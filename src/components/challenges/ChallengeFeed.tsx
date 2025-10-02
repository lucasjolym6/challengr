import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChevronLeft, ChevronRight, Flame, Clock } from "lucide-react";
import { useSpring, animated, config } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Button } from "@/components/ui/button";
import InteractionCard, { ChallengeInteraction } from './InteractionCard';
import ChallengeDiscussion from './ChallengeDiscussion';

const ChallengeFeed: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interactions, setInteractions] = useState<ChallengeInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'latest' | 'trending'>('latest');
  const [seenInteractions, setSeenInteractions] = useState<Set<string>>(new Set());
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
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
    fetchInteractions();
    loadSeenInteractions();
    checkSwipeHint();
  }, []);

  useEffect(() => {
    if (interactions.length > 0 && currentIndex < interactions.length) {
      const currentInteraction = getSortedInteractions()[currentIndex];
      if (currentInteraction && !seenInteractions.has(currentInteraction.id)) {
        markAsSeen(currentInteraction.id);
      }
    }
  }, [currentIndex, interactions]);

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

  const loadSeenInteractions = () => {
    const seen = localStorage.getItem('seenInteractions');
    if (seen) {
      setSeenInteractions(new Set(JSON.parse(seen)));
    }
  };

  const markAsSeen = (interactionId: string) => {
    const newSeen = new Set(seenInteractions);
    newSeen.add(interactionId);
    setSeenInteractions(newSeen);
    localStorage.setItem('seenInteractions', JSON.stringify(Array.from(newSeen)));
  };

  const fetchInteractions = async () => {
    try {
      const interactions: ChallengeInteraction[] = [];

      // Fetch all active challenges
      const { data: challengesData } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_categories (name, color)
        `)
        .eq('is_active', true);

      for (const challenge of challengesData || []) {
        // Get participants count
        const { count: participantsCount } = await supabase
          .from('user_challenges')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id);

        // Get posts for likes/comments count
        const userChallengeIds = await supabase
          .from('user_challenges')
          .select('id')
          .eq('challenge_id', challenge.id)
          .then(res => res.data?.map(uc => uc.id) || []);

        const { data: posts } = await supabase
          .from('posts')
          .select('likes_count, comments_count')
          .in('user_challenge_id', userChallengeIds);

        const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
        const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;

        // Get latest comment
        const postIds = await supabase
          .from('posts')
          .select('id')
          .in('user_challenge_id', userChallengeIds)
          .then(res => res.data?.map(p => p.id) || []);

        const { data: latestComment } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            profiles (username, avatar_url)
          `)
          .in('post_id', postIds)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get recent participant
        const { data: recentParticipant } = await supabase
          .from('user_challenges')
          .select(`
            id,
            created_at,
            status,
            profiles (username, avatar_url)
          `)
          .eq('challenge_id', challenge.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Check for activity spike
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const { count: recentParticipants } = await supabase
          .from('user_challenges')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id)
          .gte('created_at', oneDayAgo.toISOString());

        // Create interaction cards
        if (recentParticipants && recentParticipants > 10) {
          // Milestone interaction
          interactions.push({
            id: `milestone-${challenge.id}`,
            challenge_id: challenge.id,
            challenge_title: challenge.title,
            challenge_image: challenge.image_url,
            category_name: challenge.challenge_categories?.name || 'Challenge',
            category_color: challenge.challenge_categories?.color,
            interaction_type: 'milestone',
            participants_count: participantsCount || 0,
            likes_count: totalLikes,
            comments_count: totalComments,
            milestone: {
              message: `${recentParticipants} nouveaux aujourd'hui!`,
              count: recentParticipants,
            },
          });
        } else if (latestComment) {
          // Comment interaction
          const profile = latestComment.profiles as any;
          interactions.push({
            id: latestComment.id,
            challenge_id: challenge.id,
            challenge_title: challenge.title,
            challenge_image: challenge.image_url,
            category_name: challenge.challenge_categories?.name || 'Challenge',
            category_color: challenge.challenge_categories?.color,
            interaction_type: 'comment',
            participants_count: participantsCount || 0,
            likes_count: totalLikes,
            comments_count: totalComments,
            comment: {
              content: latestComment.content,
              user_name: profile?.username || 'Unknown',
              user_avatar: profile?.avatar_url || null,
              created_at: latestComment.created_at,
            },
          });
        } else if (recentParticipant) {
          // Join/Complete interaction
          const profile = recentParticipant.profiles as any;
          interactions.push({
            id: `participant-${recentParticipant.id}`,
            challenge_id: challenge.id,
            challenge_title: challenge.title,
            challenge_image: challenge.image_url,
            category_name: challenge.challenge_categories?.name || 'Challenge',
            category_color: challenge.challenge_categories?.color,
            interaction_type: recentParticipant.status === 'completed' ? 'complete' : 'join',
            participants_count: participantsCount || 0,
            likes_count: totalLikes,
            comments_count: totalComments,
            participant: {
              user_name: profile?.username || 'Someone',
              user_avatar: profile?.avatar_url || null,
              action: recentParticipant.status === 'completed' ? 'completed' : 'joined',
              created_at: recentParticipant.created_at,
            },
          });
        }
      }

      setInteractions(interactions);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les interactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < getSortedInteractions().length - 1) {
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
      } else if (xDir < 0 && currentIndex < getSortedInteractions().length - 1) {
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

  const getSortedInteractions = () => {
    let sorted = [...interactions];
    
    if (viewMode === 'trending') {
      sorted.sort((a, b) => {
        const scoreA = a.participants_count * 5 + a.likes_count * 2 + a.comments_count * 3;
        const scoreB = b.participants_count * 5 + b.likes_count * 2 + b.comments_count * 3;
        return scoreB - scoreA;
      });
    }
    
    // Prioritize unseen
    sorted.sort((a, b) => {
      const aSeen = seenInteractions.has(a.id) ? 1 : 0;
      const bSeen = seenInteractions.has(b.id) ? 1 : 0;
      return aSeen - bSeen;
    });
    
    return sorted;
  };

  const handleViewInteraction = (interaction: ChallengeInteraction) => {
    setSelectedChallengeId(interaction.challenge_id);
    setHighlightedItemId(interaction.id);
  };

  if (selectedChallengeId) {
    return (
      <ChallengeDiscussion
        challengeId={selectedChallengeId}
        highlightedItemId={highlightedItemId || undefined}
        onBack={() => {
          setSelectedChallengeId(null);
          setHighlightedItemId(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-[85vw] max-w-lg h-[65vh] bg-gradient-to-br from-orange-400/30 via-pink-400/30 to-purple-400/30 rounded-3xl animate-pulse shadow-2xl" />
      </div>
    );
  }

  const sortedInteractions = getSortedInteractions();
  const currentInteraction = sortedInteractions[currentIndex];

  if (sortedInteractions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-6">🎯</div>
        <h3 className="text-2xl font-bold mb-3">Aucune interaction</h3>
        <p className="text-muted-foreground max-w-sm">
          Revenez bientôt pour découvrir les défis en cours !
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
        >
          <InteractionCard
            interaction={currentInteraction}
            onClick={() => handleViewInteraction(currentInteraction)}
          />
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
        disabled={currentIndex === sortedInteractions.length - 1}
        className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-sm shadow-md transition-all disabled:opacity-20 disabled:pointer-events-none"
      >
        <ChevronRight className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default ChallengeFeed;
