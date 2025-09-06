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
  onChooseProgram: () => void;
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
  onChooseProgram,
  onOpenChat,
  onOpenProfile,
  onLogout,
  onTestWorkout 
}: DashboardProps) {
  const { t } = useLanguage();
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [hasQuestionnaire, setHasQuestionnaire] = useState<boolean>(false);
  const [monthlyStats, setMonthlyStats] = useState({ completed: 0, percentage: 0 });
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weeklyImprovement, setWeeklyImprovement] = useState(0);
  const [currentWeekVolume, setCurrentWeekVolume] = useState(0);
  
  const currentDate = new Date().toLocaleDateString('ru-RU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  // Helper function to get week key
  const getWeekKey = (date: Date) => {
    const year = date.getFullYear();
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  };

  // Load user questionnaire data and stats
  useEffect(() => {
    const loadUserData = async () => {
      if (!user.id) return;

      try {
        // Load questionnaire data
        const { data: questionnaire } = await supabase
          .from('user_questionnaire_data')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (questionnaire) {
          setQuestionnaireData(questionnaire);
          setHasQuestionnaire(!!questionnaire.completed_at);
        }

        await loadStats();

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    const loadStats = async () => {
      if (!user.id) return;

      try {
        // Calculate monthly workout stats
        const currentMonth = new Date();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        console.log('Loading monthly stats...');
        const { data: monthlyWorkouts } = await supabase
          .from('workout_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .gte('scheduled_date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('scheduled_date', lastDayOfMonth.toISOString().split('T')[0]);

        console.log('Monthly workouts data:', monthlyWorkouts);
        const monthlyCount = monthlyWorkouts?.length || 0;
        const monthlyPercentage = Math.round((monthlyCount / 12) * 100);
        setMonthlyStats({ completed: monthlyCount, percentage: monthlyPercentage });
        console.log('Monthly stats updated:', { completed: monthlyCount, percentage: monthlyPercentage });

        // Calculate current streak
        const { data: allWorkouts } = await supabase
          .from('workout_sessions')
          .select('scheduled_date, is_completed')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .order('scheduled_date', { ascending: false });

        if (allWorkouts && allWorkouts.length > 0) {
          let streak = 0;
          const today = new Date();
          
          for (let i = 0; i < allWorkouts.length; i++) {
            const workoutDate = new Date(allWorkouts[i].scheduled_date);
            const dayDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 3600 * 24));
            
            // Если тренировка была в последние 3 дня (учитываем выходные)
            if (dayDiff <= 3) {
              streak++;
            } else {
              break;
            }
          }
          setCurrentStreak(streak);
        }

        // Calculate weekly improvement - сравнение с прошлой неделей
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { data: currentWeekWorkouts } = await supabase
          .from('workout_logs')
          .select('actual_weight, actual_sets, actual_reps')
          .eq('user_id', user.id)
          .gte('completed_at', oneWeekAgo.toISOString());

        const { data: previousWeekWorkouts } = await supabase
          .from('workout_logs')
          .select('actual_weight, actual_sets, actual_reps')
          .eq('user_id', user.id)
          .gte('completed_at', twoWeeksAgo.toISOString())
          .lt('completed_at', oneWeekAgo.toISOString());

        if (currentWeekWorkouts && previousWeekWorkouts) {
          // Вычисляем общий объем за текущую неделю
          const currentWeekVolume = currentWeekWorkouts.reduce((total, log) => {
            if (log.actual_weight && log.actual_sets && log.actual_reps) {
              return total + (log.actual_weight * log.actual_sets * log.actual_reps);
            }
            return total;
          }, 0);

          // Вычисляем общий объем за прошлую неделю
          const previousWeekVolume = previousWeekWorkouts.reduce((total, log) => {
            if (log.actual_weight && log.actual_sets && log.actual_reps) {
              return total + (log.actual_weight * log.actual_sets * log.actual_reps);
            }
            return total;
          }, 0);

          console.log('Current week volume:', currentWeekVolume);
          console.log('Previous week volume:', previousWeekVolume);
          
          // Устанавливаем текущий объем для отображения
          setCurrentWeekVolume(currentWeekVolume);
          
          if (previousWeekVolume > 0) {
            const improvement = Math.round(((currentWeekVolume / previousWeekVolume) * 100) - 100);
            setWeeklyImprovement(improvement);
            console.log('Weekly improvement:', improvement);
          } else if (currentWeekVolume > 0) {
            // Если прошлой недели нет данных, но есть текущая - показываем как положительный рост
            setWeeklyImprovement(100);
          } else {
            setWeeklyImprovement(0);
          }
        }

      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadUserData();

    // Real-time subscription для обновления статистик с debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedLoadStats = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Loading stats after debounce...');
        loadStats();
      }, 1000); // 1 секунда задержки
    };

    const channel = supabase
      .channel('workout-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_sessions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Workout sessions updated, scheduling stats reload...');
          debouncedLoadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_logs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Workout logs updated, scheduling stats reload...');
          debouncedLoadStats();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-3 sm:p-4">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        {/* Top row - Logo and Logout */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Logo size="sm" className="flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gradient-gold truncate">Sport Body System</h1>
              <p className="text-xs text-muted-foreground truncate">{currentDate}</p>
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
            <span className="text-xs sm:text-sm font-medium truncate">{user.name}</span>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <Card className="card-premium bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg md:text-xl text-gradient-gold">
                  {t('dashboard.welcome')}, {user.name}! 💪
                </CardTitle>
                <CardDescription className="text-sm mt-2">
                  {t('dashboard.ready_to_train')}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 self-start text-xs">
                Active
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-[1.02]" onClick={onStartWorkout}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-full p-2 flex-shrink-0">
                <Play className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg">{t('dashboard.start_workout')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t('dashboard.ready_to_train')}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {!hasQuestionnaire ? (
          <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-[1.02]" onClick={onStartQuestionnaire}>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-accent rounded-full p-2 flex-shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">{t('questionnaire.title')}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t('questionnaire.choose_option')}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ) : (
          <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-[1.02]" onClick={onTestWorkout}>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-accent rounded-full p-2 flex-shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">Тестовая тренировка</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Обновить рабочие веса и программу</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" />
              Фитнес оценка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{monthlyStats.completed} из 12 тренировок в месяц</span>
                <span className="font-medium">{monthlyStats.percentage}%</span>
              </div>
              <Progress value={monthlyStats.percentage} className="h-2 bg-muted">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${Math.min(monthlyStats.percentage, 100)}%` }} />
              </Progress>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-success" />
              Серия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{currentStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">тренировок подряд</p>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Нагрузка за неделю
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-bold text-foreground">
                {currentWeekVolume > 0 ? `${Math.round(currentWeekVolume)} кг` : '0 кг'}
              </div>
              <div className={`text-sm font-medium ${weeklyImprovement >= 0 ? 'text-success' : 'text-destructive'}`}>
                {weeklyImprovement >= 0 ? '+' : ''}{weeklyImprovement}% к прошлой неделе
              </div>
              <p className="text-xs text-muted-foreground">общий тоннаж тренировок</p>
            </div>
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