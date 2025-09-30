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
  Image as ImageIcon
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
  profiles: Profile;
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
  const [searchFriend, setSearchFriend] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!user) return;

    const { data, error } = await supabase
      .from('user_friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        profiles!user_friends_friend_id_fkey (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (data && !error) {
      setFriends(data);
    }
  };

  const fetchFriendRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        profiles!user_friends_user_id_fkey (*)
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (data && !error) {
      setFriendRequests(data);
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
    if (!searchFriend.trim()) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchFriend}%,display_name.ilike.%${searchFriend}%`)
      .neq('user_id', user?.id)
      .limit(5);

    if (data && !error) {
      setSearchResults(data);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_friends')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Friend request sent!"
      });
      setSearchResults([]);
      setSearchFriend('');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('user_friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Friend request accepted!"
      });
      fetchFriends();
      fetchFriendRequests();
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
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
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
              
              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Skills & Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-accent">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 text-secondary mx-auto mb-2" />
                <div className="text-2xl font-bold text-secondary">{profile?.total_points || 0}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Medal className="h-8 w-8 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-success">{profile?.level || 1}</div>
                <div className="text-sm text-muted-foreground">Level</div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Goals */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{stats.weeklyProgress} / {stats.weeklyGoal} challenges</span>
                    <span>{Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%</span>
                  </div>
                  <Progress value={(stats.weeklyProgress / stats.weeklyGoal) * 100} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{stats.monthlyProgress} / {stats.monthlyGoal} challenges</span>
                    <span>{Math.round((stats.monthlyProgress / stats.monthlyGoal) * 100)}%</span>
                  </div>
                  <Progress value={(stats.monthlyProgress / stats.monthlyGoal) * 100} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Challenge History</CardTitle>
              <CardDescription>Your recently completed challenges with proof submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {completedChallenges.length > 0 ? (
                <div className="space-y-4">
                  {completedChallenges.map((challenge) => (
                    <div key={challenge.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {challenge.challenges.challenge_categories?.icon || '🎯'}
                          </span>
                          <div>
                            <h4 className="font-medium">{challenge.challenges.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Completed {new Date(challenge.completed_at).toLocaleDateString()}</span>
                              <Badge variant="success">+{challenge.challenges.points_reward} pts</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {challenge.proof_text && (
                        <p className="text-sm text-muted-foreground mb-2">{challenge.proof_text}</p>
                      )}
                      
                      {challenge.proof_image_url && (
                        <div className="mt-2">
                          <img
                            src={challenge.proof_image_url}
                            alt="Challenge proof"
                            className="rounded-lg max-h-48 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed challenges yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Your Badges ({badges.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg"
                    >
                      <div className="text-2xl">{badge.icon}</div>
                      <div>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        {badge.earned_at && (
                          <p className="text-xs text-success">
                            Earned {new Date(badge.earned_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete challenges to earn your first badge!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends" className="space-y-6">
          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Friend Requests ({friendRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.profiles.avatar_url || undefined} />
                          <AvatarFallback>
                            {request.profiles.display_name?.charAt(0) || request.profiles.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.profiles.display_name || request.profiles.username}</p>
                          <p className="text-sm text-muted-foreground">Level {request.profiles.level}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => acceptFriendRequest(request.id)}>
                        Accept
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Friends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search by username or display name..."
                  value={searchFriend}
                  onChange={(e) => setSearchFriend(e.target.value)}
                />
                <Button onClick={searchFriends}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.display_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.display_name || user.username}</p>
                          <p className="text-sm text-muted-foreground">Level {user.level} • {user.total_points} pts</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => sendFriendRequest(user.user_id)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
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
                Your Friends ({friends.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length > 0 ? (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friend.profiles.avatar_url || undefined} />
                          <AvatarFallback>
                            {friend.profiles.display_name?.charAt(0) || friend.profiles.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friend.profiles.display_name || friend.profiles.username}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Level {friend.profiles.level}</span>
                            <span>•</span>
                            <span>{friend.profiles.total_points} points</span>
                            {friend.profiles.level >= 10 && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No friends yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Search for users above to add friends!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}