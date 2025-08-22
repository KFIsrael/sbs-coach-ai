import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

interface QuestionnaireProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const questions = [
  {
    id: 1,
    title: "What's your primary fitness goal?",
    type: "single",
    options: [
      { value: "weight_loss", label: "Weight Loss" },
      { value: "muscle_gain", label: "Muscle Gain" },
      { value: "endurance", label: "Improve Endurance" },
      { value: "strength", label: "Build Strength" },
      { value: "general_fitness", label: "General Fitness" }
    ]
  },
  {
    id: 2,
    title: "What's your current fitness level?",
    type: "single",
    options: [
      { value: "beginner", label: "Beginner - Just starting out" },
      { value: "intermediate", label: "Intermediate - Some experience" },
      { value: "advanced", label: "Advanced - Regular training" },
      { value: "expert", label: "Expert - Competitive level" }
    ]
  },
  {
    id: 3,
    title: "How many days per week can you train?",
    type: "single",
    options: [
      { value: "2", label: "2 days per week" },
      { value: "3", label: "3 days per week" },
      { value: "4", label: "4 days per week" },
      { value: "5", label: "5 days per week" },
      { value: "6+", label: "6+ days per week" }
    ]
  },
  {
    id: 4,
    title: "Do you have any injuries or physical limitations?",
    type: "single",
    options: [
      { value: "none", label: "No limitations" },
      { value: "back", label: "Back problems" },
      { value: "knee", label: "Knee issues" },
      { value: "shoulder", label: "Shoulder problems" },
      { value: "other", label: "Other limitations" }
    ]
  },
  {
    id: 5,
    title: "What equipment do you have access to?",
    type: "single",
    options: [
      { value: "full_gym", label: "Full gym access" },
      { value: "home_basic", label: "Basic home equipment" },
      { value: "bodyweight", label: "Bodyweight only" },
      { value: "dumbbells", label: "Dumbbells/bands" }
    ]
  }
];

export function Questionnaire({ onComplete, onBack }: QuestionnaireProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isCompleting, setIsCompleting] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = answers[questions[currentQuestion].id];

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsCompleting(true);
      setTimeout(() => {
        onComplete(answers);
      }, 1500);
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const question = questions[currentQuestion];

  if (isCompleting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="card-premium max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gradient-gold mb-2">
                Assessment Complete!
              </h2>
              <p className="text-muted-foreground">
                Creating your personalized training program...
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={100} className="h-2 bg-muted">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all w-full" />
              </Progress>
              <p className="text-sm text-primary font-medium">Generating program...</p>
            </div>
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
            onClick={handlePrevious}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        
        <Progress value={progress} className="h-2 bg-muted mb-6">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </Progress>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto">
        <Card className="card-premium">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gradient-gold mb-2">
              {question.title}
            </CardTitle>
            <CardDescription>
              Choose the option that best describes you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup 
              value={answers[question.id] || ""} 
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {question.options.map((option) => (
                <div 
                  key={option.value}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleAnswer(option.value)}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="border-primary text-primary"
                  />
                  <Label 
                    htmlFor={option.value} 
                    className="flex-1 cursor-pointer text-base"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-end mt-8">
          <Button 
            onClick={handleNext}
            disabled={!canProceed}
            variant="premium"
            size="lg"
            className="min-w-32"
          >
            {isLastQuestion ? (
              <>Complete</>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}