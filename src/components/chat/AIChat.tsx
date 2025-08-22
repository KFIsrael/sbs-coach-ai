import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AIChatProps {
  onClose: () => void;
  user: { name: string; email: string };
}

// Mock AI responses for demonstration
const getAIResponse = (message: string): string => {
  const responses = [
    "Great question! Based on your fitness goals, I'd recommend focusing on compound movements that target multiple muscle groups. This will give you the most bang for your buck in terms of results.",
    "I notice you're making excellent progress! Remember to stay hydrated and ensure you're getting adequate rest between workout sessions. Recovery is just as important as the training itself.",
    "That's a common concern. For your fitness level, I'd suggest starting with bodyweight exercises and gradually adding resistance as you build strength and confidence.",
    "Excellent! Consistency is key to achieving your goals. Even small daily actions compound over time to create significant results. Keep up the great work!",
    "Based on your assessment, I can see you're focused on strength building. Make sure to progressively overload your exercises by gradually increasing weight, reps, or sets over time."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

export function AIChat({ onClose, user }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello ${user.name}! 👋 I'm your AI fitness coach. I've reviewed your assessment and I'm here to help you achieve your goals. What would you like to know about your training program?`,
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputValue),
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="card-premium w-full max-w-2xl h-[600px] flex flex-col shadow-dark">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-gradient-gold">
            <Bot className="h-5 w-5 text-primary" />
            AI Fitness Coach
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="bg-primary rounded-full p-2 h-fit">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                    <div 
                      className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-muted text-foreground ml-auto' 
                          : 'bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="bg-muted rounded-full p-2 h-fit">
                      <User className="h-4 w-4 text-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="bg-primary rounded-full p-2 h-fit">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your training, nutrition, or goals..."
                className="flex-1 bg-input border-border/50 focus:border-primary"
                disabled={isTyping}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                variant="premium"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI responses are simulated for demo purposes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}