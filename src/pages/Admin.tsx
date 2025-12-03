import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Lock, Plus, Trash2, Edit, LogOut, Gamepad2, Search, 
  ChevronLeft, ChevronRight, Eye, BarChart3, Calendar,
  Download, Star, ExternalLink
} from "lucide-react";

interface GameForm {
  title: string;
  image: string;
  background_image: string;
  version: string;
  category: string;
  size: string;
  description: string;
  features: string;
  developer: string;
  genre: string;
  rating: string;
  download_link: string;
  system_requirements_minimum: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
  system_requirements_recommended: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
}

const initialForm: GameForm = {
  title: "",
  image: "",
  background_image: "",
  version: "1.0",
  category: "action",
  size: "",
  description: "",
  features: "",
  developer: "",
  genre: "",
  rating: "4.5",
  download_link: "",
  system_requirements_minimum: {
    os: "Windows 10",
    processor: "",
    memory: "",
    graphics: "",
    storage: "",
  },
  system_requirements_recommended: {
    os: "Windows 10/11",
    processor: "",
    memory: "",
    graphics: "",
    storage: "",
  },
};

const categories = [
  { value: "action", label: "Action" },
  { value: "adventure", label: "Adventure" },
  { value: "rpg", label: "RPG" },
  { value: "sports", label: "Sports" },
  { value: "racing", label: "Racing" },
  { value: "simulation", label: "Simulation" },
  { value: "strategy", label: "Strategy" },
  { value: "horror", label: "Horror" },
];

const GAMES_PER_PAGE = 20;

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [form, setForm] = useState<GameForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = sessionStorage.getItem("ktm_admin_auth");
    if (storedAuth) {
      setIsAuthenticated(true);
      setAdminPassword(storedAuth);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGames();
    }
  }, [isAuthenticated]);

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("فشل في جلب الألعاب");
      return;
    }
    setGames(data || []);
  };

  // Filter and paginate games
  const filteredGames = useMemo(() => {
    return games.filter(game => 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.developer?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [games, searchQuery]);

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * GAMES_PER_PAGE,
    currentPage * GAMES_PER_PAGE
  );

  // Statistics
  const stats = useMemo(() => ({
    totalGames: games.length,
    totalViews: games.reduce((sum, g) => sum + (g.views || 0), 0),
    avgRating: games.length > 0 
      ? (games.reduce((sum, g) => sum + (g.rating || 0), 0) / games.length).toFixed(1)
      : 0,
    categoryCounts: games.reduce((acc, g) => {
      acc[g.category] = (acc[g.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }), [games]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin", {
        body: { password },
      });

      if (error || !data.success) {
        toast.error("كلمة السر غير صحيحة");
        return;
      }

      setIsAuthenticated(true);
      setAdminPassword(password);
      sessionStorage.setItem("ktm_admin_auth", password);
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (error) {
      toast.error("حدث خطأ في تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword("");
    sessionStorage.removeItem("ktm_admin_auth");
    setPassword("");
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() + "-free-download";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const gameData = {
        title: form.title,
        slug: generateSlug(form.title),
        image: form.image,
        background_image: form.background_image || null,
        version: form.version,
        category: form.category,
        size: form.size,
        description: form.description,
        features: form.features.split("\n").filter(f => f.trim()),
        developer: form.developer || null,
        genre: form.genre || null,
        rating: parseFloat(form.rating) || 4.5,
        download_link: form.download_link || null,
        system_requirements_minimum: form.system_requirements_minimum,
        system_requirements_recommended: form.system_requirements_recommended,
      };

      const { data, error } = await supabase.functions.invoke("admin-games", {
        body: {
          action: editingId ? "update" : "create",
          password: adminPassword,
          gameData,
          gameId: editingId,
        },
      });

      if (error || !data.success) {
        toast.error(data?.error || "حدث خطأ");
        return;
      }

      toast.success(editingId ? "تم تحديث اللعبة" : "تم إضافة اللعبة");
      setForm(initialForm);
      setEditingId(null);
      setShowPreview(false);
      fetchGames();
    } catch (error) {
      toast.error("حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (game: any) => {
    setEditingId(game.id);
    setForm({
      title: game.title,
      image: game.image,
      background_image: game.background_image || "",
      version: game.version,
      category: game.category,
      size: game.size,
      description: game.description,
      features: (game.features || []).join("\n"),
      developer: game.developer || "",
      genre: game.genre || "",
      rating: String(game.rating || 4.5),
      download_link: game.download_link || "",
      system_requirements_minimum: game.system_requirements_minimum || initialForm.system_requirements_minimum,
      system_requirements_recommended: game.system_requirements_recommended || initialForm.system_requirements_recommended,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه اللعبة؟")) return;

    try {
      const { data, error } = await supabase.functions.invoke("admin-games", {
        body: {
          action: "delete",
          password: adminPassword,
          gameId,
        },
      });

      if (error || !data.success) {
        toast.error("فشل في حذف اللعبة");
        return;
      }

      toast.success("تم حذف اللعبة");
      fetchGames();
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>
        
        <Card className="w-full max-w-md glass-morphism animate-scale-in relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 glass-card rounded-2xl flex items-center justify-center mb-4 animate-float">
              <Lock className="w-10 h-10 text-primary animate-glow-pulse" />
            </div>
            <CardTitle className="text-3xl font-display gradient-text">لوحة التحكم</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Label htmlFor="password">كلمة السر</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة السر"
                  className="mt-1 glass-card border-border/50 focus:border-primary/50"
                />
              </div>
              <Button type="submit" className="w-full btn-primary animate-slide-up" style={{ animationDelay: '0.2s' }} disabled={isLoading}>
                {isLoading ? "جاري التحقق..." : "دخول"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 glass-morphism z-50 animate-slide-up">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary animate-glow-pulse" />
            </div>
            <h1 className="text-2xl font-display font-bold gradient-text">لوحة تحكم KTM</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300">
              العودة للموقع
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="transition-all duration-300 hover:scale-105">
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Gamepad2, label: "إجمالي الألعاب", value: stats.totalGames, color: "primary" },
            { icon: Eye, label: "إجمالي المشاهدات", value: stats.totalViews.toLocaleString(), color: "secondary" },
            { icon: Star, label: "متوسط التقييم", value: stats.avgRating, color: "neon-green" },
            { icon: BarChart3, label: "التصنيفات", value: Object.keys(stats.categoryCounts).length, color: "neon-purple" },
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className="stat-card animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <stat.icon className={`w-8 h-8 mx-auto mb-2 text-${stat.color} animate-glow-pulse`} />
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add/Edit Game Form */}
          <div className="space-y-6">
            <Card className="glass-morphism animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingId ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                  {editingId ? "تعديل لعبة" : "إضافة لعبة جديدة"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="font-semibold text-lg border-b border-border/50 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      معلومات أساسية
                    </h3>
                    
                    <div>
                      <Label htmlFor="title">اسم اللعبة *</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="glass-card border-border/50"
                        required
                      />
                      {form.title && (
                        <p className="text-xs text-muted-foreground mt-1">
                          الرابط: /{generateSlug(form.title)}
                        </p>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="developer">المطور</Label>
                        <Input
                          id="developer"
                          value={form.developer}
                          onChange={(e) => setForm({ ...form, developer: e.target.value })}
                          className="glass-card border-border/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="genre">النوع (Genre)</Label>
                        <Input
                          id="genre"
                          value={form.genre}
                          onChange={(e) => setForm({ ...form, genre: e.target.value })}
                          placeholder="Action, Adventure"
                          className="glass-card border-border/50"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="category">التصنيف *</Label>
                        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                          <SelectTrigger className="glass-card border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="size">الحجم *</Label>
                        <Input
                          id="size"
                          value={form.size}
                          onChange={(e) => setForm({ ...form, size: e.target.value })}
                          placeholder="50 GB"
                          className="glass-card border-border/50"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="version">الإصدار</Label>
                        <Input
                          id="version"
                          value={form.version}
                          onChange={(e) => setForm({ ...form, version: e.target.value })}
                          className="glass-card border-border/50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="rating">التقييم (0-5)</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={form.rating}
                        onChange={(e) => setForm({ ...form, rating: e.target.value })}
                        className="glass-card border-border/50"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h3 className="font-semibold text-lg border-b border-border/50 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                      الصور
                    </h3>
                    
                    <div>
                      <Label htmlFor="image">رابط الصورة الصغيرة (Portrait) *</Label>
                      <Input
                        id="image"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        dir="ltr"
                        placeholder="https://steamrip.com/wp-content/uploads/..."
                        className="glass-card border-border/50"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="background_image">رابط الخلفية الكبيرة</Label>
                      <Input
                        id="background_image"
                        value={form.background_image}
                        onChange={(e) => setForm({ ...form, background_image: e.target.value })}
                        dir="ltr"
                        placeholder="https://steamrip.com/wp-content/uploads/..."
                        className="glass-card border-border/50"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <h3 className="font-semibold text-lg border-b border-border/50 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                      الوصف والميزات
                    </h3>
                    
                    <div>
                      <Label htmlFor="description">الوصف الكامل *</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={5}
                        className="glass-card border-border/50"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="features">الميزات (كل ميزة في سطر)</Label>
                      <Textarea
                        id="features"
                        value={form.features}
                        onChange={(e) => setForm({ ...form, features: e.target.value })}
                        rows={4}
                        placeholder="ميزة 1&#10;ميزة 2&#10;ميزة 3"
                        className="glass-card border-border/50"
                      />
                    </div>
                  </div>

                  {/* System Requirements */}
                  <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <h3 className="font-semibold text-lg border-b border-border/50 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-neon-purple rounded-full animate-pulse" />
                      متطلبات النظام الدنيا
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>نظام التشغيل</Label>
                        <Input
                          value={form.system_requirements_minimum.os}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_minimum: { ...form.system_requirements_minimum, os: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                      <div>
                        <Label>المعالج</Label>
                        <Input
                          value={form.system_requirements_minimum.processor}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_minimum: { ...form.system_requirements_minimum, processor: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                      <div>
                        <Label>الذاكرة</Label>
                        <Input
                          value={form.system_requirements_minimum.memory}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_minimum: { ...form.system_requirements_minimum, memory: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                      <div>
                        <Label>كرت الشاشة</Label>
                        <Input
                          value={form.system_requirements_minimum.graphics}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_minimum: { ...form.system_requirements_minimum, graphics: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                      <div>
                        <Label>التخزين</Label>
                        <Input
                          value={form.system_requirements_minimum.storage}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_minimum: { ...form.system_requirements_minimum, storage: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <h3 className="font-semibold text-lg border-b border-border/50 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                      متطلبات النظام الموصى بها
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>نظام التشغيل</Label>
                        <Input
                          value={form.system_requirements_recommended.os}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_recommended: { ...form.system_requirements_recommended, os: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                      <div>
                        <Label>المعالج</Label>
                        <Input
                          value={form.system_requirements_recommended.processor}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_recommended: { ...form.system_requirements_recommended, processor: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                      <div>
                        <Label>الذاكرة</Label>
                        <Input
                          value={form.system_requirements_recommended.memory}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_recommended: { ...form.system_requirements_recommended, memory: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                      <div>
                        <Label>كرت الشاشة</Label>
                        <Input
                          value={form.system_requirements_recommended.graphics}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_recommended: { ...form.system_requirements_recommended, graphics: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                      <div>
                        <Label>التخزين</Label>
                        <Input
                          value={form.system_requirements_recommended.storage}
                          onChange={(e) => setForm({
                            ...form,
                            system_requirements_recommended: { ...form.system_requirements_recommended, storage: e.target.value }
                          })}
                          className="glass-card border-border/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Download Link */}
                  <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <h3 className="font-semibold text-lg border-b border-border/50 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      رابط التحميل
                    </h3>
                    <div>
                      <Label htmlFor="download_link">رابط التحميل</Label>
                      <Input
                        id="download_link"
                        value={form.download_link}
                        onChange={(e) => setForm({ ...form, download_link: e.target.value })}
                        dir="ltr"
                        placeholder="https://gofile.io/..."
                        className="glass-card border-border/50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="glass-card border-border/50"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showPreview ? "إخفاء المعاينة" : "معاينة"}
                    </Button>
                    <Button type="submit" className="flex-1 btn-primary" disabled={isLoading}>
                      {isLoading ? "جاري الحفظ..." : editingId ? "تحديث اللعبة" : "إضافة اللعبة"}
                    </Button>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(initialForm); setShowPreview(false); }} className="glass-card">
                        إلغاء
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Preview Card */}
            {showPreview && form.title && (
              <Card className="glass-morphism animate-scale-in overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">معاينة صفحة اللعبة</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Preview Hero */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={form.background_image || form.image || "/placeholder.svg"}
                      alt={form.title}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                  </div>
                  
                  <div className="p-6 -mt-16 relative z-10">
                    <div className="flex gap-4">
                      <img
                        src={form.image || "/placeholder.svg"}
                        alt={form.title}
                        className="w-24 h-32 object-cover rounded-lg shadow-lg"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{form.title} Free Download</h3>
                        <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                          {form.developer && <span>👤 {form.developer}</span>}
                          <span>📦 {form.size || "N/A"}</span>
                          <span>⭐ {form.rating}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <span className="category-badge">{categories.find(c => c.value === form.category)?.label}</span>
                          <span className="version-badge">v{form.version}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-muted-foreground line-clamp-3">
                      {form.description || "لا يوجد وصف"}
                    </div>

                    {form.download_link && (
                      <Button className="w-full mt-4 btn-primary" disabled>
                        <Download className="w-4 h-4 mr-2" />
                        تحميل اللعبة
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Games List */}
          <Card className="glass-morphism animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>الألعاب المضافة ({games.length})</span>
              </CardTitle>
              
              {/* Search */}
              <div className="relative mt-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم، التصنيف، أو المطور..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-10 glass-card border-border/50"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredGames.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 animate-fade-in">
                    {searchQuery ? "لا توجد نتائج" : "لا توجد ألعاب مضافة بعد"}
                  </p>
                ) : (
                  paginatedGames.map((game, index) => (
                    <div 
                      key={game.id} 
                      className="flex items-center gap-3 p-3 glass-card rounded-xl hover:border-primary/30 transition-all duration-300 animate-scale-in group"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-14 h-18 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate group-hover:text-primary transition-colors">{game.title}</h4>
                        <p className="text-sm text-muted-foreground">{game.category} • {game.size}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {game.views?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(game.updated_at || game.created_at).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => window.open(`/${game.slug}`, '_blank')}
                          className="hover:bg-primary/10"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(game)} className="hover:bg-primary/10">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(game.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="glass-card"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={currentPage === pageNum ? "btn-primary" : "glass-card"}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="glass-card"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
