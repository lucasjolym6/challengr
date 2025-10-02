import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Heart, MessageCircle, Users, ChevronLeft, ChevronRight, Flame, ArrowRight, TrendingUp, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpring, animated, config } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { useNavigate } from 'react-router-dom';

interface ChallengeVibe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  type: string;
  difficulty_level: number;
  category_id: string | null;
  challenge_categories?: {
    name: string;
    color: string | null;
  } | null;
  participants_count: number;
  total_likes: number;
  total_comments: number;
  latest_comment?: {
    content: string;
    username: string;
    created_at: string;
  } | null;
  recent_participant?: {
    username: string;
    avatar_url: string | null;
    action: string;
    created_at: string;
  } | null;
  activity_spike?: {
    count: number;
    type: string;
  } | null;
  engagement_score?: number;
  is_trending?: boolean;
}

const ChallengeFeed: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<ChallengeVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'latest' | 'trending'>('latest');
  const [seenChallenges, setSeenChallenges] = useState<Set<string>>(new Set());
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 300, friction: 30 },
  }));

  const [hintAnimation, hintApi] = useSpring(() => ({
    x: 0,
    opacity: 0,
    config: config.gentle,
  }));

  useEffect(() => {
    fetchChallenges();
    loadSeenChallenges();
    checkSwipeHint();
  }, []);

  useEffect(() => {
    if (challenges.length > 0 && currentIndex < challenges.length) {
      const currentChallenge = getSortedChallenges()[currentIndex];
      if (currentChallenge && !seenChallenges.has(currentChallenge.id)) {
        markAsSeen(currentChallenge.id);
      }
    }
  }, [currentIndex, challenges]);

  const checkSwipeHint = () => {
    const hintShown = localStorage.getItem('vibe_swipe_hint_shown');
    if (!hintShown) {
      setShowSwipeHint(true);
      setTimeout(() => playSwipeHint(), 500);
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
        localStorage.setItem('vibe_swipe_hint_shown', 'true');
      },
    });
  };

  const loadSeenChallenges = () => {
    const seen = localStorage.getItem('seenChallenges');
    if (seen) {
      setSeenChallenges(new Set(JSON.parse(seen)));
    }
  };

  const markAsSeen = (challengeId: string) => {
    const newSeen = new Set(seenChallenges);
    newSeen.add(challengeId);
    setSeenChallenges(newSeen);
    localStorage.setItem('seenChallenges', JSON.stringify(Array.from(newSeen)));
  };

  const fetchChallenges = async () => {
    try {
      // Fetch all active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_categories (name, color)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;

      // For each challenge, aggregate social data
      const challengesWithVibes = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          // Get participants count
          const { count: participantsCount } = await supabase
            .from('user_challenges')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id);

          // Get posts for this challenge
          const { data: posts } = await supabase
            .from('posts')
            .select('likes_count, comments_count')
            .in('user_challenge_id', 
              await supabase
                .from('user_challenges')
                .select('id')
                .eq('challenge_id', challenge.id)
                .then(res => res.data?.map(uc => uc.id) || [])
            );

          const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
          const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;

          // Get latest comment
          const { data: latestCommentData } = await supabase
            .from('comments')
            .select(`
              content,
              created_at,
              profiles (username)
            `)
            .in('post_id', 
              await supabase
                .from('posts')
                .select('id')
                .in('user_challenge_id',
                  await supabase
                    .from('user_challenges')
                    .select('id')
                    .eq('challenge_id', challenge.id)
                    .then(res => res.data?.map(uc => uc.id) || [])
                )
                .then(res => res.data?.map(p => p.id) || [])
            )
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get recent participant
          const { data: recentParticipant } = await supabase
            .from('user_challenges')
            .select(`
              created_at,
              status,
              profiles (username, avatar_url)
            `)
            .eq('challenge_id', challenge.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Calculate engagement score
          const engagement_score = (participantsCount || 0) * 5 + totalLikes * 2 + totalComments * 3;

          // Check for activity spike (participants in last 24h)
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          const { count: recentParticipants } = await supabase
            .from('user_challenges')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id)
            .gte('created_at', oneDayAgo.toISOString());

          return {
            ...challenge,
            participants_count: participantsCount || 0,
            total_likes: totalLikes,
            total_comments: totalComments,
            latest_comment: latestCommentData ? {
              content: latestCommentData.content,
              username: (latestCommentData.profiles as any)?.username || 'Unknown',
              created_at: latestCommentData.created_at,
            } : null,
            recent_participant: recentParticipant ? {
              username: (recentParticipant.profiles as any)?.username || 'Someone',
              avatar_url: (recentParticipant.profiles as any)?.avatar_url || null,
              action: recentParticipant.status === 'completed' ? 'completed' : 'joined',
              created_at: recentParticipant.created_at,
            } : null,
            activity_spike: (recentParticipants || 0) > 5 ? {
              count: recentParticipants || 0,
              type: 'participants'
            } : null,
            engagement_score,
            is_trending: engagement_score > 50,
          } as ChallengeVibe;
        })
      );

      setChallenges(challengesWithVibes);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast({
        title: "Error",
        description: "Failed to load challenge vibes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < getSortedChallenges().length - 1) {
      api.start({ 
        x: -400, 
        rotate: -15, 
        scale: 0.85,
        config: { tension: 280, friction: 25 }
      });
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        api.start({ 
          x: 0, 
          rotate: 0, 
          scale: 1,
          config: { tension: 280, friction: 25 }
        });
      }, 250);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      api.start({ 
        x: 400, 
        rotate: 15, 
        scale: 0.85,
        config: { tension: 280, friction: 25 }
      });
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        api.start({ 
          x: 0, 
          rotate: 0, 
          scale: 1,
          config: { tension: 280, friction: 25 }
        });
      }, 250);
    }
  };

  const bind = useDrag(({ down, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    if (showSwipeHint) {
      setShowSwipeHint(false);
      hintApi.start({ x: 0, opacity: 0 });
      localStorage.setItem('vibe_swipe_hint_shown', 'true');
    }
    
    const trigger = vx > 0.2;
    
    if (!down && trigger) {
      if (xDir > 0 && currentIndex > 0) {
        prevCard();
      } else if (xDir < 0 && currentIndex < getSortedChallenges().length - 1) {
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

  const getSortedChallenges = () => {
    let sorted = [...challenges];
    
    if (viewMode === 'trending') {
      sorted.sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
    }
    
    // Prioritize unseen
    sorted.sort((a, b) => {
      const aSeen = seenChallenges.has(a.id) ? 1 : 0;
      const bSeen = seenChallenges.has(b.id) ? 1 : 0;
      return aSeen - bSeen;
    });
    
    return sorted;
  };

  const handleViewChallenge = (challengeId: string) => {
    navigate(`/challenges`);
    // Could add challenge ID to URL to auto-open the challenge
  };

  if (loading) {
    return (
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-[85vw] max-w-lg h-[65vh] bg-gradient-to-br from-orange-400/30 via-pink-400/30 to-purple-400/30 rounded-3xl animate-pulse shadow-2xl" />
      </div>
    );
  }

  const sortedChallenges = getSortedChallenges();
  const currentChallenge = sortedChallenges[currentIndex];

  if (sortedChallenges.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-6">🎯</div>
        <h3 className="text-2xl font-bold mb-3">No challenges yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Check back soon for exciting challenges to join!
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Fixed View Mode Toggle - Higher and Bolder */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-4">
        <Button
          variant={viewMode === 'trending' ? 'default' : 'outline'}
          size="lg"
          onClick={() => {
            setViewMode('trending');
            setCurrentIndex(0);
          }}
          className="gap-2 rounded-full shadow-lg font-bold px-6 py-3"
        >
          <Flame className="w-5 h-5" />
          Trending
        </Button>
        <Button
          variant={viewMode === 'latest' ? 'default' : 'outline'}
          size="lg"
          onClick={() => {
            setViewMode('latest');
            setCurrentIndex(0);
          }}
          className="gap-2 rounded-full shadow-lg font-bold px-6 py-3"
        >
          <Clock className="w-5 h-5" />
          Latest
        </Button>
      </div>

      {/* Fixed Card Container */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        {/* Swipe Hint */}
        {showSwipeHint && (
          <>
            <animated.div
              style={{
                x: hintAnimation.x.to(x => -x),
                opacity: hintAnimation.opacity,
              }}
              className="absolute -left-14 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            >
              <ChevronLeft className="w-8 h-8 text-orange-400/60" strokeWidth={2.5} />
            </animated.div>
            <animated.div
              style={{
                x: hintAnimation.x,
                opacity: hintAnimation.opacity,
              }}
              className="absolute -right-14 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            >
              <ChevronRight className="w-8 h-8 text-orange-400/60" strokeWidth={2.5} />
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
          className="w-[85vw] max-w-lg h-[65vh] cursor-grab active:cursor-grabbing"
          onClick={() => handleViewChallenge(currentChallenge.id)}
        >
          <Card className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border-0 relative flex flex-col">
            {/* Full-bleed Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
              {currentChallenge.image_url ? (
                <img 
                  src={currentChallenge.image_url} 
                  alt={currentChallenge.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400" />
              )}
              {/* Stronger dark overlay for better readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/75" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full p-6">
              {/* Header */}
              <div className="flex-shrink-0 space-y-3">
                {/* Trending Badge */}
                {currentChallenge.is_trending && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 shadow-lg gap-1.5 px-3 py-1.5">
                    <Flame className="w-4 h-4" />
                    Trending
                  </Badge>
                )}

                {/* Category */}
                {currentChallenge.challenge_categories && (
                  <Badge 
                    variant="secondary" 
                    className="bg-white/25 text-white backdrop-blur-md border-white/40"
                  >
                    {currentChallenge.challenge_categories.name}
                  </Badge>
                )}

                {/* Challenge Title - Big & Bold */}
                <h2 className="text-3xl font-black text-white drop-shadow-2xl leading-tight">
                  {currentChallenge.title}
                </h2>

                {/* Quick Stats - Compact with emojis */}
                <div className="flex items-center gap-4 text-white/95">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-bold">{currentChallenge.participants_count}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-bold">{currentChallenge.total_likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-bold">{currentChallenge.total_comments}</span>
                  </div>
                </div>
              </div>

              {/* Center Highlight - Social Echo in rounded box */}
              <div className="flex-1 flex items-center justify-center py-6">
                <div className="bg-white/20 backdrop-blur-xl border-2 border-white/40 rounded-3xl p-6 shadow-2xl max-w-full">
                  {/* Activity Spike */}
                  {currentChallenge.activity_spike && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-black text-xl">
                          🔥 {currentChallenge.activity_spike.count} nouveaux aujourd'hui!
                        </p>
                        <p className="text-white/90 text-sm mt-1">Ce défi explose 🎉</p>
                      </div>
                    </div>
                  )}

                  {/* Recent Participant */}
                  {currentChallenge.recent_participant && !currentChallenge.activity_spike && (
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 border-3 border-white/70 shadow-lg">
                        <AvatarImage src={currentChallenge.recent_participant.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold text-lg">
                          {currentChallenge.recent_participant.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white font-bold text-lg break-words">
                          <span className="text-orange-300">{currentChallenge.recent_participant.username}</span>
                          {' '}{currentChallenge.recent_participant.action === 'completed' ? 'a complété ⭐' : 'a rejoint 🎉'}
                        </p>
                        <p className="text-white/80 text-xs mt-1">{formatTimeAgo(currentChallenge.recent_participant.created_at)}</p>
                      </div>
                      <Sparkles className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                    </div>
                  )}

                  {/* Latest Comment */}
                  {currentChallenge.latest_comment && !currentChallenge.recent_participant && !currentChallenge.activity_spike && (
                    <div className="relative">
                      <div className="absolute -left-4 top-4 w-0 h-0 border-t-[10px] border-r-[12px] border-b-[10px] border-transparent border-r-white/25" />
                      <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
                        <p className="text-white font-medium text-base italic line-clamp-3 break-words">
                          💬 "{currentChallenge.latest_comment.content}"
                        </p>
                        <p className="text-white/70 text-sm mt-2 font-semibold">
                          — {currentChallenge.latest_comment.username}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer CTA - Small Secondary Button */}
              <div className="flex-shrink-0 flex justify-end">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewChallenge(currentChallenge.id);
                  }}
                  variant="secondary"
                  size="sm"
                  className="bg-white/30 hover:bg-white/40 text-white border border-white/50 backdrop-blur-md font-semibold rounded-full gap-2 px-4 py-2 shadow-lg"
                >
                  Voir le fil
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </animated.div>
      </div>

      {/* Small Subtle Navigation Arrows - Aligned with card */}
      <button
        onClick={prevCard}
        disabled={currentIndex === 0}
        className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-sm shadow-md transition-all disabled:opacity-20 disabled:pointer-events-none"
      >
        <ChevronLeft className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
      </button>
      <button
        onClick={nextCard}
        disabled={currentIndex === sortedChallenges.length - 1}
        className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-sm shadow-md transition-all disabled:opacity-20 disabled:pointer-events-none"
      >
        <ChevronRight className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default ChallengeFeed;
