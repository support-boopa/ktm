import { Layout } from "@/components/layout/Layout";
import { CategoryCard } from "@/components/games/CategoryCard";
import { useGames } from "@/hooks/useGames";
import { Loader2 } from "lucide-react";

const Categories = () => {
  const { categories, isLoading } = useGames();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 glass-morphism rounded-2xl mb-6 text-4xl animate-float">
            🎮
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
            تصنيفات الألعاب
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            اختر تصنيفك المفضل واكتشف مئات الألعاب في كل فئة
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>

        {/* Info Section */}
        <div className="glass-morphism p-8 mt-12 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            تبحث عن لعبة معينة؟
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            استخدم خاصية البحث في صفحة الألعاب للعثور على أي لعبة بسرعة، أو تصفح التصنيفات للاكتشاف.
          </p>
          <a
            href="/games"
            className="btn-primary inline-flex items-center gap-2 group"
          >
            <span className="relative z-10">تصفح كل الألعاب</span>
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
