import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Calendar, 
  Target, 
  Trophy, 
  TrendingUp, 
  Zap, 
  User,
  LogOut,
  Play,
  MessageCircle,
  Languages,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/ui/language-selector";
import { Logo } from "@/components/ui/logo";
import { supabase } from "@/integrations/supabase/client";

interface DashboardProps {
  user: { name: string; email: string; id?: string; };
  onStartQuestionnaire: () => void;
  onStartWorkout: () => void;
  onViewPrograms: () => void;
  onOpenChat: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onTestWorkout: () => void;
}

interface QuestionnaireData {
  fitness_goal: string;
  fitness_level: string;
  age_range: string;
  limitations: string;
  equipment: string;
  body_type: string;
  completed_at: string;
}

export function Dashboard({ 
  user, 
  onStartQuestionnaire, 
  onStartWorkout, 
  onViewPrograms, 
  onOpenChat,
  onOpenProfile,
  onLogout,
  onTestWorkout
}: DashboardProps) {
  const { t } = useLanguage();
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Load questionnaire data
  useEffect(() => {
    const loadQuestionnaireData = async () => {
      if (!user.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_questionnaire_data')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (data && !error) {
          setQuestionnaireData(data);
          setHasQuestionnaire(true);
        }
      } catch (error) {
        console.error('Error loading questionnaire data:', error);
      }
    };

    loadQuestionnaireData();
  }, [user.id]);

  const getGoalLabel = (goal: string) => {
    const goals: Record<string, string> = {
      strength: 'Увеличить силу',
      muscle_gain: 'Набрать мышечную массу', 
      fat_loss: 'Сжечь жир',
      general_fitness: 'Общая физподготовка'
    };
    return goals[goal] || goal;
  };

  const getLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: 'Новичок',
      intermediate: 'Средний',
      advanced: 'Продвинутый'
    };
    return levels[level] || level;
  };

  const getEquipmentLabel = (equipment: string) => {
    const equipments: Record<string, string> = {
      full_gym: 'Полный доступ к залу',
      home_basic: 'Только гантели + штанга',
      bodyweight: 'Только резины/собственный вес',
      minimal: 'Минимум (турник/брусья)'
    };
    return equipments[equipment] || equipment;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      {/* Header */}
      <header className="mb-8">
        {/* Top row - Logo and Logout */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Logo size="sm" className="flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gradient-gold truncate">Sport Body System</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{currentDate}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onLogout}
            className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0 ml-2"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Bottom row - Language and Profile */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LanguageSelector />
          </div>
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-primary/10 p-2 rounded-md transition-colors min-w-0 flex-1 justify-end"
            onClick={onOpenProfile}
          >
            <User className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium truncate">{user.name}</span>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="mb-8">
        <Card className="card-premium bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl text-gradient-gold">
                  {t('dashboard.welcome')}, {user.name}! 💪
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-2">
                  {t('dashboard.ready_to_train')}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 self-start">
                Active
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-[1.02]" onClick={onStartWorkout}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-full p-2 flex-shrink-0">
                <Play className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">{t('dashboard.start_workout')}</CardTitle>
                <CardDescription className="text-sm">{t('dashboard.ready_to_train')}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {!hasQuestionnaire ? (
          <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-[1.02]" onClick={onStartQuestionnaire}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-accent rounded-full p-2 flex-shrink-0">
                  <Target className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">{t('questionnaire.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('questionnaire.choose_option')}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ) : (
          <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-[1.02]" onClick={onTestWorkout}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-accent rounded-full p-2 flex-shrink-0">
                  <Target className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">Тестовая тренировка</CardTitle>
                  <CardDescription className="text-sm">Обновить рабочие веса и программу</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" />
              {t('questionnaire.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">3 из 5 {t('dashboard.workouts')}</span>
                <span className="font-medium">60%</span>
              </div>
              <Progress value={60} className="h-2 bg-muted">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: '60%' }} />
              </Progress>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-success" />
              {t('placeholder.streak')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">7 {t('dashboard.days')}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('placeholder.continue')}</p>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t('placeholder.improvement')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+15%</div>
            <p className="text-xs text-muted-foreground mt-1">{t('placeholder.strength_gain')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Features */}
      <Card className="card-premium mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {t('placeholder.coming_soon')}
          </CardTitle>
          <CardDescription>
            {t('placeholder.advanced_features')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/20 rounded p-1 flex-shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t('placeholder.nutritionist')}</p>
                <p className="text-xs text-muted-foreground">{t('placeholder.meal_planning')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/20 rounded p-1 flex-shrink-0">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t('placeholder.endocrinologist')}</p>
                <p className="text-xs text-muted-foreground">{t('placeholder.hormone_optimization')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/20 rounded p-1 flex-shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t('placeholder.sports_doctor')}</p>
                <p className="text-xs text-muted-foreground">{t('placeholder.injury_prevention')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="grid grid-cols-1 gap-4">
          <Button 
            variant="premium" 
            size="xl" 
            onClick={onViewPrograms}
            className="w-full justify-center sm:justify-start"
          >
            <Trophy className="mr-2 h-5 w-5 flex-shrink-0" />
            <span>{t('dashboard.view_programs')}</span>
          </Button>
          
          <Button 
            variant="outline_gold" 
            size="xl" 
            onClick={onOpenChat}
            className="w-full justify-center sm:justify-start"
          >
            <MessageCircle className="mr-2 h-5 w-5 flex-shrink-0" />
            <span>{t('dashboard.ai_coach')}</span>
          </Button>
      </div>
    </div>
  );
}