import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, Clock, Target, Play, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import exercisesData from "@/data/exercises.json";

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

export function WorkoutProgram({ onBack, onStartWorkout, questionnaireData }: WorkoutProgramProps) {
  const { t } = useLanguage();
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutDay[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateProgram = async () => {
      if (!questionnaireData) {
        // Use default program if no questionnaire data
        setWorkoutProgram(defaultWorkoutProgram);
        return;
      }

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
    };

    generateProgram();
  }, [questionnaireData]);

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
  const completedWorkouts = workoutProgram.filter(day => day.completed).length;
  const totalWorkouts = workoutProgram.length;
  const progressPercentage = (completedWorkouts / totalWorkouts) * 100;

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
            Программа создана ИИ на основе ваших ответов
          </p>
          
          {/* Overall Progress */}
          <Card className="card-premium max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Прогресс недели</span>
                  <span className="font-medium">{completedWorkouts}/{totalWorkouts} тренировок</span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-muted">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" 
                    style={{ width: `${progressPercentage}%` }} 
                  />
                </Progress>
                <div className="text-xs text-primary font-medium">
                  {Math.round(progressPercentage)}% Завершено
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workout Days */}
      <div className="max-w-4xl mx-auto space-y-4">
        {workoutProgram.map((day) => (
          <Card 
            key={day.day} 
            className={`card-premium transition-all duration-300 hover:shadow-gold ${
              day.completed ? 'border-success/30' : 'hover:scale-105'
            }`}
          >
            <CardHeader>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={day.completed ? "secondary" : "outline"} className="bg-primary/20 text-primary border-primary/30">
                        День {day.day}
                      </Badge>
                      {day.completed && (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <CardTitle className="text-lg sm:text-xl mb-1">{day.title}</CardTitle>
                    <CardDescription className="text-sm sm:text-base">{day.focus}</CardDescription>
                    
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{day.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 flex-shrink-0" />
                        <span>{day.exercises.length} {t('workout.exercises')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant={day.completed ? "outline_gold" : "premium"}
                    onClick={() => onStartWorkout(day)}
                    className="w-full sm:w-auto flex-shrink-0"
                    size="sm"
                  >
                    {day.completed ? (
                      <span className="text-sm">Повторить</span>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        <span className="text-sm">{t('workout.start_workout')}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium text-primary text-sm sm:text-base">Предпросмотр упражнений:</h4>
                <div className="grid grid-cols-1 gap-3">
                  {day.exercises.map((exercise) => (
                    <div 
                      key={exercise.id}
                      className="bg-muted/30 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{exercise.name}</div>
                          <div className="text-xs text-muted-foreground">{exercise.sets}</div>
                        </div>
                        <Badge variant="outline" className="text-xs self-start sm:self-center flex-shrink-0">
                          {exercise.muscleGroup}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Program Info */}
      <div className="max-w-4xl mx-auto mt-8">
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Детали программы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">3</div>
                <div className="text-sm text-muted-foreground">Тренировок/Неделя</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">50</div>
                <div className="text-sm text-muted-foreground">Средние минуты</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">12</div>
                <div className="text-sm text-muted-foreground">Недель программа</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}