import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting user account deletion process');

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Create supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular client to get current user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            authorization: authHeader,
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      throw new Error('User not found or unauthorized');
    }

    console.log('Deleting data for user:', user.id);

    // Delete user data from all related tables
    const tablesToClean = [
      'workout_sessions',
      'workout_logs', 
      'workout_programs',
      'user_test_maxes',
      'questionnaire_responses',
      'user_questionnaire_data',
      'profiles'
    ];

    for (const table of tablesToClean) {
      console.log(`Deleting from ${table}...`);
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        // Continue with other tables even if one fails
      }
    }

    // Delete user from auth.users (this requires admin privileges)
    console.log('Deleting user from auth.users...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError);
      throw new Error('Failed to delete user account');
    }

    console.log('User account successfully deleted');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account successfully deleted' 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in delete-user-account function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 400 
      }
    );
  }
});