import { useParams, Link } from "react-router-dom";
import { LiteLayout } from "@/components/lite/LiteLayout";
import { LiteGameCard } from "@/components/lite/LiteGameCard";
import { LiteSectionHeader } from "@/components/lite/LiteSectionHeader";
import { useGame } from "@/hooks/useGames";
import { Star, Download, Calendar, HardDrive, User } from "lucide-react";

const LiteGameDetails = () => {
  const { slug } = useParams();
  const { game, relatedGames, isLoading } = useGame(slug || "");

  if (isLoading) {
    return (
      <LiteLayout>
        <div className="lite-loading">جاري التحميل...</div>
      </LiteLayout>
    );
  }

  if (!game) {
    return (
      <LiteLayout>
        <div className="lite-empty">
          <div className="lite-empty-icon">❌</div>
          <p className="lite-empty-text">اللعبة غير موجودة</p>
          <Link to="/" className="lite-button" style={{ marginTop: "1rem", display: "inline-block" }}>
            العودة للرئيسية
          </Link>
        </div>
      </LiteLayout>
    );
  }

  const minReqs = game.system_requirements_minimum as Record<string, string> | null;
  const recReqs = game.system_requirements_recommended as Record<string, string> | null;

  return (
    <LiteLayout>
      <div className="lite-container lite-game-details">
        {/* Header */}
        <div className="lite-game-header">
          <img src={game.image} alt={game.title} className="lite-game-cover" />
          <div className="lite-game-header-info">
            <h1>{game.title}</h1>
            <div className="lite-game-meta">
              {game.rating && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Star size={14} fill="hsl(48 96% 53%)" color="hsl(48 96% 53%)" />
                  {game.rating}
                </span>
              )}
              {game.developer && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <User size={14} />
                  {game.developer}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <HardDrive size={14} />
                {game.size}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Calendar size={14} />
                {new Date(game.created_at).toLocaleDateString("ar-SA")}
              </span>
            </div>

            {/* Tags */}
            <div className="lite-game-tags" style={{ marginBottom: "1rem" }}>
              {(game.genre || game.category).split(",").map((cat, idx) => (
                <span key={idx} className="lite-game-tag" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
                  {cat.trim()}
                </span>
              ))}
            </div>

            {/* Download Button */}
            {game.download_link && (
              <a
                href={game.download_link}
                target="_blank"
                rel="noopener noreferrer"
                className="lite-button"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Download size={18} />
                تحميل اللعبة
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="lite-game-description">
          <h2>وصف اللعبة</h2>
          <p>{game.description}</p>
        </div>

        {/* Features */}
        {game.features && game.features.length > 0 && (
          <div className="lite-game-description">
            <h2>مميزات اللعبة</h2>
            <ul style={{ listStyle: "disc", paddingRight: "1.5rem", margin: 0 }}>
              {game.features.map((feature, idx) => (
                <li key={idx} style={{ fontSize: "0.875rem", color: "hsl(215 20% 75%)", marginBottom: "0.5rem" }}>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* System Requirements */}
        {(minReqs || recReqs) && (
          <div className="lite-requirements">
            {minReqs && (
              <div className="lite-requirements-box">
                <h3>الحد الأدنى</h3>
                <ul>
                  {Object.entries(minReqs).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recReqs && (
              <div className="lite-requirements-box">
                <h3>المتطلبات الموصى بها</h3>
                <ul>
                  {Object.entries(recReqs).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Screenshots */}
        {game.screenshots && game.screenshots.length > 0 && (
          <div className="lite-screenshots">
            <h2>صور اللعبة</h2>
            <div className="lite-screenshots-grid">
              {game.screenshots.slice(0, 6).map((screenshot, idx) => (
                <img
                  key={idx}
                  src={screenshot}
                  alt={`Screenshot ${idx + 1}`}
                  className="lite-screenshot"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}

        {/* Related Games */}
        {relatedGames.length > 0 && (
          <section style={{ marginTop: "2rem" }}>
            <LiteSectionHeader title="ألعاب مشابهة" />
            <div className="lite-game-grid">
              {relatedGames.slice(0, 6).map((game) => (
                <LiteGameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}
      </div>
    </LiteLayout>
  );
};

export default LiteGameDetails;
