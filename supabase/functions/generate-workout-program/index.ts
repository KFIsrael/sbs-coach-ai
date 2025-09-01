import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      workout_programs: any;
      workout_sessions: any;
      muscle_groups: any;
      exercises: any;
      workout_exercises: any;
      workout_exercise_sets: any;
      user_questionnaire_data: any;
      user_test_maxes: any;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting program generation edge function');
    
    const { startDateISO } = await req.json();
    
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Helper functions
    function chooseSplit(questionnaireData: any): string {
      const ageRange = questionnaireData?.age_range;
      const limitations = questionnaireData?.limitations || [];
      
      if (limitations.includes('limited_time')) return 'FULL';
      if (ageRange === 'under_18' || ageRange === 'over_60') return 'UPPER_LOWER';
      return 'PUSH_PULL_LEGS';
    }

    function getSplitDays(split: string): string[] {
      switch (split) {
        case 'PUSH_PULL_LEGS': return ['PUSH', 'PULL', 'LEGS'];
        case 'UPPER_LOWER': return ['UPPER', 'LOWER', 'UPPER'];
        case 'FULL': return ['FULL', 'FULL', 'FULL'];
        default: return ['PUSH', 'PULL', 'LEGS'];
      }
    }

    function setsFrom5RM(fiveRM?: number) {
      const sets = [
        { set_no: 1, reps: 15, pct_of_5rm: 0.60 },
        { set_no: 2, reps: 12, pct_of_5rm: 0.70 },
        { set_no: 3, reps: 10, pct_of_5rm: 0.80 }
      ];
      
      return sets.map(s => ({
        ...s,
        weight_kg: fiveRM ? Math.round(fiveRM * s.pct_of_5rm * 2) / 2 : null
      }));
    }

    // 1) Read questionnaire data
    console.log('Reading questionnaire data...');
    const { data: questionnaireData } = await supabase
      .from('user_questionnaire_data')
      .select('age_range,limitations')
      .eq('user_id', user.id)
      .maybeSingle();

    const split = chooseSplit(questionnaireData || {});
    console.log('Selected split:', split);

    // 2) Create program
    const start = new Date(startDateISO);
    const end = new Date(start);
    end.setDate(end.getDate() + 7 * 12);

    console.log('Creating workout program...');
    const { data: program, error: programError } = await supabase
      .from('workout_programs')
      .insert({
        user_id: user.id,
        name: '12-недельная программа',
        description: 'Автогенерация на основе тестовой тренировки',
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        split
      })
      .select('*')
      .single();

    if (programError) {
      console.error('Program creation error:', programError);
      throw programError;
    }

    console.log('Program created:', program.id);

    // 3) Load 5RM data
    console.log('Loading test maxes...');
    const { data: maxes } = await supabase
      .from('user_test_maxes')
      .select('anchor_key,five_rm_kg')
      .eq('user_id', user.id);

    const fiveRMMap = new Map();
    (maxes || []).forEach((m: any) => {
      if (m.five_rm_kg != null) {
        fiveRMMap.set(m.anchor_key, Number(m.five_rm_kg));
      }
    });

    console.log('Loaded 5RM data for exercises:', Array.from(fiveRMMap.keys()));

    // 4) Exercise pools
    const pools: Record<string, string[]> = {
      PUSH: ['Грудь', 'Плечи', 'Руки'],
      PULL: ['Спина', 'Руки'],
      LEGS: ['Ноги'],
      UPPER: ['Грудь', 'Плечи', 'Спина', 'Руки'],
      LOWER: ['Ноги'],
      FULL: ['Грудь', 'Спина', 'Ноги', 'Плечи']
    };

    const splitDays = getSplitDays(split);

    // 5) Find nearest Monday
    const startDate = new Date(startDateISO);
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
    const nearestMonday = new Date(startDate);
    if (daysToMonday > 0) {
      nearestMonday.setDate(startDate.getDate() + daysToMonday);
    }

    console.log('Starting program generation for 12 weeks...');
    const workoutDays = [0, 2, 4]; // Mon, Wed, Fri

    // Batch operations for better performance
    const sessionsToInsert = [];
    
    // Prepare all sessions first
    for (let w = 0; w < 12; w++) {
      for (let d = 0; d < 3; d++) {
        const dayType = splitDays[d];
        const dayDate = new Date(nearestMonday);
        dayDate.setDate(nearestMonday.getDate() + w * 7 + workoutDays[d]);

        sessionsToInsert.push({
          program_id: program.id,
          user_id: user.id,
          scheduled_date: dayDate.toISOString().slice(0, 10),
          name: `Нед ${w + 1} / День ${d + 1} (${dayType})`,
          split_day: dayType
        });
      }
    }

    console.log(`Inserting ${sessionsToInsert.length} sessions...`);
    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .insert(sessionsToInsert)
      .select('*');

    if (sessionsError) {
      console.error('Sessions creation error:', sessionsError);
      throw sessionsError;
    }

    console.log('Sessions created, now adding exercises...');

    // Get all muscle groups once
    const allMuscleGroupNames = [...new Set(Object.values(pools).flat())];
    const { data: muscleGroups } = await supabase
      .from('muscle_groups')
      .select('id,name')
      .in('name', allMuscleGroupNames);

    const muscleGroupMap = new Map();
    (muscleGroups || []).forEach((mg: any) => {
      muscleGroupMap.set(mg.name, mg.id);
    });

    // Get all exercises once
    const { data: allExercises } = await supabase
      .from('exercises')
      .select('id,name,anchor_key,muscle_group_id,created_at')
      .in('muscle_group_id', Array.from(muscleGroupMap.values()));

    console.log(`Loaded ${allExercises?.length || 0} exercises`);

    // Process sessions in smaller batches
    const batchSize = 6; // Process 6 sessions at a time (2 weeks)
    for (let i = 0; i < sessions.length; i += batchSize) {
      const sessionBatch = sessions.slice(i, i + batchSize);
      console.log(`Processing session batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sessions.length/batchSize)}`);
      
      const exercisesToInsert = [];
      const setsToInsert: any[] = [];

      for (const session of sessionBatch) {
        const dayType = session.split_day;
        const muscleGroupNames = pools[dayType];
        const relevantMuscleGroupIds = muscleGroupNames.map(name => muscleGroupMap.get(name)).filter(Boolean);
        
        const relevantExercises = (allExercises || [])
          .filter((ex: any) => relevantMuscleGroupIds.includes(ex.muscle_group_id))
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);

        let order = 1;
        for (const ex of relevantExercises) {
          exercisesToInsert.push({
            session_id: session.id,
            exercise_id: ex.id,
            sets: 3,
            reps: 0,
            order_number: order++
          });

          // Prepare sets for this exercise
          const fiveRM = ex.anchor_key ? fiveRMMap.get(ex.anchor_key) : undefined;
          const sets = setsFrom5RM(fiveRM);
          
          for (const s of sets) {
            setsToInsert.push({
              exercise_id: ex.id,
              session_id: session.id,
              order: order - 1,
              set_no: s.set_no,
              reps: s.reps,
              weight_kg: s.weight_kg,
              pct_of_5rm: s.pct_of_5rm
            });
          }
        }
      }

      // Insert exercises for this batch
      if (exercisesToInsert.length > 0) {
        const { data: insertedExercises, error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert)
          .select('*');

        if (exercisesError) {
          console.error('Exercises insertion error:', exercisesError);
          throw exercisesError;
        }

        // Map exercises to their sets
        const finalSets = [];
        let setsIndex = 0;
        
        for (let j = 0; j < insertedExercises.length; j++) {
          const exercise = insertedExercises[j];
          // Each exercise has 3 sets
          for (let setNum = 0; setNum < 3; setNum++) {
            if (setsIndex < setsToInsert.length) {
              finalSets.push({
                workout_exercise_id: exercise.id,
                set_no: setsToInsert[setsIndex].set_no,
                reps: setsToInsert[setsIndex].reps,
                weight_kg: setsToInsert[setsIndex].weight_kg,
                pct_of_5rm: setsToInsert[setsIndex].pct_of_5rm
              });
              setsIndex++;
            }
          }
        }

        // Insert sets for this batch
        if (finalSets.length > 0) {
          const { error: setsError } = await supabase
            .from('workout_exercise_sets')
            .insert(finalSets);

          if (setsError) {
            console.error('Sets insertion error:', setsError);
            throw setsError;
          }
        }
      }
    }

    console.log('Program generation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        programId: program.id,
        message: 'Программа успешно создана'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-workout-program function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Ошибка при создании программы тренировок'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});