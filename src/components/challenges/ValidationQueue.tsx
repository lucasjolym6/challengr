import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmissionValidationCard } from "./SubmissionValidationCard";
import { PostVerificationCard } from "./PostVerificationCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react";

interface Submission {
  id: string;
  proof_text?: string;
  proof_image_url?: string;
  proof_video_url?: string;
  created_at: string;
  validated_at?: string;
  status: string;
  rejection_reason?: string;
  validator_comment?: string;
  user_id: string;
  challenge_id: string;
  challenges: {
    title: string;
    description?: string;
    points_reward?: number;
  };
  profiles: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  verified: boolean;
  user_challenge_id: string | null;
  hashtags: string[] | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  user_challenges?: {
    challenges: {
      title: string;
      challenge_categories: {
        name: string;
        icon: string;
      } | null;
    };
  } | null;
}

export function ValidationQueue() {
  const { toast } = useToast();
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [myValidations, setMyValidations] = useState<Submission[]>([]);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [validationCapabilities, setValidationCapabilities] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchSubmissions();
    }
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchSubmissions = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      // Fetch pending submissions for challenges I created
      const { data: myChallenges } = await supabase
        .from('challenges')
        .select('id')
        .eq('created_by', currentUserId);

      const myChallengeIds = myChallenges?.map(c => c.id) || [];

      // Fetch pending submissions that need validation
      const { data: pendingData, error: pendingError } = await supabase
        .from('submissions')
        .select(`
          id,
          proof_text,
          proof_image_url,
          proof_video_url,
          created_at,
          status,
          rejection_reason,
          validator_comment,
          user_id,
          challenge_id
        `)
        .eq('status', 'pending')
        .in('challenge_id', myChallengeIds.length > 0 ? myChallengeIds : ['00000000-0000-0000-0000-000000000000'])
        .order('created_at', { ascending: true });

      if (pendingError) throw pendingError;

      // Fetch related data for pending submissions
      const pending = await Promise.all((pendingData || []).map(async (sub) => {
        const [challengeRes, profileRes] = await Promise.all([
          supabase.from('challenges').select('title, description, points_reward').eq('id', sub.challenge_id).single(),
          supabase.from('profiles').select('username, display_name, avatar_url').eq('user_id', sub.user_id).single()
        ]);
        
        return {
          ...sub,
          challenges: challengeRes.data || { title: '', description: '', points_reward: 0 },
          profiles: profileRes.data || { username: '', display_name: '', avatar_url: '' }
        };
      }));

      // Fetch submissions I've validated
      const { data: myValidatedData, error: validatedError } = await supabase
        .from('submissions')
        .select(`
          id,
          proof_text,
          proof_image_url,
          proof_video_url,
          created_at,
          validated_at,
          status,
          rejection_reason,
          validator_comment,
          user_id,
          challenge_id
        `)
        .eq('validator_id', currentUserId)
        .in('status', ['approved', 'rejected'])
        .order('validated_at', { ascending: false });

      if (validatedError) throw validatedError;

      // Fetch related data for validated submissions
      const myValidated = await Promise.all((myValidatedData || []).map(async (sub) => {
        const [challengeRes, profileRes] = await Promise.all([
          supabase.from('challenges').select('title, description, points_reward').eq('id', sub.challenge_id).single(),
          supabase.from('profiles').select('username, display_name, avatar_url').eq('user_id', sub.user_id).single()
        ]);
        
        return {
          ...sub,
          challenges: challengeRes.data || { title: '', description: '', points_reward: 0 },
          profiles: profileRes.data || { username: '', display_name: '', avatar_url: '' }
        };
      }));

      // All submissions from my challenges can be validated by me
      const capabilities: Record<string, boolean> = {};
      if (pending) {
        for (const submission of pending) {
          capabilities[submission.id] = true; // Challenge creator can always validate
        }
      }

      setPendingSubmissions(pending);
      setMyValidations(myValidated);
      setValidationCapabilities(capabilities);

      // Fetch all unverified posts - we'll filter by challenge ownership client-side
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, content, image_url, created_at, user_id, user_challenge_id, hashtags, verified')
        .eq('verified', false)
        .order('created_at', { ascending: true });

      if (postsError) throw postsError;

      const posts = postsData || [];
      console.log('Fetched unverified posts:', posts.length);

      if (posts.length === 0) {
        setPendingPosts([]);
        return;
      }

      // Collect all unique user_challenge_ids
      const ucIds = Array.from(new Set(posts.map(p => p.user_challenge_id).filter(Boolean))) as string[];
      const userIds = Array.from(new Set(posts.map(p => p.user_id)));

      console.log('User challenge IDs from posts:', ucIds);

      if (ucIds.length === 0) {
        console.log('No user_challenge_ids found in posts');
        setPendingPosts([]);
        return;
      }

      // Fetch user_challenges to get challenge_ids
      const { data: ucData, error: ucError } = await supabase
        .from('user_challenges')
        .select('id, challenge_id')
        .in('id', ucIds);

      if (ucError) {
        console.error('Error fetching user_challenges:', ucError);
        throw ucError;
      }

      console.log('User challenges data:', ucData);

      const ucById = new Map(ucData.map(uc => [uc.id, uc.challenge_id]));
      const challengeIds = Array.from(new Set(ucData.map(uc => uc.challenge_id)));

      console.log('Challenge IDs:', challengeIds);

      if (challengeIds.length === 0) {
        setPendingPosts([]);
        return;
      }

      // Fetch challenges to check ownership
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('id, title, created_by, category_id')
        .in('id', challengeIds);

      if (challengesError) {
        console.error('Error fetching challenges:', challengesError);
        throw challengesError;
      }

      console.log('Challenges data:', challengesData);
      console.log('Current user ID:', currentUserId);

      // Create lookup maps
      const challengeById = new Map(challengesData.map(c => [c.id, c]));

      // Filter posts where the challenge was created by current user AND submitter is NOT the current user
      const postChallengeIds = new Set(
        challengesData
          .filter(c => c.created_by === currentUserId)
          .map(c => c.id)
      );

      console.log('My challenge IDs:', Array.from(postChallengeIds));

      // Fetch profiles for post authors
      const { data: profilesData } = userIds.length > 0
        ? await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url')
            .in('user_id', userIds)
        : { data: [] };

      const profileByUser = new Map((profilesData || []).map(p => [p.user_id, p]));

      // Filter and map posts
      const myPosts = posts
        .filter(p => {
          if (!p.user_challenge_id) {
            console.log('Post has no user_challenge_id:', p.id);
            return false;
          }
          
          const challengeId = ucById.get(p.user_challenge_id);
          if (!challengeId) {
            console.log('No challenge_id found for user_challenge:', p.user_challenge_id);
            return false;
          }

          const isMyChallenge = postChallengeIds.has(challengeId);
          const isNotMyPost = p.user_id !== currentUserId;
          
          console.log(`Post ${p.id}: challenge=${challengeId}, isMyChallenge=${isMyChallenge}, isNotMyPost=${isNotMyPost}`);
          
          return isMyChallenge && isNotMyPost;
        })
        .map(p => {
          const profile = profileByUser.get(p.user_id);
          const challengeId = ucById.get(p.user_challenge_id!);
          const ch = challengeId ? challengeById.get(challengeId) : undefined;
          
          return {
            ...p,
            profiles: profile || { username: 'Unknown', display_name: 'Unknown User', avatar_url: null },
            user_challenges: ch
              ? { challenges: { title: ch.title, challenge_categories: null } }
              : null
          } as Post;
        });

      console.log('Filtered posts for validation:', myPosts.length);
      setPendingPosts(myPosts);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load validation queue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidationComplete = () => {
    fetchSubmissions();
  };

  if (!currentUserId) {
    return <div>Please log in to access the validation queue.</div>;
  }

  const pendingCount = pendingSubmissions.filter(s => 
    validationCapabilities[s.id]
  ).length;

  const totalPending = pendingCount + pendingPosts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Validation Queue</h2>
          <p className="text-muted-foreground">
            Review and validate challenge submissions and posts from the community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <Badge variant={totalPending > 0 ? "default" : "secondary"}>
            {totalPending} pending
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Submissions ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Posts ({pendingPosts.length})
          </TabsTrigger>
          <TabsTrigger value="my-validations" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            My Validations ({myValidations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading submissions...</div>
          ) : pendingSubmissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  There are no pending submissions that you can validate right now.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => {
                const canValidate = validationCapabilities[submission.id];
                
                if (!canValidate) {
                  return (
                    <Card key={submission.id} className="opacity-50">
                      <CardContent className="flex items-center justify-between py-4">
                        <div>
                          <h4 className="font-medium">{submission.challenges.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            by {submission.profiles.display_name || submission.profiles.username}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-muted-foreground">
                            Cannot validate (need to complete this challenge first)
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <SubmissionValidationCard
                    key={submission.id}
                    submission={submission}
                    currentUserId={currentUserId}
                    canValidate={canValidate}
                    onValidationComplete={handleValidationComplete}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : pendingPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">All posts verified!</h3>
                <p className="text-muted-foreground">
                  There are no pending posts to verify right now.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <PostVerificationCard
                  key={post.id}
                  post={post}
                  onVerificationComplete={handleValidationComplete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-validations" className="space-y-4">
          {myValidations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">No validations yet</h3>
                <p className="text-muted-foreground">
                  Start validating submissions to help the community and earn validator points!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myValidations.map((submission) => (
                <SubmissionValidationCard
                  key={submission.id}
                  submission={submission}
                  currentUserId={currentUserId}
                  canValidate={false} // Already validated
                  onValidationComplete={handleValidationComplete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}