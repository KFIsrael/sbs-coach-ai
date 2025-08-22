import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, Clock, Target, Play, CheckCircle2 } from "lucide-react";

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
}

// Mock workout program data
const workoutProgram: WorkoutDay[] = [
  {
    day: 1,
    title: "Upper Body Strength",
    focus: "Chest, Back, Shoulders",
    duration: "45 min",
    completed: true,
    exercises: [
      {
        id: "1",
        name: "Push-ups",
        description: "Classic bodyweight chest exercise",
        muscleGroup: "Chest",
        sets: "3 sets × 12-15 reps"
      },
      {
        id: "2", 
        name: "Pull-ups",
        description: "Upper body pulling movement",
        muscleGroup: "Back",
        sets: "3 sets × 8-12 reps"
      },
      {
        id: "3",
        name: "Overhead Press",
        description: "Shoulder strength builder",
        muscleGroup: "Shoulders", 
        sets: "3 sets × 10-12 reps"
      }
    ]
  },
  {
    day: 2,
    title: "Lower Body Power",
    focus: "Legs, Glutes",
    duration: "50 min",
    completed: true,
    exercises: [
      {
        id: "4",
        name: "Squats",
        description: "Fundamental leg exercise",
        muscleGroup: "Legs",
        sets: "4 sets × 12-15 reps"
      },
      {
        id: "5",
        name: "Deadlifts",
        description: "Full body strength movement",
        muscleGroup: "Back, Legs",
        sets: "3 sets × 8-10 reps"
      }
    ]
  },
  {
    day: 3,
    title: "Core & Conditioning",
    focus: "Core, Cardio",
    duration: "40 min",
    completed: false,
    exercises: [
      {
        id: "6",
        name: "Plank",
        description: "Core stability exercise",
        muscleGroup: "Core",
        sets: "3 sets × 30-60 sec"
      },
      {
        id: "7",
        name: "Mountain Climbers",
        description: "Dynamic core and cardio",
        muscleGroup: "Core, Cardio",
        sets: "3 sets × 20 reps"
      }
    ]
  }
];

export function WorkoutProgram({ onBack, onStartWorkout }: WorkoutProgramProps) {
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
            Back to Dashboard
          </Button>
        </div>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gradient-gold mb-2">
            Your Training Program
          </h1>
          <p className="text-muted-foreground mb-4">
            AI-generated program based on your assessment
          </p>
          
          {/* Overall Progress */}
          <Card className="card-premium max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Progress</span>
                  <span className="font-medium">{completedWorkouts}/{totalWorkouts} workouts</span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-muted">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" 
                    style={{ width: `${progressPercentage}%` }} 
                  />
                </Progress>
                <div className="text-xs text-primary font-medium">
                  {Math.round(progressPercentage)}% Complete
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={day.completed ? "secondary" : "outline"} className="bg-primary/20 text-primary border-primary/30">
                      Day {day.day}
                    </Badge>
                    {day.completed && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                  </div>
                  <CardTitle className="text-xl mb-1">{day.title}</CardTitle>
                  <CardDescription className="text-base">{day.focus}</CardDescription>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {day.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {day.exercises.length} exercises
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant={day.completed ? "outline_gold" : "premium"}
                  onClick={() => onStartWorkout(day)}
                  className="ml-4"
                >
                  {day.completed ? (
                    <>Review Workout</>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Workout
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium text-primary">Exercises Preview:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {day.exercises.map((exercise) => (
                    <div 
                      key={exercise.id}
                      className="bg-muted/30 rounded-lg p-3 space-y-1"
                    >
                      <div className="font-medium text-sm">{exercise.name}</div>
                      <div className="text-xs text-muted-foreground">{exercise.sets}</div>
                      <Badge variant="outline" className="text-xs">
                        {exercise.muscleGroup}
                      </Badge>
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
              Program Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">3</div>
                <div className="text-sm text-muted-foreground">Workouts/Week</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">45</div>
                <div className="text-sm text-muted-foreground">Avg Minutes</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">12</div>
                <div className="text-sm text-muted-foreground">Week Program</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}