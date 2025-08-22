import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Timer, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

interface TestWorkoutProps {
  onBack: () => void;
  onComplete: (results: any) => void;
}

// 5 basic exercises covering different muscle groups
const testExercises = [
  {
    id: "test-1",
    name: {
      ru: "Приседания",
      en: "Squats"
    },
    description: {
      ru: "Базовое упражнение для ног и ягодиц",
      en: "Basic exercise for legs and glutes"
    },
    muscleGroup: "legs",
    reps: "15-20",
    sets: 3,
    restTime: 60
  },
  {
    id: "test-2", 
    name: {
      ru: "Отжимания",
      en: "Push-ups"
    },
    description: {
      ru: "Базовое упражнение для груди и рук",
      en: "Basic exercise for chest and arms"
    },
    muscleGroup: "chest",
    reps: "10-15",
    sets: 3,
    restTime: 60
  },
  {
    id: "test-3",
    name: {
      ru: "Планка",
      en: "Plank"
    },
    description: {
      ru: "Статическое упражнение для кора",
      en: "Static exercise for core"
    },
    muscleGroup: "core",
    reps: "30-60 сек",
    sets: 3,
    restTime: 60
  },
  {
    id: "test-4",
    name: {
      ru: "Подтягивания или обратные отжимания",
      en: "Pull-ups or Reverse Push-ups"
    },
    description: {
      ru: "Упражнение для спины и бицепсов",
      en: "Exercise for back and biceps"
    },
    muscleGroup: "back",
    reps: "8-12",
    sets: 3,
    restTime: 90
  },
  {
    id: "test-5",
    name: {
      ru: "Выпады",
      en: "Lunges"
    },
    description: {
      ru: "Функциональное упражнение для ног",
      en: "Functional exercise for legs"
    },
    muscleGroup: "legs",
    reps: "10-12 на каждую ногу",
    sets: 3,
    restTime: 60
  }
];

export function TestWorkout({ onBack, onComplete }: TestWorkoutProps) {
  const { t, language } = useLanguage();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutResults, setWorkoutResults] = useState<any[]>([]);

  const exercise = testExercises[currentExercise];
  const isLastExercise = currentExercise === testExercises.length - 1;
  const isLastSet = currentSet === exercise.sets;

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

  const handleSetComplete = () => {
    const result = {
      exerciseId: exercise.id,
      exerciseName: exercise.name[language],
      set: currentSet,
      completed: true,
      timestamp: new Date()
    };

    setWorkoutResults(prev => [...prev, result]);

    if (isLastSet) {
      if (isLastExercise) {
        // Workout complete
        onComplete({
          exercises: testExercises.length,
          totalSets: workoutResults.length + 1,
          results: [...workoutResults, result],
          completedAt: new Date()
        });
      } else {
        // Next exercise
        setCurrentExercise(prev => prev + 1);
        setCurrentSet(1);
        startRestTimer();
      }
    } else {
      // Next set
      setCurrentSet(prev => prev + 1);
      startRestTimer();
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

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

      {/* Exercise */}
      <div className="max-w-2xl mx-auto">
        <Card className="card-premium mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gradient-gold mb-2">
              {exercise.name[language]}
            </CardTitle>
            <CardDescription>
              {exercise.description[language]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">{exercise.sets}</div>
                <div className="text-sm text-muted-foreground">Подходов</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">{exercise.reps}</div>
                <div className="text-sm text-muted-foreground">Повторений</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">{exercise.restTime}с</div>
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

            <div className="flex justify-center">
              <Button 
                onClick={handleSetComplete}
                variant="premium"
                size="lg"
                className="min-w-48"
              >
                <Play className="mr-2 h-5 w-5" />
                {isLastSet && isLastExercise ? 'Завершить тренировку' : 'Подход выполнен'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg">Прогресс тренировки</CardTitle>
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