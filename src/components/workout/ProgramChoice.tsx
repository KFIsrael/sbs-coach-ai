import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, FlaskConical } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProgramChoiceProps {
  onBack: () => void;
  onAIGeneration: () => void;
  onTestWorkout: () => void;
}

export function ProgramChoice({ onBack, onAIGeneration, onTestWorkout }: ProgramChoiceProps) {
  const { t } = useLanguage();

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
          <Card className="card-premium cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20" onClick={onAIGeneration}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl text-gradient-gold">
                {t('program_choice.ai_generation')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('program_choice.ai_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="premium" 
                className="w-full"
                onClick={onAIGeneration}
              >
                <Zap className="h-4 w-4 mr-2" />
                {t('program_choice.ai_generation')}
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
                {t('program_choice.test_workout')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('program_choice.test_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                className="w-full border-accent hover:bg-accent hover:text-accent-foreground"
                onClick={onTestWorkout}
              >
                <FlaskConical className="h-4 w-4 mr-2" />
                {t('program_choice.test_workout')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}