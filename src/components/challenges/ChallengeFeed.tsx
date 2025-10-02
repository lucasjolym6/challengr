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

      // Fetch challenges without joins first to avoid relationship issues
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('id, title, image_url, category_id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(30);

      console.log('ChallengeFeed - challenges fetch result:', { challengesData, challengesError });

      if (challengesError) {
        console.error('Error fetching challenges in ChallengeFeed:', challengesError);
        setInteractions([]);
        setLoading(false);
        return;
      }

      if (!challengesData || challengesData.length === 0) {
        setInteractions([]);
        setLoading(false);
        return;
      }

      // Fetch categories separately to avoid join issues
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('challenge_categories')
        .select('id, name, color');

      console.log('ChallengeFeed - categories fetch result:', { categoriesData, categoriesError });

      // Enrich challenges with category data
      const enrichedChallenges = challengesData.map(challenge => ({
        ...challenge,
        challenge_categories: challenge.category_id && categoriesData
          ? categoriesData.find(cat => cat.id === challenge.category_id)
          : null
      }));

      console.log('ChallengeFeed - enriched challenges:', enrichedChallenges);

      const challengeIds = enrichedChallenges.map(c => c.id);

      // Batch fetch all user challenges for these challenges
      const { data: allUserChallenges } = await supabase
        .from('user_challenges')
        .select('id, challenge_id, user_id, status, created_at, completed_at')
        .in('challenge_id', challengeIds);

      const userChallengesByChallenge = (allUserChallenges || []).reduce((acc, uc) => {
        if (!acc[uc.challenge_id]) acc[uc.challenge_id] = [];
        acc[uc.challenge_id].push(uc);
        return acc;
      }, {} as Record<string, any[]>);

      const allUserChallengeIds = (allUserChallenges || []).map(uc => uc.id);

      // Batch fetch all posts
      const { data: allPosts, error: postsError } = await supabase
        .from('posts')
        .select('id, user_challenge_id, likes_count, comments_count, content, image_url, created_at, verified, user_id')
        .in('user_challenge_id', allUserChallengeIds)
        .order('created_at', { ascending: false })
        .limit(100);

      console.log('ChallengeFeed - posts fetch result:', { allPosts, postsError });

      if (postsError) {
        console.error('Error fetching posts in ChallengeFeed:', postsError);
        // Continue without posts rather than failing completely
      }

      const postsByChallenge = (allPosts || []).reduce((acc, post) => {
        const uc = allUserChallenges?.find(u => u.id === post.user_challenge_id);
        if (uc) {
          if (!acc[uc.challenge_id]) acc[uc.challenge_id] = [];
          acc[uc.challenge_id].push(post);
        }
        return acc;
      }, {} as Record<string, any[]>);

      // Batch fetch all comments
      const postIds = (allPosts || []).map(p => p.id);
      const { data: allComments } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          content,
          created_at,
          user_id,
          profiles!comments_user_id_fkey (username, avatar_url)
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: false })
        .limit(200);

      const commentsByPost = (allComments || []).reduce((acc, comment) => {
        if (!acc[comment.post_id]) acc[comment.post_id] = [];
        acc[comment.post_id].push(comment);
        return acc;
      }, {} as Record<string, any[]>);

      // Batch fetch user profiles
      const allUserIds = [...new Set([
        ...(allUserChallenges || []).map(uc => uc.user_id),
        ...(allPosts || []).map(p => p.user_id),
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', allUserIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      // Process each challenge to create interactions
      for (const challenge of challengesData) {
        const userChallenges = userChallengesByChallenge[challenge.id] || [];
        const posts = postsByChallenge[challenge.id] || [];

        const participantsCount = userChallenges.length;
        const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
        const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);

        // Check for recent activity spike (last 24h)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentParticipants = userChallenges.filter(
          uc => new Date(uc.created_at) > oneDayAgo
        ).length;

        // Priority 1: Activity spike (milestone)
        if (recentParticipants >= 10) {
          interactions.push({
            id: `milestone-${challenge.id}-${Date.now()}`,
            challenge_id: challenge.id,
            challenge_title: challenge.title,
            challenge_image: challenge.image_url,
            category_name: challenge.challenge_categories?.name || 'Challenge',
            category_color: challenge.challenge_categories?.color,
            interaction_type: 'milestone',
            participants_count: participantsCount,
            likes_count: totalLikes,
            comments_count: totalComments,
            milestone: {
              message: `${recentParticipants} nouveaux aujourd'hui!`,
              count: recentParticipants,
            },
          });
          continue;
        }

        // Priority 2: Recent comment
        const latestPost = posts[0];
        if (latestPost) {
          const postComments = commentsByPost[latestPost.id] || [];
          const latestComment = postComments[0];

          if (latestComment) {
            const profile = (latestComment.profiles as any) || profilesMap[latestComment.user_id];
            interactions.push({
              id: latestComment.id,
              challenge_id: challenge.id,
              challenge_title: challenge.title,
              challenge_image: challenge.image_url,
              category_name: challenge.challenge_categories?.name || 'Challenge',
              category_color: challenge.challenge_categories?.color,
              interaction_type: 'comment',
              participants_count: participantsCount,
              likes_count: totalLikes,
              comments_count: totalComments,
              comment: {
                content: latestComment.content,
                user_name: profile?.username || 'Unknown',
                user_avatar: profile?.avatar_url || null,
                created_at: latestComment.created_at,
              },
            });
            continue;
          }
        }

        // Priority 3: Recent participant (join/complete)
        const sortedUC = [...userChallenges].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const recentParticipant = sortedUC[0];

        if (recentParticipant) {
          const profile = profilesMap[recentParticipant.user_id];
          const isComplete = recentParticipant.status === 'completed';
          interactions.push({
            id: `${isComplete ? 'complete' : 'join'}-${recentParticipant.id}`,
            challenge_id: challenge.id,
            challenge_title: challenge.title,
            challenge_image: challenge.image_url,
            category_name: challenge.challenge_categories?.name || 'Challenge',
            category_color: challenge.challenge_categories?.color,
            interaction_type: isComplete ? 'complete' : 'join',
            participants_count: participantsCount,
            likes_count: totalLikes,
            comments_count: totalComments,
            participant: {
              user_name: profile?.username || 'Someone',
              user_avatar: profile?.avatar_url || null,
              action: isComplete ? 'completed' : 'joined',
              created_at: isComplete && recentParticipant.completed_at 
                ? recentParticipant.completed_at 
                : recentParticipant.created_at,
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
