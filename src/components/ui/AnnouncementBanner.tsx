import { useState, useEffect } from 'react';
import { X, Megaphone, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

const typeStyles = {
  info: {
    bg: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    icon: Info,
    iconColor: 'text-blue-400'
  },
  success: {
    bg: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/30',
    icon: Sparkles,
    iconColor: 'text-green-400'
  },
  warning: {
    bg: 'from-yellow-500/20 to-orange-500/20',
    border: 'border-yellow-500/30',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400'
  },
  announcement: {
    bg: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30',
    icon: Megaphone,
    iconColor: 'text-purple-400'
  }
};

export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('site_announcements')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        // Filter out dismissed
        const dismissedIds = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
        setDismissed(dismissedIds);
        setAnnouncements(data.filter(a => !dismissedIds.includes(a.id)));
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const style = typeStyles[current.type as keyof typeof typeStyles] || typeStyles.info;
  const Icon = style.icon;

  return (
    <div className={cn(
      'relative overflow-hidden bg-gradient-to-r backdrop-blur-sm border-b',
      style.bg,
      style.border
    )}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn('p-1.5 rounded-lg bg-background/30', style.iconColor)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground">{current.title}</span>
              <span className="mx-2 text-muted-foreground">—</span>
              <span className="text-muted-foreground truncate">{current.content}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {announcements.length > 1 && (
              <div className="flex gap-1">
                {announcements.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      i === currentIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => handleDismiss(current.id)}
              className="p-1 rounded-lg hover:bg-background/30 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
