import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmissionValidationCard } from "./SubmissionValidationCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle, Clock, AlertTriangle } from "lucide-react";

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

export function ValidationQueue() {
  const { toast } = useToast();
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [myValidations, setMyValidations] = useState<Submission[]>([]);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Validation Queue</h2>
          <p className="text-muted-foreground">
            Review and validate challenge submissions from the community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <Badge variant={pendingCount > 0 ? "default" : "secondary"}>
            {pendingCount} pending
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Validation ({pendingCount})
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