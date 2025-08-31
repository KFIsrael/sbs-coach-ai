import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, Clock, Target, Play, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import exercisesData from "@/data/exercises.json";
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
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  sets: string;
  videoUrl?: string;
  imageUrl?: string;
}

interface WorkoutDay {
  day: number;
  title: string;
  focus: string;
  duration: string;
  exercises: Exercise[];
  completed: boolean;
  date?: Date;
  muscleGroup: string;
}

interface CalendarWorkout {
  date: Date;
  title: string;
  muscleGroup: string;
  workoutIndex: number;
}

interface WorkoutProgramProps {
  onBack: () => void;
  onStartWorkout: (day: WorkoutDay) => void;
  questionnaireData?: any;
}

// Default workout program with Russian content
const defaultWorkoutProgram: WorkoutDay[] = [
  {
    day: 1,
    title: "Грудь и Трицепс",
    focus: "Грудные мышцы, Трицепсы",
    duration: "50 мин",
    completed: false,
    muscleGroup: "Грудь + Трицепс",
    exercises: [
      {
        id: "1",
        name: "Жим штанги лёжа",
        description: "Базовое упражнение для груди",
        muscleGroup: "Грудь",
        sets: "3 подхода × 10-12 повторений"
      },
      {
        id: "2", 
        name: "Отжимания на брусьях",
        description: "Упражнение для груди и трицепсов",
        muscleGroup: "Грудь",
        sets: "3 подхода × 8-12 повторений"
      }
    ]
  },
  {
    day: 2,
    title: "Спина и Бицепс",
    focus: "Мышцы спины, Бицепсы",
    duration: "50 мин",
    completed: false,
    muscleGroup: "Спина + Бицепс",
    exercises: [
      {
        id: "3",
        name: "Подтягивания",
        description: "Базовое упражнение для спины",
        muscleGroup: "Спина",
        sets: "3 подхода × 8-12 повторений"
      }
    ]
  },
  {
    day: 3,
    title: "Ноги",
    focus: "Квадрицепсы, Ягодицы, Бицепс бедра",
    duration: "55 мин",
    completed: false,
    muscleGroup: "Ноги",
    exercises: [
      {
        id: "4",
        name: "Приседания со штангой",
        description: "Базовое упражнение для ног",
        muscleGroup: "Ноги",
        sets: "4 подхода × 10-15 повторений"
      }
    ]
  }
];

// Функция для генерации дат тренировок (понедельник, среда, пятница)
const generateWorkoutDates = (startDate: Date, weeksCount: number = 4): Date[] => {
  const workoutDates: Date[] = [];
  const currentDate = new Date(startDate);
  
  // Найти ближайший понедельник
  const dayOfWeek = getDay(currentDate);
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
  const nextMonday = addDays(currentDate, daysUntilMonday);
  
  for (let week = 0; week < weeksCount; week++) {
    const weekStart = addDays(nextMonday, week * 7);
    
    // Понедельник
    workoutDates.push(new Date(weekStart));
    
    // Среда
    workoutDates.push(addDays(weekStart, 2));
    
    // Пятница
    workoutDates.push(addDays(weekStart, 4));
  }
  
  return workoutDates;
};

// Функция для поиска ближайшей тренировки
const findNextWorkout = (workoutDates: Date[], workouts: WorkoutDay[]): { date: Date; workout: WorkoutDay } | null => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  for (let i = 0; i < workoutDates.length; i++) {
    const workoutDate = workoutDates[i];
    const workoutDateStart = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate());
    
    // Если тренировка сегодня или в будущем
    if (workoutDateStart >= todayStart) {
      const workoutIndex = i % workouts.length;
      return {
        date: workoutDate,
        workout: { ...workouts[workoutIndex], date: workoutDate }
      };
    }
  }
  
  return null;
};

// Функция для создания календарных тренировок
const createCalendarWorkouts = (dates: Date[], workouts: WorkoutDay[]): CalendarWorkout[] => {
  return dates.map((date, index) => {
    const workoutIndex = index % workouts.length;
    const workout = workouts[workoutIndex];
    
    return {
      date,
      title: workout.title,
      muscleGroup: workout.muscleGroup,
      workoutIndex
    };
  });
};

export function WorkoutProgram({ onBack, onStartWorkout, questionnaireData }: WorkoutProgramProps) {
  const { t } = useLanguage();
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutDay[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workoutDates, setWorkoutDates] = useState<Date[]>([]);
  const [nextWorkout, setNextWorkout] = useState<{ date: Date; workout: WorkoutDay } | null>(null);

  useEffect(() => {
    const generateProgram = async () => {
      if (!questionnaireData) {
        // Use default program if no questionnaire data
        setWorkoutProgram(defaultWorkoutProgram);
      } else {
        setIsGenerating(true);
        setError(null);

        try {
          const response = await fetch('https://izymayczjppcgmejqxus.supabase.co/functions/v1/generate-workout-program', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              questionnaireData,
              exercises: exercisesData
            })
          });

          if (!response.ok) {
            throw new Error('Failed to generate program');
          }

          const data = await response.json();
          setWorkoutProgram(data.program.workouts);
        } catch (err) {
          console.error('Error generating program:', err);
          setError('Failed to generate workout program. Using default program.');
          setWorkoutProgram(defaultWorkoutProgram);
        } finally {
          setIsGenerating(false);
        }
      }
    };

    generateProgram();
  }, [questionnaireData]);

  useEffect(() => {
    if (workoutProgram.length > 0) {
      // Генерируем даты тренировок на 12 недель
      const dates = generateWorkoutDates(new Date(), 12);
      setWorkoutDates(dates);
      
      // Находим ближайшую тренировку
      const next = findNextWorkout(dates, workoutProgram);
      setNextWorkout(next);
    }
  }, [workoutProgram]);

  // Функция для рендеринга календаря
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = addDays(calendarStart, 41); // 6 недель

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const calendarWorkouts = createCalendarWorkouts(workoutDates, workoutProgram);
    
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
            const dayWorkout = calendarWorkouts.find(w => isSameDay(w.date, day));
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  relative h-16 p-1 border rounded-lg cursor-pointer transition-all
                  ${isCurrentMonth ? 'border-border' : 'border-transparent bg-muted/30'}
                  ${isCurrentDay ? 'bg-primary/10 border-primary' : ''}
                  ${dayWorkout ? 'hover:bg-accent/10' : ''}
                `}
                onClick={() => dayWorkout && onStartWorkout({
                  ...workoutProgram[dayWorkout.workoutIndex],
                  date: day
                })}
              >
                <div className={`text-xs font-medium ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </div>
                
                {dayWorkout && (
                  <div className="absolute inset-x-1 bottom-1">
                    <div className="bg-primary/20 text-primary rounded-sm px-1 py-0.5 text-[10px] font-medium leading-tight">
                      {dayWorkout.muscleGroup}
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
                {t('questionnaire.generating')}
              </h2>
              <p className="text-muted-foreground">
                ИИ создает вашу персональную программу...
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
                {isSameDay(nextWorkout.date, new Date()) ? 'Тренировка сегодня' : 'Следующая тренировка'}
              </CardTitle>
              <CardDescription>
                {format(nextWorkout.date, 'EEEE, d MMMM', { locale: ru })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{nextWorkout.workout.title}</h3>
                  <p className="text-muted-foreground mb-4">{nextWorkout.workout.focus}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{nextWorkout.workout.duration}</span>
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
                      {nextWorkout.workout.exercises.slice(0, 3).map((exercise) => (
                        <div key={exercise.id} className="bg-muted/30 rounded p-2 text-sm">
                          <div className="font-medium">{exercise.name}</div>
                          <div className="text-xs text-muted-foreground">{exercise.sets}</div>
                        </div>
                      ))}
                      {nextWorkout.workout.exercises.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{nextWorkout.workout.exercises.length - 3} еще упражнений
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="premium"
                  size="lg"
                  onClick={() => onStartWorkout(nextWorkout.workout)}
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
              Нажмите на день с тренировкой, чтобы начать
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCalendar()}
          </CardContent>
        </Card>

        {/* Информация о программе */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Детали программы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">3</div>
                <div className="text-sm text-muted-foreground">Тренировки в неделю</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">ПН/СР/ПТ</div>
                <div className="text-sm text-muted-foreground">Дни тренировок</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">50</div>
                <div className="text-sm text-muted-foreground">Минут на тренировку</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}