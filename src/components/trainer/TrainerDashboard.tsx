import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  ArrowLeft, 
  MessageSquare,
  Send,
  Target,
  Activity,
  Calendar,
  Dumbbell,
  Mail,
  User,
  Settings
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientProgramManager } from "./ClientProgramManager";

interface Client {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  questionnaire?: {
    fitness_goal?: string;
    fitness_level?: string;
    age_range?: string;
    limitations?: string;
    equipment?: string;
  };
  program_count?: number;
}

interface TrainerDashboardProps {
  user: { name: string; email: string };
  onBack: () => void;
}

export function TrainerDashboard({ user, onBack }: TrainerDashboardProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageContent, setMessageContent] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'program_manager'>('list');
  const [selectedClientForPrograms, setSelectedClientForPrograms] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // For now, we'll show all clients since we have one trainer
      // In the future, we can implement proper trainer-client assignments
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          username
        `)
        .eq('role', 'client');

      if (profiles) {
        // Fetch questionnaire data and program count for each client
        const clientsWithQuestionnaires = await Promise.all(
          profiles.map(async (profile) => {
            const [questionnaireResponse, programsResponse] = await Promise.all([
              supabase
                .from('user_questionnaire_data')
                .select('*')
                .eq('user_id', profile.user_id)
                .single(),
              supabase
                .from('workout_programs')
                .select('id')
                .eq('user_id', profile.user_id)
            ]);

            return {
              ...profile,
              questionnaire: questionnaireResponse.data || undefined,
              program_count: programsResponse.data?.length || 0
            };
          })
        );

        setClients(clientsWithQuestionnaires);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: t('common.error'),
        description: "Ошибка загрузки клиентов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedClient || !messageContent.trim()) return;

    setSendingMessage(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: authUser.id,
          recipient_id: selectedClient.user_id,
          content: messageContent.trim()
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: "Сообщение отправлено клиенту",
      });

      setMessageContent("");
      setSelectedClient(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('common.error'),
        description: "Ошибка отправки сообщения",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const formatGoal = (goal: string) => {
    switch (goal) {
      case 'weight_loss': return t('goal.weight_loss');
      case 'muscle_gain': return t('goal.muscle_gain');
      case 'endurance': return t('goal.endurance');
      case 'strength': return t('goal.strength');
      case 'general_fitness': return t('goal.general_fitness');
      default: return goal;
    }
  };

  const formatLevel = (level: string) => {
    switch (level) {
      case 'beginner': return t('level.beginner');
      case 'intermediate': return t('level.intermediate');
      case 'advanced': return t('level.advanced');
      case 'expert': return t('level.expert');
      default: return level;
    }
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
            <h1 className="text-2xl font-bold text-gradient-gold">{t('trainer.dashboard')}</h1>
            <p className="text-sm text-muted-foreground">Тренер: {user.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Всего клиентов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{clients.length}</div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-success" />
                Активных программ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{clients.length}</div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-accent" />
                Сообщений сегодня
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('trainer.clients')}
            </CardTitle>
            <CardDescription>
              Управляйте программами и общайтесь с клиентами
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => (
                  <Card key={client.user_id} className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {client.first_name && client.last_name 
                              ? `${client.first_name} ${client.last_name}`
                              : client.username || 'Неизвестный клиент'
                            }
                          </CardTitle>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Активен
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {client.questionnaire ? (
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Цель: </span>
                            <span className="text-muted-foreground">
                              {client.questionnaire.fitness_goal ? formatGoal(client.questionnaire.fitness_goal) : 'Не указана'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Уровень: </span>
                            <span className="text-muted-foreground">
                              {client.questionnaire.fitness_level ? formatLevel(client.questionnaire.fitness_level) : 'Не указан'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Возраст: </span>
                            <span className="text-muted-foreground">
                              {client.questionnaire.age_range || 'Не указан'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Анкета не заполнена</p>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => setSelectedClient(client)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Сообщение
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Отправить сообщение</DialogTitle>
                              <DialogDescription>
                                Сообщение для {client.first_name && client.last_name 
                                  ? `${client.first_name} ${client.last_name}`
                                  : client.username || 'клиента'
                                }
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Введите ваше сообщение..."
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                rows={4}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setMessageContent("");
                                    setSelectedClient(null);
                                  }}
                                >
                                  {t('common.cancel')}
                                </Button>
                                <Button
                                  onClick={sendMessage}
                                  disabled={!messageContent.trim() || sendingMessage}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  {sendingMessage ? 'Отправка...' : 'Отправить'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('trainer.no_clients')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}