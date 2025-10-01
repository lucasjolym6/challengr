import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Heart, MessageCircle, Share2, Send, ChevronLeft, ChevronRight, Flame, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpring, animated, config } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  user_challenge_id: string | null;
  hashtags: string[] | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  user_challenges?: {
    challenges: {
      title: string;
      challenge_categories: {
        name: string;
        icon: string;
      } | null;
    };
  } | null;
  engagement_score?: number;
  is_high_engagement?: boolean;
}

const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
];

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

const ChallengeFeed: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'latest' | 'trending'>('latest');
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [seenPosts, setSeenPosts] = useState<Set<string>>(new Set());
  const [showReactions, setShowReactions] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
    config: config.wobbly,
  }));

  useEffect(() => {
    fetchPosts();
    loadSeenPosts();
  }, []);

  useEffect(() => {
    if (posts.length > 0 && currentIndex < posts.length) {
      const currentPost = getSortedPosts()[currentIndex];
      if (currentPost && !seenPosts.has(currentPost.id)) {
        markAsSeen(currentPost.id);
      }
    }
  }, [currentIndex, posts]);

  const loadSeenPosts = () => {
    const seen = localStorage.getItem('seenPosts');
    if (seen) {
      setSeenPosts(new Set(JSON.parse(seen)));
    }
  };

  const markAsSeen = (postId: string) => {
    const newSeen = new Set(seenPosts);
    newSeen.add(postId);
    setSeenPosts(newSeen);
    localStorage.setItem('seenPosts', JSON.stringify(Array.from(newSeen)));
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, display_name, avatar_url),
          user_challenges (
            challenges (
              title,
              challenge_categories (name, icon)
            )
          )
        `)
        .eq('verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate engagement score and mark high engagement posts
      const postsWithEngagement = (data || []).map(post => {
        const engagement_score = post.likes_count * 2 + post.comments_count * 3;
        return {
          ...post,
          engagement_score,
          is_high_engagement: engagement_score > 10, // Threshold for high engagement
        };
      });

      setPosts(postsWithEngagement);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load challenge feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (username, display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        if (error) throw error;
      }

      // Refresh posts to update like count
      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const submitComment = async (postId: string) => {
    if (!user || !commentInput.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: commentInput.trim()
        }]);

      if (error) throw error;

      setCommentInput('');
      fetchComments(postId);
      fetchPosts();
      toast({
        title: "Comment posted!",
        description: "Your comment has been added.",
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  const handleDoubleTap = (postId: string) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      toggleLike(postId);
      // Show heart animation
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); font-size: 100px; pointer-events: none; z-index: 9999; animation: heartPop 0.6s ease-out forwards;';
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 600);
    }
    setLastTap(now);
  };

  const nextCard = () => {
    if (currentIndex < getSortedPosts().length - 1) {
      api.start({ x: -300, rotate: -20, scale: 0.8 });
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        api.start({ x: 0, rotate: 0, scale: 1 });
        setShowComments(false);
      }, 200);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      api.start({ x: 300, rotate: 20, scale: 0.8 });
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        api.start({ x: 0, rotate: 0, scale: 1 });
        setShowComments(false);
      }, 200);
    }
  };

  const bind = useDrag(({ down, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    const trigger = vx > 0.2;
    
    if (!down && trigger) {
      if (xDir > 0 && currentIndex > 0) {
        prevCard();
      } else if (xDir < 0 && currentIndex < getSortedPosts().length - 1) {
        nextCard();
      } else {
        api.start({ x: 0, rotate: 0, scale: 1 });
      }
    } else {
      api.start({
        x: down ? mx : 0,
        rotate: down ? mx / 20 : 0,
        scale: down ? 1.05 : 1,
      });
    }
  }, {
    axis: 'x',
    bounds: { left: -200, right: 200 },
    rubberband: true,
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getSortedPosts = () => {
    let sortedPosts = [...posts];
    
    if (viewMode === 'trending') {
      sortedPosts.sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
    }
    
    // Prioritize unseen posts
    sortedPosts.sort((a, b) => {
      const aSeen = seenPosts.has(a.id) ? 1 : 0;
      const bSeen = seenPosts.has(b.id) ? 1 : 0;
      return aSeen - bSeen;
    });
    
    return sortedPosts;
  };

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this challenge: ${post.user_challenges?.challenges?.title || 'Challenge'}`,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="h-[85vh] flex items-center justify-center">
        <div className="w-full max-w-md aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 rounded-3xl animate-pulse shadow-2xl" />
      </div>
    );
  }

  const sortedPosts = getSortedPosts();
  const currentPost = sortedPosts[currentIndex];

  if (sortedPosts.length === 0) {
    return (
      <div className="h-[85vh] flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-6">📸</div>
        <h3 className="text-2xl font-bold mb-3">No posts yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Complete some challenges and share your achievements with the community!
        </p>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / sortedPosts.length) * 100;

  return (
    <div className="relative h-[85vh] flex flex-col items-center">
      <style>{`
        @keyframes heartPop {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Button
          variant={viewMode === 'trending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setViewMode('trending');
            setCurrentIndex(0);
          }}
          className="gap-2 rounded-full shadow-lg"
        >
          <Flame className="w-4 h-4" />
          Trending
        </Button>
        <Button
          variant={viewMode === 'latest' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setViewMode('latest');
            setCurrentIndex(0);
          }}
          className="gap-2 rounded-full shadow-lg"
        >
          <Flame className="w-4 h-4" />
          Latest
        </Button>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full shadow-2xl bg-card/95 backdrop-blur hover:scale-110 transition-transform disabled:opacity-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={nextCard}
          disabled={currentIndex === sortedPosts.length - 1}
          className="w-12 h-12 rounded-full shadow-2xl bg-card/95 backdrop-blur hover:scale-110 transition-transform disabled:opacity-0"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Main Card Container */}
      <div className="relative w-full max-w-md flex-1 flex items-center justify-center px-4">
        <animated.div
          {...bind()}
          ref={cardRef}
          style={{
            x,
            rotate,
            scale,
            touchAction: 'none',
          }}
          className="w-full h-[90%] cursor-grab active:cursor-grabbing"
          onDoubleClick={() => handleDoubleTap(currentPost.id)}
        >
          <Card className="w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-card to-card/95 border-2 border-primary/20 relative">
            {/* High Engagement Glow */}
            {currentPost.is_high_engagement && (
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-2xl -z-10" />
            )}

            {/* Trending Badge */}
            {currentPost.is_high_engagement && (
              <div className="absolute top-6 right-6 z-10">
                <Badge className="bg-gradient-primary text-white shadow-elegant gap-1 px-3 py-1.5">
                  <Flame className="w-4 h-4" />
                  Trending
                </Badge>
              </div>
            )}

            {/* Profile Header - Sticky */}
            <div className="sticky top-0 z-20 bg-gradient-to-b from-card via-card to-transparent backdrop-blur-sm p-6 pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 border-3 border-primary/30 shadow-lg">
                  <AvatarImage src={currentPost.profiles.avatar_url || undefined} />
                  <AvatarFallback className="text-xl font-bold bg-gradient-primary text-white">
                    {currentPost.profiles.display_name?.charAt(0) || currentPost.profiles.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{currentPost.profiles.display_name || currentPost.profiles.username}</p>
                  <p className="text-sm text-muted-foreground">{formatTimeAgo(currentPost.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="px-6 pb-32 space-y-4 overflow-y-auto max-h-[calc(100%-180px)]">
              {/* Challenge Badge */}
              {currentPost.user_challenges?.challenges && (
                <Badge variant="outline" className="gap-2 px-4 py-2 text-sm">
                  <span className="text-lg">{currentPost.user_challenges.challenges.challenge_categories?.icon}</span>
                  <span className="font-semibold">{currentPost.user_challenges.challenges.title}</span>
                </Badge>
              )}

              {/* Post Image */}
              {currentPost.image_url && (
                <div className="rounded-2xl overflow-hidden shadow-elegant">
                  <img 
                    src={currentPost.image_url} 
                    alt="Challenge proof" 
                    className="w-full aspect-square object-cover"
                  />
                </div>
              )}

              {/* Content Text */}
              <div className="text-center space-y-3 py-6">
                <p className="text-lg leading-relaxed font-medium px-4">{currentPost.content}</p>
                
                {/* Hashtags */}
                {currentPost.hashtags && currentPost.hashtags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {currentPost.hashtags.map((hashtag, idx) => (
                      <span key={idx} className="text-sm font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {hashtag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Floating Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card to-transparent p-6 pt-8">
              <div className="flex items-center justify-around mb-4">
                {/* Like Button */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="lg"
                    onClick={() => setShowReactions(!showReactions)}
                    className={cn(
                      "gap-3 transition-all hover:scale-110 active:scale-95 rounded-full",
                      currentPost.likes_count > 0 && "text-red-500"
                    )}
                  >
                    <Heart className={cn("w-7 h-7", currentPost.likes_count > 0 && "fill-current")} />
                    <span className="text-lg font-bold">{currentPost.likes_count}</span>
                  </Button>
                  
                  {/* Reaction Picker */}
                  {showReactions && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-3 bg-card border-2 border-primary/20 rounded-full shadow-2xl flex gap-2 animate-scale-in">
                      {REACTION_EMOJIS.map((reaction) => (
                        <button
                          key={reaction.emoji}
                          onClick={() => {
                            toggleLike(currentPost.id);
                            setShowReactions(false);
                          }}
                          className="text-3xl hover:scale-125 active:scale-110 transition-transform"
                          title={reaction.label}
                        >
                          {reaction.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Comment Button */}
                <Button 
                  variant="ghost" 
                  size="lg"
                  onClick={() => {
                    setShowComments(!showComments);
                    if (!showComments) fetchComments(currentPost.id);
                  }}
                  className="gap-3 hover:scale-110 active:scale-95 transition-all rounded-full"
                >
                  <MessageCircle className="w-7 h-7" />
                  <span className="text-lg font-bold">{currentPost.comments_count}</span>
                </Button>
                
                {/* Share Button */}
                <Button 
                  variant="ghost" 
                  size="lg"
                  onClick={() => handleShare(currentPost)}
                  className="gap-3 hover:scale-110 active:scale-95 transition-all rounded-full"
                >
                  <Share2 className="w-7 h-7" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Card>
        </animated.div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in">
          <div className="w-full max-w-lg bg-card rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden animate-slide-in-right">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Comments ({currentPost.comments_count})</h3>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowComments(false)}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={comment.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {comment.profiles.display_name?.charAt(0) || comment.profiles.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <span className="font-bold truncate">
                        {comment.profiles.display_name || comment.profiles.username}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-card border-t border-border p-4">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {user?.user_metadata?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[60px] resize-none rounded-xl"
                  />
                  <Button 
                    size="icon"
                    onClick={() => submitComment(currentPost.id)}
                    disabled={!commentInput.trim()}
                    className="rounded-full h-[60px] w-[60px]"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeFeed;