import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Zap, FlaskConical } from "lucide-react";
import { generateProgram } from "@/hooks/useProgram";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProgramChoiceProps {
  onBack: () => void;
  onAIGeneration: () => void;
  onTestWorkout: () => void;
}

export function ProgramChoice({ onBack, onAIGeneration, onTestWorkout }: ProgramChoiceProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const { toast } = useToast();

  const onGenerate = async () => {
    setLoading(true);
    try {
      await generateProgram(date);
      toast({
        title: "Программа создана!",
        description: "12-недельная программа тренировок готова",
      });
      onAIGeneration(); // редирект на страницу программы
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать программу",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            {t('questionnaire.back')}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient-gold mb-2">
            {t('program_choice.title')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('program_choice.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* AI Generation Option */}
          <Card className="card-premium">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl text-gradient-gold">
                Создать программу без тестовой тренировки
              </CardTitle>
              <CardDescription className="text-sm">
                Программа на основе анкеты с расчетом в % от 5МП (5 повторный максимум)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>Как это работает:</strong>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Программа создается на основе ваших ответов в анкете</li>
                  <li>• Веса рассчитываются в процентах от вашего 5МП (максимальный вес на 5 повторений)</li>
                  <li>• Подходит если вы примерно знаете свои рабочие веса</li>
                  <li>• Быстрый старт тренировок</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">Дата начала</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
              <Button
                onClick={onGenerate}
                disabled={loading}
                className="w-full"
                variant="premium"
                size="lg"
              >
                {loading ? 'Генерирую...' : 'Создать программу'}
              </Button>
            </CardContent>
          </Card>

          {/* Test Workout Option */}
          <Card className="card-premium cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20" onClick={onTestWorkout}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 rounded-full bg-accent/10 w-fit">
                <FlaskConical className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl text-gradient-gold">
                Пройти тестовую тренировку
              </CardTitle>
              <CardDescription className="text-sm">
                Определим ваши точные 5МП (5 повторный максимум) для каждого упражнения
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>Как это работает:</strong>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Проведем тестовую тренировку для определения ваших возможностей</li>
                  <li>• Определим ваши реальные 5МП (максимальный вес на 5 повторений)</li>
                  <li>• Создадим программу с точными рабочими весами</li>
                  <li>• Максимально персонализированный подход к тренировкам</li>
                </ul>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-accent hover:bg-accent hover:text-accent-foreground"
                onClick={onTestWorkout}
              >
                <FlaskConical className="h-4 w-4 mr-2" />
                Начать тестовую тренировку
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}