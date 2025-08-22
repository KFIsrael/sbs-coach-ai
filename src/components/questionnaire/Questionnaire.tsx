import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuestionnaireProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const getQuestions = (t: (key: string) => string) => [
  {
    id: 1,
    title: t("question.fitness_goal"),
    type: "single",
    options: [
      { value: "weight_loss", label: t("goal.weight_loss") },
      { value: "muscle_gain", label: t("goal.muscle_gain") },
      { value: "endurance", label: t("goal.endurance") },
      { value: "strength", label: t("goal.strength") },
      { value: "general_fitness", label: t("goal.general_fitness") }
    ]
  },
  {
    id: 2,
    title: t("question.fitness_level"),
    type: "single",
    options: [
      { value: "beginner", label: t("level.beginner") },
      { value: "intermediate", label: t("level.intermediate") },
      { value: "advanced", label: t("level.advanced") },
      { value: "expert", label: t("level.expert") }
    ]
  },
  {
    id: 3,
    title: t("question.age"),
    type: "single",
    options: [
      { value: "18-25", label: t("age.18-25") },
      { value: "26-35", label: t("age.26-35") },
      { value: "36-45", label: t("age.36-45") },
      { value: "46-55", label: t("age.46-55") },
      { value: "56+", label: t("age.56+") }
    ]
  },
  {
    id: 4,
    title: t("question.limitations"),
    type: "single",
    options: [
      { value: "none", label: t("limitations.none") },
      { value: "back", label: t("limitations.back") },
      { value: "knee", label: t("limitations.knee") },
      { value: "shoulder", label: t("limitations.shoulder") },
      { value: "other", label: t("limitations.other") }
    ]
  },
  {
    id: 5,
    title: t("question.equipment"),
    type: "single",
    options: [
      { value: "full_gym", label: t("equipment.full_gym") },
      { value: "home_basic", label: t("equipment.home_basic") },
      { value: "bodyweight", label: t("equipment.bodyweight") },
      { value: "dumbbells", label: t("equipment.dumbbells") }
    ]
  }
];

export function Questionnaire({ onComplete, onBack }: QuestionnaireProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  
  const questions = getQuestions(t);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = answers[questions[currentQuestion].id];

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }));
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      setIsCompleting(true);
      
      try {
        // Save questionnaire data to database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: t('common.error'),
            description: "Пользователь не найден",
            variant: "destructive",
          });
          setIsCompleting(false);
          return;
        }

        const { error } = await supabase
          .from('user_questionnaire_data')
          .upsert({
            user_id: user.id,
            fitness_goal: answers[1], // question ID 1
            fitness_level: answers[2], // question ID 2  
            age_range: answers[3], // question ID 3
            limitations: answers[4], // question ID 4
            equipment: answers[5] // question ID 5
          });

        if (error) {
          console.error('Error saving questionnaire data:', error);
          toast({
            title: t('common.error'),
            description: "Ошибка сохранения данных анкеты",
            variant: "destructive",
          });
          setIsCompleting(false);
          return;
        }

        toast({
          title: t('common.success'),
          description: "Данные анкеты сохранены",
        });

        // Simulate processing time
        setTimeout(() => {
          onComplete(answers);
        }, 1000);
      } catch (error) {
        console.error('Error in handleNext:', error);
        setIsCompleting(false);
        toast({
          title: t('common.error'),
          description: "Произошла ошибка при сохранении",
          variant: "destructive",
        });
      }
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
                {t('questionnaire.assessment_complete')}
              </h2>
              <p className="text-muted-foreground">
                {t('questionnaire.generating')}
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={100} className="h-2 bg-muted">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all w-full" />
              </Progress>
              <p className="text-sm text-primary font-medium">{t('questionnaire.generating')}</p>
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
            {t('questionnaire.back')}
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
              {t('questionnaire.choose_option')}
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
              <>{t('questionnaire.complete')}</>
            ) : (
              <>
                {t('questionnaire.next')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}