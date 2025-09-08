import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Extract user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      throw new Error('No user ID in token');
    }

    console.log('User authenticated:', userId);

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
        case 'PUSH_PULL_LEGS':
          return ['PUSH', 'PULL', 'LEGS'];
        case 'UPPER_LOWER':
          return ['UPPER', 'LOWER', 'UPPER'];
        case 'FULL':
          return ['FULL', 'FULL', 'FULL'];
        default:
          return ['PUSH', 'PULL', 'LEGS'];
      }
    }

    function setsFrom5RM(fiveRM?: number) {
      const sets = [
        { set_no: 1, reps: 15, pct_of_5rm: 0.78 },
        { set_no: 2, reps: 12, pct_of_5rm: 0.83 },
        { set_no: 3, reps: 10, pct_of_5rm: 0.88 },
      ];

      return sets.map((s) => ({
        ...s,
        weight_kg: fiveRM ? Math.round(fiveRM * s.pct_of_5rm * 2) / 2 : null,
      }));
    }

    // 1) Read questionnaire data
    console.log('Reading questionnaire data...');
    const { data: questionnaireData } = await supabase
      .from('user_questionnaire_data')
      .select('age_range,limitations')
      .eq('user_id', userId)
      .maybeSingle();

    const split = chooseSplit(questionnaireData || {});
    console.log('Selected split:', split);

    // Fix split value - the screenshot shows "ULF" but our function returns different values
    const actualSplit = split === 'UPPER_LOWER' ? 'ULF' : split;

    // 2) Create program
    const start = new Date(startDateISO);
    const end = new Date(start);
    end.setDate(end.getDate() + 7 * 12);

    console.log('Creating workout program...');
    const { data: program, error: programError } = await supabase
      .from('workout_programs')
      .insert({
        user_id: userId,
        name: '12-недельная программа',
        description: 'Автогенерация на основе тестовой тренировки',
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        split: actualSplit,
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
      .eq('user_id', userId);

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
      FULL: ['Грудь', 'Спина', 'Ноги', 'Плечи'],
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

    // Initialize variables for exercises and muscle groups
    const muscleGroupMap = new Map();
    let allExercises: any[] = [];


    // Generate sessions one by one to avoid complexity
    for (let w = 0; w < 12; w++) {
      for (let d = 0; d < 3; d++) {
        const dayType = splitDays[d];
        const dayDate = new Date(nearestMonday);
        dayDate.setDate(nearestMonday.getDate() + w * 7 + workoutDays[d]);

        console.log(`Creating session: Week ${w + 1}, Day ${d + 1}, Type: ${dayType}`);

        // Get all muscle groups and exercises once (only on first iteration)
        if (w === 0 && d === 0) {
          const allMuscleGroupNames = [...new Set(Object.values(pools).flat())];
          const { data: muscleGroups } = await supabase
            .from('muscle_groups')
            .select('id,name')
            .in('name', allMuscleGroupNames);

          (muscleGroups || []).forEach((mg: any) => {
            muscleGroupMap.set(mg.name, mg.id);
          });

          const { data: exercises } = await supabase
            .from('exercises')
            .select('id,name,anchor_key,muscle_group_id,created_at')
            .in('muscle_group_id', Array.from(muscleGroupMap.values()));

          allExercises = exercises || [];
          console.log(`Loaded ${allExercises.length} exercises`);
        }

        // Create session
        const { data: session, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            program_id: program.id,
            user_id: userId,
            scheduled_date: dayDate.toISOString().slice(0, 10),
            name: `Нед ${w + 1} / День ${d + 1} (${dayType})`,
            split_day: dayType,
          })
          .select('*')
          .single();

        if (sessionError) {
          console.error('Session creation error:', sessionError);
          throw sessionError;
        }

        // Get exercises for this day type
        const muscleGroupNames = pools[dayType] || [];
        const relevantMuscleGroupIds = muscleGroupNames
          .map((name) => muscleGroupMap.get(name))
          .filter(Boolean);

        const relevantExercises = (allExercises || [])
          .filter((ex: any) => relevantMuscleGroupIds.includes(ex.muscle_group_id))
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);

        console.log(`Adding ${relevantExercises.length} exercises to session ${session.id}`);

        // Add exercises to session
        for (let order = 1; order <= relevantExercises.length; order++) {
          const ex = relevantExercises[order - 1];

          // Create workout exercise
          const { data: workoutExercise, error: exerciseError } = await supabase
            .from('workout_exercises')
            .insert({
              session_id: session.id,
              exercise_id: ex.id,
              sets: 3,
              reps: 0,
              order_number: order,
            })
            .select('*')
            .single();

          if (exerciseError) {
            console.error('Exercise creation error:', exerciseError);
            throw exerciseError;
          }

          // Create sets for this exercise
          const fiveRM = ex.anchor_key ? fiveRMMap.get(ex.anchor_key) : undefined;
          const sets = setsFrom5RM(fiveRM);

          for (const s of sets) {
            const { error: setError } = await supabase.from('workout_exercise_sets').insert({
              workout_exercise_id: workoutExercise.id,
              set_no: s.set_no,
              reps: s.reps,
              weight_kg: s.weight_kg,
              pct_of_5rm: s.pct_of_5rm,
            });

            if (setError) {
              console.error('Set creation error:', setError);
              throw setError;
            }
          }
        }
      }
    }

    console.log('Program generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        programId: program.id,
        message: 'Программа успешно создана',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in generate-workout-program function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Ошибка при создании программы тренировок',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
