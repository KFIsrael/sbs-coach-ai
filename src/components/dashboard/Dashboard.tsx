import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Calendar, 
  Target, 
  Trophy, 
  TrendingUp, 
  Zap, 
  User,
  LogOut,
  Play,
  MessageCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DashboardProps {
  user: { name: string; email: string };
  onStartQuestionnaire: () => void;
  onStartWorkout: () => void;
  onViewPrograms: () => void;
  onOpenChat: () => void;
  onLogout: () => void;
}

export function Dashboard({ 
  user, 
  onStartQuestionnaire, 
  onStartWorkout, 
  onViewPrograms, 
  onOpenChat,
  onLogout 
}: DashboardProps) {
  const { t } = useLanguage();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gradient-gold">Sport Body System</h1>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onLogout}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="mb-8">
        <Card className="card-premium bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-gradient-gold">
                  {t('dashboard.welcome')}, {user.name}! 💪
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {t('dashboard.ready_to_train')}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                Active
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-105" onClick={onStartWorkout}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-full p-2">
                <Play className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('dashboard.start_workout')}</CardTitle>
                <CardDescription>Begin today's training session</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="card-premium hover:shadow-gold cursor-pointer transition-all duration-300 hover:scale-105" onClick={onStartQuestionnaire}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-accent rounded-full p-2">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Assessment</CardTitle>
                <CardDescription>Complete fitness questionnaire</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">3 of 5 workouts</span>
                <span className="font-medium">60%</span>
              </div>
              <Progress value={60} className="h-2 bg-muted">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: '60%' }} />
              </Progress>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-success" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">7 days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+15%</div>
            <p className="text-xs text-muted-foreground mt-1">Strength gain</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Features */}
      <Card className="card-premium mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Advanced features being developed for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/20 rounded p-1">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Nutritionist</p>
                <p className="text-xs text-muted-foreground">Meal planning</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/20 rounded p-1">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Endocrinologist</p>
                <p className="text-xs text-muted-foreground">Hormone optimization</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/20 rounded p-1">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Sports Doctor</p>
                <p className="text-xs text-muted-foreground">Injury prevention</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          variant="premium" 
          size="xl" 
          onClick={onViewPrograms}
          className="w-full justify-start"
        >
          <Trophy className="mr-2 h-5 w-5" />
          View Training Programs
        </Button>
        
        <Button 
          variant="outline_gold" 
          size="xl" 
          onClick={onOpenChat}
          className="w-full justify-start"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          AI Coach Chat
        </Button>
      </div>

      {/* Floating Chat Button */}
      <Button
        onClick={onOpenChat}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-gold floating-element"
        variant="premium"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}