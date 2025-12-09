import { Link } from "react-router-dom";
import { Star } from "lucide-react";

interface LiteGameCardProps {
  game: {
    id: string;
    title: string;
    slug: string;
    image: string;
    category: string;
    genre?: string | null;
    size: string;
    rating?: number | null;
  };
}

export const LiteGameCard = ({ game }: LiteGameCardProps) => {
  return (
    <Link to={`/${game.slug}`} className="lite-game-card">
      <div className="lite-game-image-container">
        <img
          src={game.image}
          alt={game.title}
          className="lite-game-image"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
        {game.rating && (
          <div className="lite-game-rating">
            <Star fill="currentColor" />
            <span>{game.rating}</span>
          </div>
        )}
      </div>
      <div className="lite-game-info">
        <h3 className="lite-game-title">{game.title}</h3>
        <div className="lite-game-tags">
          {(game.genre || game.category).split(",").slice(0, 2).map((cat, idx) => (
            <span key={idx} className="lite-game-tag">
              {cat.trim()}
            </span>
          ))}
        </div>
        <span className="lite-game-size">{game.size}</span>
      </div>
    </Link>
  );
};
