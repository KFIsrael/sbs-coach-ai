import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthForm } from "@/components/auth/AuthForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Questionnaire } from "@/components/questionnaire/Questionnaire";
import { ProgramChoice } from "@/components/workout/ProgramChoice";
import { WorkoutProgram } from "@/components/workout/WorkoutProgram";
import { WorkoutSession } from "@/components/workout/WorkoutSession";
import { TestWorkout } from "@/components/workout/TestWorkout";
import { AIChat } from "@/components/chat/AIChat";
import heroImage from "@/assets/hero-fitness.jpg";

type AppState = 'auth' | 'dashboard' | 'questionnaire' | 'program_choice' | 'programs' | 'workout' | 'test_workout';

interface User {
  name: string;
  email: string;
}

interface WorkoutDay {
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
  const [showChat, setShowChat] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutDay | null>(null);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);

  const handleAuth = (userData: User) => {
    setUser(userData);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setAppState('auth');
    setShowChat(false);
  };

  const handleQuestionnaireComplete = (data: any) => {
    console.log('Questionnaire data:', data);
    setQuestionnaireData(data);
    setAppState('program_choice');
  };

  const handleStartWorkout = (workout: WorkoutDay) => {
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
            user={user}
            onStartQuestionnaire={() => setAppState('questionnaire')}
            onStartWorkout={() => setAppState('programs')}
            onViewPrograms={() => setAppState('programs')}
            onOpenChat={() => setShowChat(true)}
            onLogout={handleLogout}
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
            onBack={() => setAppState('questionnaire')}
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
