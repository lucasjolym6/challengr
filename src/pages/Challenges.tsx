import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Plus, Trophy, TrendingUp, Search } from "lucide-react";
import ChallengeDetailDialog from "@/components/challenges/ChallengeDetailDialog";
import { CreateChallengeDialog } from "@/components/challenges/CreateChallengeDialog";
import { DifficultyCircle } from "@/components/ui/difficulty-circle";
import { UserLevelBadge } from "@/components/ui/user-level-badge";
import { ChallengesHeader } from "@/components/challenges/ChallengesHeader";
import { useSearchParams } from "react-router-dom";
// Feed moved to separate page

// Import category images

// Import category images
import sportsImg from "@/assets/category-sports.jpg";
import drawingImg from "@/assets/category-drawing.jpg";
import musicImg from "@/assets/category-music.jpg";
import cookingImg from "@/assets/category-cooking.jpg";
import writingImg from "@/assets/category-writing.jpg";
import codingImg from "@/assets/category-coding.jpg";
import gardeningImg from "@/assets/category-gardening.jpg";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category_id: string;
  difficulty_level: number;
  points_reward: number;
  is_custom: boolean;
  created_by: string | null;
  type: 'company' | 'community';
  image_url: string | null;
  challenge_categories: {
    name: string;
    icon: string;
    color: string;
  } | null;
  profiles: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
    level: string | null;
  } | null;
}

interface UserChallenge {
  id: string;
  status: string;
  challenge_id: string;
  started_at: string | null;
  completed_at: string | null;
  challenges: Challenge;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const Challenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'company' | 'community'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const [loading, setLoading] = useState(true);
  
  // Get search query from URL
  const searchQuery = searchParams.get('search') || '';

  // Normalize text for search (remove accents and convert to lowercase)
  const normalizeText = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Helper function to enrich challenges with category data
  const enrichChallengesWithCategories = (challenges: any[], categories: any[]) => {
    return challenges.map(challenge => ({
      ...challenge,
      challenge_categories: challenge.category_id ? 
        categories.find(cat => cat.id === challenge.category_id) || null : 
        null
    }));
  };

  // Form state for creating custom challenges
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    category_id: '',
    difficulty_level: 1,
    points_reward: 10
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      
      // Always try to fetch categories first
      let categories = [];
      try {
        const categoriesRes = await supabase.from('challenge_categories').select('*');
        if (categoriesRes.error) {
          console.warn('Categories table may not exist:', categoriesRes.error);
        } else {
          categories = categoriesRes.data || [];
          setCategories(categories);
        }
      } catch (error) {
        console.warn('Failed to fetch categories:', error);
      }
      
      // Always try to fetch challenges without joins first
      let challenges = [];
      try {
        const challengesSimpleRes = await supabase.from('challenges').select('*').eq('is_active', true);
        if (challengesSimpleRes.error) {
          console.error('Failed to fetch challenges:', challengesSimpleRes.error);
          setChallenges([]);
        } else {
          challenges = challengesSimpleRes.data || [];
          
          // Fetch creator profiles
          const creatorIds = [...new Set(challenges.map(c => c.created_by).filter(Boolean))];
          let creatorProfiles: any[] = [];
          
          if (creatorIds.length > 0) {
            try {
              const profilesRes = await supabase
                .from('profiles')
                .select('user_id, display_name, username, avatar_url, level')
                .in('user_id', creatorIds);
              
              if (!profilesRes.error) {
                creatorProfiles = profilesRes.data || [];
              }
            } catch (error) {
              console.warn('Failed to fetch creator profiles:', error);
            }
          }
          
          // Try to enrich with categories and profiles
          if (categories.length > 0) {
            try {
              const enrichedChallenges = challenges.map(challenge => ({
                ...challenge,
                challenge_categories: challenge.category_id ? 
                  categories.find(cat => cat.id === challenge.category_id) || null : 
                  null,
                profiles: challenge.created_by ?
                  creatorProfiles.find(profile => profile.user_id === challenge.created_by) || null :
                  null
              }));
              setChallenges(enrichedChallenges);
            } catch (error) {
              console.warn('Failed to enrich challenges, using simple data:', error);
              setChallenges(challenges);
            }
          } else {
            setChallenges(challenges);
          }
        }
      } catch (error) {
        console.error('Failed to fetch challenges:', error);
        setChallenges([]);
      }
      
      // Fetch user challenges
      if (user) {
        try {
          const userChallengesRes = await supabase.from('user_challenges').select(`
            *,
            challenges!user_challenges_challenge_id_fkey (*)
          `).eq('user_id', user.id);
          
          if (userChallengesRes.error) {
            console.warn('Failed to fetch user challenges:', userChallengesRes.error);
            setUserChallenges([]);
          } else {
            setUserChallenges(userChallengesRes.data || []);
          }
        } catch (error) {
          console.warn('Failed to fetch user challenges:', error);
          setUserChallenges([]);
        }
      } else {
        setUserChallenges([]);
      }
      
    } catch (error) {
      console.error('Unexpected error in fetchData:', error);
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomChallenge = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('challenges').insert([{
        ...newChallenge,
        created_by: user.id,
        is_custom: true,
        type: 'community'
      }]);

      if (error) throw error;

      setNewChallenge({
        title: '',
        description: '',
        category_id: '',
        difficulty_level: 1,
        points_reward: 10
      });
      setShowCreateDialog(false);
      fetchData();
      
      toast({
        title: "Success!",
        description: "Custom challenge created successfully",
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive",
      });
    }
  };

  const startChallenge = async (challengeId: string) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    console.log('Starting challenge for user:', user.id);
    console.log('Challenge ID:', challengeId);

    try {
      // First, check if user profile exists
      console.log('Checking if user profile exists...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username')
        .eq('user_id', user.id)
        .single();
      
      console.log('Profile check result:', { profileData, profileError });
      
      if (profileError || !profileData) {
        console.error('User profile not found, creating one...');
        
        // Create user profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            user_id: user.id,
            username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          }])
          .select()
          .single();
        
        console.log('Profile creation result:', { newProfile, createError });
        
        if (createError) {
          throw new Error(`Failed to create user profile: ${createError.message}`);
        }
      }

      // Check if user_challenge already exists
      console.log('Checking for existing user_challenge...');
      const { data: existingChallenges, error: checkError } = await supabase
        .from('user_challenges')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId);
      
      console.log('Existing challenges check result:', { existingChallenges, checkError });
      const existingChallenge = existingChallenges?.[0];

      if (existingChallenge) {
        // Update existing challenge status
        console.log('Updating existing user_challenge:', existingChallenge.id);
        const { error } = await supabase
          .from('user_challenges')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', existingChallenge.id);

        console.log('Update result:', { error });
        if (error) throw error;
      } else {
        // Insert new challenge
        console.log('Inserting new user_challenge...');
        const insertData = {
          user_id: user.id,
          challenge_id: challengeId,
          status: 'in_progress',
          started_at: new Date().toISOString()
        };
        console.log('Insert data:', insertData);
        
        const { error } = await supabase.from('user_challenges').insert([insertData]);
        
        console.log('Insert result:', { error });
        if (error) throw error;
      }

      fetchData();
      toast({
        title: "Challenge Started!",
        description: "Good luck with your challenge",
      });
    } catch (error) {
      console.error('Error starting challenge:', error);
      toast({
        title: "Error",
        description: "Failed to start challenge",
        variant: "destructive",
      });
    }
  };

  const completeChallenge = async (userChallengeId: string) => {
    try {
      const { error } = await supabase
        .from('user_challenges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', userChallengeId);

      if (error) throw error;

      fetchData();
      toast({
        title: "Challenge Completed!",
        description: "Congratulations! Points have been awarded",
      });
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Error",
        description: "Failed to complete challenge",
        variant: "destructive",
      });
    }
  };

  const getUserChallengeStatus = (challengeId: string) => {
    return userChallenges.find(uc => uc.challenge_id === challengeId);
  };

  const getCategoryVariant = (categoryName: string) => {
    const variants: { [key: string]: any } = {
      'Sports': 'sports',
      'Drawing': 'drawing', 
      'Music': 'music',
      'Cooking': 'cooking',
      'Writing': 'writing',
      'Coding': 'coding',
      'Gardening': 'gardening'
    };
    return variants[categoryName] || 'default';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'in-progress';
      default: return 'to-do';
    }
  };

  const getCategoryImage = (categoryName: string): string => {
    const categoryImages: { [key: string]: string } = {
      'Sports': sportsImg,
      'Drawing': drawingImg,
      'Music': musicImg,
      'Cooking': cookingImg,
      'Writing': writingImg,
      'Coding': codingImg,
      'Gardening': gardeningImg
    };
    return categoryImages[categoryName] || sportsImg;
  };

  const filteredChallenges = challenges.filter(c => {
    const categoryMatch = selectedCategory === 'all' || c.challenge_categories?.name === selectedCategory;
    const typeMatch = selectedType === 'all' || c.type === selectedType;
    
    // Apply search filter if search query exists
    let searchMatch = true;
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeText(searchQuery);
      const normalizedTitle = normalizeText(c.title);
      const normalizedDescription = normalizeText(c.description);
      const normalizedCategory = c.challenge_categories?.name ? normalizeText(c.challenge_categories.name) : '';
      
      searchMatch = normalizedTitle.includes(normalizedQuery) || 
                   normalizedDescription.includes(normalizedQuery) ||
                   normalizedCategory.includes(normalizedQuery);
    }
    
    return categoryMatch && typeMatch && searchMatch;
  });

  const companyChallenges = filteredChallenges.filter(c => c.type === 'company');
  const communityChallenges = filteredChallenges.filter(c => c.type === 'community');

  // Discussion moved to separate page

  const openChallengeDetail = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowDetailDialog(true);
  };

  // openDiscussion removed - using navigation instead

  const renderChallengeCard = (challenge: Challenge) => {
    const userChallenge = getUserChallengeStatus(challenge.id);
    const status = userChallenge?.status || 'to_do';
    const creatorName = challenge.profiles?.display_name || challenge.profiles?.username || 'Unknown';
    const creatorInitials = creatorName.substring(0, 2).toUpperCase();
    const creatorLevel = challenge.profiles?.level || 1;

    return (
      <Card 
        key={challenge.id}
        id={`challenge-${challenge.id}`}
        className="group hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer border-border/40"
        onClick={() => openChallengeDetail(challenge)}
      >
        {/* Challenge Image - Strava-style large banner */}
        <div className="relative h-56 md:h-64 w-full overflow-hidden bg-muted">
          <img 
            src={challenge.image_url || getCategoryImage(challenge.challenge_categories?.name || '')} 
            alt={challenge.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Category badge overlaid on image */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-0 font-semibold">
              {challenge.challenge_categories?.icon} {challenge.challenge_categories?.name}
            </Badge>
          </div>

          {/* Status badge */}
          {status !== 'to_do' && (
            <div className="absolute top-4 right-4">
              {status === 'completed' ? (
                <Badge className="bg-success backdrop-blur-sm text-white border-0 font-semibold">
                  ✓ Completed
                </Badge>
              ) : (
                <Badge className="bg-primary backdrop-blur-sm text-primary-foreground border-0 font-semibold">
                  In Progress
                </Badge>
              )}
            </div>
          )}
        </div>

        <CardContent className="p-5 md:p-6 space-y-4">
          {/* Title */}
          <div>
            <h3 className="font-bold text-xl md:text-2xl leading-tight mb-2">{challenge.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {challenge.description}
            </p>
          </div>

          {/* Stats Row - Strava style */}
          <div className="flex items-center justify-between py-3 border-y border-border/50">
            <div className="flex flex-col items-center flex-1">
              <DifficultyCircle level={challenge.difficulty_level} size="md" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Difficulty</span>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl font-bold text-primary">{challenge.points_reward}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Points</span>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl font-bold text-foreground">{challenge.type === 'company' ? '🏢' : '👥'}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{challenge.type === 'company' ? 'Company' : 'Community'}</span>
            </div>
          </div>

          {/* Progress bar for in-progress challenges */}
          {status === 'in_progress' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">50%</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          )}

          {/* Creator Info */}
          <div className="flex items-center gap-2 pt-1">
            <Avatar className="h-7 w-7">
              <AvatarImage src={challenge.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-muted">{creatorInitials}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">by <span className="font-medium text-foreground">{creatorName}</span></span>
              <UserLevelBadge level={creatorLevel} size="sm" />
            </div>
          </div>

          {/* CTA Button - Strava style full-width orange */}
          <div className="pt-2">
            {status === 'to_do' && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  openChallengeDetail(challenge);
                }}
                className="w-full h-11 font-semibold text-base"
              >
                Start Challenge
              </Button>
            )}
            {status === 'in_progress' && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  userChallenge && completeChallenge(userChallenge.id);
                }}
                className="w-full h-11 font-semibold text-base"
              >
                Submit Proof
              </Button>
            )}
            {status === 'completed' && (
              <Button variant="outline" className="w-full h-11 font-semibold text-base" disabled>
                Completed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading challenges...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern iOS26 Header */}
      <ChallengesHeader
        activeChallenges={userChallenges.filter(uc => uc.status === 'in_progress').length}
        completedChallenges={userChallenges.filter(uc => uc.status === 'completed').length}
        onCreateChallenge={() => setShowCreateDialog(true)}
      />

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Search Results Header */}
        {searchQuery && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">Search Results</h3>
            </div>
            <p className="text-muted-foreground">
              Found {filteredChallenges.length} challenge(s) for "{searchQuery}"
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as 'all' | 'company' | 'community')} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Challenges Grid */}
        {selectedType === 'all' ? (
          <div className="space-y-10">
            {companyChallenges.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h2 className="text-xl md:text-2xl font-bold">Company Challenges</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                  {companyChallenges.map(renderChallengeCard)}
                </div>
              </div>
            )}

            {communityChallenges.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h2 className="text-xl md:text-2xl font-bold">Community Challenges</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                  {communityChallenges.map(renderChallengeCard)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {filteredChallenges.map(renderChallengeCard)}
          </div>
        )}

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">No challenges found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No challenges found for "${searchQuery}"`
                : selectedCategory === 'all' 
                  ? "No challenges available yet" 
                  : `No challenges found in ${selectedCategory} category`
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create the first challenge
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Discussion Feed moved to separate page */}

      {/* Challenge Detail Dialog */}
        <ChallengeDetailDialog
          challenge={selectedChallenge}
          userChallenge={selectedChallenge ? getUserChallengeStatus(selectedChallenge.id) : null}
          isOpen={showDetailDialog}
          onClose={() => setShowDetailDialog(false)}
          onStatusUpdate={fetchData}
// onOpenDiscussion removed - using navigation instead
        />

      <CreateChallengeDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onChallengeCreated={fetchData}
        categories={categories}
      />
    </div>
  );
};

export default Challenges;