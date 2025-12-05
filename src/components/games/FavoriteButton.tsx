import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FavoriteButtonProps {
  gameId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export const FavoriteButton = ({ gameId, variant = 'icon', className }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  const favorite = isFavorite(gameId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnimating(true);
    await toggleFavorite(gameId);
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (variant === 'full') {
    return (
      <Button
        onClick={handleClick}
        variant={favorite ? 'default' : 'outline'}
        className={cn(
          'gap-2 transition-all duration-300',
          favorite && 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30',
          isAnimating && 'scale-110',
          className
        )}
      >
        <Heart 
          className={cn(
            'w-4 h-4 transition-all duration-300',
            favorite && 'fill-red-500 text-red-500',
            isAnimating && 'animate-pulse'
          )} 
        />
        {favorite ? 'في المفضلة' : 'إضافة للمفضلة'}
      </Button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'p-2 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110',
        favorite 
          ? 'bg-red-500/20 text-red-500' 
          : 'bg-background/50 text-muted-foreground hover:text-red-400',
        isAnimating && 'scale-125',
        className
      )}
    >
      <Heart 
        className={cn(
          'w-5 h-5 transition-all duration-300',
          favorite && 'fill-red-500',
          isAnimating && 'animate-bounce'
        )} 
      />
    </button>
  );
};
