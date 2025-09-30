import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  Edit, 
  Camera, 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  Users, 
  UserPlus, 
  Search,
  Crown,
  Award,
  Target,
  Calendar,
  Image as ImageIcon,
  CheckCircle
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  skills: string[];
  level: number;
  total_points: number;
}

interface CompletedChallenge {
  id: string;
  completed_at: string;
  proof_text: string;
  proof_image_url: string;
  challenges: {
    title: string;
    description: string;
    points_reward: number;
    challenge_categories: {
      name: string;
      icon: string;
    };
  };
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  earned_at?: string;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  profiles: Profile | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    weeklyGoal: 5,
    weeklyProgress: 0,
    monthlyGoal: 20,
    monthlyProgress: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    skills: [] as string[]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
      fetchCompletedChallenges();
      fetchBadges();
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setProfile(data);
      setEditForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
        skills: data.skills || []
      });
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user) return;

    // Get total completed challenges
    const { count: completedCount } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // Get in progress challenges
    const { count: inProgressCount } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'in_progress');

    // Get weekly progress (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count: weeklyCount } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', weekAgo.toISOString());

    // Get monthly progress (last 30 days)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const { count: monthlyCount } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', monthAgo.toISOString());

    setStats({
      completed: completedCount || 0,
      inProgress: inProgressCount || 0,
      weeklyGoal: 5,
      weeklyProgress: weeklyCount || 0,
      monthlyGoal: 20,
      monthlyProgress: monthlyCount || 0
    });
  };

  const fetchCompletedChallenges = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        id,
        completed_at,
        proof_text,
        proof_image_url,
        challenges (
          title,
          description,
          points_reward,
          challenge_categories (
            name,
            icon
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    if (data && !error) {
      setCompletedChallenges(data);
    }
  };

  const fetchBadges = async () => {
    if (!user) return;

    // Get all badges and user's earned badges
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .order('points_required', { ascending: true });

    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', user.id);

    if (allBadges && userBadges) {
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
      const badgesWithStatus = allBadges.map(badge => ({
        ...badge,
        earned_at: userBadges.find(ub => ub.badge_id === badge.id)?.earned_at
      })).filter(badge => earnedBadgeIds.has(badge.id));

      setBadges(badgesWithStatus);
    }
  };

  const fetchFriends = async () => {
    if (!user?.id) return;

    try {
      const { data: friendsData, error: friendsError } = await supabase
        .from('user_friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        return;
      }

      // Fetch profile data separately to avoid complex joins
      if (friendsData && friendsData.length > 0) {
        const friendIds = friendsData.map(f => f.friend_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', friendIds);

        const friendsWithProfiles = friendsData.map(friend => ({
          ...friend,
          profiles: profilesData?.find(p => p.user_id === friend.friend_id) || null
        }));

        setFriends(friendsWithProfiles);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    if (!user?.id) return;

    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('user_friends')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (requestsError) {
        console.error('Error fetching friend requests:', requestsError);
        return;
      }

      // Fetch profile data separately
      if (requestsData && requestsData.length > 0) {
        const requesterIds = requestsData.map(r => r.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', requesterIds);

        const requestsWithProfiles = requestsData.map(request => ({
          ...request,
          profiles: profilesData?.find(p => p.user_id === request.user_id) || null
        }));

        setFriendRequests(requestsWithProfiles);
      } else {
        setFriendRequests([]);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editForm.display_name,
        bio: editForm.bio,
        skills: editForm.skills
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      setIsEditing(false);
      fetchProfile();
    }
  };

  const searchFriends = async () => {
    if (!searchQuery.trim()) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .neq('user_id', user?.id)
      .limit(5);

    if (data && !error) {
      setSearchResults(data);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_friends')
        .insert([
          {
            user_id: user.id,
            friend_id: friendId,
            status: 'pending'
          }
        ]);

      if (error) {
        console.error('Error sending friend request:', error);
        toast({
          title: "Error",
          description: "Failed to send friend request",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Friend request sent!"
      });
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error", 
        description: "Failed to send friend request",
        variant: "destructive"
      });
    }
  };

  const respondToFriendRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('user_friends')
        .update({ status: response })
        .eq('id', requestId);

      if (error) {
        console.error('Error responding to friend request:', error);
        toast({
          title: "Error",
          description: "Failed to respond to friend request", 
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Friend request ${response}!`
      });
      fetchFriendRequests();
      if (response === 'accepted') {
        fetchFriends();
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      toast({
        title: "Error",
        description: "Failed to respond to friend request",
        variant: "destructive"
      });
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !editForm.skills.includes(skill)) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, skill]
      });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile photo updated successfully"
      });

      fetchProfile();
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile photo",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{profile?.display_name || profile?.username}</h1>
                  <p className="text-muted-foreground">@{profile?.username}</p>
                  {profile?.bio && (
                    <p className="mt-2 text-muted-foreground">{profile.bio}</p>
                  )}
                </div>
                
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={editForm.display_name}
                          onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      
                      <div>
                        <Label>Skills & Interests</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {editForm.skills.map((skill) => (
                            <Badge 
                              key={skill} 
                              variant="secondary" 
                              className="cursor-pointer"
                              onClick={() => removeSkill(skill)}
                            >
                              {skill} ×
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Add a skill..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addSkill(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={updateProfile} className="flex-1">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Skills display */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Level and Points */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="text-sm">Level {profile?.level || 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="text-sm">{profile?.total_points || 0} Points</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold">{badges.length}</div>
            <div className="text-sm text-muted-foreground">Badges</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">{friends.length}</div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Progress
              </CardTitle>
              <CardDescription>
                Complete {stats.weeklyGoal} challenges this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{stats.weeklyProgress} / {stats.weeklyGoal} completed</span>
                  <span>{Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%</span>
                </div>
                <Progress value={(stats.weeklyProgress / stats.weeklyGoal) * 100} />
              </div>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Progress
              </CardTitle>
              <CardDescription>
                Complete {stats.monthlyGoal} challenges this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{stats.monthlyProgress} / {stats.monthlyGoal} completed</span>
                  <span>{Math.round((stats.monthlyProgress / stats.monthlyGoal) * 100)}%</span>
                </div>
                <Progress value={(stats.monthlyProgress / stats.monthlyGoal) * 100} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Challenge History</CardTitle>
              <CardDescription>Your recently completed challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedChallenges.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No completed challenges yet. Start your first challenge!
                  </p>
                ) : (
                  completedChallenges.map((challenge) => (
                    <div key={challenge.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="text-2xl">
                        {challenge.challenges.challenge_categories?.icon || '🎯'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{challenge.challenges.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {challenge.challenges.description}
                        </p>
                        {challenge.proof_text && (
                          <p className="text-sm italic mb-2">"{challenge.proof_text}"</p>
                        )}
                        {challenge.proof_image_url && (
                          <img 
                            src={challenge.proof_image_url} 
                            alt="Challenge proof" 
                            className="max-w-sm max-h-32 object-cover rounded"
                          />
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Completed: {new Date(challenge.completed_at).toLocaleDateString()}</span>
                          <span>+{challenge.challenges.points_reward} points</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle>Earned Badges</CardTitle>
              <CardDescription>Badges you've unlocked through challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No badges earned yet. Complete challenges to earn badges!
                  </div>
                ) : (
                  badges.map((badge) => (
                    <div key={badge.id} className="text-center p-4 border rounded-lg">
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <h3 className="font-semibold text-sm">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                      {badge.earned_at && (
                        <p className="text-xs text-green-600 mt-2">
                          Earned {new Date(badge.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Friends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add Friends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by username or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchFriends()}
                  />
                  <Button onClick={searchFriends}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={result.avatar_url || undefined} />
                            <AvatarFallback>{result.display_name?.charAt(0) || result.username?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{result.display_name || result.username}</p>
                            <p className="text-xs text-muted-foreground">@{result.username}</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => sendFriendRequest(result.user_id)}>
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Friend Requests */}
                {friendRequests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Friend Requests</h4>
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                              {request.profiles?.display_name?.charAt(0) || request.profiles?.username?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {request.profiles?.display_name || request.profiles?.username}
                            </p>
                            <p className="text-xs text-muted-foreground">@{request.profiles?.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => respondToFriendRequest(request.id, 'accepted')}>
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => respondToFriendRequest(request.id, 'declined')}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friends List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Friends ({friends.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {friends.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No friends yet. Search and add some friends!
                    </p>
                  ) : (
                    friends.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-2 p-2 border rounded">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={friend.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {friend.profiles?.display_name?.charAt(0) || friend.profiles?.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {friend.profiles?.display_name || friend.profiles?.username}
                          </p>
                          <p className="text-xs text-muted-foreground">@{friend.profiles?.username}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Level {friend.profiles?.level || 1}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}