import React, { useState, useEffect } from 'react';
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Filter, TrendingUp, Clock, Users, Star, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostCard from './PostCard';
import FeedFilters, { FilterType } from './FeedFilters';
import TrendingSection from './TrendingSection';
import { useSpring, animated } from '@react-spring/web';
import { useSearchParams } from "react-router-dom";

export interface CommunityPost {
  id: string;
  user_id: string;
  user_challenge_id: string;
  challenge_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  verified: boolean;
  
  // User info
  user: {
    username: string;
    avatar_url?: string;
    level: number;
    total_points: number;
  };
  
  // Challenge info
  challenge: {
    title: string;
    description: string;
    category: {
      name: string;
      color: string;
    };
  };
  
  // User challenge progress
  user_challenge: {
    status: string;
    progress_percentage?: number;
    points_earned: number;
  };
  
  // Comments (nested)
  comments?: CommunityComment[];
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id?: string;
  
  // User info
  user: {
    username: string;
    avatar_url?: string;
    level: number;
  };
  
  // Reactions
  reactions: {
    fire: number;
    muscle: number;
    party: number;
  };
  
  // Nested replies
  replies?: CommunityComment[];
}

type SortMode = 'smart' | 'newest' | 'popular' | 'trending';

const CommunityFeed: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('smart');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(['all']);
  const [showTrending, setShowTrending] = useState(false);
  
  // Get search query from URL
  const searchQuery = searchParams.get('search') || '';
  
  // Animation for filter changes
  const [filterAnimation, setFilterAnimation] = useSpring(() => ({
    opacity: 1,
    transform: 'translateY(0px)',
  }));

  // Normalize text for search (remove accents and convert to lowercase)
  const normalizeText = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  useEffect(() => {
    fetchPosts();
  }, [sortMode, activeFilters, searchQuery]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // First, fetch posts with basic data
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          user_challenge_id,
          content,
          image_url,
          hashtags,
          likes_count,
          comments_count,
          created_at,
          verified,
          profiles!posts_user_id_fkey (
            username,
            avatar_url,
            level,
            total_points
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (activeFilters.includes('my_challenges') && user) {
        query = query.eq('user_id', user.id);
      }

      const { data: postsData, error } = await query.limit(50);

      if (error) throw error;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get user challenge IDs
      const userChallengeIds = postsData
        .map(post => post.user_challenge_id)
        .filter(Boolean);

      if (userChallengeIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch user challenges separately
      const { data: userChallengesData } = await supabase
        .from('user_challenges')
        .select(`
          id,
          challenge_id,
          status,
          proof_text,
          proof_image_url,
          challenges!user_challenges_challenge_id_fkey (
            id,
            title,
            description,
            points_reward,
            challenge_categories!challenges_category_id_fkey (
              name,
              color
            )
          )
        `)
        .in('id', userChallengeIds);

      // Create a map for quick lookup
      const userChallengesMap = new Map();
      userChallengesData?.forEach(uc => {
        userChallengesMap.set(uc.id, uc);
      });

              // Transform data
              let transformedPosts: CommunityPost[] = postsData
                .filter(post => post.user_challenge_id && userChallengesMap.has(post.user_challenge_id))
                .map(post => {
                  const userChallenge = userChallengesMap.get(post.user_challenge_id);
                  return {
                    id: post.id,
                    user_id: post.user_id,
                    user_challenge_id: post.user_challenge_id,
                    challenge_id: userChallenge.challenge_id,
                    content: post.content,
                    image_url: post.image_url,
                    hashtags: post.hashtags || [],
                    likes_count: post.likes_count,
                    comments_count: post.comments_count,
                    created_at: post.created_at,
                    verified: post.verified,
                    user: {
                      username: post.profiles.username,
                      avatar_url: post.profiles.avatar_url,
                      level: post.profiles.level,
                      total_points: post.profiles.total_points,
                    },
                    challenge: {
                      title: userChallenge.challenges.title,
                      description: userChallenge.challenges.description,
                      category: {
                        name: userChallenge.challenges.challenge_categories.name,
                        color: userChallenge.challenges.challenge_categories.color,
                      },
                    },
                    user_challenge: {
                      status: userChallenge.status,
                      points_earned: userChallenge.challenges.points_reward || 0,
                    },
                  };
                });


      // If no real data, add some mock discussion-focused posts for demo
      if (transformedPosts.length === 0) {
        const mockPosts: CommunityPost[] = [
                  {
                    id: 'mock-1',
                    user_id: 'user-1',
                    user_challenge_id: 'uc-1',
                    challenge_id: 'challenge-1',
                    content: "Je l'ai fait sans sel et c'était super dur ! Mais finalement c'est possible et même plus savoureux.",
                    image_url: null,
                    hashtags: [],
                    likes_count: 12,
                    comments_count: 5,
                    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    verified: true,
            user: {
              username: 'Raphaël Levy',
              avatar_url: null,
              level: 3,
              total_points: 150,
            },
            challenge: {
              title: 'Cuisiner sans recette',
              description: 'Créer un plat original sans suivre de recette',
              category: {
                name: 'Cooking',
                color: '#FF6B6B',
              },
            },
            user_challenge: {
              status: 'completed',
              points_earned: 25,
            },
          },
          {
            id: 'mock-2',
            user_id: 'user-2',
            user_challenge_id: 'uc-2',
            challenge_id: 'challenge-2',
            content: "Voici ma progression après 3 jours ! Le puzzle commence à prendre forme.",
            image_url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop',
            hashtags: [],
            likes_count: 8,
            comments_count: 2,
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            verified: true,
            user: {
              username: 'Lucas',
              avatar_url: null,
              level: 2,
              total_points: 80,
            },
            challenge: {
              title: 'Finir un puzzle',
              description: 'Compléter un puzzle de 1000+ pièces',
              category: {
                name: 'Creative',
                color: '#4ECDC4',
              },
            },
            user_challenge: {
              status: 'in_progress',
              points_earned: 15,
            },
          },
          {
            id: 'mock-3',
            user_id: 'user-3',
            user_challenge_id: 'uc-3',
            challenge_id: 'challenge-3',
            content: "Écouter du Mozart 🎧 - Une expérience vraiment apaisante. Je recommande la Symphonie n°40 !",
            image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
            hashtags: [],
            likes_count: 15,
            comments_count: 7,
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            verified: true,
            user: {
              username: 'Anna',
              avatar_url: null,
              level: 4,
              total_points: 220,
            },
            challenge: {
              title: 'Écouter du Mozart 🎧',
              description: 'Écouter une œuvre complète de Mozart',
              category: {
                name: 'Music',
                color: '#45B7D1',
              },
            },
            user_challenge: {
              status: 'completed',
              points_earned: 30,
            },
          },
                  {
                    id: 'mock-4',
                    user_id: 'user-4',
                    user_challenge_id: 'uc-4',
                    challenge_id: 'challenge-4',
                    content: "Première session de méditation terminée ! 10 minutes de calme absolu.",
                    image_url: null,
                    hashtags: [],
                    likes_count: 6,
                    comments_count: 3,
                    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                    verified: true,
            user: {
              username: 'Marie',
              avatar_url: null,
              level: 1,
              total_points: 45,
            },
            challenge: {
              title: 'Méditer 10 min',
              description: 'Pratiquer la méditation pendant 10 minutes',
              category: {
                name: 'Wellness',
                color: '#9B59B6',
              },
            },
            user_challenge: {
              status: 'in_progress',
              points_earned: 10,
            },
          },
          {
            id: 'mock-5',
            user_id: 'user-5',
            user_challenge_id: 'uc-5',
            challenge_id: 'challenge-5',
            content: "Mon premier dessin au crayon ! Pas facile mais j'adore le résultat.",
            image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
            hashtags: [],
            likes_count: 22,
            comments_count: 8,
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            verified: true,
            user: {
              username: 'Thomas',
              avatar_url: null,
              level: 2,
              total_points: 95,
            },
            challenge: {
              title: 'Dessiner au crayon',
              description: 'Créer un dessin uniquement au crayon',
              category: {
                name: 'Art',
                color: '#E67E22',
              },
            },
            user_challenge: {
              status: 'completed',
              points_earned: 35,
            },
          },
        ];
        
        setPosts(mockPosts);
        setLoading(false);
        return;
      }

      // Apply sorting
      let sortedPosts = [...transformedPosts];
      switch (sortMode) {
        case 'newest':
          sortedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'popular':
          sortedPosts.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
          break;
        case 'trending':
          // Trending = recent posts with high engagement
          sortedPosts.sort((a, b) => {
            const now = new Date();
            const aTime = new Date(a.created_at);
            const bTime = new Date(b.created_at);
            const aAge = (now.getTime() - aTime.getTime()) / (1000 * 60 * 60); // hours
            const bAge = (now.getTime() - bTime.getTime()) / (1000 * 60 * 60); // hours
            
            // Trending score = engagement / age
            const aScore = (a.likes_count + a.comments_count) / Math.max(aAge, 1);
            const bScore = (b.likes_count + b.comments_count) / Math.max(bAge, 1);
            
            return bScore - aScore;
          });
          break;
        case 'smart':
        default:
          // Smart = mix of recency and engagement
          sortedPosts.sort((a, b) => {
            const now = new Date();
            const aTime = new Date(a.created_at);
            const bTime = new Date(b.created_at);
            const aAge = (now.getTime() - aTime.getTime()) / (1000 * 60 * 60); // hours
            const bAge = (now.getTime() - bTime.getTime()) / (1000 * 60 * 60); // hours
            
            // Smart score = (engagement * 0.7) + (recency * 0.3)
            const aEngagement = a.likes_count + a.comments_count;
            const bEngagement = b.likes_count + b.comments_count;
            const aRecency = Math.max(0, 24 - aAge) / 24; // 0-1 based on 24h window
            const bRecency = Math.max(0, 24 - bAge) / 24;
            
            const aScore = (aEngagement * 0.7) + (aRecency * 100 * 0.3);
            const bScore = (bEngagement * 0.7) + (bRecency * 100 * 0.3);
            
            return bScore - aScore;
          });
          break;
      }

      // Apply search filter if search query exists
      let filteredPosts = sortedPosts;
      if (searchQuery.trim()) {
        const normalizedQuery = normalizeText(searchQuery);
        filteredPosts = sortedPosts.filter(post => {
          const normalizedContent = normalizeText(post.content);
          const normalizedTitle = normalizeText(post.challenge.title);
          const normalizedUsername = normalizeText(post.user.username);
          const normalizedCategory = normalizeText(post.challenge.category.name);
          
          return normalizedContent.includes(normalizedQuery) ||
                 normalizedTitle.includes(normalizedQuery) ||
                 normalizedUsername.includes(normalizedQuery) ||
                 normalizedCategory.includes(normalizedQuery);
        });
      }

      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    setFilterAnimation.start({
      opacity: 0.5,
      transform: 'translateY(-10px)',
    });
    setTimeout(() => {
      setFilterAnimation.start({
        opacity: 1,
        transform: 'translateY(0px)',
      });
    }, 150);
  };

  const handleFilterChange = (filters: FilterType[]) => {
    setActiveFilters(filters);
    setFilterAnimation.start({
      opacity: 0.5,
      transform: 'translateY(-10px)',
    });
    setTimeout(() => {
      setFilterAnimation.start({
        opacity: 1,
        transform: 'translateY(0px)',
      });
    }, 150);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      {/* Search Results Header */}
      {searchQuery && (
        <div className="bg-gradient-to-r from-orange-400/20 to-pink-400/20 border border-orange-400/30 rounded-2xl p-4 mb-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-800">Search Results</h3>
          </div>
          <p className="text-orange-700/80">
            Found {posts.length} post(s) for "{searchQuery}"
          </p>
        </div>
      )}

      {/* iOS26-Inspired Header */}
      <div className="space-y-4 mb-6">

        {/* Sort Buttons - Glassmorphic Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={sortMode === 'smart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('smart')}
            className={`rounded-full whitespace-nowrap text-sm px-5 py-2 font-semibold transition-all duration-300 ${
              sortMode === 'smart' 
                ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg shadow-orange-400/30' 
                : 'bg-white/60 backdrop-blur-xl border-white/20 text-gray-700 hover:bg-white/80'
            }`}
          >
            <Star className="w-4 h-4 mr-2" />
            Smart
          </Button>
          <Button
            variant={sortMode === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('newest')}
            className={`rounded-full whitespace-nowrap text-sm px-5 py-2 font-semibold transition-all duration-300 ${
              sortMode === 'newest' 
                ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg shadow-orange-400/30' 
                : 'bg-white/60 backdrop-blur-xl border-white/20 text-gray-700 hover:bg-white/80'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Newest
          </Button>
          <Button
            variant={sortMode === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('popular')}
            className={`rounded-full whitespace-nowrap text-sm px-5 py-2 font-semibold transition-all duration-300 ${
              sortMode === 'popular' 
                ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg shadow-orange-400/30' 
                : 'bg-white/60 backdrop-blur-xl border-white/20 text-gray-700 hover:bg-white/80'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Popular
          </Button>
          <Button
            variant={sortMode === 'trending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('trending')}
            className={`rounded-full whitespace-nowrap text-sm px-5 py-2 font-semibold transition-all duration-300 ${
              sortMode === 'trending' 
                ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg shadow-orange-400/30' 
                : 'bg-white/60 backdrop-blur-xl border-white/20 text-gray-700 hover:bg-white/80'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
          </Button>
        </div>

        {/* Trending Section Toggle - Glassmorphic */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTrending(!showTrending)}
            className="bg-white/60 backdrop-blur-xl border border-white/20 text-orange-600 hover:text-orange-700 hover:bg-white/80 rounded-full px-4 py-2 font-semibold transition-all duration-300"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 ${showTrending ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Trending Section */}
        {showTrending && <TrendingSection />}

        {/* Filters */}
        <FeedFilters
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Posts Feed - iOS26 Style with Micro-Spacing */}
      <animated.div style={filterAnimation} className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)'
                }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🎯</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Aucun post trouvé</h3>
            <p className="text-gray-600">
              {searchQuery 
                ? `Aucun post trouvé pour "${searchQuery}"`
                : "Essayez de modifier vos filtres ou votre recherche !"
              }
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </animated.div>
    </div>
  );
};

export default CommunityFeed;
