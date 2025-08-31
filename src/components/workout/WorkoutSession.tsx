import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Timer, CheckCircle2, Play, Pause, RotateCcw, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logSet } from "@/hooks/useProgram";
import { useToast } from "@/hooks/use-toast";

interface WorkoutSet {
  id: string;
  set_no: number;
  reps: number;
  weight_kg: number | null;
  pct_of_5rm: number | null;
}

interface ExerciseWithSets {
  id: string;
  name: string;
  description?: string;
  muscleGroup?: string;
  sets: WorkoutSet[];
}

interface WorkoutDay {
  id?: string;
  day: number;
  title: string;
  focus: string;
  duration: string;
  exercises: ExerciseWithSets[];
  completed: boolean;
}

interface WorkoutSessionProps {
  workout: WorkoutDay;
  onBack: () => void;
  onComplete: () => void;
}

interface ExerciseLog {
  exerciseId: string;
  sets: { weight: number; reps: number; completed: boolean }[];
}

export function WorkoutSession({ workout, onBack, onComplete }: WorkoutSessionProps) {
  const { toast } = useToast();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [actualWeights, setActualWeights] = useState<Record<string, number>>({});
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [restTimer, setRestTimer] = useState(0);

  // Загружаем упражнения с сетами
  useEffect(() => {
    loadWorkoutData();
  }, []);

  const loadWorkoutData = async () => {
    try {
      console.log('Loading workout data for workout ID:', workout.id);
      
      // Если ID похож на UUID, загружаем из БД
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (workout.id && uuidRegex.test(workout.id)) {
        // Загружаем реальные данные из БД
        const { data: session, error } = await supabase
          .from('workout_sessions')
          .select(`
            *,
            workout_exercises(
              *,
              exercises(name, description),
              workout_exercise_sets(*)
            )
          `)
          .eq('id', workout.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading session:', error);
          throw error;
        }

        if (session && session.workout_exercises) {
          console.log('Loaded session data:', session);
          
          const exercisesFromDB: ExerciseWithSets[] = session.workout_exercises.map((we: any) => ({
            id: we.exercise_id,
            name: we.exercises?.name || 'Упражнение',
            description: we.exercises?.description || 'Базовое упражнение',
            muscleGroup: 'Разные группы',
            sets: we.workout_exercise_sets?.map((set: any) => ({
              id: set.id,
              set_no: set.set_no,
              reps: set.reps,
              weight_kg: set.weight_kg,
              pct_of_5rm: set.pct_of_5rm
            })) || []
          }));
          
          setExercises(exercisesFromDB);
          console.log('Exercises loaded from DB:', exercisesFromDB);
          return;
        }
      }
      
      // Fallback - используем mock данные если реальных данных нет
      console.log('Using fallback mock data');
      const mockExercises: ExerciseWithSets[] = workout.exercises?.map((ex: any, index: number) => ({
        id: `ex-${index}`,
        name: ex.name || `Упражнение ${index + 1}`,
        description: ex.description || 'Базовое упражнение',
        muscleGroup: ex.muscleGroup || 'Разные группы',
        sets: [
          { id: `set-${index}-1`, set_no: 1, reps: 15, weight_kg: 20, pct_of_5rm: null },
          { id: `set-${index}-2`, set_no: 2, reps: 12, weight_kg: 22.5, pct_of_5rm: null },
          { id: `set-${index}-3`, set_no: 3, reps: 10, weight_kg: 25, pct_of_5rm: null },
        ]
      })) || [];
      
      setExercises(mockExercises);
    } catch (error) {
      console.error('Error loading workout data:', error);
    }
  };

  const handleSetComplete = async (exerciseId: string, setId: string, actualWeight: number) => {
    try {
      // Здесь будет логика сохранения подхода
      const set = exercises[currentExercise]?.sets.find(s => s.id === setId);
      if (set && workout.id) {
        console.log('Logging set:', { session_id: workout.id, exercise_id: exerciseId, set_no: set.set_no, reps: set.reps, weight_kg: actualWeight });
        
        await logSet({
          session_id: workout.id,
          exercise_id: exerciseId,
          set_no: set.set_no,
          reps: set.reps,
          weight_kg: actualWeight
        });
        
        console.log('Set logged successfully');
        
        toast({
          title: "Подход записан",
          description: `${set.reps} повт × ${actualWeight} кг`,
        });

        // Запускаем таймер отдыха
        setRestTimer(90);
        setIsTimerRunning(true);
        
        const timer = setInterval(() => {
          setRestTimer(prev => {
            if (prev <= 1) {
              setIsTimerRunning(false);
              clearInterval(timer);
              toast({
                title: "Отдых завершен!",
                description: "Время для следующего подхода"
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error logging set:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить подход",
        variant: "destructive",
      });
    }
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setRestTimer(0);
      setIsTimerRunning(false);
    } else {
      handleCompleteWorkout();
    }
  };

  const handlePreviousExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(prev => prev - 1);
      setRestTimer(0);
      setIsTimerRunning(false);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      console.log('Completing workout with ID:', workout.id);
      
      // Обновляем статус тренировки в базе данных
      if (workout.id) {
        const { error } = await supabase
          .from('workout_sessions')
          .update({ is_completed: true })
          .eq('id', workout.id);
        
        if (error) {
          console.error('Error updating workout status:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось сохранить статус тренировки",
            variant: "destructive",
          });
          return;
        }
        
        console.log('Workout status updated successfully');
      }
      
      toast({
        title: "Тренировка завершена! 🎉",
        description: "Отличная работа! Ваш прогресс сохранен."
      });
      setTimeout(() => onComplete(), 1000);
    } catch (error) {
      console.error('Error completing workout:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить тренировку",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentExercise + 1) / exercises.length) * 100;
  const currentExerciseData = exercises[currentExercise];
  const isLastExercise = currentExercise === exercises.length - 1;

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          
          {restTimer > 0 && (
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <span className="text-lg font-mono text-primary">
                {formatTime(restTimer)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRestTimer(0);
                  setIsTimerRunning(false);
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gradient-gold mb-1">
            {workout.title}
          </h1>
          <p className="text-muted-foreground mb-4">{workout.focus}</p>
          
          <Progress value={progress} className="h-2 bg-muted mb-2">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }} 
            />
          </Progress>
          <p className="text-sm text-muted-foreground">
            Упражнение {currentExercise + 1} из {exercises.length}
          </p>
        </div>
      </div>

      {/* Current Exercise */}
      <div className="max-w-2xl mx-auto">
        {/* Current Exercise Details */}
        {currentExerciseData && (
          <>
            <Card className="card-premium mb-6">
              <CardHeader className="text-center">
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 w-fit mx-auto mb-2">
                  {currentExerciseData.muscleGroup}
                </Badge>
                <CardTitle className="text-2xl mb-2">{currentExerciseData.name}</CardTitle>
                <CardDescription className="text-base">
                  {currentExerciseData.description}
                </CardDescription>
                <div className="text-sm text-primary font-medium mt-2">
                  Система 15-12-10 повторений
                </div>
              </CardHeader>
            </Card>

            {/* Отображение сетов */}
            <Card className="card-premium mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Подходы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentExerciseData.sets?.map((set) => (
                  <Card key={set.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">Подход {set.set_no}</div>
                        <div className="text-sm text-muted-foreground">
                          {set.reps} повторений
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                         {set.weight_kg != null ? (
                            <div className="font-medium">{set.weight_kg} кг</div>
                          ) : (
                            <div className="text-sm text-orange-500">
                              <div className="font-medium">{Math.round((set.pct_of_5rm || 0) * 100)}% от 5ПМ</div>
                              <div className="text-xs text-muted-foreground">
                                Пройдите тестовую тренировку для точных весов
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Вес"
                            value={actualWeights[set.id] || ''}
                            onChange={(e) => setActualWeights(prev => ({
                              ...prev,
                              [set.id]: Number(e.target.value)
                            }))}
                            className="w-20"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSetComplete(currentExerciseData.id, set.id, actualWeights[set.id] || 0)}
                            disabled={!actualWeights[set.id]}
                          >
                            ✓
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <Button 
            variant="outline_gold" 
            onClick={handlePreviousExercise}
            disabled={currentExercise === 0}
            className="flex-1"
          >
            Предыдущее упражнение
          </Button>
          
          <Button 
            variant="premium" 
            onClick={handleNextExercise}
            className="flex-1"
          >
            {isLastExercise ? (
              <>Завершить тренировку</>
            ) : (
              <>Следующее упражнение</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}