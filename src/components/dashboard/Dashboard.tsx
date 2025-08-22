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
import { supabase } from "@/integrations/supabase/client";

interface DashboardProps {
  user: { name: string; email: string; id?: string; };
  onStartQuestionnaire: () => void;
  onStartWorkout: () => void;
  onViewPrograms: () => void;
  onOpenChat: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
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
  onLogout 
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
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gradient-gold">Sport Body System</h1>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-primary/10 p-2 rounded-md transition-colors"
            onClick={onOpenProfile}
          >
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onLogout}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="mb-8">
        <Card className="card-premium bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-gradient-gold">
                  {t('dashboard.welcome')}, {user.name}! 💪
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {t('dashboard.ready_to_train')}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                Active
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-105" onClick={onStartWorkout}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-full p-2">
                <Play className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('dashboard.start_workout')}</CardTitle>
                <CardDescription>{t('dashboard.ready_to_train')}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {!hasQuestionnaire ? (
          <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-105" onClick={onStartQuestionnaire}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-accent rounded-full p-2">
                  <Target className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('questionnaire.title')}</CardTitle>
                  <CardDescription>{t('questionnaire.choose_option')}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ) : (
          <Card className="card-premium border-success/20 bg-success/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-success rounded-full p-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-success">Анкета завершена</CardTitle>
                  <CardDescription>Ваш профиль тренировок настроен</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Questionnaire Data Section */}
      {hasQuestionnaire && questionnaireData && (
        <Card className="card-premium mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Ваш профиль тренировок
            </CardTitle>
            <CardDescription>
              Данные из анкеты • Заполнено {new Date(questionnaireData.completed_at).toLocaleDateString('ru-RU')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">Цель</p>
                <p className="text-base font-semibold">{getGoalLabel(questionnaireData.fitness_goal)}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">Уровень</p>
                <p className="text-base font-semibold">{getLevelLabel(questionnaireData.fitness_level)}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">Возраст</p>
                <p className="text-base font-semibold">{questionnaireData.age_range}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">Оборудование</p>
                <p className="text-base font-semibold">{getEquipmentLabel(questionnaireData.equipment)}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">Ограничения</p>
                <p className="text-base font-semibold">
                  {questionnaireData.limitations === 'none' ? 'Нет ограничений' : questionnaireData.limitations}
                </p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">Телосложение</p>
                <p className="text-base font-semibold">
                  {questionnaireData.body_type === 'normal' ? 'Нормальное' : questionnaireData.body_type}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/20 rounded p-1">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('placeholder.nutritionist')}</p>
                <p className="text-xs text-muted-foreground">{t('placeholder.meal_planning')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/20 rounded p-1">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('placeholder.endocrinologist')}</p>
                <p className="text-xs text-muted-foreground">{t('placeholder.hormone_optimization')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/20 rounded p-1">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('placeholder.sports_doctor')}</p>
                <p className="text-xs text-muted-foreground">{t('placeholder.injury_prevention')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="premium" 
            size="xl" 
            onClick={onViewPrograms}
            className="w-full justify-start"
          >
            <Trophy className="mr-2 h-5 w-5" />
            {t('dashboard.view_programs')}
          </Button>
          
          <Button 
            variant="outline_gold" 
            size="xl" 
            onClick={onOpenChat}
            className="w-full justify-start"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            {t('dashboard.ai_coach')}
          </Button>
      </div>

      {/* Floating Chat Button */}
      <Button
        onClick={onOpenChat}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-gold floating-element"
        variant="premium"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}