import { LiteLayout } from "@/components/lite/LiteLayout";
import { LiteCategoryCard } from "@/components/lite/LiteCategoryCard";
import { LiteSectionHeader } from "@/components/lite/LiteSectionHeader";
import { useGames } from "@/hooks/useGames";

const LiteCategories = () => {
  const { categories, isLoading } = useGames();

  if (isLoading) {
    return (
      <LiteLayout>
        <div className="lite-loading">جاري التحميل...</div>
      </LiteLayout>
    );
  }

  return (
    <LiteLayout>
      <section className="lite-container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <LiteSectionHeader
          title="التصنيفات"
          subtitle="تصفح الألعاب حسب النوع"
        />
        <div className="lite-category-grid">
          {categories.map((category) => (
            <LiteCategoryCard key={category.id} category={category} />
          ))}
        </div>

        {categories.length === 0 && (
          <div className="lite-empty">
            <div className="lite-empty-icon">📁</div>
            <p className="lite-empty-text">لا توجد تصنيفات</p>
          </div>
        )}
      </section>
    </LiteLayout>
  );
};

export default LiteCategories;
