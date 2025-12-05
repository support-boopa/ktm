import { Star } from 'lucide-react';
import { useState } from 'react';
import { useGameRating } from '@/hooks/useGameRating';
import { cn } from '@/lib/utils';

interface GameRatingProps {
  gameId: string;
  showAverage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GameRating = ({ gameId, showAverage = true, size = 'md' }: GameRatingProps) => {
  const { userRating, averageRating, totalRatings, submitRating, isLoading } = useGameRating(gameId);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (rating: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await submitRating(rating);
    setIsSubmitting(false);
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const displayRating = hoverRating || userRating || 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={isLoading || isSubmitting}
            className={cn(
              'transition-all duration-200 hover:scale-125 disabled:opacity-50',
              isSubmitting && 'cursor-wait'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-all duration-200',
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]'
                  : 'text-muted-foreground/50 hover:text-yellow-400/50'
              )}
            />
          </button>
        ))}
      </div>
      
      {showAverage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
          <span>({totalRatings} تقييم)</span>
          {userRating && (
            <span className="text-primary">• تقييمك: {userRating}</span>
          )}
        </div>
      )}
    </div>
  );
};
