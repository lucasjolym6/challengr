import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Heart, MessageCircle, ArrowLeft, Send, Users, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  challenge_categories?: {
    name: string;
    color: string | null;
  } | null;
}

interface DiscussionItem {
  id: string;
  type: 'post' | 'join' | 'complete';
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string | null;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count?: number;
  is_liked?: boolean;
  verified?: boolean;
  replies?: CommentReply[];
}

interface CommentReply {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
  likes_count: number;
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
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [items, setItems] = useState<DiscussionItem[]>([]);
  const [stats, setStats] = useState({ participants: 0, likes: 0, comments: 0 });
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [showHighlight, setShowHighlight] = useState(true);
  const highlightedRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChallenge();
    fetchDiscussion();
  }, [challengeId]);

  useEffect(() => {
    if (highlightedItemId && highlightedRef.current && items.length > 0) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Fade out highlight after 2 seconds
        setTimeout(() => setShowHighlight(false), 2000);
      }, 300);
    }
  }, [highlightedItemId, items]);

  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  const fetchChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          id,
          title,
          description,
          image_url,
          challenge_categories!category_id (name, color)
        `)
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      setChallenge(data);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    }
  };

  const fetchDiscussion = async () => {
    try {
      // Get user challenges for this challenge
      const { data: userChallenges } = await supabase
        .from('user_challenges')
        .select('id, user_id, status, created_at, completed_at')
        .eq('challenge_id', challengeId);

      const userChallengeIds = userChallenges?.map(uc => uc.id) || [];

      // Get stats
      const { count: participantsCount } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId);

      if (userChallengeIds.length === 0) {
        setStats({ participants: participantsCount || 0, likes: 0, comments: 0 });
        setItems([]);
        setLoading(false);
        return;
      }

      // Get posts with user info
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          likes_count,
          comments_count,
          verified,
          user_id,
          profiles!posts_user_id_fkey (username, avatar_url)
        `)
        .in('user_challenge_id', userChallengeIds)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get comments with replies
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

      // Get activity items (joins/completes)
      const { data: activities } = await supabase
        .from('user_challenges')
        .select(`
          id,
          user_id,
          status,
          created_at,
          completed_at,
          profiles!user_challenges_user_id_fkey (username, avatar_url)
        `)
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false })
        .limit(30);

      // Calculate total stats
      const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
      const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;
      setStats({ 
        participants: participantsCount || 0, 
        likes: totalLikes, 
        comments: totalComments 
      });

      // Combine items
      const discussionItems: DiscussionItem[] = [];

      // Add posts with their comments as replies
      posts?.forEach(post => {
        const profile = post.profiles as any;
        const postComments = comments
          ?.filter(c => c.post_id === post.id)
          .map(c => {
            const commentProfile = c.profiles as any;
            return {
              id: c.id,
              user_id: c.user_id,
              user_name: commentProfile?.username || 'Unknown',
              user_avatar: commentProfile?.avatar_url || null,
              content: c.content,
              created_at: c.created_at,
              likes_count: 0,
            };
          }) || [];

        discussionItems.push({
          id: post.id,
          type: 'post' as const,
          user_id: post.user_id,
          user_name: profile?.username || 'Unknown',
          user_avatar: profile?.avatar_url || null,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          verified: post.verified || false,
          replies: postComments,
        });
      });

      // Add activity items (joins/completes)
      activities?.forEach(activity => {
        const profile = activity.profiles as any;
        const activityDate = activity.status === 'completed' && activity.completed_at 
          ? activity.completed_at 
          : activity.created_at;

        if (activity.status === 'in_progress') {
          discussionItems.push({
            id: `join-${activity.id}`,
            type: 'join' as const,
            user_id: activity.user_id,
            user_name: profile?.username || 'Unknown',
            user_avatar: profile?.avatar_url || null,
            content: null,
            image_url: null,
            created_at: activityDate,
            likes_count: 0,
          });
        } else if (activity.status === 'completed') {
          discussionItems.push({
            id: `complete-${activity.id}`,
            type: 'complete' as const,
            user_id: activity.user_id,
            user_name: profile?.username || 'Unknown',
            user_avatar: profile?.avatar_url || null,
            content: null,
            image_url: null,
            created_at: activityDate,
            likes_count: 0,
          });
        }
      });

      // Sort by date (newest first)
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

  const handleLike = async (itemId: string, itemType: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour liker",
        variant: "destructive",
      });
      return;
    }

    if (itemType !== 'post') return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', itemId)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        await supabase.from('likes').delete().eq('id', existingLike.id);
      } else {
        // Like
        await supabase.from('likes').insert({ user_id: user.id, post_id: itemId });
      }

      fetchDiscussion();
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  const handleComment = async (postId?: string) => {
    if (!user || !newComment.trim()) return;

    try {
      const targetPostId = postId || replyingTo?.id;
      if (!targetPostId) return;

      await supabase.from('comments').insert({
        post_id: targetPostId,
        user_id: user.id,
        content: newComment.trim(),
      });

      setNewComment('');
      setReplyingTo(null);
      fetchDiscussion();
      
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié",
      });
    } catch (error) {
      console.error('Error commenting:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const days = Math.floor(diffInHours / 24);
    if (days < 7) return `${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'complete':
        return { text: 'Complété', emoji: '⭐', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
      case 'join':
        return { text: 'A rejoint', emoji: '🎉', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      default:
        return null;
    }
  };

  const renderReply = (reply: CommentReply) => {
    return (
      <div key={reply.id} className="flex gap-3 ml-12 mt-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={reply.user_avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-purple-300 to-pink-300 text-white text-xs">
            {reply.user_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{reply.user_name}</span>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(reply.created_at)}</span>
          </div>
          <p className="text-sm text-foreground break-words">{reply.content}</p>
          <div className="flex items-center gap-4 mt-1">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors text-xs">
              <Heart className="w-3.5 h-3.5" />
              <span className="font-semibold">{reply.likes_count}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderItem = (item: DiscussionItem) => {
    const isHighlighted = item.id === highlightedItemId && showHighlight;
    const statusBadge = getStatusBadge(item.type);

    return (
      <div key={item.id} className="bg-background">
        <div
          ref={isHighlighted ? highlightedRef : null}
          className={cn(
            "bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm transition-all duration-500 border border-border/40",
            isHighlighted && "ring-2 ring-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20 animate-pulse"
          )}
        >
          <div className="flex gap-3">
            <Avatar className="w-11 h-11 flex-shrink-0 border-2 border-border/30">
              <AvatarImage src={item.user_avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-semibold">
                {item.user_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-bold text-sm">{item.user_name}</span>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(item.created_at)}</span>
                {statusBadge && (
                  <Badge className={cn("text-xs font-semibold", statusBadge.className)}>
                    {statusBadge.emoji} {statusBadge.text}
                  </Badge>
                )}
                {item.verified && item.type === 'post' && (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold">
                    ✓ Vérifié
                  </Badge>
                )}
              </div>

              {/* Content */}
              {item.content && (
                <p className="text-sm text-foreground break-words mb-2 leading-relaxed">{item.content}</p>
              )}

              {/* Image */}
              {item.image_url && (
                <div className="rounded-xl overflow-hidden mb-3 border border-border/50">
                  <img 
                    src={item.image_url} 
                    alt="Post" 
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-5 mt-2.5">
                <button 
                  onClick={() => handleLike(item.id, item.type)}
                  className={cn(
                    "flex items-center gap-1.5 transition-colors",
                    item.is_liked 
                      ? "text-red-500" 
                      : "text-muted-foreground hover:text-red-500"
                  )}
                >
                  <Heart className={cn("w-4 h-4", item.is_liked && "fill-red-500")} />
                  <span className="text-xs font-bold">{item.likes_count}</span>
                </button>
                
                {item.type === 'post' && (
                  <button 
                    onClick={() => setReplyingTo({ id: item.id, username: item.user_name })}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">{item.comments_count || 0}</span>
                  </button>
                )}
                
                {item.type === 'post' && (
                  <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Replies */}
              {item.replies && item.replies.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/30 space-y-3">
                  {item.replies.map(reply => renderReply(reply))}
                </div>
              )}

              {/* Reply Input (inline) */}
              {replyingTo?.id === item.id && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={replyInputRef}
                      placeholder={`Répondre à @${replyingTo.username}...`}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleComment();
                        }
                        if (e.key === 'Escape') {
                          setReplyingTo(null);
                          setNewComment('');
                        }
                      }}
                      className="flex-1 rounded-full text-sm h-9"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleComment()}
                      disabled={!newComment.trim()}
                      className="rounded-full h-9 px-4"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment('');
                      }}
                      className="rounded-full h-9 px-3"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !challenge) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Hero Header - Sticky */}
      <div className="flex-shrink-0 sticky top-0 z-20 bg-background border-b shadow-sm">
        {/* Challenge Image Banner */}
        <div className="relative h-32 md:h-40 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
          {challenge.image_url ? (
            <>
              <img 
                src={challenge.image_url} 
                alt={challenge.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400" />
          )}
          
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="absolute top-3 left-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Challenge Info */}
        <div className="px-4 py-4 bg-background">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              {challenge.challenge_categories && (
                <Badge className="mb-2 font-semibold">
                  {challenge.challenge_categories.name}
                </Badge>
              )}
              <h1 className="text-2xl md:text-3xl font-black leading-tight mb-1">
                {challenge.title}
              </h1>
              {challenge.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {challenge.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-muted-foreground mt-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="text-sm font-bold text-foreground">{stats.participants}</span>
              <span className="text-xs">participants</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-bold text-foreground">{stats.likes}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-bold text-foreground">{stats.comments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feed - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-lg font-semibold mb-2">Aucune interaction</p>
              <p className="text-sm text-muted-foreground">Soyez le premier à participer à ce défi !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => renderItem(item))}
            </div>
          )}
        </div>
        
        {/* Bottom padding for sticky input */}
        <div className="h-20" />
      </div>

      {/* Sticky Comment Bar - Only show if not replying */}
      {!replyingTo && (
        <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm sticky bottom-0 z-10 shadow-lg">
          <div className="container mx-auto px-4 py-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm font-bold">
                  {user?.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder="Écris un commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={() => {
                  if (items.length > 0 && items[0].type === 'post') {
                    setReplyingTo({ id: items[0].id, username: items[0].user_name });
                  }
                }}
                className="flex-1 rounded-full h-10"
              />
              <div className="flex items-center gap-1">
                <span className="text-xl cursor-pointer hover:scale-110 transition-transform">🔥</span>
                <span className="text-xl cursor-pointer hover:scale-110 transition-transform">😂</span>
                <span className="text-xl cursor-pointer hover:scale-110 transition-transform">🎉</span>
                <span className="text-xl cursor-pointer hover:scale-110 transition-transform">❤️</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeDiscussion;
