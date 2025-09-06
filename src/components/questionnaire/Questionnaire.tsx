import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, CheckCircle, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuestionnaireProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

interface BaseQuestion {
  id: number;
  title: string;
  type: string;
}

interface RegularQuestion extends BaseQuestion {
  block: string;
  options: Array<{
    value: string;
    label: string;
    hasInput?: boolean;
  }>;
}

interface FiveRMQuestion extends BaseQuestion {
  anchor_key: string;
}

type Question = RegularQuestion | FiveRMQuestion;

const getQuestions = (): RegularQuestion[] => [
  {
    id: 1,
    title: "Какова твоя основная цель?",
    type: "single",
    block: "goal_and_level",
    options: [
      { value: "strength", label: "🏋️ Увеличить силу" },
      { value: "muscle_gain", label: "💪 Набрать мышечную массу" },
      { value: "weight_loss", label: "🔥 Сжечь жир" },
      { value: "general_fitness", label: "⚡ Общая физподготовка / здоровье" }
    ]
  },
  {
    id: 2,
    title: "Как оцениваешь свой уровень?",
    type: "single",
    block: "goal_and_level",
    options: [
      { value: "beginner", label: "Новичок (меньше 6 месяцев регулярных тренировок)" },
      { value: "intermediate", label: "Средний (от 6 мес до 2 лет)" },
      { value: "advanced", label: "Продвинутый (2+ лет)" }
    ]
  },
  {
    id: 3,
    title: "Твой возраст?",
    type: "single",
    block: "age_and_limitations",
    options: [
      { value: "under_18", label: "До 18" },
      { value: "18-29", label: "18–29" },
      { value: "30-39", label: "30–39" },
      { value: "40-49", label: "40–49" },
      { value: "50-59", label: "50–59" },
      { value: "60+", label: "60+" }
    ]
  },
  {
    id: 4,
    title: "Есть ли ограничения по здоровью/травмы?",
    type: "single_with_input",
    block: "age_and_limitations",
    options: [
      { value: "none", label: "Нет ограничений" },
      { value: "knee", label: "Проблемы с коленями" },
      { value: "back", label: "Проблемы с поясницей" },
      { value: "shoulder", label: "Проблемы с плечами" },
      { value: "other", label: "Другое", hasInput: true }
    ]
  },
  {
    id: 5,
    title: "Что у тебя есть для тренировок?",
    type: "single",
    block: "equipment",
    options: [
      { value: "full_gym", label: "Полный доступ к тренажёрному залу" },
      { value: "dumbbells_barbell", label: "Только гантели + штанга" },
      { value: "bodyweight_bands", label: "Только резины/собственный вес" },
      { value: "minimal", label: "Минимум (турник/брусья)" }
    ]
  },
  {
    id: 6,
    title: "Как ты оцениваешь своё телосложение сейчас?",
    type: "single",
    block: "body_type",
    options: [
      { value: "overweight", label: "Избыточный вес / ожирение" },
      { value: "normal", label: "Нормальное" },
      { value: "thin", label: "Худой / эктоморф" },
      { value: "athletic", label: "Атлетичное" }
    ]
  }
];

const get5RMQuestions = (): FiveRMQuestion[] => [
  {
    id: 7,
    title: "Жим штанги лёжа (грудь)",
    type: "input_with_skip",
    anchor_key: "bench_press"
  },
  {
    id: 8,
    title: "Подтягивания или вертикальная тяга (спина)",
    type: "input_with_skip", 
    anchor_key: "pull_up"
  },
  {
    id: 9,
    title: "Жим штанги/гантелей над головой (плечи)",  
    type: "input_with_skip",
    anchor_key: "overhead_press"
  },
  {
    id: 10,
    title: "Жим ногами / приседания (ноги)",
    type: "input_with_skip",
    anchor_key: "squat"
  },
  {
    id: 11,
    title: "Румынская тяга или ягодичный мостик (ягодицы/задняя цепь)", 
    type: "input_with_skip",
    anchor_key: "deadlift"
  }
];

export function Questionnaire({ onComplete, onBack }: QuestionnaireProps) {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [textInputs, setTextInputs] = useState<Record<number, string>>({});
  const [fiveRMInputs, setFiveRMInputs] = useState<Record<string, number | null>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [wantsWeights, setWantsWeights] = useState<boolean | null>(null);
  const [in5RMSection, setIn5RMSection] = useState(false);
  
  const questions = getQuestions();
  const fiveRMQuestions = get5RMQuestions();

  // Check if user is in demo mode
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsDemoUser(user?.email === "demo@sbs.com");
    };
    checkUser();
  }, []);

  const totalQuestions = questions.length + (wantsWeights ? fiveRMQuestions.length : 0);
  const currentQuestionIndex = in5RMSection ? questions.length + currentQuestion : currentQuestion;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  
  const getCurrentQuestions = () => in5RMSection ? fiveRMQuestions : questions;
  const currentQuestions = getCurrentQuestions();
  const isLastQuestion = currentQuestion === currentQuestions.length - 1;
  
  const canProceed = () => {
    const currentQ = currentQuestions[currentQuestion];
    if (!currentQ) return false;
    
    if (currentQ.type === "input_with_skip") {
      return true; // Can always proceed with 5RM questions (skip option available)
    }
    
    const hasAnswer = answers[currentQ.id];
    if (currentQ.type === "single_with_input" && hasAnswer === "other" && 'options' in currentQ) {
      return textInputs[currentQ.id]?.trim().length > 0;
    }
    
    return hasAnswer;
  };

  const handleAnswer = (value: string) => {
    const currentQ = currentQuestions[currentQuestion];
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: value
    }));
  };

  const handleTextInput = (questionId: number, value: string) => {
    setTextInputs(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handle5RMInput = (anchorKey: string, value: number | null) => {
    setFiveRMInputs(prev => ({
      ...prev,
      [anchorKey]: value
    }));
  };

  const handleTransitionChoice = (choice: boolean) => {
    setWantsWeights(choice);
    setShowTransition(false);
    if (choice) {
      setIn5RMSection(true);
      setCurrentQuestion(0);
    } else {
      // Complete without 5RM
      completeQuestionnaire();
    }
  };

  const completeQuestionnaire = async () => {
    setIsCompleting(true);
    
    try {
      // Check authentication before saving
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Ошибка",
          description: "Необходимо войти в систему для сохранения анкеты",
          variant: "destructive",
        });
        setIsCompleting(false);
        onBack(); // Return to dashboard, which will redirect to auth
        return;
      }

      // Check if it's a demo user (they can't save to database)
      if (user.email === "demo@sbs.com") {
        toast({
          title: "Демо режим",
          description: "В демо режиме данные не сохраняются. Войдите через email/пароль для полного доступа.",
          variant: "destructive",
        });
        setIsCompleting(false);
        return;
      }

      const now = new Date().toISOString();
      
      // Save questionnaire data
      const { error: questionnaireError } = await supabase
        .from('user_questionnaire_data')
        .upsert({
          user_id: user.id,
          fitness_goal: answers[1], // question ID 1
          fitness_level: answers[2], // question ID 2  
          age_range: answers[3], // question ID 3
          limitations: answers[4] === "other" ? textInputs[4] || answers[4] : answers[4], // question ID 4
          equipment: answers[5], // question ID 5
          body_type: answers[6], // question ID 6
          updated_at: now,
          completed_at: now
        }, {
          onConflict: 'user_id'
        });

      if (questionnaireError) {
        console.error('Error saving questionnaire data:', questionnaireError);
        toast({
          title: "Ошибка",
          description: `Ошибка сохранения анкеты: ${questionnaireError.message}`,
          variant: "destructive",
        });
        setIsCompleting(false);
        return;
      }

      // Save 5RM data if provided
      if (wantsWeights && Object.keys(fiveRMInputs).length > 0) {
        const testMaxes = Object.entries(fiveRMInputs)
          .filter(([_, value]) => value !== null)
          .map(([anchorKey, fiveRM]) => ({
            user_id: user.id,
            anchor_key: anchorKey,
            five_rm_kg: fiveRM,
            measured_at: new Date().toISOString().split('T')[0]
          }));

        if (testMaxes.length > 0) {
          const { error: testMaxError } = await supabase
            .from('user_test_maxes')
            .upsert(testMaxes, {
              onConflict: 'user_id,anchor_key'
            });

          if (testMaxError) {
            console.error('Error saving test maxes:', testMaxError);
            // Don't fail the entire process, just warn
            toast({
              title: "Предупреждение",
              description: "Анкета сохранена, но не удалось сохранить данные о весах",
            });
          }
        }
      }

      toast({
        title: "Успешно",
        description: "Данные анкеты сохранены",
      });

      // Simulate processing time
      setTimeout(() => {
        onComplete({ answers, textInputs, fiveRMInputs, wantsWeights });
      }, 1000);
    } catch (error) {
      console.error('Error in completeQuestionnaire:', error);
      setIsCompleting(false);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении",
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      if (in5RMSection) {
        // Complete the questionnaire with 5RM data
        completeQuestionnaire();
      } else {
        // Show transition screen
        setShowTransition(true);
      }
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else if (in5RMSection) {
      // Go back to main questionnaire
      setIn5RMSection(false);
      setCurrentQuestion(questions.length - 1);
    } else {
      onBack();
    }
  };

  const question = currentQuestions[currentQuestion];

  // Transition screen
  if (showTransition) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="card-premium text-center">
            <CardContent className="p-8">
              <div className="mb-6">
                <Dumbbell className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gradient-gold mb-4">
                  Отлично! 🙌
                </h2>
                <p className="text-muted-foreground mb-6">
                  На основе твоих ответов мы уже можем составить базовую программу тренировок.
                </p>
                <p className="text-base mb-8">
                  Но если ты хочешь, чтобы программа содержала не только упражнения и повторы, но и <strong>точные веса</strong> — пройди ещё один короткий этап.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  Ты можешь заполнить его прямо сейчас или вернуться позже в любой момент.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => handleTransitionChoice(true)}
                  variant="premium"
                  size="lg"
                  className="min-w-48"
                >
                  Да, хочу с весами
                </Button>
                <Button 
                  onClick={() => handleTransitionChoice(false)}
                  variant="outline"
                  size="lg"
                  className="min-w-48"
                >
                  Пропустить, составить без весов
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="card-premium max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gradient-gold mb-2">
                Анкета завершена!
              </h2>
              <p className="text-muted-foreground">
                Генерируем персональную программу...
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={100} className="h-2 bg-muted">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all w-full" />
              </Progress>
              <p className="text-sm text-primary font-medium">Генерируем программу...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={handlePrevious}
            className="text-muted-foreground hover:text-primary"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            {isDemoUser && (
              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400 hidden sm:inline-flex">
                Демо режим — сохранение отключено
              </Badge>
            )}
            <span className="text-xs sm:text-sm text-muted-foreground">
              {currentQuestionIndex + 1} из {totalQuestions}
            </span>
            {in5RMSection && (
              <Badge variant="secondary" className="text-xs">
                5ПМ
              </Badge>
            )}
          </div>
        </div>
        
        <Progress value={progress} className="h-2 bg-muted mb-4 sm:mb-6">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </Progress>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto">
        {in5RMSection ? (
          <Card className="card-premium">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gradient-gold mb-2">
                Замеры по ключевым упражнениям (5 повторений максимум)
              </CardTitle>
              <CardDescription>
                Введи максимальный вес, с которым ты можешь сделать ровно 5 повторений (5ПМ).
                <br />Если не знаешь — жми «Не знаю», и программа рассчитает вес автоматически по процентам.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">{question.title}</h3>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="Вес в кг"
                      value={'anchor_key' in question ? fiveRMInputs[question.anchor_key] || "" : ""}
                      onChange={(e) => {
                        if ('anchor_key' in question) {
                          handle5RMInput(question.anchor_key, e.target.value ? parseFloat(e.target.value) : null);
                        }
                      }}
                      className="w-32 text-center"
                      min="0"
                      step="0.5"
                    />
                    <span className="text-muted-foreground">кг</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      if ('anchor_key' in question) {
                        handle5RMInput(question.anchor_key, null);
                      }
                    }}
                    className="text-sm"
                  >
                    Не знаю
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-premium">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gradient-gold mb-2">
                {question.title}
              </CardTitle>
              <CardDescription>
                Выбери подходящий вариант
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={answers[question.id] || ""} 
                onValueChange={handleAnswer}
                className="space-y-3"
              >
                {'options' in question && question.options.map((option) => (
                  <div key={option.value}>
                    <div 
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
                    
                    {/* Text input for "other" option */}
                    {option.hasInput && answers[question.id] === option.value && (
                      <div className="ml-8 mt-2">
                        <Textarea
                          placeholder="Опишите подробнее..."
                          value={textInputs[question.id] || ""}
                          onChange={(e) => handleTextInput(question.id, e.target.value)}
                          className="w-full"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-end mt-8">
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
            variant="premium"
            size="lg"
            className="min-w-32"
          >
            {isLastQuestion ? (
              in5RMSection ? "Завершить" : "Далее"
            ) : (
              <>
                Далее
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}