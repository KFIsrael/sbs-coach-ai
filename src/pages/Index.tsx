import { useState, useEffect, useRef } from "react";
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
  
  // Prevent duplicate processing for same user
  const lastProcessedUserRef = useRef<string | null>(null);

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

  // Process authenticated user
  const processAuthenticatedUser = async (user: SupabaseUser, eventType: string) => {
    // Prevent duplicate processing for the same user
    if (lastProcessedUserRef.current === user.id && eventType === 'SIGNED_IN') {
      console.log('Skipping duplicate processing for user:', user.id);
      return;
    }
    
    lastProcessedUserRef.current = user.id;
    
    const userData: User = {
      email: user.email || "",
      name: user.user_metadata?.first_name || "User",
      role: "client"
    };
    setUser(userData);
    
    // Immediately set dashboard to hide login form
    if (eventType === 'SIGNED_IN') {
      console.log('Setting state to dashboard (immediate)');
      setAppState('dashboard');
    }
    
    // Defer profile/questionnaire checks
    setTimeout(async () => {
      try {
        console.log('Checking user profile for:', user.id);
        // Check user role and redirect accordingly
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        console.log('Profile data:', profile, 'Error:', profileError);
        
        // Загружаем данные анкеты если есть
        const { data: questionnaire } = await supabase
          .from('user_questionnaire_data')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (questionnaire) {
          setQuestionnaireData(questionnaire);
        }
        
        if (profile?.role === 'trainer') {
          console.log('Setting state to trainer_dashboard');
          setAppState('trainer_dashboard');
        } else {
          // Check if user has completed questionnaire
          console.log('Checking questionnaire for user:', user.id);
          const hasQuestionnaire = await checkUserQuestionnaire(user.id);
          console.log('Has questionnaire:', hasQuestionnaire);
          if (hasQuestionnaire) {
            console.log('Setting state to dashboard');
            setAppState('dashboard');
          } else {
            console.log('Setting state to questionnaire');
            setAppState('questionnaire');
          }
        }
      } catch (error) {
        console.error('Error in user processing:', error);
        // Fallback to dashboard if there's an error
        console.log('Setting state to dashboard (fallback)');
        setAppState('dashboard');
      }
    }, 0);
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
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'no user');
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              processAuthenticatedUser(session.user, 'SIGNED_IN');
              toast({
                title: "Добро пожаловать!",
                description: "Добро пожаловать в SBS Fitness!",
              });
            }
            break;
            
          case 'INITIAL_SESSION':
            if (session?.user) {
              console.log('Initial session found, processing user');
              processAuthenticatedUser(session.user, 'INITIAL_SESSION');
            } else {
              console.log('No initial session found');
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed, no state change needed');
            break;
            
          case 'SIGNED_OUT':
            console.log('Setting state to auth (signed out)');
            setUser(null);
            setAppState('auth');
            lastProcessedUserRef.current = null;
            break;
            
          default:
            console.log('Unhandled auth event:', event);
        }
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id || 'no session');
      if (session) {
        setSession(session);
        setSupabaseUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleTestWorkoutComplete = async (results: any) => {
    console.log('Test workout results:', results);
    
    try {
      // Автоматически генерируем программу после тестовой тренировки
      const { generateProgram } = await import('@/hooks/useProgram');
      await generateProgram(new Date().toISOString());
      
      toast({
        title: "Тестирование завершено!",
        description: "Программа тренировок создана на основе ваших результатов",
      });
      
      // Переходим к просмотру созданной программы
      setAppState('programs');
    } catch (error: any) {
      console.error('Error generating program:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать программу",
        variant: "destructive",
      });
      // В случае ошибки возвращаемся на главный экран
      setAppState('dashboard');
    }
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
            onAccountDeleted={handleLogout}
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
            onBack={() => setAppState('dashboard')}
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
