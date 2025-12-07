import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Send,
  Bot,
  User,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  LogOut,
  Menu,
  X,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-trend-chat`;

export default function AITrend() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, profile } = useAuth();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check admin authentication
  useEffect(() => {
    const storedAuth = sessionStorage.getItem("ktm_admin_auth");
    if (storedAuth) {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // Load conversations
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    }
  }, [isAuthenticated, user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setCurrentConversation(conversationId);
      fetchMessages(conversationId);
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [conversationId]);

  const fetchConversations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
  };

  const fetchMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data.map(m => ({
        ...m,
        role: m.role as "user" | "assistant"
      })));
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin", {
        body: { password },
      });

      if (error || !data.success) {
        toast.error("كلمة السر غير صحيحة");
        return;
      }

      setIsAuthenticated(true);
      sessionStorage.setItem("ktm_admin_auth", password);
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (error) {
      toast.error("حدث خطأ في تسجيل الدخول");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("ktm_admin_auth");
    navigate("/ktm-admin-panel");
  };

  const createNewConversation = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title: "محادثة جديدة" })
      .select()
      .single();

    if (!error && data) {
      setConversations(prev => [data, ...prev]);
      navigate(`/ktm/ai/trend/${data.id}`);
    }
  };

  const deleteConversation = async (convId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المحادثة؟")) return;

    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", convId);

    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (currentConversation === convId) {
        navigate("/ktm/ai/trend");
      }
      toast.success("تم حذف المحادثة");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    let convId = currentConversation;

    // Create new conversation if none exists
    if (!convId) {
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({ user_id: user.id, title: input.slice(0, 50) })
        .select()
        .single();

      if (error || !data) {
        toast.error("حدث خطأ في إنشاء المحادثة");
        return;
      }

      convId = data.id;
      setConversations(prev => [data, ...prev]);
      navigate(`/ktm/ai/trend/${convId}`, { replace: true });
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to UI
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Save user message to DB
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      role: "user",
      content: userMessage,
    });

    // Add loading message
    const loadingMsg: Message = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, loadingMsg]);

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messages.filter(m => !m.id.startsWith('temp-') && !m.id.startsWith('loading-')).map(m => ({
            role: m.role,
            content: m.content,
          })).concat([{ role: "user", content: userMessage }]),
          userContext: {
            name: profile?.first_name || "مستخدم",
            email: user.email,
            avatarUrl: profile?.avatar_url,
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            // Incomplete JSON
          }
        }
      }

      // Save assistant message to DB
      const { data: savedMsg } = await supabase
        .from("ai_messages")
        .insert({
          conversation_id: convId,
          role: "assistant",
          content: assistantContent,
        })
        .select()
        .single();

      // Update conversation title if it's the first message
      if (messages.length === 0) {
        await supabase
          .from("ai_conversations")
          .update({ title: userMessage.slice(0, 50) })
          .eq("id", convId);
        
        fetchConversations();
      }

      // Update messages with real IDs
      fetchMessages(convId);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: "عذراً، حدث خطأ. حاول مرة أخرى.",
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="w-full max-w-md glass-morphism p-8 rounded-2xl animate-scale-in relative z-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-primary to-secondary animate-float">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold gradient-text">KTM AI Trend</h1>
            <p className="text-muted-foreground mt-2">أدخل كلمة سر الأدمن للوصول</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة السر"
              className="glass-card"
            />
            <Button type="submit" className="w-full btn-primary">
              دخول
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center glass-morphism p-8 rounded-2xl">
          <Bot className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">يجب تسجيل الدخول</h1>
          <p className="text-muted-foreground mb-4">سجل دخولك للوصول إلى KTM AI Trend</p>
          <Button onClick={() => navigate("/auth")} className="btn-primary">
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative z-40 h-screen bg-card/50 backdrop-blur-xl border-l border-border/50 transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-72" : "w-0 md:w-16"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          {isSidebarOpen && (
            <h2 className="font-display font-bold text-lg gradient-text">المحادثات</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hover:bg-primary/10"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* New Conversation Button */}
        <div className="p-2">
          <Button
            onClick={createNewConversation}
            className={cn(
              "w-full gap-2 btn-primary",
              !isSidebarOpen && "justify-center p-2"
            )}
          >
            <Plus className="w-5 h-5" />
            {isSidebarOpen && "محادثة جديدة"}
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300",
                currentConversation === conv.id
                  ? "bg-primary/20 border border-primary/30"
                  : "hover:bg-muted/50"
              )}
              onClick={() => navigate(`/ktm/ai/trend/${conv.id}`)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 text-primary" />
              {isSidebarOpen && (
                <>
                  <span className="flex-1 truncate text-sm">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            className={cn("w-full gap-2 text-destructive hover:bg-destructive/10", !isSidebarOpen && "justify-center p-2")}
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && "خروج"}
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Header */}
        <header className="p-4 border-b border-border/50 glass-morphism flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-glow">
              <img src="/favicon.png" alt="KTM AI" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-display font-bold flex items-center gap-2">
                KTM AI Trend
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </h1>
              <p className="text-xs text-muted-foreground">مرحباً {profile?.first_name || "بك"}</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !currentConversation && (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center max-w-md animate-fade-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-float">
                  <img src="/favicon.png" alt="KTM AI" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-2xl font-bold mb-4 gradient-text">مرحباً في KTM AI Trend</h2>
                <p className="text-muted-foreground mb-6">
                  أنا مساعدك الذكي. أعرف كل شيء عن موقع KTM وأستطيع مساعدتك في اكتشاف الألعاب الرائجة وتحليل الموقع.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["ما هي أحدث الألعاب؟", "أخبرني عن الموقع", "ما هي الألعاب الأكثر مشاهدة؟"].map((q, i) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 rounded-full transition-all duration-300 hover:scale-105 animate-scale-in"
                      style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 animate-message-in",
                msg.role === "user" ? "flex-row-reverse" : ""
              )}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === "user"
                    ? "bg-secondary/20"
                    : "bg-gradient-to-br from-primary to-secondary"
                )}
              >
                {msg.role === "user" ? (
                  profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-secondary" />
                  )
                ) : (
                  <img src="/favicon.png" alt="KTM AI" className="w-5 h-5 object-contain" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] p-4 rounded-2xl",
                  msg.role === "user"
                    ? "bg-secondary text-secondary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}
              >
                {msg.content ? (
                  <div className="whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50 glass-morphism">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك..."
              disabled={isLoading}
              className="flex-1 glass-card text-base py-6"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="btn-primary px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-message-in {
          animation: message-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
