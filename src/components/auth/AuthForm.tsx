import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell } from "lucide-react";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthFormProps {
  onAuth: (userData: { email: string; name: string; role?: string }) => void;
}

export function AuthForm({ onAuth }: AuthFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailPendingConfirmation, setEmailPendingConfirmation] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState("");
  const [resendingEmail, setResendingEmail] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in - let onAuthStateChange handle navigation
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          // Check for email not confirmed error
          if (error.message.includes('Email not confirmed')) {
            setEmailNotConfirmed(formData.email);
          }
          toast({
            title: t('common.error'),
            description: error.message,
            variant: "destructive",
          });
        }
        // Don't call onAuth - let Index.tsx onAuthStateChange handle navigation
      } else {
        // Sign up - show success message, don't navigate
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: formData.name,
            }
          }
        });

        if (error) {
          toast({
            title: t('common.error'),
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data.user && !data.session) {
          // Email confirmation required
          setEmailPendingConfirmation(formData.email);
          toast({
            title: "Проверьте почту!",
            description: `На ${formData.email} отправлено письмо с подтверждением. Перейдите по ссылке в письме.`,
          });
          setIsLogin(true); // Switch to login mode
        } else if (data.session) {
          // Auto-confirmed, let onAuthStateChange handle navigation
          toast({
            title: t('common.success'),
            description: "Регистрация успешна!",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || "Произошла ошибка",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    onAuth({ email: "demo@sbs.com", name: "Demo User", role: "demo" });
  };

  const handleResendConfirmation = async () => {
    if (!emailNotConfirmed) return;
    
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailNotConfirmed,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Письмо отправлено",
          description: `Новое письмо с подтверждением отправлено на ${emailNotConfirmed}`,
        });
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || "Ошибка отправки письма",
        variant: "destructive",
      });
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="card-premium w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gradient-gold">
              {t('auth.title')}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {t('auth.subtitle')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email confirmation reminder */}
          {emailPendingConfirmation && isLogin && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
              <div className="text-sm font-medium mb-1">Требуется подтверждение</div>
              <div className="text-xs">
                Письмо отправлено на {emailPendingConfirmation}. Перейдите по ссылке в письме, затем войдите.
              </div>
            </div>
          )}

          {/* Email not confirmed error with resend button */}
          {emailNotConfirmed && isLogin && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300">
              <div className="text-sm font-medium mb-2">Email не подтвержден</div>
              <div className="text-xs mb-3">
                Проверьте почту {emailNotConfirmed} и перейдите по ссылке подтверждения.
              </div>
              <Button
                onClick={handleResendConfirmation}
                disabled={resendingEmail}
                size="sm"
                variant="outline"
                className="text-xs h-7 border-red-500/50 hover:bg-red-500/10"
              >
                {resendingEmail ? "Отправка..." : "Отправить повторно"}
              </Button>
            </div>
          )}
          
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.name')}</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleSubmit}
              variant="premium"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Загрузка..." : (isLogin ? t('auth.login') : t('auth.register'))}
            </Button>
            
            <Button 
              onClick={handleDemo}
              variant="outline"
              size="lg"
              className="w-full border-primary/50 hover:bg-primary/10"
            >
              {t('auth.demo')}
            </Button>
            
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80"
              >
                {isLogin ? t('auth.switch_to_register') : t('auth.switch_to_login')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}