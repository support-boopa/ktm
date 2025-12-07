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
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  LogOut,
  Menu,
  X,
  Lock,
  TrendingUp,
  Search,
  Clock,
  Gamepad2,
  RefreshCw,
  Home,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  isAnimating?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface TrendingGame {
  name: string;
  image?: string;
  description?: string;
  platform?: string;
  source?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-trend-chat`;

// Animated text component
const AnimatedText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 15);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <span className="whitespace-pre-wrap">
      {displayedText}
      {currentIndex < text.length && (
        <span className="inline-block w-2 h-5 bg-primary/80 animate-pulse ml-0.5" />
      )}
    </span>
  );
};

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
  const [activeTab, setActiveTab] = useState("chat");
  const [trendingGames, setTrendingGames] = useState<TrendingGame[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [trendSearchQuery, setTrendSearchQuery] = useState("");
  const [lastTrendUpdate, setLastTrendUpdate] = useState<string | null>(null);
  
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

  // Load cached trending games
  useEffect(() => {
    const cached = localStorage.getItem("ktm_trending_games");
    const lastUpdate = localStorage.getItem("ktm_trending_update");
    
    if (cached && lastUpdate) {
      const updateTime = new Date(lastUpdate);
      const now = new Date();
      const hoursDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        setTrendingGames(JSON.parse(cached));
        setLastTrendUpdate(lastUpdate);
      }
    }
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
        role: m.role as "user" | "assistant",
        isAnimating: false
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

  const fetchTrendingGames = async () => {
    setIsLoadingTrends(true);
    
    try {
      // Get existing games to exclude
      const { data: existingGames } = await supabase
        .from("games")
        .select("title");
      
      const existingTitles = existingGames?.map(g => g.title.toLowerCase()) || [];
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `ابحث عن أحدث 15 لعبة ترند ومشهورة لسنة 2025. استبعد هذه الألعاب لأنها موجودة عندنا: ${existingTitles.slice(0, 20).join(", ")}
            
أرجع الرد بهذا الشكل JSON فقط بدون أي نص آخر:
[{"name": "اسم اللعبة", "description": "وصف قصير", "platform": "PC/PS5/Xbox", "image": "رابط صورة من الانترنت"}]

ابحث في Steam, Epic Games, PlayStation, Xbox, Nintendo ومواقع أخبار الألعاب.`
          }],
          userContext: { name: "System", email: "system@ktm.com" },
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch trends");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      }

      // Extract JSON from SSE response
      const lines = fullResponse.split("\n");
      let content = "";
      
      for (const line of lines) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            content += parsed.choices?.[0]?.delta?.content || "";
          } catch {}
        }
      }

      // Try to parse JSON from content
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const games = JSON.parse(jsonMatch[0]);
        // Filter out existing games
        const filtered = games.filter((g: TrendingGame) => 
          !existingTitles.includes(g.name.toLowerCase())
        ).slice(0, 10);
        
        setTrendingGames(filtered);
        localStorage.setItem("ktm_trending_games", JSON.stringify(filtered));
        localStorage.setItem("ktm_trending_update", new Date().toISOString());
        setLastTrendUpdate(new Date().toISOString());
        toast.success("تم تحديث ألعاب الترند!");
      }
    } catch (error) {
      console.error("Error fetching trends:", error);
      toast.error("حدث خطأ في جلب الألعاب");
    } finally {
      setIsLoadingTrends(false);
    }
  };

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

    // Add user message to UI with animation
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
      isAnimating: true,
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
      await supabase
        .from("ai_messages")
        .insert({
          conversation_id: convId,
          role: "assistant",
          content: assistantContent,
        });

      // Update conversation title if it's the first message
      if (messages.length === 0) {
        await supabase
          .from("ai_conversations")
          .update({ title: userMessage.slice(0, 50) })
          .eq("id", convId);
        
        fetchConversations();
      }

      // Update final message state
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          isAnimating: false,
        };
        return newMessages;
      });

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: "عذراً، حدث خطأ. حاول مرة أخرى.",
          isAnimating: false,
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

  const filteredTrendingGames = trendingGames.filter(game =>
    game.name.toLowerCase().includes(trendSearchQuery.toLowerCase())
  );

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <Sparkles className="w-8 h-8 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#111118]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl shadow-emerald-500/5">
            <div className="text-center mb-8">
              <div className="mx-auto w-24 h-24 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25 animate-float">
                <img src="/favicon.png" alt="KTM" className="w-14 h-14" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                KTM AI Trend
              </h1>
              <p className="text-gray-400 mt-3 text-lg">مساعدك الذكي لاكتشاف الترند</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة السر"
                  className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-14 pr-12 text-lg rounded-xl placeholder:text-gray-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:scale-[1.02]"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                دخول
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center bg-[#111118]/80 backdrop-blur-xl border border-white/5 p-10 rounded-3xl">
          <img src="/favicon.png" alt="KTM" className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-3">يجب تسجيل الدخول</h1>
          <p className="text-gray-400 mb-6 text-lg">سجل دخولك للوصول إلى KTM AI Trend</p>
          <Button onClick={() => navigate("/auth")} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 px-8 py-3 text-lg rounded-xl">
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex" dir="ltr">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative z-50 h-screen bg-[#111118]/95 backdrop-blur-2xl border-r border-white/5 transition-all duration-500 flex flex-col",
          isSidebarOpen ? "w-80" : "w-0 md:w-20"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="KTM" className="w-10 h-10" />
              <span className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                AI Trend
              </span>
            </div>
          ) : (
            <img src="/favicon.png" alt="KTM" className="w-10 h-10 mx-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hover:bg-white/5 text-gray-400 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation Tabs */}
        {isSidebarOpen && (
          <div className="p-3 border-b border-white/5">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("chat")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300",
                  activeTab === "chat"
                    ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <MessageSquare className="w-4 h-4 inline ml-2" />
                المحادثات
              </button>
              <button
                onClick={() => setActiveTab("trends")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300",
                  activeTab === "trends"
                    ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <TrendingUp className="w-4 h-4 inline ml-2" />
                الترند
              </button>
            </div>
          </div>
        )}

        {/* New Conversation Button */}
        <div className="p-3">
          <Button
            onClick={createNewConversation}
            className={cn(
              "w-full gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl h-12 font-medium shadow-lg shadow-emerald-500/20",
              !isSidebarOpen && "justify-center p-2"
            )}
          >
            <Plus className="w-5 h-5" />
            {isSidebarOpen && "محادثة جديدة"}
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {conversations.map((conv, index) => (
            <div
              key={conv.id}
              className={cn(
                "group flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-300",
                currentConversation === conv.id
                  ? "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20"
                  : "hover:bg-white/5"
              )}
              onClick={() => navigate(`/ktm/ai/trend/${conv.id}`)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                currentConversation === conv.id
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                  : "bg-white/5"
              )}>
                <MessageSquare className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <>
                  <span className="flex-1 truncate text-sm text-gray-300">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Button
            variant="ghost"
            className={cn("w-full gap-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl", !isSidebarOpen && "justify-center p-2")}
            onClick={() => navigate("/ktm-admin-panel")}
          >
            <Home className="w-4 h-4" />
            {isSidebarOpen && "لوحة التحكم"}
          </Button>
          <Button
            variant="ghost"
            className={cn("w-full gap-2 text-red-400 hover:bg-red-500/10 rounded-xl", !isSidebarOpen && "justify-center p-2")}
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && "خروج"}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Trending Games Tab Content */}
        {activeTab === "trends" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              {/* Trends Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                    ألعاب الترند 2025
                  </h1>
                  {lastTrendUpdate && (
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      آخر تحديث: {new Date(lastTrendUpdate).toLocaleString('ar-SA')}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      value={trendSearchQuery}
                      onChange={(e) => setTrendSearchQuery(e.target.value)}
                      placeholder="ابحث في الترند..."
                      className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-12 pr-11 w-64 rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={fetchTrendingGames}
                    disabled={isLoadingTrends}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 h-12 px-6 rounded-xl"
                  >
                    {isLoadingTrends ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 ml-2" />
                        تحديث
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Trending Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredTrendingGames.map((game, index) => (
                  <div
                    key={index}
                    className="group bg-[#111118]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center relative overflow-hidden">
                      {game.image ? (
                        <img 
                          src={game.image} 
                          alt={game.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Gamepad2 className="w-16 h-16 text-emerald-400/50" />
                      )}
                      <div className="absolute top-3 right-3 bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        🔥 Trending
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">{game.name}</h3>
                      {game.description && (
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{game.description}</p>
                      )}
                      {game.platform && (
                        <span className="inline-block bg-white/5 text-gray-300 text-xs px-3 py-1.5 rounded-full">
                          {game.platform}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {trendingGames.length === 0 && !isLoadingTrends && (
                <div className="text-center py-20">
                  <TrendingUp className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-3">لا توجد ألعاب ترند</h3>
                  <p className="text-gray-400 mb-6">اضغط على زر التحديث لجلب أحدث الألعاب</p>
                  <Button
                    onClick={fetchTrendingGames}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 px-8 py-3 rounded-xl"
                  >
                    <RefreshCw className="w-5 h-5 ml-2" />
                    جلب الألعاب
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Tab Content */}
        {activeTab === "chat" && (
          <>
            {/* Chat Header */}
            <header className="px-6 py-4 border-b border-white/5 bg-[#111118]/50 backdrop-blur-xl flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden hover:bg-white/5"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <img src="/favicon.png" alt="KTM AI" className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">KTM AI Trend</h1>
                  <p className="text-sm text-gray-400">مساعدك الذكي • يتحدث جميع اللغات</p>
                </div>
              </div>

              <div className="mr-auto flex items-center gap-2">
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  متصل
                </span>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30 animate-float">
                    <img src="/favicon.png" alt="KTM AI" className="w-20 h-20" />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    مرحباً بك في <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">KTM AI</span>
                  </h2>
                  <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                    أنا مساعدك الذكي. أستطيع مساعدتك في اكتشاف الألعاب، تحليل الموقع، وأكثر من ذلك.
                    <br />أتحدث جميع اللغات وأرد بنفس لغة رسالتك!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {[
                      { icon: TrendingUp, text: "ما هي أحدث الألعاب الترند؟", color: "emerald" },
                      { icon: Search, text: "ابحث لي عن ألعاب مغامرات", color: "cyan" },
                      { icon: Sparkles, text: "ما الجديد في الموقع؟", color: "purple" },
                      { icon: History, text: "أخبرني عن إحصائيات الموقع", color: "amber" },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(item.text);
                          inputRef.current?.focus();
                        }}
                        className="group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 text-right hover:bg-white/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                            item.color === "emerald" && "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
                            item.color === "cyan" && "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20",
                            item.color === "purple" && "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20",
                            item.color === "amber" && "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20",
                          )}>
                            <item.icon className="w-6 h-6" />
                          </div>
                          <span className="text-gray-300 group-hover:text-white transition-colors">{item.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-4 animate-fade-in",
                        message.role === "user" ? "flex-row-reverse" : ""
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center",
                        message.role === "assistant"
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20"
                          : "bg-white/10"
                      )}>
                        {message.role === "assistant" ? (
                          <img src="/favicon.png" alt="AI" className="w-6 h-6" />
                        ) : (
                          profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="User" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <span className="text-lg font-bold">{profile?.first_name?.[0] || "U"}</span>
                          )
                        )}
                      </div>
                      
                      <div className={cn(
                        "flex-1 max-w-[80%]",
                        message.role === "user" ? "text-left" : ""
                      )}>
                        <div className={cn(
                          "rounded-2xl p-5",
                          message.role === "assistant"
                            ? "bg-[#111118] border border-white/5"
                            : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                        )}>
                          {message.role === "assistant" && message.isAnimating ? (
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-gray-400 text-sm">جاري الكتابة...</span>
                            </div>
                          ) : (
                            <div className={cn(
                              "whitespace-pre-wrap leading-relaxed",
                              message.role === "assistant" ? "text-gray-200" : ""
                            )}>
                              {message.content || (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-gray-400">جاري التفكير...</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={cn(
                          "text-xs text-gray-500 mt-2",
                          message.role === "user" ? "text-left" : "text-right"
                        )}>
                          {new Date(message.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/5 bg-[#111118]/50 backdrop-blur-xl">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك هنا... (أتحدث جميع اللغات)"
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-16 pr-6 pl-16 text-lg rounded-2xl placeholder:text-gray-500"
                    dir="auto"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-center text-xs text-gray-500 mt-3">
                  KTM AI يستخدم Gemini AI • خصوصيتك محفوظة
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}