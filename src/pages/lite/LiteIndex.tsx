import { useState } from "react";
import { LiteLayout } from "@/components/lite/LiteLayout";
import { LiteGameCard } from "@/components/lite/LiteGameCard";
import { LiteCategoryCard } from "@/components/lite/LiteCategoryCard";
import { LiteSectionHeader } from "@/components/lite/LiteSectionHeader";
import { useGames } from "@/hooks/useGames";

const GAMES_PER_PAGE = 12;

const LiteIndex = () => {
  const { games, categories, isLoading } = useGames();
  const [visibleGames, setVisibleGames] = useState(GAMES_PER_PAGE);

  const recentGames = games.slice(0, visibleGames);
  const hasMoreGames = games.length > visibleGames;
  const featuredGame = games.find(g => (g.rating || 0) >= 4.2) || games[0];

  if (isLoading) {
    return (
      <LiteLayout>
        <div className="lite-loading">جاري التحميل...</div>
      </LiteLayout>
    );
  }

  return (
    <LiteLayout>
      {/* Hero Section */}
      {featuredGame && (
        <div className="lite-hero">
          <div
            className="lite-hero-bg"
            style={{ backgroundImage: `url(${featuredGame.image})` }}
          />
          <div className="lite-hero-overlay" />
          <div className="lite-hero-content">
            <h1 className="lite-hero-title">{featuredGame.title}</h1>
            <div className="lite-hero-meta">
              <span>⭐ {featuredGame.rating || "N/A"}</span>
              <span>{featuredGame.genre || featuredGame.category}</span>
              <span>{featuredGame.size}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Games */}
      <section className="lite-container" style={{ paddingTop: "2rem" }}>
        <LiteSectionHeader
          title="أحدث الألعاب"
          subtitle="آخر الألعاب المضافة للمكتبة"
          href="/recent"
        />
        <div className="lite-game-grid">
          {recentGames.map((game) => (
            <LiteGameCard key={game.id} game={game} />
          ))}
        </div>

        {hasMoreGames && (
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <button
              onClick={() => setVisibleGames((prev) => prev + GAMES_PER_PAGE)}
              className="lite-button lite-button-outline"
            >
              تحميل المزيد
            </button>
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="lite-container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
          <LiteSectionHeader
            title="التصنيفات"
            subtitle="تصفح حسب النوع"
            href="/categories"
          />
          <div className="lite-category-grid">
            {categories.map((category) => (
              <LiteCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {games.length === 0 && (
        <div className="lite-empty">
          <div className="lite-empty-icon">🎮</div>
          <p className="lite-empty-text">لا توجد ألعاب حالياً</p>
        </div>
      )}
    </LiteLayout>
  );
};

export default LiteIndex;
