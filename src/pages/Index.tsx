import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { AuthForm } from "@/components/auth/AuthForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Questionnaire } from "@/components/questionnaire/Questionnaire";
import { ProgramChoice } from "@/components/workout/ProgramChoice";
import { WorkoutProgram } from "@/components/workout/WorkoutProgram";
import { WorkoutSession } from "@/components/workout/WorkoutSession";
import { TestWorkout } from "@/components/workout/TestWorkout";
import { AIChat } from "@/components/chat/AIChat";
import { UserProfile } from "@/components/profile/UserProfile";
import { TrainerDashboard } from "@/components/trainer/TrainerDashboard";
import heroImage from "@/assets/hero-fitness.jpg";

type AppState = 'auth' | 'dashboard' | 'questionnaire' | 'program_choice' | 'programs' | 'workout' | 'test_workout' | 'profile' | 'trainer_dashboard';

interface User {
  name: string;
  email: string;
  role?: string;
}

interface IndexWorkoutDay {
  id?: string;
  day: number;
  title: string;
  focus: string;
  duration: string;
  exercises: any[];
  completed: boolean;
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<IndexWorkoutDay | null>(null);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const { toast } = useToast();

  // Check if user has completed questionnaire
  const checkUserQuestionnaire = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_questionnaire_data')
        .select('id, completed_at')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking questionnaire:', error);
        return false;
      }
      
      // Check if data exists and completed_at is not null
      return !!(data && data.completed_at);
    } catch (error) {
      console.error('Error checking questionnaire:', error);
      return false;
    }
  };

  // Set up auth state listener
  useEffect(() => {
    // Handle email confirmation tokens in URL hash
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('type') === 'signup' && hashParams.get('access_token')) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (data.session && !error) {
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            toast({
              title: "Email подтвержден!",
              description: "Добро пожаловать в SBS Fitness!",
            });
          }
        } catch (error) {
          console.error('Error handling email confirmation:', error);
        }
      }
    };

    handleEmailConfirmation();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        if (session?.user) {
          const userData: User = {
            email: session.user.email || "",
            name: session.user.user_metadata?.first_name || "User",
            role: "client"
          };
          setUser(userData);
          
          // Check user role and redirect accordingly
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (profile?.role === 'trainer') {
            setAppState('trainer_dashboard');
          } else {
            // Check if user has completed questionnaire
            checkUserQuestionnaire(session.user.id).then(hasQuestionnaire => {
              if (hasQuestionnaire) {
                setAppState('dashboard');
              } else {
                setAppState('questionnaire');
              }
            });
          }
          
          // Show success toast for sign in
          if (event === 'SIGNED_IN') {
            toast({
              title: "Добро пожаловать!",
              description: "Добро пожаловать в SBS Fitness!",
            });
          }
        } else {
          setUser(null);
          setAppState('auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session);
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        const userData: User = {
          email: session.user.email || "",
          name: session.user.user_metadata?.first_name || "User",
          role: "client"
        };
        setUser(userData);
        
        // Check user role and redirect accordingly
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile?.role === 'trainer') {
          setAppState('trainer_dashboard');
        } else {
          // Check if user has completed questionnaire
          checkUserQuestionnaire(session.user.id).then(hasQuestionnaire => {
            if (hasQuestionnaire) {
              setAppState('dashboard');
            } else {
              setAppState('questionnaire');
            }
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleAuth = (userData: User) => {
    // Only handle demo users here - real auth goes through onAuthStateChange
    if (userData.role === 'demo') {
      setUser(userData);
      setAppState('dashboard');
    }
    // For real users, onAuthStateChange will handle the navigation
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSupabaseUser(null);
    setAppState('auth');
    setShowChat(false);
  };

  const handleQuestionnaireComplete = (data: any) => {
    console.log('Questionnaire data:', data);
    setQuestionnaireData(data);
    // После заполнения анкеты сразу переходим к выбору программы
    setAppState('program_choice');
  };

  const handleStartWorkout = (workout: IndexWorkoutDay) => {
    setCurrentWorkout(workout);
    setAppState('workout');
  };

  const handleWorkoutComplete = () => {
    setCurrentWorkout(null);
    setAppState('dashboard');
  };

  const handleTestWorkoutComplete = (results: any) => {
    console.log('Test workout results:', results);
    setAppState('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/50">
      {/* Background Image for Auth */}
      {appState === 'auth' && (
        <div 
          className="fixed inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
      )}
      
      {/* Main Content */}
      <div className="relative z-10">
        {appState === 'auth' && (
          <AuthForm onAuth={handleAuth} />
        )}

        {appState === 'dashboard' && user && (
          <Dashboard
            user={{ ...user, id: supabaseUser?.id }}
            onStartQuestionnaire={() => setAppState('questionnaire')}
            onStartWorkout={() => setAppState('programs')}
            onViewPrograms={() => setAppState('programs')}
            onOpenChat={() => setShowChat(true)}
            onOpenProfile={() => setAppState('profile')}
            onLogout={handleLogout}
            onTestWorkout={() => setAppState('test_workout')}
          />
        )}

        {appState === 'profile' && user && (
          <UserProfile
            user={{ ...user, id: supabaseUser?.id }}
            onBack={() => setAppState('dashboard')}
          />
        )}

        {appState === 'trainer_dashboard' && user && (
          <TrainerDashboard
            user={user}
            onBack={() => setAppState('auth')}
          />
        )}

        {appState === 'questionnaire' && (
          <Questionnaire
            onComplete={handleQuestionnaireComplete}
            onBack={() => setAppState('dashboard')}
          />
        )}

        {appState === 'program_choice' && (
          <ProgramChoice
            onBack={() => setAppState('dashboard')}
            onAIGeneration={() => setAppState('programs')}
            onTestWorkout={() => setAppState('test_workout')}
          />
        )}

        {appState === 'test_workout' && (
          <TestWorkout
            onBack={() => setAppState('program_choice')}
            onComplete={handleTestWorkoutComplete}
          />
        )}

        {appState === 'programs' && (
          <WorkoutProgram
            onBack={() => setAppState('dashboard')}
            onStartWorkout={handleStartWorkout}
            questionnaireData={questionnaireData}
          />
        )}

        {appState === 'workout' && currentWorkout && (
          <WorkoutSession
            workout={currentWorkout}
            onBack={() => setAppState('dashboard')}
            onComplete={handleWorkoutComplete}
          />
        )}
      </div>

      {/* AI Chat Modal */}
      {showChat && user && (
        <AIChat
          onClose={() => setShowChat(false)}
          user={user}
        />
      )}

      <Toaster />
    </div>
  );
};

export default Index;
