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
  3: string; // training days
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
    const trainingDays = questionnaireData[3];
    const limitations = questionnaireData[4];
    const equipment = questionnaireData[5];

    const prompt = `You are an expert fitness trainer. Create a personalized 4-week workout program based on this profile:

Goal: ${fitnessGoal}
Fitness Level: ${fitnessLevel}  
Training Days: ${trainingDays}
Limitations: ${limitations}
Equipment: ${equipment}

Available exercises: ${JSON.stringify(exercises, null, 2)}

Create exactly ${trainingDays.charAt(0)} workout days for week 1. Each workout should:
1. Have a descriptive name and focus area
2. Include 4-6 exercises from the available list
3. Specify sets, reps, and rest time appropriate for the fitness level
4. Be 30-60 minutes long
5. Consider any limitations mentioned

Return ONLY a JSON object with this structure:
{
  "program": {
    "name": "Program name",
    "description": "Brief description",
    "weeks": 4,
    "workouts": [
      {
        "day": 1,
        "name": "Workout name",
        "focus": "Focus area", 
        "duration": "45 min",
        "exercises": [
          {
            "exerciseId": "exercise_id_from_list",
            "sets": 3,
            "reps": "10-12",
            "restTime": 60,
            "notes": "Form tips"
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