import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Heart, MessageCircle, ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscussionItem {
  id: string;
  type: 'comment' | 'post' | 'join' | 'complete';
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string | null;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count?: number;
  is_liked?: boolean;
  replies?: DiscussionItem[];
}

interface ChallengeDiscussionProps {
  challengeId: string;
  highlightedItemId?: string;
  onBack: () => void;
}

const ChallengeDiscussion: React.FC<ChallengeDiscussionProps> = ({
  challengeId,
  highlightedItemId,
  onBack,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<DiscussionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDiscussion();
  }, [challengeId]);

  useEffect(() => {
    if (highlightedItemId && highlightedRef.current) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, [highlightedItemId, items]);

  const fetchDiscussion = async () => {
    try {
      // Get all posts for this challenge
      const { data: userChallenges } = await supabase
        .from('user_challenges')
        .select('id')
        .eq('challenge_id', challengeId);

      const userChallengeIds = userChallenges?.map(uc => uc.id) || [];

      if (userChallengeIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          likes_count,
          comments_count,
          user_id,
          profiles!posts_user_id_fkey (username, avatar_url)
        `)
        .in('user_challenge_id', userChallengeIds)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get comments for these posts
      const postIds = posts?.map(p => p.id) || [];
      const { data: comments } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_id,
          profiles!comments_user_id_fkey (username, avatar_url)
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      // Get user challenge activities (joins/completes)
      const { data: activities } = await supabase
        .from('user_challenges')
        .select(`
          id,
          status,
          created_at,
          completed_at,
          user_id,
          profiles!user_challenges_user_id_fkey (username, avatar_url)
        `)
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Combine and format all items
      const discussionItems: DiscussionItem[] = [];

      // Add posts
      posts?.forEach(post => {
        const profile = post.profiles as any;
        discussionItems.push({
          id: post.id,
          type: 'post',
          user_id: post.user_id,
          user_name: profile?.username || 'Unknown',
          user_avatar: profile?.avatar_url || null,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          replies: comments
            ?.filter(c => c.post_id === post.id)
            .map(c => {
              const commentProfile = c.profiles as any;
              return {
                id: c.id,
                type: 'comment' as const,
                user_id: c.user_id,
                user_name: commentProfile?.username || 'Unknown',
                user_avatar: commentProfile?.avatar_url || null,
                content: c.content,
                image_url: null,
                created_at: c.created_at,
                likes_count: 0,
              };
            }) || [],
        });
      });

      // Add activities
      activities?.forEach(activity => {
        const profile = activity.profiles as any;
        if (activity.status === 'in_progress') {
          discussionItems.push({
            id: `join-${activity.id}`,
            type: 'join',
            user_id: activity.user_id,
            user_name: profile?.username || 'Unknown',
            user_avatar: profile?.avatar_url || null,
            content: 'a rejoint le défi',
            image_url: null,
            created_at: activity.created_at,
            likes_count: 0,
          });
        } else if (activity.status === 'completed' && activity.completed_at) {
          discussionItems.push({
            id: `complete-${activity.id}`,
            type: 'complete',
            user_id: activity.user_id,
            user_name: profile?.username || 'Unknown',
            user_avatar: profile?.avatar_url || null,
            content: 'a complété le défi',
            image_url: null,
            created_at: activity.completed_at,
            likes_count: 0,
          });
        }
      });

      // Sort by date
      discussionItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setItems(discussionItems);
    } catch (error) {
      console.error('Error fetching discussion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la discussion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: user.id, post_id: itemId });

      if (error) throw error;
      fetchDiscussion();
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      // This is simplified - you'd need to get the actual post_id
      toast({
        title: "Fonctionnalité à venir",
        description: "Les commentaires seront bientôt disponibles",
      });
      setNewComment('');
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const days = Math.floor(diffInHours / 24);
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const renderItem = (item: DiscussionItem, isNested = false) => {
    const isHighlighted = item.id === highlightedItemId;

    return (
      <div
        key={item.id}
        ref={isHighlighted ? highlightedRef : null}
        className={cn(
          "rounded-2xl p-4 transition-all duration-500",
          isHighlighted && "bg-yellow-100/40 dark:bg-yellow-900/20 ring-2 ring-yellow-400/50",
          isNested && "ml-12"
        )}
      >
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={item.user_avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
              {item.user_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm">{item.user_name}</span>
              <span className="text-xs text-muted-foreground">{formatTimeAgo(item.created_at)}</span>
              {(item.type === 'join' || item.type === 'complete') && (
                <Badge variant="secondary" className="text-xs">
                  {item.type === 'join' ? '🎉 A rejoint' : '⭐ Complété'}
                </Badge>
              )}
            </div>

            {item.content && (
              <p className="text-sm text-foreground break-words mb-2">{item.content}</p>
            )}

            {item.image_url && (
              <img 
                src={item.image_url} 
                alt="Post" 
                className="rounded-lg max-w-full h-auto mb-2"
              />
            )}

            <div className="flex items-center gap-4 mt-2">
              <button 
                onClick={() => handleLike(item.id)}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span className="text-xs font-semibold">{item.likes_count}</span>
              </button>
              {item.type === 'post' && (
                <button 
                  onClick={() => setReplyingTo(item.id)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold">{item.comments_count || 0}</span>
                </button>
              )}
            </div>

            {/* Replies (max 2 levels) */}
            {item.replies && item.replies.length > 0 && !isNested && (
              <div className="mt-3 space-y-2">
                {item.replies.map(reply => renderItem(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-lg">Discussion du défi</h2>
            <p className="text-xs text-muted-foreground">{items.length} interactions</p>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune interaction pour le moment</p>
              <p className="text-sm text-muted-foreground mt-2">Soyez le premier à participer !</p>
            </div>
          ) : (
            items.map(item => renderItem(item))
          )}
        </div>
      </div>

      {/* Sticky Reply Bar */}
      <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                {user?.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <Input
              placeholder="Écris ta réaction…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              className="flex-1 rounded-full"
            />
            <Button
              size="icon"
              onClick={handleComment}
              disabled={!newComment.trim()}
              className="rounded-full flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDiscussion;
