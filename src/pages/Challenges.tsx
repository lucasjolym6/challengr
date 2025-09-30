import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Plus, Filter, Grid3X3, List, Users, User, Play, CheckCircle } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category_id: string;
  difficulty_level: number;
  points_reward: number;
  is_custom: boolean;
  created_by: string | null;
  challenge_categories: {
    name: string;
    icon: string;
    color: string;
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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const [challengesRes, categoriesRes, userChallengesRes] = await Promise.all([
        supabase.from('challenges').select(`
          *,
          challenge_categories (name, icon, color)
        `).eq('is_active', true),
        supabase.from('challenge_categories').select('*'),
        user ? supabase.from('user_challenges').select(`
          *,
          challenges (
            *,
            challenge_categories (name, icon, color)
          )
        `).eq('user_id', user.id) : { data: [], error: null }
      ]);

      if (challengesRes.error) throw challengesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (userChallengesRes.error) throw userChallengesRes.error;

      setChallenges(challengesRes.data || []);
      setCategories(categoriesRes.data || []);
      setUserChallenges(userChallengesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
        is_custom: true
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
    if (!user) return;

    try {
      const { error } = await supabase.from('user_challenges').insert([{
        user_id: user.id,
        challenge_id: challengeId,
        status: 'in_progress',
        started_at: new Date().toISOString()
      }]);

      if (error) throw error;

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

  const filteredChallenges = selectedCategory === 'all' 
    ? challenges 
    : challenges.filter(c => c.challenge_categories?.name === selectedCategory);

  const renderChallengeCard = (challenge: Challenge) => {
    const userChallenge = getUserChallengeStatus(challenge.id);
    const status = userChallenge?.status || 'to_do';

    return (
      <Card key={challenge.id} className="group hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {challenge.challenge_categories?.icon || '🎯'}
              </div>
              <div>
                <CardTitle className="text-lg">{challenge.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getCategoryVariant(challenge.challenge_categories?.name || '')}>
                    {challenge.challenge_categories?.name}
                  </Badge>
                  {challenge.is_custom && (
                    <Badge variant="outline">Custom</Badge>
                  )}
                </div>
              </div>
            </div>
            <Badge variant={getStatusVariant(status)}>
              {status === 'to_do' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Completed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            {challenge.description}
          </CardDescription>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>Difficulty: {challenge.difficulty_level}/5</span>
            <span>{challenge.points_reward} points</span>
          </div>

          <div className="flex gap-2">
            {status === 'to_do' && (
              <>
                <Button 
                  onClick={() => startChallenge(challenge.id)}
                  className="flex-1"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start Solo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Find Partner
                </Button>
              </>
            )}
            {status === 'in_progress' && (
              <Button 
                onClick={() => userChallenge && completeChallenge(userChallenge.id)}
                variant="success"
                className="flex-1"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Complete
              </Button>
            )}
            {status === 'completed' && (
              <Button variant="secondary" className="flex-1" size="sm" disabled>
                Completed!
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Challenges
          </h1>
          <p className="text-muted-foreground">
            Discover and create challenges to grow your skills
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Challenge</DialogTitle>
                <DialogDescription>
                  Create a personalized challenge for yourself or the community
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Challenge Title</Label>
                  <Input
                    id="title"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                    placeholder="Enter challenge title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                    placeholder="Describe your challenge"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newChallenge.category_id} onValueChange={(value) => setNewChallenge({...newChallenge, category_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                    <Select value={newChallenge.difficulty_level.toString()} onValueChange={(value) => setNewChallenge({...newChallenge, difficulty_level: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(level => (
                          <SelectItem key={level} value={level.toString()}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="points">Points Reward</Label>
                    <Input
                      id="points"
                      type="number"
                      value={newChallenge.points_reward}
                      onChange={(e) => setNewChallenge({...newChallenge, points_reward: parseInt(e.target.value) || 10})}
                    />
                  </div>
                </div>
                
                <Button onClick={createCustomChallenge} className="w-full">
                  Create Challenge
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
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
        </div>
        
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Challenges Grid/List */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
        : "space-y-4"
      }>
        {filteredChallenges.map(renderChallengeCard)}
      </div>

      {filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2">No challenges found</h3>
          <p className="text-muted-foreground mb-4">
            {selectedCategory === 'all' 
              ? "No challenges available yet" 
              : `No challenges found in ${selectedCategory} category`
            }
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create the first challenge
          </Button>
        </div>
      )}
    </div>
  );
};

export default Challenges;