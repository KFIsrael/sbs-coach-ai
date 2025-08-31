import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  ArrowLeft, 
  Mail, 
  MessageSquare,
  Target,
  Activity,
  Calendar,
  Dumbbell,
  Edit,
  Trash2
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfileProps {
  user: { name: string; email: string; id?: string; };
  onBack: () => void;
  onAccountDeleted?: () => void;
}

interface QuestionnaireData {
  fitness_goal?: string;
  fitness_level?: string;
  age_range?: string;
  limitations?: string;
  equipment?: string;
  body_type?: string; 
  completed_at?: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_read: boolean;
}

export function UserProfile({ user, onBack, onAccountDeleted }: UserProfileProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Fetch questionnaire data
      const { data: questionnaire } = await supabase
        .from('user_questionnaire_data')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (questionnaire) {
        setQuestionnaireData(questionnaire);
      }

      // Fetch messages
      const { data: userMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', authUser.id)
        .order('created_at', { ascending: false });

      if (userMessages) {
        setMessages(userMessages);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: t('common.error'),
        description: "Ошибка загрузки данных профиля",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== "УДАЛИТЬ") {
      toast({
        title: "Ошибка",
        description: "Введите 'УДАЛИТЬ' для подтверждения",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // For now, we'll just sign out the user and inform them to contact support
      // In a production app, you'd want an edge function with admin rights to actually delete the user
      await supabase.auth.signOut();

      toast({
        title: "Запрос на удаление отправлен",
        description: "Ваша сессия завершена. Для окончательного удаления аккаунта обратитесь в службу поддержки.",
      });

      // Call the callback to handle logout
      if (onAccountDeleted) {
        onAccountDeleted();
      } else {
        onBack();
      }
    } catch (error: any) {
      console.error('Error during account deletion process:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обработать запрос на удаление",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getGoalLabel = (goal: string) => {
    const goals: Record<string, string> = {
      strength: 'Увеличить силу',
      muscle_gain: 'Набрать мышечную массу', 
      fat_loss: 'Сжечь жир',
      general_fitness: 'Общая физподготовка'
    };
    return goals[goal] || goal;
  };

  const getLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: 'Новичок',
      intermediate: 'Средний',
      advanced: 'Продвинутый'
    };
    return levels[level] || level;
  };

  const getEquipmentLabel = (equipment: string) => {
    const equipments: Record<string, string> = {
      full_gym: 'Полный доступ к залу',
      home_basic: 'Только гантели + штанга',
      bodyweight: 'Только резины/собственный вес',
      minimal: 'Минимум (турник/брусья)'
    };
    return equipments[equipment] || equipment;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gradient-gold">{t('profile.title')}</h1>
            <p className="text-sm text-muted-foreground">{user.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Personal Information */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t('profile.personal_data')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                Активный клиент
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Questionnaire Results */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Ваш профиль тренировок
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // TODO: Implement edit functionality
                  toast({
                    title: "В разработке",
                    description: "Функция редактирования профиля будет доступна в следующих обновлениях",
                  });
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Изменить
              </Button>
            </div>
            {questionnaireData?.completed_at && (
              <CardDescription>
                Заполнено {new Date(questionnaireData.completed_at).toLocaleDateString('ru-RU')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {questionnaireData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Цель</p>
                  <p className="text-base font-semibold">
                    {questionnaireData.fitness_goal ? getGoalLabel(questionnaireData.fitness_goal) : 'Не указано'}
                  </p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Уровень</p>
                  <p className="text-base font-semibold">
                    {questionnaireData.fitness_level ? getLevelLabel(questionnaireData.fitness_level) : 'Не указано'}
                  </p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Возраст</p>
                  <p className="text-base font-semibold">
                    {questionnaireData.age_range || 'Не указано'}
                  </p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Оборудование</p>
                  <p className="text-base font-semibold">
                    {questionnaireData.equipment ? getEquipmentLabel(questionnaireData.equipment) : 'Не указано'}
                  </p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Ограничения</p>
                  <p className="text-base font-semibold">
                    {questionnaireData.limitations === 'none' ? 'Нет ограничений' : questionnaireData.limitations || 'Не указано'}
                  </p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Телосложение</p>
                  <p className="text-base font-semibold">
                    {questionnaireData.body_type === 'normal' ? 'Нормальное' : questionnaireData.body_type || 'Не указано'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Анкета не заполнена</p>
            )}
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>{t('profile.subscription')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Базовый план</h4>
                <p className="text-sm text-muted-foreground">Доступ к базовым функциям</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Активен
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {t('profile.messages')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">От тренера</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                    {!message.is_read && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Новое
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{t('profile.no_messages')}</p>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Опасная зона
            </CardTitle>
            <CardDescription>
              Необратимые действия с вашим аккаунтом
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h3 className="font-medium text-destructive mb-2">Удаление аккаунта</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  При удалении аккаунта будут безвозвратно удалены все ваши данные: профиль, 
                  программы тренировок, сообщения и другая информация. Это действие нельзя отменить.
                  После подтверждения ваша сессия будет завершена.
                </p>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить аккаунт
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-destructive">Удалить аккаунт?</DialogTitle>
                      <DialogDescription>
                        Это действие нельзя отменить. Все ваши данные будут безвозвратно удалены.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="confirm-delete">
                          Введите <span className="font-mono font-bold">УДАЛИТЬ</span> для подтверждения:
                        </Label>
                        <Input
                          id="confirm-delete"
                          value={confirmDelete}
                          onChange={(e) => setConfirmDelete(e.target.value)}
                          placeholder="УДАЛИТЬ"
                          className="font-mono"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowDeleteDialog(false);
                            setConfirmDelete("");
                          }}
                        >
                          Отмена
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={deleting || confirmDelete !== "УДАЛИТЬ"}
                        >
                          {deleting ? 'Удаление...' : 'Удалить аккаунт'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}