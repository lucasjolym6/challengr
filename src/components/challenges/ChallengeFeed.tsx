import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Heart, MessageCircle, Share2, Send, ChevronLeft, ChevronRight, Flame, X, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpring, animated, config } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import ChallengeDetailDialog from './ChallengeDetailDialog';

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
      id: string;
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
  const [lastTap, setLastTap] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [selectedUserChallenge, setSelectedUserChallenge] = useState<any>(null);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
    config: config.wobbly,
  }));

  const [hintAnimation, hintApi] = useSpring(() => ({
    x: 0,
    opacity: 0,
    config: config.gentle,
  }));

  useEffect(() => {
    fetchPosts();
    loadSeenPosts();
    checkSwipeHint();
  }, []);

  useEffect(() => {
    if (posts.length > 0 && currentIndex < posts.length) {
      const currentPost = getSortedPosts()[currentIndex];
      if (currentPost && !seenPosts.has(currentPost.id)) {
        markAsSeen(currentPost.id);
      }
    }
  }, [currentIndex, posts]);

  const checkSwipeHint = () => {
    const hintShown = localStorage.getItem('community_swipe_hint_shown');
    if (!hintShown) {
      setShowSwipeHint(true);
      // Show hint animation after 500ms
      setTimeout(() => {
        playSwipeHint();
      }, 500);
    }
  };

  const playSwipeHint = () => {
    hintApi.start({
      from: { x: 0, opacity: 0 },
      to: async (next) => {
        await next({ x: 15, opacity: 1 });
        await next({ x: 0, opacity: 0 });
      },
      config: { tension: 200, friction: 20 },
      onRest: () => {
        setShowSwipeHint(false);
        localStorage.setItem('community_swipe_hint_shown', 'true');
      },
    });
  };

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
              id,
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

  const bind = useDrag(({ down, movement: [mx], direction: [xDir], velocity: [vx], cancel }) => {
    // Cancel hint animation on first swipe
    if (showSwipeHint) {
      setShowSwipeHint(false);
      hintApi.start({ x: 0, opacity: 0 });
      localStorage.setItem('community_swipe_hint_shown', 'true');
    }
    
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

  const handleOpenChallenge = async (post: Post) => {
    if (!post.user_challenges?.challenges) return;
    
    try {
      // Fetch full challenge details
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_categories (name, icon, color)
        `)
        .eq('id', post.user_challenges.challenges.id)
        .single();

      if (challengeError) throw challengeError;

      // Fetch user challenge if exists
      if (user) {
        const { data: userChallengeData } = await supabase
          .from('user_challenges')
          .select('*')
          .eq('challenge_id', post.user_challenges.challenges.id)
          .eq('user_id', user.id)
          .single();

        setSelectedUserChallenge(userChallengeData);
      }

      setSelectedChallenge(challengeData);
      setShowChallengeDialog(true);
    } catch (error) {
      console.error('Error loading challenge:', error);
      toast({
        title: "Error",
        description: "Failed to load challenge details",
        variant: "destructive",
      });
    }
  };

  const handleChallengeDialogClose = () => {
    setShowChallengeDialog(false);
    setSelectedChallenge(null);
    setSelectedUserChallenge(null);
  };

  if (loading) {
    return (
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-[90vw] max-w-2xl h-[70vh] bg-gradient-to-br from-[#FF7E5F] via-[#FFB88C] to-[#FFC7A3] rounded-3xl animate-pulse shadow-2xl opacity-30" />
      </div>
    );
  }

  const sortedPosts = getSortedPosts();
  const currentPost = sortedPosts[currentIndex];

  if (sortedPosts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
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
    <div className="relative h-full overflow-hidden">
      <style>{`
        @keyframes heartPop {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* Fixed View Mode Toggle */}
      <div className="fixed top-[108px] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-3">
        <Button
          variant={viewMode === 'trending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setViewMode('trending');
            setCurrentIndex(0);
          }}
          className="gap-2 rounded-full shadow-md"
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
          className="gap-2 rounded-full shadow-md"
        >
          <Flame className="w-4 h-4" />
          Latest
        </Button>
      </div>

      {/* Fixed Card Container */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        {/* Swipe Hint Ghost Arrows */}
        {showSwipeHint && (
          <>
            <animated.div
              style={{
                x: hintAnimation.x.to(x => -x),
                opacity: hintAnimation.opacity,
              }}
              className="absolute left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            >
              <ChevronLeft className="w-10 h-10 text-orange-400/50" strokeWidth={3} />
            </animated.div>
            <animated.div
              style={{
                x: hintAnimation.x,
                opacity: hintAnimation.opacity,
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            >
              <ChevronRight className="w-10 h-10 text-orange-400/50" strokeWidth={3} />
            </animated.div>
          </>
        )}
        
        <animated.div
          {...bind()}
          ref={cardRef}
          style={{
            x: showSwipeHint ? hintAnimation.x : x,
            rotate,
            scale,
            touchAction: 'none',
          }}
          className="w-[90vw] max-w-2xl h-[70vh] cursor-grab active:cursor-grabbing"
          onDoubleClick={() => handleDoubleTap(currentPost.id)}
        >
          <Card className="w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#FF8A4C] via-[#FFB08A] to-[#FFD0B8] border-0 relative flex flex-col hover:shadow-[0_20px_60px_-15px_rgba(255,138,76,0.5)] transition-shadow duration-300">
            {/* Inner highlight on focus */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 pointer-events-none" />
            
            {/* Trending Badge */}
            {currentPost.is_high_engagement && (
              <div className="absolute top-5 right-5 z-10">
                <Badge className="bg-white/90 text-orange-600 shadow-lg gap-1 px-3 py-1.5 font-bold backdrop-blur border border-orange-200">
                  <Flame className="w-4 h-4" />
                  Trending
                </Badge>
              </div>
            )}

            {/* Profile Header */}
            <div className="flex-shrink-0 p-5 pb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-white/60 shadow-lg ring-2 ring-white/30">
                  <AvatarImage src={currentPost.profiles.avatar_url || undefined} />
                  <AvatarFallback className="text-lg font-bold bg-white text-orange-600">
                    {currentPost.profiles.display_name?.charAt(0) || currentPost.profiles.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate text-white drop-shadow-md">{currentPost.profiles.display_name || currentPost.profiles.username}</p>
                  <p className="text-sm text-white/90 font-medium drop-shadow">{formatTimeAgo(currentPost.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 px-5 overflow-y-auto space-y-4 min-h-0">
              {/* Challenge Badge - Modern Glassmorphism */}
              {currentPost.user_challenges?.challenges && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-pink-400/30 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="relative flex items-center gap-3 px-4 py-3 bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl shadow-lg hover:bg-white/20 transition-all">
                    <span className="text-2xl">🎯</span>
                    <span className="font-bold text-white drop-shadow-md truncate text-sm">{currentPost.user_challenges.challenges.title}</span>
                  </div>
                </div>
              )}

              {/* Post Image */}
              {currentPost.image_url && (
                <div className="rounded-2xl overflow-hidden shadow-xl ring-4 ring-white/30">
                  <img 
                    src={currentPost.image_url} 
                    alt="Challenge proof" 
                    className="w-full aspect-square object-cover"
                  />
                </div>
              )}

              {/* Content Text */}
              <div className="text-center space-y-3 py-2">
                <p className="text-base leading-relaxed font-semibold text-white drop-shadow-md px-2 line-clamp-3">{currentPost.content}</p>
                
                {/* Hashtags */}
                {currentPost.hashtags && currentPost.hashtags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {currentPost.hashtags.map((hashtag, idx) => (
                      <span key={idx} className="text-sm font-bold text-white drop-shadow px-3 py-1.5 bg-white/25 rounded-full backdrop-blur-sm border border-white/30 hover:bg-white/35 transition-colors">
                        {hashtag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Floating Action Bar - Instagram Style */}
            <div className="flex-shrink-0 px-5 py-4 bg-gradient-to-t from-black/5 to-transparent">
              <div className="flex items-center justify-center gap-8">
                {/* Like Button - Simple */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(currentPost.id)}
                    className="relative group transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center rounded-full min-w-[44px] min-h-[44px]"
                  >
                    <Heart 
                      className={cn(
                        "w-7 h-7 transition-all",
                        currentPost.likes_count > 0 
                          ? "fill-red-500 text-red-500" 
                          : "text-white drop-shadow-md"
                      )} 
                      strokeWidth={2.5}
                    />
                  </button>
                  {currentPost.likes_count > 0 && (
                    <span className="text-sm font-bold text-white drop-shadow-md">
                      {currentPost.likes_count}
                    </span>
                  )}
                </div>
                
                {/* Comment Button - Instagram Style */}
                <button
                  onClick={() => {
                    setShowComments(!showComments);
                    if (!showComments) fetchComments(currentPost.id);
                  }}
                  className="relative group flex items-center gap-2 transition-all duration-200 hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] justify-center"
                >
                  <MessageCircle 
                    className="w-7 h-7 text-white drop-shadow-md" 
                    strokeWidth={2.5}
                  />
                  {currentPost.comments_count > 0 && (
                    <span className="text-sm font-bold text-white drop-shadow-md">
                      {currentPost.comments_count}
                    </span>
                  )}
                </button>
                
                {/* Challenge/Share Button - Instagram Style */}
                {currentPost.user_challenges?.challenges ? (
                  <button
                    onClick={() => handleOpenChallenge(currentPost)}
                    className="relative group transition-all duration-200 hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Open challenge"
                  >
                    <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Compass 
                      className="w-7 h-7 text-white drop-shadow-md relative z-10" 
                      strokeWidth={2.5}
                    />
                  </button>
                ) : (
                  <button
                    onClick={() => handleShare(currentPost)}
                    className="relative group transition-all duration-200 hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Share2 
                      className="w-7 h-7 text-white drop-shadow-md" 
                      strokeWidth={2.5}
                    />
                  </button>
                )}
              </div>
            </div>
          </Card>
        </animated.div>
      </div>

      {/* Navigation Arrows - Side Fixed */}
      <Button
        variant="outline"
        size="icon"
        onClick={prevCard}
        disabled={currentIndex === 0}
        className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full shadow-2xl bg-white/95 hover:bg-white backdrop-blur hover:scale-110 transition-all disabled:opacity-30 disabled:pointer-events-none border-2 border-orange-200"
      >
        <ChevronLeft className="w-6 h-6 text-orange-600" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={nextCard}
        disabled={currentIndex === sortedPosts.length - 1}
        className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full shadow-2xl bg-white/95 hover:bg-white backdrop-blur hover:scale-110 transition-all disabled:opacity-30 disabled:pointer-events-none border-2 border-orange-200"
      >
        <ChevronRight className="w-6 h-6 text-orange-600" />
      </Button>

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in">
          <div className="w-full max-w-lg bg-card rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden animate-slide-in-right">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
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

            <div className="sticky bottom-0 bg-card border-t border-border p-4 z-10">
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

      {/* Challenge Detail Dialog */}
      <ChallengeDetailDialog
        challenge={selectedChallenge}
        userChallenge={selectedUserChallenge}
        isOpen={showChallengeDialog}
        onClose={handleChallengeDialogClose}
        onStatusUpdate={() => {
          handleChallengeDialogClose();
          fetchPosts();
        }}
      />
    </div>
  );
};

export default ChallengeFeed;