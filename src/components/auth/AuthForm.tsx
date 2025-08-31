import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/ui/language-selector";
import { Logo } from "@/components/ui/logo";
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

        // Registration successful - show success message and auto-login
        toast({
          title: t('common.success'),
          description: "Регистрация успешна! Добро пожаловать!",
        });
        
        // Auto login after successful registration since email confirmation is disabled
        if (!data.session && data.user) {
          console.log('Auto-logging in user after registration');
          // onAuthStateChange will handle the navigation automatically
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="card-premium w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-fit">
            <Logo size="lg" />
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