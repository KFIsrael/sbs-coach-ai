import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell } from "lucide-react";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/contexts/LanguageContext";

interface AuthFormProps {
  onAuth: (userData: { email: string; name: string }) => void;
}

export function AuthForm({ onAuth }: AuthFormProps) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth for now
    onAuth({ 
      email: formData.email || "demo@sbs.com", 
      name: formData.name || "Demo User" 
    });
  };

  const handleDemo = () => {
    onAuth({ email: "demo@sbs.com", name: "Demo User" });
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
            >
              {isLogin ? t('auth.login') : t('auth.register')}
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