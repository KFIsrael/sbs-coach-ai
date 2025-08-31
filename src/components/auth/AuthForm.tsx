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
    password: "",
    role: "client"
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
            toast({
              title: "Требуется подтверждение email",
              description: "Пожалуйста, проверьте вашу почту и перейдите по ссылке для подтверждения аккаунта.",
              variant: "destructive",
            });
          } else {
            toast({
              title: t('common.error'),
              description: error.message,
              variant: "destructive",
            });
          }
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
              role: formData.role,
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

        // Registration successful - show success message
        toast({
          title: t('common.success'),
          description: "Регистрация успешна! Проверьте почту для подтверждения аккаунта, затем войдите.",
        });
        
        // Switch to login mode after registration
        setIsLogin(true);
        setEmailPendingConfirmation(formData.email);
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
          title: "Попробуйте войти",
          description: "Попробуйте войти с вашими данными",
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
          {emailNotConfirmed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800 mb-2">
                Аккаунт создан, но требует подтверждения email: {emailNotConfirmed}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendConfirmation}
                disabled={resendingEmail}
                className="text-xs"
              >
                {resendingEmail ? "Отправка..." : "Отправить письмо повторно"}
              </Button>
            </div>
          )}

          {emailPendingConfirmation && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                Письмо с подтверждением отправлено на: {emailPendingConfirmation}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Проверьте почту и перейдите по ссылке для подтверждения аккаунта.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
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
                
                <div className="space-y-2">
                  <Label htmlFor="role">Роль</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-md focus:border-primary focus:outline-none"
                  >
                    <option value="client">Клиент</option>
                    <option value="trainer">Тренер</option>
                  </select>
                </div>
              </>
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
                type="submit"
                variant="premium"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Загрузка..." : (isLogin ? t('auth.login') : t('auth.register'))}
              </Button>
            </div>
          </form>
              
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
        </CardContent>
      </Card>
    </div>
  );
}