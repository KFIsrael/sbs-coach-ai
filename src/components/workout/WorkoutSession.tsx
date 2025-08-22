import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Timer, CheckCircle2, Play, Pause, RotateCcw, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>({});
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [restTimer, setRestTimer] = useState(0);

  const progress = ((currentExercise + 1) / workout.exercises.length) * 100;
  const exercise = workout.exercises[currentExercise];
  const isLastExercise = currentExercise === workout.exercises.length - 1;

  const getExerciseLog = (exerciseId: string): ExerciseLog => {
    return exerciseLogs[exerciseId] || {
      exerciseId,
      sets: [
        { weight: 0, reps: 0, completed: false },
        { weight: 0, reps: 0, completed: false },
        { weight: 0, reps: 0, completed: false }
      ]
    };
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number) => {
    const log = getExerciseLog(exerciseId);
    const updatedSets = [...log.sets];
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };
    
    setExerciseLogs(prev => ({
      ...prev,
      [exerciseId]: { ...log, sets: updatedSets }
    }));
  };

  const markSetCompleted = (exerciseId: string, setIndex: number) => {
    const log = getExerciseLog(exerciseId);
    const updatedSets = [...log.sets];
    updatedSets[setIndex] = { ...updatedSets[setIndex], completed: !updatedSets[setIndex].completed };
    
    setExerciseLogs(prev => ({
      ...prev,
      [exerciseId]: { ...log, sets: updatedSets }
    }));

    if (!updatedSets[setIndex].completed) {
      // Start rest timer when set is completed
      setRestTimer(90); // 90 seconds rest
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
  };

  const handleNextExercise = () => {
    if (isLastExercise) {
      handleCompleteWorkout();
    } else {
      setCurrentExercise(prev => prev + 1);
      setRestTimer(0);
      setIsTimerRunning(false);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(prev => prev - 1);
      setRestTimer(0);
      setIsTimerRunning(false);
    }
  };

  const handleCompleteWorkout = () => {
    toast({
      title: "Тренировка завершена! 🎉",
      description: "Отличная работа! Ваш прогресс сохранен."
    });
    setTimeout(() => onComplete(), 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const log = getExerciseLog(exercise.id);

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
            Упражнение {currentExercise + 1} из {workout.exercises.length}
          </p>
        </div>
      </div>

      {/* Current Exercise */}
      <div className="max-w-2xl mx-auto">
        {/* Full Workout Overview */}
        <Card className="card-premium mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Все упражнения тренировки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workout.exercises.map((ex, index) => (
                <div 
                  key={ex.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    index === currentExercise 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="bg-primary/20 rounded-full p-2 flex-shrink-0">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{ex.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ex.muscleGroup}</span>
                      <span>•</span>
                      <span>{ex.sets}</span>
                    </div>
                  </div>
                  {index === currentExercise && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                      Текущее
                    </Badge>
                  )}
                  {index < currentExercise && (
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Exercise Details */}
        <Card className="card-premium mb-6">
          <CardHeader className="text-center">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 w-fit mx-auto mb-2">
              {exercise.muscleGroup}
            </Badge>
            <CardTitle className="text-2xl mb-2">{exercise.name}</CardTitle>
            <CardDescription className="text-base">
              {exercise.description}
            </CardDescription>
            <div className="text-sm text-primary font-medium mt-2">
              {exercise.sets}
            </div>
          </CardHeader>
        </Card>

        {/* Set Tracking */}
        <Card className="card-premium mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Отслеживание подходов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {log.sets.map((set, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border transition-all ${
                  set.completed 
                    ? 'bg-success/10 border-success/30' 
                    : 'bg-muted/30 border-border/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium">Подход {index + 1}</Label>
                  <Button
                    variant={set.completed ? "secondary" : "outline_gold"}
                    size="sm"
                    onClick={() => markSetCompleted(exercise.id, index)}
                  >
                    {set.completed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Выполнено
                      </>
                    ) : (
                      "Отметить выполненным"
                    )}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`weight-${index}`} className="text-sm">Вес (кг)</Label>
                    <Input
                      id={`weight-${index}`}
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(exercise.id, index, 'weight', Number(e.target.value))}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`reps-${index}`} className="text-sm">Повторения</Label>
                    <Input
                      id={`reps-${index}`}
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(exercise.id, index, 'reps', Number(e.target.value))}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

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