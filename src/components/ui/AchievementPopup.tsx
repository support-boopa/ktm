import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface AchievementPopupProps {
  achievement: {
    achievement_name: string;
    achievement_icon: string;
  } | null;
  onClose: () => void;
}

export const AchievementPopup = ({ achievement, onClose }: AchievementPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
      )}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-amber-500/30 to-yellow-500/30 blur-xl rounded-2xl animate-pulse" />
        
        {/* Main card */}
        <div className="relative bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-yellow-600/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 flex items-center gap-4 shadow-2xl">
          {/* Icon container */}
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/30 blur-md rounded-full animate-ping" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center text-3xl shadow-lg">
              {achievement.achievement_icon}
            </div>
          </div>
          
          {/* Text content */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
              <Trophy className="w-4 h-4" />
              <span>إنجاز جديد!</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              {achievement.achievement_name}
            </span>
          </div>

          {/* Sparkles */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-400 rounded-full animate-ping delay-150" />
          <div className="absolute top-1/2 -right-2 w-2 h-2 bg-yellow-300 rounded-full animate-ping delay-300" />
        </div>
      </div>
    </div>
  );
};
