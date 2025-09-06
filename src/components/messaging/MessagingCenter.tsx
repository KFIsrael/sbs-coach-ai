import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  MessageSquare,
  Send,
  User,
  Clock
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

interface MessagingCenterProps {
  user: { name: string; email: string; id?: string };
  onBack: () => void;
}

export function MessagingCenter({ user, onBack }: MessagingCenterProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const fetchMessages = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Fetch messages where user is sender or recipient
      const { data: messageData, error } = await supabase
        .from('messages')
        .select(`
          *
        `)
        .or(`sender_id.eq.${authUser.id},recipient_id.eq.${authUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile names for senders/recipients
      if (messageData && messageData.length > 0) {
        const userIds = new Set<string>();
        messageData.forEach(msg => {
          userIds.add(msg.sender_id);
          userIds.add(msg.recipient_id);
        });

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, username')
          .in('user_id', Array.from(userIds));

        const profileMap = new Map();
        profiles?.forEach(profile => {
          const name = profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : profile.username || 'Неизвестный пользователь';
          profileMap.set(profile.user_id, name);
        });

        const messagesWithNames = messageData.map(msg => ({
          ...msg,
          sender_name: profileMap.get(msg.sender_id),
          recipient_name: profileMap.get(msg.recipient_id)
        }));

        setMessages(messagesWithNames);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: t('common.error'),
        description: "Ошибка загрузки сообщений",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (recipientId: string) => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: authUser.id,
          recipient_id: recipientId,
          content: newMessage.trim()
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: "Сообщение отправлено",
      });

      setNewMessage("");
      fetchMessages();
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

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  // Group messages by conversation (other participant)
  const getConversations = () => {
    const conversations = new Map<string, Message[]>();
    
    messages.forEach(message => {
      const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
      
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, []);
      }
      conversations.get(otherUserId)!.push(message);
    });

    return conversations;
  };

  const conversations = getConversations();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка сообщений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-3 sm:p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gradient-gold">Сообщения</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{user.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        {conversations.size > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Беседы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {Array.from(conversations.entries()).map(([userId, userMessages]) => {
                        const lastMessage = userMessages[0]; // Messages are sorted by created_at desc
                        const unreadCount = userMessages.filter(msg => 
                          !msg.is_read && msg.recipient_id === user.id
                        ).length;
                        const otherUserName = lastMessage.sender_id === user.id 
                          ? lastMessage.recipient_name 
                          : lastMessage.sender_name;

                        return (
                          <div
                            key={userId}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedConversation === userId 
                                ? 'bg-primary/10 border-2 border-primary/30' 
                                : 'hover:bg-muted/50 border-2 border-transparent'
                            }`}
                            onClick={() => setSelectedConversation(userId)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{otherUserName}</span>
                              {unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {lastMessage.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(lastMessage.created_at)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {(() => {
                        const convoMessages = conversations.get(selectedConversation);
                        if (!convoMessages || convoMessages.length === 0) return 'Неизвестный пользователь';
                        const lastMessage = convoMessages[0];
                        return lastMessage.sender_id === user.id 
                          ? lastMessage.recipient_name 
                          : lastMessage.sender_name;
                      })()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Messages */}
                      <ScrollArea className="h-96">
                        <div className="space-y-3">
                          {conversations.get(selectedConversation)
                            ?.slice()
                            .reverse()
                            .map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                                onClick={() => !message.is_read && message.recipient_id === user.id && markAsRead(message.id)}
                              >
                                <div className={`max-w-[70%] p-3 rounded-lg ${
                                  message.sender_id === user.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}>
                                  <p className="text-sm">{message.content}</p>
                                  <div className="flex items-center justify-between mt-2 gap-2">
                                    <span className="text-xs opacity-70">
                                      {formatTime(message.created_at)}
                                    </span>
                                    {!message.is_read && message.recipient_id === user.id && (
                                      <Badge variant="secondary" className="text-xs">
                                        Новое
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>

                      {/* Send Message */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Введите сообщение..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage(selectedConversation);
                            }
                          }}
                        />
                        <Button
                          onClick={() => sendMessage(selectedConversation)}
                          disabled={!newMessage.trim() || sendingMessage}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="card-premium">
                  <CardContent className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Выберите беседу</h3>
                    <p className="text-muted-foreground">
                      Выберите беседу из списка слева для просмотра сообщений
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="card-premium">
            <CardContent className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет сообщений</h3>
              <p className="text-muted-foreground">
                У вас пока нет сообщений
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}