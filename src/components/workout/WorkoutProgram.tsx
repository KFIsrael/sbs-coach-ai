import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, Clock, Target, Play, CheckCircle2, Loader2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { RegenerateProgramDialog } from "./RegenerateProgramDialog";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  getDay,
  addDays,
  subDays,
  isSameDay,
  startOfWeek,
  isAfter,
  isBefore,
  addMonths,
  subMonths
} from "date-fns";
import { ru } from "date-fns/locale";

interface Exercise {
  name: string;
  sets: Array<{
    reps: number;
    weight: string;
    completed: boolean;
  }>;
}

interface WorkoutDay {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  date?: Date;
  // Compatibility fields for Index.tsx
  day: number; // Required field
  title: string; // Required field
  focus: string; // Required field
  duration: string; // Required field
  completed: boolean; // Required field
  muscleGroup?: string;
  sessionData?: any; // Добавляем данные сессии из БД
}

interface WorkoutProgramProps {
  onBack: () => void;
  onStartWorkout: (day: WorkoutDay) => void;
  onChooseProgram?: () => void;
  questionnaireData?: any;
}

export function WorkoutProgram({ onBack, onStartWorkout, onChooseProgram, questionnaireData }: WorkoutProgramProps) {
  const { t } = useLanguage();
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutDay[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workoutDates, setWorkoutDates] = useState<Date[]>([]);
  const [nextWorkout, setNextWorkout] = useState<{ date: Date; workout: WorkoutDay } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [programSplit, setProgramSplit] = useState<string | null>(null);
  const [showAllExercises, setShowAllExercises] = useState(false);

  useEffect(() => {
    const loadProgram = async () => {
      setIsGenerating(true);
      try {
        // Получаем пользователя
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Пользователь не авторизован');

        // Получаем программу пользователя (независимо от наличия данных анкеты)
        const { data: programs, error: programError } = await supabase
          .from('workout_programs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (programError) throw programError;
        if (!programs || programs.length === 0) {
          // Если программы нет - показываем пустое состояние
          console.log('No program found, showing empty state');
          setWorkoutProgram([]);
          return;
        }

        const program = programs[0];
        setProgramId(program.id);
        setProgramSplit(program.split);

        // Получаем сессии программы с упражнениями и сетами
        const { data: sessions, error: sessionsError } = await supabase
          .from('workout_sessions')
          .select(`
            *,
            workout_exercises(
              *,
              exercises(name, description),
              workout_exercise_sets(*)
            )
          `)
          .eq('program_id', program.id)
          .order('scheduled_date');

        if (sessionsError) throw sessionsError;

        // Группируем сессии по split_day
        const sessionsByDay: Record<string, any[]> = {};
        sessions?.forEach(session => {
          if (!sessionsByDay[session.split_day]) {
            sessionsByDay[session.split_day] = [];
          }
          sessionsByDay[session.split_day].push(session);
        });

        // Создаем программу тренировок для UI
        const workoutDays: WorkoutDay[] = Object.entries(sessionsByDay).map(([splitDay, sessionGroup], index) => {
          // Берем первую сессию для получения базовой информации
          const firstSession = sessionGroup[0];
          
          const exercises = firstSession.workout_exercises?.map((we: any) => ({
            name: we.exercises?.name || 'Упражнение',
            sets: we.workout_exercise_sets?.map((set: any) => ({
              reps: set.reps,
              weight: set.weight_kg ? `${set.weight_kg}кг` : `${Math.round((set.pct_of_5rm || 0) * 100)}% от 5МП`,
              completed: false
            })) || []
          })) || [];

          const workoutName = splitDay === 'PUSH' ? 'Толкающие мышцы' : 
                              splitDay === 'PULL' ? 'Тянущие мышцы' : 
                              splitDay === 'LEGS' ? 'Ноги' :
                              splitDay === 'UPPER' ? 'Верх тела' :
                              splitDay === 'LOWER' ? 'Низ тела' : 'Все тело';
          
          return {
            id: firstSession.id, // Используем реальный ID сессии из БД
            name: workoutName,
            description: `Тренировка группы: ${splitDay}`,
            exercises,
            date: new Date(),
            day: index + 1, // Always provide required field
            title: workoutName,
            focus: `Тренировка группы: ${splitDay}`,
            duration: '~60 мин',
            completed: false,
            muscleGroup: workoutName,
            sessionData: firstSession // Добавляем полные данные сессии
          };
        });

        setWorkoutProgram(workoutDays);
      } catch (err) {
        console.error('Error loading program:', err);
        setError('Не удалось загрузить программу.');
        setWorkoutProgram([]);
      } finally {
        setIsGenerating(false);
      }
    };

    loadProgram();
  }, [questionnaireData]);

  useEffect(() => {
    if (workoutProgram.length > 0 && programId) {
      const loadWorkoutDates = async () => {
        try {
          // Получаем даты сессий из базы данных
          const { data: sessions } = await supabase
            .from('workout_sessions')
            .select('scheduled_date, split_day')
            .eq('program_id', programId)
            .order('scheduled_date');

          if (sessions) {
            const dates = sessions.map(s => new Date(s.scheduled_date));
            setWorkoutDates(dates);
            
            // Находим ближайшую тренировку или используем выбранную дату
            let targetWorkout;
            
            if (selectedDate) {
              // Если выбрана определенная дата, используем ее
              const sessionForDate = sessions.find(s => isSameDay(new Date(s.scheduled_date), selectedDate));
              if (sessionForDate) {
                const workoutIndex = workoutProgram.findIndex(w => 
                  w.name.includes(sessionForDate.split_day) || 
                  (sessionForDate.split_day === 'PUSH' && w.name.includes('Толкающие')) ||
                  (sessionForDate.split_day === 'PULL' && w.name.includes('Тянущие')) ||
                  (sessionForDate.split_day === 'LEGS' && w.name.includes('Ноги')) ||
                  (sessionForDate.split_day === 'UPPER' && w.name.includes('Верх')) ||
                  (sessionForDate.split_day === 'LOWER' && w.name.includes('Низ')) ||
                  (sessionForDate.split_day === 'FULL' && w.name.includes('тело'))
                );
                
                if (workoutIndex >= 0) {
                  targetWorkout = {
                    date: new Date(sessionForDate.scheduled_date),
                    workout: { ...workoutProgram[workoutIndex], date: new Date(sessionForDate.scheduled_date) }
                  };
                }
              }
            }
            
            if (!targetWorkout) {
              // Находим ближайшую тренировку
              const today = new Date();
              const upcomingSessions = sessions.filter(s => new Date(s.scheduled_date) >= today);
              
              if (upcomingSessions.length > 0) {
                const nextSession = upcomingSessions[0];
                const workoutIndex = workoutProgram.findIndex(w => 
                  w.name.includes(nextSession.split_day) || 
                  (nextSession.split_day === 'PUSH' && w.name.includes('Толкающие')) ||
                  (nextSession.split_day === 'PULL' && w.name.includes('Тянущие')) ||
                  (nextSession.split_day === 'LEGS' && w.name.includes('Ноги')) ||
                  (nextSession.split_day === 'UPPER' && w.name.includes('Верх')) ||
                  (nextSession.split_day === 'LOWER' && w.name.includes('Низ')) ||
                  (nextSession.split_day === 'FULL' && w.name.includes('тело'))
                );
                
                if (workoutIndex >= 0) {
                  targetWorkout = {
                    date: new Date(nextSession.scheduled_date),
                    workout: { ...workoutProgram[workoutIndex], date: new Date(nextSession.scheduled_date) }
                  };
                }
              }
              setSelectedDate(null);
            }
            
            setNextWorkout(targetWorkout);
          }
        } catch (error) {
          console.error('Error loading workout dates:', error);
        }
      };

      loadWorkoutDates();
    }
  }, [workoutProgram, selectedDate, programId]);

  // Функция для рендеринга календаря
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = addDays(calendarStart, 41); // 6 недель

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
      <div className="space-y-4">
        {/* Навигация по месяцам */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            
            // Проверяем, есть ли тренировка в этот день
            const hasWorkout = workoutDates.some(date => isSameDay(date, day));
            
            // Определяем тип тренировки на основе программы и дня недели
            const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday
            let workoutType = '';
            if (hasWorkout && programSplit) {
              if (programSplit === 'PPL') {
                if (dayOfWeek === 1) workoutType = 'Толкающие'; // Понедельник
                else if (dayOfWeek === 3) workoutType = 'Тянущие'; // Среда  
                else if (dayOfWeek === 5) workoutType = 'Ноги'; // Пятница
              } else if (programSplit === 'ULF') {
                if (dayOfWeek === 1) workoutType = 'Верх'; // Понедельник
                else if (dayOfWeek === 3) workoutType = 'Низ'; // Среда  
                else if (dayOfWeek === 5) workoutType = 'Все тело'; // Пятница
              } else if (programSplit === 'FULLx3') {
                if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
                  workoutType = 'Все тело';
                }
              }
            }
            
            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={`
                  p-2 rounded-lg border cursor-pointer transition-all duration-200
                  ${isCurrentMonth ? 'border-border' : 'border-transparent bg-muted/30'}
                  ${isCurrentDay ? 'bg-primary/10 border-primary' : ''}
                  ${hasWorkout ? 'hover:bg-accent/10' : ''}
                  ${hasWorkout && selectedDate && isSameDay(selectedDate, day) ? 'bg-accent/20 border-accent' : ''}
                `}
                onClick={() => {
                  if (hasWorkout) {
                    setSelectedDate(day);
                  }
                }}
              >
                <div className={`text-xs font-medium ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </div>
                {hasWorkout && workoutType && (
                  <div className="mt-1">
                    <div className={`text-xs px-1 py-0.5 rounded text-center font-medium ${
                      workoutType === 'Толкающие' ? 'bg-red-500/20 text-red-600' :
                      workoutType === 'Тянущие' ? 'bg-blue-500/20 text-blue-600' :
                      workoutType === 'Ноги' ? 'bg-green-500/20 text-green-600' :
                      workoutType === 'Верх' ? 'bg-purple-500/20 text-purple-600' :
                      workoutType === 'Низ' ? 'bg-orange-500/20 text-orange-600' :
                      workoutType === 'Все тело' ? 'bg-teal-500/20 text-teal-600' :
                      'bg-gray-500/20 text-gray-600'
                    }`}>
                      {workoutType}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="card-premium max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mb-6">
              <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gradient-gold mb-2">
                Загружаем программу
              </h2>
              <p className="text-muted-foreground">
                Получаем вашу персональную программу из базы данных...
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={100} className="h-2 bg-muted">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all w-full" />
              </Progress>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="card-premium max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold text-gradient-gold mb-2">
              Ошибка загрузки
            </h2>
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
            <Button onClick={onBack} variant="premium">
              Назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isGenerating && workoutProgram.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="card-premium max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold text-gradient-gold mb-2">
              Программа не найдена
            </h2>
            <p className="text-muted-foreground mb-4">
              Сначала необходимо создать программу тренировок
            </p>
            <Button onClick={onChooseProgram || onBack} variant="premium">
              Создать программу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowRegenerateDialog(true)}
            className="text-primary border-primary hover:bg-primary/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить программу
          </Button>
        </div>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gradient-gold mb-2">
            Ваша программа тренировок
          </h1>
          <p className="text-muted-foreground mb-4">
            Тренировки проходят по понедельникам, средам и пятницам
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Ближайшая тренировка */}
        {nextWorkout && (
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {selectedDate ? (
                  `Тренировка на ${format(nextWorkout.date, 'd MMMM', { locale: ru })}`
                ) : (
                  isSameDay(nextWorkout.date, new Date()) ? 'Тренировка сегодня' : 'Следующая тренировка'
                )}
              </CardTitle>
              <CardDescription>
                {format(nextWorkout.date, 'EEEE, d MMMM', { locale: ru })}
                {selectedDate && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="ml-2 p-0 h-auto text-xs"
                    onClick={() => setSelectedDate(null)}
                  >
                    Вернуться к ближайшей
                  </Button>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{nextWorkout.workout.name}</h3>
                  <p className="text-muted-foreground mb-4">{nextWorkout.workout.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>~60 мин</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{nextWorkout.workout.exercises.length} упражнений</span>
                    </div>
                  </div>

                  {/* Превью упражнений */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Упражнения:</h4>
                     <div className="grid gap-2">
                       {(showAllExercises ? nextWorkout.workout.exercises : nextWorkout.workout.exercises.slice(0, 3)).map((exercise, index) => (
                         <div key={index} className="bg-muted/30 rounded p-2 text-sm">
                           <div className="font-medium">{exercise.name}</div>
                           <div className="text-xs text-muted-foreground">
                             {exercise.sets.length} подходов: {exercise.sets.map(s => `${s.reps} × ${s.weight}`).join(', ')}
                           </div>
                         </div>
                       ))}
                       {nextWorkout.workout.exercises.length > 3 && !showAllExercises && (
                         <button 
                           onClick={() => setShowAllExercises(true)}
                           className="text-xs text-muted-foreground text-center hover:text-foreground transition-colors duration-200 cursor-pointer p-2 rounded hover:bg-muted/50"
                         >
                           +{nextWorkout.workout.exercises.length - 3} еще упражнений
                         </button>
                       )}
                       {showAllExercises && nextWorkout.workout.exercises.length > 3 && (
                         <button 
                           onClick={() => setShowAllExercises(false)}
                           className="text-xs text-muted-foreground text-center hover:text-foreground transition-colors duration-200 cursor-pointer p-2 rounded hover:bg-muted/50"
                         >
                           Скрыть дополнительные упражнения
                         </button>
                       )}
                     </div>
                  </div>
                </div>
                
                <Button 
                  variant="premium"
                  size="lg"
                  onClick={async () => {
                    try {
                      // Находим реальную сессию для выбранной даты
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) throw new Error('Пользователь не авторизован');

                      const { data: sessionForDate } = await supabase
                        .from('workout_sessions')
                        .select(`
                          *,
                          workout_exercises(
                            *,
                            exercises(name, description),
                            workout_exercise_sets(*)
                          )
                        `)
                        .eq('program_id', programId)
                        .eq('scheduled_date', format(nextWorkout.date, 'yyyy-MM-dd'))
                        .maybeSingle();

                      if (sessionForDate) {
                        // Создаем объект тренировки с реальными данными
                        const workoutWithRealData = {
                          ...nextWorkout.workout,
                          id: sessionForDate.id, // Реальный UUID из БД
                          exercises: sessionForDate.workout_exercises?.map((we: any) => ({
                            id: we.exercise_id,
                            name: we.exercises?.name || 'Упражнение',
                            description: we.exercises?.description || '',
                            sets: we.workout_exercise_sets?.map((set: any) => ({
                              id: set.id,
                              set_no: set.set_no,
                              reps: set.reps,
                              weight_kg: set.weight_kg,
                              pct_of_5rm: set.pct_of_5rm
                            })) || []
                          })) || []
                        };
                        
                        console.log('Starting workout with ID:', sessionForDate.id);
                        onStartWorkout(workoutWithRealData);
                      } else {
                        console.error('Session not found for date:', nextWorkout.date);
                        // Fallback - используем данные как есть
                        onStartWorkout(nextWorkout.workout);
                      }
                    } catch (error) {
                      console.error('Error loading session data:', error);
                      // Fallback - используем данные как есть
                      onStartWorkout(nextWorkout.workout);
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Начать тренировку
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Календарь тренировок */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Календарь тренировок
            </CardTitle>
            <CardDescription>
              Нажмите на дату с тренировкой для просмотра деталей
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCalendar()}
          </CardContent>
        </Card>

        {/* Детали программы */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Детали программы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">3</div>
                <div className="text-sm text-muted-foreground">тренировки в неделю</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">12</div>
                <div className="text-sm text-muted-foreground">недель программы</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">Пн/Ср/Пт</div>
                <div className="text-sm text-muted-foreground">дни тренировок</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regenerate Program Dialog */}
      <RegenerateProgramDialog 
        isOpen={showRegenerateDialog}
        onClose={() => setShowRegenerateDialog(false)}
        onSuccess={() => {
          // Refresh the program data
          setWorkoutProgram([]);
          setIsGenerating(true);
          window.location.reload(); // Simple reload to refresh all data
        }}
      />
    </div>
  );
}