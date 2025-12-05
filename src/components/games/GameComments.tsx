import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { toast } from 'sonner';
import { MessageSquare, User, Send, Loader2, Trash2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    first_name: string;
    last_name: string | null;
    avatar_url: string | null;
    username: string;
    is_verified: boolean;
    is_permanently_verified: boolean;
  };
}

interface GameCommentsProps {
  gameId: string;
}

export const GameComments = ({ gameId }: GameCommentsProps) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('game_comments')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch profiles for each comment
      const commentsWithProfiles = await Promise.all(
        data.map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, username, is_verified, is_permanently_verified')
            .eq('user_id', comment.user_id)
            .single();
          
          return {
            ...comment,
            profile: profileData || undefined,
          };
        })
      );
      
      setComments(commentsWithProfiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [gameId]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول للتعليق');
      return;
    }

    if (!newComment.trim()) {
      toast.error('يرجى كتابة تعليق');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('game_comments')
      .insert({
        game_id: gameId,
        user_id: user.id,
        content: newComment.trim(),
      });

    if (error) {
      toast.error('حدث خطأ في إضافة التعليق');
    } else {
      toast.success('تم إضافة التعليق');
      
      // Auto-verify comment challenges directly via edge function
      try {
        const { data: verifyData } = await supabase.functions.invoke('verify-challenge', {
          body: { 
            userId: user.id, 
            challengeId: 'auto',
            action: 'comment',
            actionData: { content: newComment.trim() }
          }
        });
        
        if (verifyData?.verified) {
          toast.success('🎉 تم إنجاز التحدي!', {
            description: verifyData.message,
            duration: 5000
          });
        }
      } catch (e) {
        console.log('Challenge verification skipped');
      }
      
      setNewComment('');
      fetchComments();
    }

    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('game_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('حدث خطأ في حذف التعليق');
    } else {
      toast.success('تم حذف التعليق');
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('en-GB');
  };

  const isUserVerified = (commentProfile?: Comment['profile']) => {
    if (!commentProfile) return false;
    return commentProfile.is_verified || commentProfile.is_permanently_verified || commentProfile.username === 'ktm';
  };

  return (
    <div className="glass-morphism p-6 animate-slide-up">
      <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        التعليقات ({comments.length})
      </h2>

      {/* Comment Form */}
      {user ? (
        <div className="mb-6 p-4 bg-card/30 rounded-xl border border-border/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-card border border-border overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <span className="font-medium flex items-center gap-1.5">
              {profile?.first_name} {profile?.last_name || ''}
              {(profile?.is_verified || profile?.is_permanently_verified || profile?.username === 'ktm') && (
                <VerifiedBadge size="sm" />
              )}
            </span>
          </div>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="اكتب تعليقك هنا..."
            className="mb-3 min-h-[100px]"
          />
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !newComment.trim()}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Send className="w-4 h-4 ml-2" />
            )}
            إرسال التعليق
          </Button>
        </div>
      ) : (
        <div className="mb-6 p-6 bg-card/30 rounded-xl border border-border/30 text-center">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">يجب تسجيل الدخول للتعليق</p>
          <Link to="/auth">
            <Button variant="outline">تسجيل الدخول</Button>
          </Link>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد تعليقات بعد</p>
          <p className="text-sm">كن أول من يعلق!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div 
              key={comment.id} 
              className="p-4 bg-card/20 rounded-xl border border-border/20 animate-fade-in"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-card border border-border overflow-hidden flex-shrink-0">
                    {comment.profile?.avatar_url ? (
                      <img src={comment.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-1.5">
                      {comment.profile?.first_name || 'مستخدم'} {comment.profile?.last_name || ''}
                      {isUserVerified(comment.profile) && (
                        <VerifiedBadge size="sm" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                  </div>
                </div>
                
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <p className="mt-3 text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
