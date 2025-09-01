import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Timer, RotateCcw, Info, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestWorkoutProps {
  onBack: () => void;
  onComplete: (results: any) => void;
}

// 5 базовых упражнений для определения 5МП
const testExercises = [
  {
    id: "test-1",
    anchor_key: "chest_press",
    name: {
      ru: "Жим лежа",
      en: "Bench Press"
    },
    description: {
      ru: "Базовое упражнение для груди, плеч и трицепсов",
      en: "Basic exercise for chest, shoulders and triceps"
    },
    instruction: {
      ru: "Лягте на скамью, возьмите штангу хватом чуть шире плеч. Опустите штангу к груди и выжмите вверх. Начните с легкого веса и постепенно увеличивайте до максимального веса, с которым можете выполнить ровно 5 повторений.",
      en: "Lie on bench, grip barbell slightly wider than shoulders. Lower to chest and press up. Start light and gradually increase to maximum weight for exactly 5 reps."
    },
    muscleGroup: "chest",
    sets: 3,
    targetReps: 5,
    restTime: 180,
    startWeight: 20 // рекомендуемый стартовый вес в кг
  },
  {
    id: "test-2", 
    anchor_key: "leg_press",
    name: {
      ru: "Приседания со штангой",
      en: "Barbell Squats"
    },
    description: {
      ru: "Базовое упражнение для ног и ягодиц",
      en: "Basic exercise for legs and glutes"
    },
    instruction: {
      ru: "Поставьте штангу на плечи, ноги на ширине плеч. Присядьте до параллели бедер с полом, затем встаньте. Найдите максимальный вес для 5 повторений с правильной техникой.",
      en: "Place barbell on shoulders, feet shoulder-width apart. Squat to thigh parallel, then stand. Find maximum weight for 5 reps with proper form."
    },
    muscleGroup: "legs",
    sets: 3,
    targetReps: 5,
    restTime: 180,
    startWeight: 20
  },
  {
    id: "test-3",
    anchor_key: "hip_hinge",
    name: {
      ru: "Становая тяга",
      en: "Deadlift"
    },
    description: {
      ru: "Базовое упражнение для спины, ног и всего тела",
      en: "Basic exercise for back, legs and whole body"
    },
    instruction: {
      ru: "Встаньте над штангой, ноги на ширине плеч. Наклонитесь, возьмите штангу и выпрямитесь, держа спину прямой. Опустите штангу обратно. Определите максимальный вес для 5 повторений.",
      en: "Stand over barbell, feet shoulder-width apart. Bend down, grip bar and straighten up keeping back straight. Lower bar back down. Find max weight for 5 reps."
    },
    muscleGroup: "back",
    sets: 3,
    targetReps: 5,
    restTime: 180,
    startWeight: 30
  },
  {
    id: "test-4",
    anchor_key: "shoulder_press",
    name: {
      ru: "Жим стоя",
      en: "Standing Press"
    },
    description: {
      ru: "Базовое упражнение для плеч и рук",
      en: "Basic exercise for shoulders and arms"
    },
    instruction: {
      ru: "Встаньте прямо, возьмите штангу или гантели на уровне плеч. Выжмите вес над головой, затем опустите. Найдите максимальный вес для 5 строгих повторений без читинга.",
      en: "Stand straight, hold barbell or dumbbells at shoulder level. Press weight overhead, then lower. Find maximum weight for 5 strict reps without cheating."
    },
    muscleGroup: "shoulders",
    sets: 3,
    targetReps: 5,
    restTime: 120,
    startWeight: 15
  },
  {
    id: "test-5",
    anchor_key: "vertical_pull",
    name: {
      ru: "Тяга в наклоне",
      en: "Bent-over Row"
    },
    description: {
      ru: "Базовое упражнение для спины и бицепсов",
      en: "Basic exercise for back and biceps"
    },
    instruction: {
      ru: "Наклонитесь вперед, держа штангу в опущенных руках. Подтяните штангу к нижней части груди, затем опустите. Определите максимальный вес для 5 повторений с контролем.",
      en: "Bend forward holding barbell with arms extended. Pull bar to lower chest, then lower. Find maximum weight for 5 controlled reps."
    },
    muscleGroup: "back",
    sets: 3,
    targetReps: 5,
    restTime: 120,
    startWeight: 20
  }
];

export function TestWorkout({ onBack, onComplete }: TestWorkoutProps) {
  const { t, language } = useLanguage();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutResults, setWorkoutResults] = useState<any[]>([]);
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [actualReps, setActualReps] = useState<string>('5');
  const [showInstructions, setShowInstructions] = useState(true);
  const { toast } = useToast();

  const exercise = testExercises[currentExercise];
  const isLastExercise = currentExercise === testExercises.length - 1;
  const isLastSet = exercise ? currentSet === exercise.sets : false;

  // Safety check - reset to valid state if currentExercise is out of bounds
  if (!exercise && currentExercise >= testExercises.length) {
    console.error('Invalid exercise index:', currentExercise, 'resetting to 0');
    setCurrentExercise(0);
    setCurrentSet(1);
    return null; // Don't render until state is fixed
  }

  const startRestTimer = () => {
    setIsResting(true);
    setRestTimer(exercise.restTime);
    
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSetComplete = async () => {
    console.log('Set complete button clicked');
    console.log('Current exercise:', currentExercise, 'of', testExercises.length);
    console.log('Current set:', currentSet, 'of', exercise.sets);
    console.log('isLastExercise:', isLastExercise, 'isLastSet:', isLastSet);
    const weight = parseFloat(currentWeight);
    const reps = parseInt(actualReps);
    
    if (!weight || weight <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректный вес",
        variant: "destructive"
      });
      return;
    }

    if (!reps || reps <= 0) {
      toast({
        title: "Ошибка", 
        description: "Введите корректное количество повторений",
        variant: "destructive"
      });
      return;
    }

    console.log(`Recording set: ${weight}kg x ${reps} reps`);

    const result = {
      exerciseId: exercise.id,
      exerciseName: exercise.name[language],
      anchorKey: exercise.anchor_key,
      set: currentSet,
      weight: weight,
      reps: reps,
      completed: true,
      timestamp: new Date()
    };

    setWorkoutResults(prev => [...prev, result]);

    // Если это 5 повторений, сохраняем как потенциальный 5МП
    if (reps === 5) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Проверяем текущий 5МП
          const { data: existingMax } = await supabase
            .from('user_test_maxes')
            .select('five_rm_kg')
            .eq('user_id', user.id)
            .eq('anchor_key', exercise.anchor_key)
            .maybeSingle();

          // Обновляем если это новый максимум
          if (!existingMax?.five_rm_kg || weight > existingMax.five_rm_kg) {
            await supabase
              .from('user_test_maxes')
              .upsert({
                user_id: user.id,
                anchor_key: exercise.anchor_key,
                five_rm_kg: weight,
                measured_at: new Date().toISOString().slice(0, 10)
              });
            
            toast({
              title: "Новый рекорд!",
              description: `5МП для ${exercise.name[language]}: ${weight}кг`,
            });
          }
        }
      } catch (error) {
        console.error('Error saving test max:', error);
      }
    }

    if (isLastSet) {
      if (isLastExercise) {
        console.log('Test workout complete, calling onComplete...');
        // Workout complete
        const finalResults = {
          exercises: testExercises.length,
          totalSets: workoutResults.length + 1,
          results: [...workoutResults, result],
          completedAt: new Date()
        };
        console.log('Final results:', finalResults);
        onComplete(finalResults);
        return;
      } else {
        // Next exercise
        setCurrentExercise(prev => prev + 1);
        setCurrentSet(1);
        setCurrentWeight('');
        setActualReps('5');
        setShowInstructions(false); // Не показываем инструкции для следующих упражнений
        startRestTimer();
      }
    } else {
      // Next set
      setCurrentSet(prev => prev + 1);
      // Предлагаем увеличить вес если выполнили 5+ повторений
      if (reps >= 5) {
        setCurrentWeight((weight + 2.5).toString());
      }
      startRestTimer();
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  // Устанавливаем стартовый вес при первом заходе на упражнение
  if (!currentWeight && currentSet === 1) {
    setCurrentWeight(exercise.startWeight.toString());
  }

  if (isResting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="card-premium max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mb-6">
              <Timer className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gradient-gold mb-2">
                Отдых
              </h2>
              <p className="text-muted-foreground">
                Следующее упражнение: {testExercises[currentExercise]?.name[language] || exercise.name[language]}
              </p>
            </div>
            <div className="text-4xl font-bold text-primary mb-4">
              {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
            </div>
            <Button onClick={skipRest} variant="outline" className="mt-4">
              Пропустить отдых
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentExercise + 1} из {testExercises.length}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Instructions Card - показываем только для первого упражнения или по запросу */}
        {showInstructions && currentExercise === 0 && (
          <Card className="card-premium border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Info className="h-5 w-5" />
                Как определить свой 5МП
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Что такое 5МП?</h4>
                <p className="text-sm text-muted-foreground">
                  5МП (5 повторный максимум) - это максимальный вес, с которым вы можете выполнить ровно 5 повторений с правильной техникой.
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Важно для безопасности:</h4>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• Всегда разминайтесь перед упражнениями</li>
                      <li>• Начинайте с легкого веса и постепенно увеличивайте</li>
                      <li>• Следите за правильной техникой</li>
                      <li>• При необходимости используйте страховку</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <strong>Инструкция для {exercise.name[language]}:</strong>
                <p className="mt-1">{exercise.instruction[language]}</p>
              </div>
              
              <Button 
                onClick={() => setShowInstructions(false)}
                variant="outline" 
                className="w-full"
              >
                Понятно, начинаем!
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exercise Card */}
        <Card className="card-premium">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gradient-gold mb-2">
              {exercise.name[language]}
            </CardTitle>
            <CardDescription>
              {exercise.description[language]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Инструкция для текущего упражнения */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Как выполнять:</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {exercise.instruction[language]}
                  </p>
                  {currentExercise === 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-700 dark:text-amber-300">
                          <strong>Безопасность:</strong> Разминайтесь, начинайте с легкого веса, следите за техникой, используйте страховку при необходимости.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold text-primary">{exercise.sets}</div>
                  <div className="text-sm text-muted-foreground">Подходов</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold text-primary">{exercise.targetReps}</div>
                  <div className="text-sm text-muted-foreground">Цель повторений</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold text-primary">{Math.floor(exercise.restTime / 60)}м</div>
                  <div className="text-sm text-muted-foreground">Отдых</div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold mb-2">
                  Подход {currentSet} из {exercise.sets}
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                    style={{ width: `${(currentSet / exercise.sets) * 100}%` }}
                  />
                </div>
              </div>

              {/* Weight and Reps Input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Вес (кг)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.5"
                    min="0"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    placeholder="Введите вес"
                    className="text-center text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Повторений</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    max="20"
                    value={actualReps}
                    onChange={(e) => setActualReps(e.target.value)}
                    className="text-center text-lg font-semibold"
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <strong>Подсказка:</strong> Если вы легко выполнили 5+ повторений, увеличьте вес на следующем подходе. 
                Если не смогли выполнить 5 повторений, уменьшите вес.
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={handleSetComplete}
                  variant="premium"
                  size="lg"
                  className="min-w-48"
                  disabled={!currentWeight || !actualReps}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {isLastSet && isLastExercise ? 'Завершить тестирование' : 'Подход выполнен'}
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Progress Overview */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg">Прогресс тестирования</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testExercises.map((ex, index) => (
                <div 
                  key={ex.id}
                  className={`flex items-center justify-between p-2 rounded ${
                    index === currentExercise ? 'bg-primary/10 border border-primary/20' : 
                    index < currentExercise ? 'bg-success/10' : 'bg-muted/30'
                  }`}
                >
                  <span className="font-medium">{ex.name[language]}</span>
                  <span className="text-sm text-muted-foreground">
                    {index < currentExercise ? '✓' : 
                     index === currentExercise ? `${currentSet}/${ex.sets}` : 
                     `0/${ex.sets}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}