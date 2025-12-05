import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, User, Search, Home, Gamepad2, 
  ChevronUp, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';

export const QuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { favorites } = useFavorites();

  const actions = [
    { icon: Home, label: 'الرئيسية', href: '/' },
    { icon: Heart, label: 'المفضلة', href: '/favorites', badge: favorites.length || undefined },
    { icon: Gamepad2, label: 'الألعاب', href: '/games' },
    { icon: User, label: 'ملفي', href: '/profile' },
    { icon: Search, label: 'بحث', href: '/games' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-background/80 backdrop-blur-xl border-t border-border/50 px-4 py-2 safe-area-pb">
          <div className="flex items-center justify-around">
            {actions.slice(0, 5).map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors relative"
              >
                <action.icon className="w-5 h-5" />
                <span className="text-[10px]">{action.label}</span>
                {action.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {action.badge > 9 ? '9+' : action.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-50 hidden md:block">
        <div className={cn(
          'flex flex-col-reverse items-center gap-2 transition-all duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          {actions.map((action, i) => (
            <Link
              key={action.href}
              to={action.href}
              className={cn(
                'p-3 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300 hover:scale-110 relative',
                isOpen && `animate-in fade-in slide-in-from-bottom-4`
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <action.icon className="w-5 h-5" />
              {action.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {action.badge > 9 ? '9+' : action.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'mt-2 p-4 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-110',
            isOpen && 'rotate-180'
          )}
        >
          {isOpen ? <X className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
};
