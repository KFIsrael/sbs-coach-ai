import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2, RefreshCw } from "lucide-react";
import { regenerateProgram } from "@/hooks/useProgram";
import { useToast } from "@/hooks/use-toast";

interface RegenerateProgramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegenerateProgramDialog({ isOpen, onClose, onSuccess }: RegenerateProgramDialogProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [selectedSplit, setSelectedSplit] = useState<string>('auto');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      await regenerateProgram(selectedDate, selectedSplit === 'auto' ? undefined : selectedSplit || undefined);
      
      toast({
        title: "Программа обновлена",
        description: "Новая программа тренировок успешно создана",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error regenerating program:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать новую программу. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Обновить программу
          </DialogTitle>
          <DialogDescription>
            Создать новую программу тренировок с выбранными параметрами
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Дата начала */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Дата начала новой программы</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Тип сплита */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Тип программы (опционально)</label>
            <Select value={selectedSplit} onValueChange={setSelectedSplit}>
              <SelectTrigger>
                <SelectValue placeholder="Автоматический выбор на основе анкеты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Автоматический выбор</SelectItem>
                <SelectItem value="PPL">Push/Pull/Legs (3 дня)</SelectItem>
                <SelectItem value="ULF">Верх/Низ/Фулл-боди (3 дня)</SelectItem>
                <SelectItem value="FULLx3">Фулл-боди (3 дня)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Если не выбрано, система определит подходящий тип на основе ваших данных
            </p>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Отмена
            </Button>
            <Button 
              onClick={handleRegenerate} 
              disabled={isRegenerating}
              className="flex-1"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Обновить
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}