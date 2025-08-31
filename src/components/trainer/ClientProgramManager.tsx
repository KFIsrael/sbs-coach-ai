import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Plus,
  Edit,
  Calendar,
  Dumbbell,
  Target,
  Clock,
  User
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  split: string;
}

interface ClientProgramManagerProps {
  client: Client;
  onBack: () => void;
}

export function ClientProgramManager({ client, onBack }: ClientProgramManagerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: "",
    description: "",
    split: "",
    duration: "4" // weeks
  });

  useEffect(() => {
    fetchClientPrograms();
  }, [client.user_id]);

  const fetchClientPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_programs')
        .select('*')
        .eq('user_id', client.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить программы клиента",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProgram = async () => {
    if (!newProgram.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название программы",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + parseInt(newProgram.duration) * 7 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const { error } = await supabase
        .from('workout_programs')
        .insert({
          user_id: client.user_id,
          created_by: authUser.id,
          name: newProgram.name.trim(),
          description: newProgram.description.trim(),
          split: newProgram.split.trim(),
          start_date: startDate,
          end_date: endDate
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Программа создана для клиента",
      });

      setNewProgram({ name: "", description: "", split: "", duration: "4" });
      fetchClientPrograms();
    } catch (error) {
      console.error('Error creating program:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать программу",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const clientName = client.first_name && client.last_name 
    ? `${client.first_name} ${client.last_name}`
    : client.username || 'Неизвестный клиент';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка программ...</p>
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
            <h1 className="text-2xl font-bold text-gradient-gold">Программы клиента</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              {clientName}
            </p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Создать программу
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая программа тренировок</DialogTitle>
              <DialogDescription>
                Создайте программу для {clientName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Название программы</label>
                <Input
                  placeholder="Например: Силовая программа для начинающих"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  placeholder="Описание целей и особенностей программы..."
                  value={newProgram.description}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Сплит</label>
                <Input
                  placeholder="Например: Push/Pull/Legs или Upper/Lower"
                  value={newProgram.split}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, split: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Продолжительность (недель)</label>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={newProgram.duration}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setNewProgram({ name: "", description: "", split: "", duration: "4" })}>
                  Отмена
                </Button>
                <Button onClick={createProgram} disabled={isCreating}>
                  {isCreating ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="max-w-6xl mx-auto">
        {programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="card-premium hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 mb-2">
                        <Dumbbell className="h-5 w-5 text-primary" />
                        {program.name}
                      </CardTitle>
                      {program.description && (
                        <CardDescription className="text-sm">
                          {program.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Активна
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Старт</div>
                        <div className="text-muted-foreground">{formatDate(program.start_date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Окончание</div>
                        <div className="text-muted-foreground">{formatDate(program.end_date)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {program.split && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Сплит: </span>
                        <span className="text-muted-foreground">{program.split}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Редактировать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-premium">
            <CardContent className="text-center py-12">
              <Dumbbell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет программ</h3>
              <p className="text-muted-foreground mb-6">
                У {clientName} пока нет программ тренировок
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать первую программу
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая программа тренировок</DialogTitle>
                    <DialogDescription>
                      Создайте программу для {clientName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Название программы</label>
                      <Input
                        placeholder="Например: Силовая программа для начинающих"
                        value={newProgram.name}
                        onChange={(e) => setNewProgram(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Описание</label>
                      <Textarea
                        placeholder="Описание целей и особенностей программы..."
                        value={newProgram.description}
                        onChange={(e) => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Сплит</label>
                      <Input
                        placeholder="Например: Push/Pull/Legs или Upper/Lower"
                        value={newProgram.split}
                        onChange={(e) => setNewProgram(prev => ({ ...prev, split: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Продолжительность (недель)</label>
                      <Input
                        type="number"
                        min="1"
                        max="52"
                        value={newProgram.duration}
                        onChange={(e) => setNewProgram(prev => ({ ...prev, duration: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setNewProgram({ name: "", description: "", split: "", duration: "4" })}>
                        Отмена
                      </Button>
                      <Button onClick={createProgram} disabled={isCreating}>
                        {isCreating ? 'Создание...' : 'Создать'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}