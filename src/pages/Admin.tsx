import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Lock, Plus, Trash2, Edit, LogOut, Gamepad2 } from "lucide-react";

interface GameForm {
  title: string;
  slug: string;
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
  slug: "",
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

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [form, setForm] = useState<GameForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated in session
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
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setForm({
      ...form,
      title,
      slug: generateSlug(title) + "-free-download",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const gameData = {
        title: form.title,
        slug: form.slug,
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
      slug: game.slug,
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">لوحة التحكم</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div>
                <Label htmlFor="password">كلمة السر</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة السر"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
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
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-display font-bold">لوحة تحكم KTM</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              العودة للموقع
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add/Edit Game Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? "تعديل لعبة" : "إضافة لعبة جديدة"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">معلومات أساسية</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">اسم اللعبة *</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">الرابط (Slug)</Label>
                      <Input
                        id="slug"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="developer">المطور</Label>
                      <Input
                        id="developer"
                        value={form.developer}
                        onChange={(e) => setForm({ ...form, developer: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="genre">النوع (Genre)</Label>
                      <Input
                        id="genre"
                        value={form.genre}
                        onChange={(e) => setForm({ ...form, genre: e.target.value })}
                        placeholder="Action, Adventure"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category">التصنيف *</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger>
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
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="version">الإصدار</Label>
                      <Input
                        id="version"
                        value={form.version}
                        onChange={(e) => setForm({ ...form, version: e.target.value })}
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
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">الصور</h3>
                  
                  <div>
                    <Label htmlFor="image">رابط الصورة الصغيرة (Portrait) *</Label>
                    <Input
                      id="image"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      dir="ltr"
                      placeholder="https://steamrip.com/wp-content/uploads/..."
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
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">الوصف والميزات</h3>
                  
                  <div>
                    <Label htmlFor="description">الوصف الكامل *</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={5}
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
                    />
                  </div>
                </div>

                {/* System Requirements */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">متطلبات النظام الدنيا</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>نظام التشغيل</Label>
                      <Input
                        value={form.system_requirements_minimum.os}
                        onChange={(e) => setForm({
                          ...form,
                          system_requirements_minimum: { ...form.system_requirements_minimum, os: e.target.value }
                        })}
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
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">متطلبات النظام الموصى بها</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>نظام التشغيل</Label>
                      <Input
                        value={form.system_requirements_recommended.os}
                        onChange={(e) => setForm({
                          ...form,
                          system_requirements_recommended: { ...form.system_requirements_recommended, os: e.target.value }
                        })}
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
                      />
                    </div>
                  </div>
                </div>

                {/* Download Link */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">رابط التحميل</h3>
                  <div>
                    <Label htmlFor="download_link">رابط التحميل</Label>
                    <Input
                      id="download_link"
                      value={form.download_link}
                      onChange={(e) => setForm({ ...form, download_link: e.target.value })}
                      dir="ltr"
                      placeholder="https://gofile.io/..."
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "جاري الحفظ..." : editingId ? "تحديث اللعبة" : "إضافة اللعبة"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(initialForm); }}>
                      إلغاء
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Games List */}
          <Card>
            <CardHeader>
              <CardTitle>الألعاب المضافة ({games.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[800px] overflow-y-auto">
                {games.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">لا توجد ألعاب مضافة بعد</p>
                ) : (
                  games.map((game) => (
                    <div key={game.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-16 h-20 object-cover rounded"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{game.title}</h4>
                        <p className="text-sm text-muted-foreground">{game.category} • {game.size}</p>
                        <p className="text-xs text-muted-foreground">👁️ {game.views} مشاهدة</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(game)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(game.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}