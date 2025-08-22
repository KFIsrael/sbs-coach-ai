import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionnaireData {
  1: string; // fitness goal
  2: string; // fitness level  
  3: string; // age
  4: string; // limitations
  5: string; // equipment
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionnaireData, exercises } = await req.json() as {
      questionnaireData: QuestionnaireData;
      exercises: any[];
    };

    console.log('Generating workout program with data:', { questionnaireData, exerciseCount: exercises.length });

    // Create a fitness profile from questionnaire data
    const fitnessGoal = questionnaireData[1];
    const fitnessLevel = questionnaireData[2];
    const age = questionnaireData[3];
    const limitations = questionnaireData[4];
    const equipment = questionnaireData[5];

    const prompt = `You are an expert fitness trainer. Create a personalized 3-day split workout program based on this profile:

Goal: ${fitnessGoal}
Fitness Level: ${fitnessLevel}  
Age: ${age}
Limitations: ${limitations}
Equipment: ${equipment}

Available exercises: ${JSON.stringify(exercises, null, 2)}

Create exactly 3 workout days following this split:
- Day 1: Chest + Triceps (грудь и трицепс)
- Day 2: Back + Biceps (спина и бицепс)  
- Day 3: Legs (ноги)

Each workout should:
1. Have a descriptive Russian name and focus area
2. Include 5-7 exercises from the available list that match the muscle groups
3. Specify sets, reps, and rest time appropriate for the fitness level and age
4. Be 45-60 minutes long
5. Consider any limitations mentioned
6. Use exercises with matching muscleGroup from the list

Return ONLY a JSON object with this structure:
{
  "program": {
    "name": "Трёхдневная сплит-программа",
    "description": "Персональная программа тренировок на 3 дня в неделю",
    "weeks": 12,
    "workouts": [
      {
        "day": 1,
        "title": "Грудь и Трицепс",
        "focus": "Chest + Triceps", 
        "duration": "50 min",
        "completed": false,
        "exercises": [
          {
            "id": "exercise_id_from_list",
            "name": "Exercise name from list",
            "description": "Exercise description", 
            "muscleGroup": "chest",
            "sets": "3 x 10-12"
          }
        ]
      }
    ]
  }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fitness trainer who creates personalized workout programs. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response:', data);
      throw new Error('Invalid response from OpenAI');
    }

    const generatedProgram = JSON.parse(data.choices[0].message.content);
    
    console.log('Generated program:', generatedProgram);

    return new Response(JSON.stringify(generatedProgram), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating workout program:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate workout program',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});