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
import { useNavigate } from "react-router-dom";
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
  CheckCircle,
  Clock,
  Zap,
  Sparkles,
  Shield,
  Settings,
  LogOut
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
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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
        challenges!user_challenges_challenge_id_fkey (
          title,
          description,
          points_reward,
          challenge_categories!challenges_category_id_fkey (
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
      // Fetch friends where current user is user_id
      const { data: friendsAsUser, error: error1 } = await supabase
        .from('user_friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      // Fetch friends where current user is friend_id
      const { data: friendsAsFriend, error: error2 } = await supabase
        .from('user_friends')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'accepted');

      if (error1 || error2) {
        console.error('Error fetching friends:', error1 || error2);
        return;
      }

      const allFriendships = [...(friendsAsUser || []), ...(friendsAsFriend || [])];

      if (allFriendships.length > 0) {
        // Extract friend IDs from both directions
        const friendIds = allFriendships.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', friendIds);

        const friendsWithProfiles = allFriendships.map(friend => ({
          ...friend,
          profiles: profilesData?.find(p => 
            p.user_id === (friend.user_id === user.id ? friend.friend_id : friend.user_id)
          ) || null
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
      // Check if friend request already exists in either direction
      const { data: existingRequest } = await supabase
        .from('user_friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

      if (existingRequest && existingRequest.length > 0) {
        const request = existingRequest[0];
        if (request.status === 'accepted') {
          toast({
            title: "Already friends",
            description: "You are already friends with this user",
          });
        } else if (request.status === 'pending') {
          toast({
            title: "Request pending",
            description: "A friend request is already pending",
          });
        }
        return;
      }

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

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 animate-pulse">
        <div className="h-24 w-24 bg-muted rounded-full mx-auto"></div>
        <div className="h-6 bg-muted rounded w-32 mx-auto"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto md:max-w-none">
      {/* Mobile-first Profile Header */}
      <div className="p-4 md:p-6 space-y-4">
        {/* Profile Photo - Centered on Mobile */}
        <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 md:h-24 md:w-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl md:text-2xl">
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
              size="icon"
              variant="outline"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full p-0 md:h-8 md:w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <Camera className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-xl md:text-2xl font-bold">
              {profile?.display_name || profile?.username}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile?.username}</p>
            
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full md:w-auto">
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

            {profile?.bio && (
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            )}

            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats - 3 Columns (Instagram/Strava style) */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Challenges</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">{profile?.total_points || 0}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">{friends.length}</div>
            <div className="text-xs text-muted-foreground">Friends</div>
          </div>
        </div>

        {/* Action Buttons - Previously in burger menu */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/validation')}
            className="flex items-center gap-2 h-10"
          >
            <Shield className="h-4 w-4" />
            <span className="text-xs">Validation</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 h-10"
          >
            <Crown className="h-4 w-4" />
            <span className="text-xs">Premium</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 h-10"
          >
            <Settings className="h-4 w-4" />
            <span className="text-xs">Settings</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="flex items-center gap-2 h-10 text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs">Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Tabs - Mobile optimized */}
      <Tabs defaultValue="completed" className="px-4 md:px-6 pb-4">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="completed" className="text-xs md:text-sm">Completed</TabsTrigger>
          <TabsTrigger value="badges" className="text-xs md:text-sm">Badges</TabsTrigger>
          <TabsTrigger value="friends" className="text-xs md:text-sm">Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="space-y-4">
          {completedChallenges.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <Trophy className="h-20 w-20 text-muted-foreground mx-auto opacity-30" />
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-6 w-6 text-yellow-500 opacity-60" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">No completed challenges yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Start your journey by completing your first challenge and watch your achievements grow!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedChallenges.map((challenge) => (
                <Card key={challenge.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 overflow-hidden">
                  {/* Challenge Image */}
                  {challenge.proof_image_url && (
                    <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                      <img 
                        src={challenge.proof_image_url} 
                        alt="Challenge proof" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-5">
                    {/* Header with icon and category */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                          {challenge.challenges.challenge_categories?.icon || '🎯'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base leading-tight mb-1 line-clamp-2">
                            {challenge.challenges.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-primary/10 text-primary border-primary/20"
                            >
                              {challenge.challenges.challenge_categories?.name || 'General'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Points badge */}
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="default" className="text-xs font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          +{challenge.challenges.points_reward} pts
                        </Badge>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="font-medium text-green-600">100%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full w-full flex items-center justify-end pr-1">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Completion date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      <span>Completed on {new Date(challenge.completed_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                    </div>

                    {/* Proof text */}
                    {challenge.proof_text && (
                      <div className="bg-muted/30 rounded-lg p-3 mb-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          "{challenge.proof_text}"
                        </p>
                      </div>
                    )}

                    {/* Challenge description */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {challenge.challenges.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {badges.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No badges earned yet
                </p>
              </div>
            ) : (
              badges.map((badge) => (
                <Card key={badge.id} className="text-center p-3">
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <h3 className="font-bold text-xs">{badge.name}</h3>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          {/* Search Friends */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchFriends()}
                  className="text-sm"
                />
                <Button onClick={searchFriends} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={result.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {result.display_name?.charAt(0) || result.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{result.display_name || result.username}</p>
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
            </CardContent>
          </Card>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold px-1">Friend Requests</h3>
              {friendRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {request.profiles?.display_name?.charAt(0) || request.profiles?.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Friends List */}
          <div className="space-y-2">
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No friends yet
                </p>
              </div>
            ) : (
              friends.map((friend) => (
                <Card key={friend.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {friend.profiles?.display_name?.charAt(0) || friend.profiles?.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {friend.profiles?.display_name || friend.profiles?.username}
                        </p>
                        <p className="text-xs text-muted-foreground">@{friend.profiles?.username}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Lv. {friend.profiles?.level || 1}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}