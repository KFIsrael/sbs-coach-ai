import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Trophy, Target } from "lucide-react";

interface AuthFormProps {
  onAuth: (userData: { email: string; name: string }) => void;
}

export function AuthForm({ onAuth }: AuthFormProps) {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    name: "", 
    email: "", 
    password: "",
    confirmPassword: ""
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for now
    onAuth({ email: loginData.email, name: "User" });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    // Simulate registration for now
    onAuth({ email: registerData.email, name: registerData.name });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3 shadow-gold">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient-gold mb-2">
            Sport Body System
          </h1>
          <p className="text-muted-foreground">
            AI-powered fitness coaching for premium results
          </p>
        </div>

        <Card className="card-premium border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-foreground">Welcome Back</CardTitle>
            <CardDescription>
              Transform your fitness journey with personalized AI coaching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="bg-input border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="bg-input border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <Button type="submit" variant="premium" size="lg" className="w-full">
                    Sign In
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost_gold" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onAuth({ email: "demo@sbs.com", name: "Demo User" })}
                  >
                    Quick Demo Access
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="bg-input border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="bg-input border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="bg-input border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="bg-input border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <Button type="submit" variant="premium" size="lg" className="w-full">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Features Preview */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="bg-primary/10 rounded-lg p-2 mx-auto w-fit">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">AI Coaching</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-primary/10 rounded-lg p-2 mx-auto w-fit">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Custom Programs</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-primary/10 rounded-lg p-2 mx-auto w-fit">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Progress Tracking</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}