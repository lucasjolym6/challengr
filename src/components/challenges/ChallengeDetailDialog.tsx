import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Play, Users, CheckCircle, Clock, Trophy, Target, XCircle } from "lucide-react";

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
}

interface Submission {
  id: string;
  challenge_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  proof_text?: string;
  proof_image_url?: string;
  proof_video_url?: string;
  validator_id?: string;
  validator_comment?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  validated_at?: string;
}

interface ChallengeDetailDialogProps {
  challenge: Challenge | null;
  userChallenge: UserChallenge | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

const ChallengeDetailDialog: React.FC<ChallengeDetailDialogProps> = ({
  challenge,
  userChallenge,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissionText, setSubmissionText] = useState('');
  const [submissionImage, setSubmissionImage] = useState<File | null>(null);
  const [submissionVideo, setSubmissionVideo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canValidate, setCanValidate] = useState(false);
  const [pendingValidations, setPendingValidations] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    if (user && challenge && isOpen) {
      checkCanValidate();
      fetchPendingValidations();
      fetchUserSubmission();
    }
  }, [user, challenge, isOpen]);

  const fetchUserSubmission = async () => {
    if (!user || !challenge) return;
    
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      setUserSubmission(data as Submission | null);
    } catch (error) {
      console.error('Error fetching user submission:', error);
      setUserSubmission(null);
    }
  };

  const checkCanValidate = async () => {
    if (!user || !challenge) return;
    
    try {
      // For now, just check if user is challenge creator or has approved submissions
      const { data: creatorCheck } = await supabase
        .from('challenges')
        .select('created_by')
        .eq('id', challenge.id)
        .eq('created_by', user.id)
        .single();
      
      if (creatorCheck) {
        setCanValidate(true);
        return;
      }

      const { data: approvedSubmissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .eq('status', 'approved');
      
      setCanValidate(approvedSubmissions && approvedSubmissions.length > 0);
    } catch (error) {
      console.error('Error checking validation capability:', error);
      setCanValidate(false);
    }
  };

  const fetchPendingValidations = async () => {
    if (!user || !challenge) return;
    
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          ),
          challenges (
            title,
            description,
            points_reward
          )
        `)
        .eq('challenge_id', challenge.id)
        .eq('status', 'pending')
        .neq('user_id', user.id);
      
      if (error) throw error;
      setPendingValidations(data as Submission[] || []);
    } catch (error) {
      console.error('Error fetching pending validations:', error);
      setPendingValidations([]);
    }
  };

  if (!challenge) return null;

  const status = userChallenge?.status || 'to_do';
  
  // Determine the actual display status based on submission state
  const getDisplayStatus = () => {
    if (!userChallenge) return 'to_do';
    if (!userSubmission) return status; // No submission yet, use challenge status
    
    // Use submission status to determine display
    switch (userSubmission.status) {
      case 'pending':
        return 'pending_validation';
      case 'approved':
        return 'completed';
      case 'rejected':
        return 'rejected';
      default:
        return status;
    }
  };
  
  const displayStatus = getDisplayStatus();

  const startChallenge = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('user_challenges').insert([{
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'in_progress',
        started_at: new Date().toISOString()
      }]);

      if (error) throw error;

      onStatusUpdate();
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

  const submitProof = async () => {
    if (!user || !userChallenge) return;
    
    setIsSubmitting(true);
    try {
      let proofImageUrl = null;
      let proofVideoUrl = null;

      // Upload proof image if provided
      if (submissionImage) {
        const imageFileName = `${user.id}/${challenge.id}/${Date.now()}-${submissionImage.name}`;
        const { data: imageData, error: imageError } = await supabase.storage
          .from('user-uploads')
          .upload(imageFileName, submissionImage);

        if (imageError) throw imageError;
        
        const { data: imageUrlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(imageFileName);
        
        proofImageUrl = imageUrlData.publicUrl;
      }

      // Upload proof video if provided
      if (submissionVideo) {
        const videoFileName = `${user.id}/${challenge.id}/${Date.now()}-${submissionVideo.name}`;
        const { data: videoData, error: videoError } = await supabase.storage
          .from('user-uploads')
          .upload(videoFileName, submissionVideo);

        if (videoError) throw videoError;
        
        const { data: videoUrlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(videoFileName);
        
        proofVideoUrl = videoUrlData.publicUrl;
      }

      // Create submission record
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          status: 'pending',
          proof_text: submissionText,
          proof_image_url: proofImageUrl,
          proof_video_url: proofVideoUrl
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Create a post for the community feed
      const { error: postError } = await supabase.from('posts').insert([{
        user_id: user.id,
        user_challenge_id: userChallenge.id,
        content: submissionText,
        hashtags: [`#${challenge.challenge_categories?.name?.toLowerCase()}`],
        image_url: proofImageUrl
      }]);

      if (postError) throw postError;

      // Notify challenge creator about new submission
      if (challenge.created_by) {
        const { error: notificationError } = await supabase
          .from('validator_notifications')
          .insert([{
            submission_id: submissionData.id,
            validator_id: challenge.created_by,
            type: 'new_submission',
            user_challenge_id: userChallenge.id // Still needed for backward compatibility
          }]);

        if (notificationError) console.warn('Failed to create validator notification:', notificationError);
      }

      // Also notify other eligible validators (users who have approved submissions for this challenge)
      const { data: eligibleValidators, error: validatorsError } = await supabase
        .from('submissions')
        .select('user_id')
        .eq('challenge_id', challenge.id)
        .eq('status', 'approved')
        .neq('user_id', user.id);

      if (!validatorsError && eligibleValidators) {
        for (const validator of eligibleValidators) {
          await supabase
            .from('validator_notifications')
            .insert([{
              submission_id: submissionData.id,
              validator_id: validator.user_id,
              type: 'new_submission',
              user_challenge_id: userChallenge.id
            }]);
        }
      }

      // Update the user submission state
      setUserSubmission(submissionData as Submission);

      onStatusUpdate();
      toast({
        title: "Submission Sent!",
        description: "Your submission has been sent to the challenge creator for review. You'll be notified once it's validated.",
      });
      // Don't close the dialog - user stays to see their submission status
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast({
        title: "Error",
        description: "Failed to submit proof",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">
              {challenge.challenge_categories?.icon || '🎯'}
            </div>
            <div>
              <DialogTitle className="text-2xl">{challenge.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getCategoryVariant(challenge.challenge_categories?.name || '')}>
                  {challenge.challenge_categories?.name}
                </Badge>
                {challenge.is_custom && (
                  <Badge variant="outline">Custom</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Challenge Description
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {challenge.description}
            </p>
          </div>

          {/* Challenge Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-semibold">{challenge.points_reward}</span>
              </div>
              <p className="text-sm text-muted-foreground">Points</p>
            </div>
            <div className="text-center p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-semibold">{challenge.difficulty_level}/5</span>
              </div>
              <p className="text-sm text-muted-foreground">Difficulty</p>
            </div>
            <div className="text-center p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-semibold">No Limit</span>
              </div>
              <p className="text-sm text-muted-foreground">Time</p>
            </div>
          </div>

          {/* Challenge Rules */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Rules & Requirements</h3>
            <div className="space-y-2 text-sm">
              <p>• Complete the challenge as described</p>
              <p>• Submit proof of completion (photo, video, or text)</p>
              <p>• Be honest and authentic in your submission</p>
              <p>• Share your experience with the community</p>
            </div>
          </div>

          {/* Actions based on status */}
          {displayStatus === 'to_do' && (
            <div className="flex gap-3">
              <Button onClick={startChallenge} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Start Solo
              </Button>
              <Button variant="outline" className="flex-1">
                <Users className="w-4 h-4 mr-2" />
                Find Partner
              </Button>
            </div>
          )}

          {displayStatus === 'in_progress' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Submit Proof of Completion
              </h3>
              
              <div>
                <Label htmlFor="proof-text">Describe your experience</Label>
                <Textarea
                  id="proof-text"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Tell us about how you completed this challenge..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="proof-image">Upload photo/video (optional)</Label>
                <Input
                  id="proof-image"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setSubmissionImage(e.target.files?.[0] || null)}
                  className="mt-2"
                />
              </div>

              <Button 
                onClick={submitProof} 
                className="w-full"
                disabled={!submissionText || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit for Validation"}
              </Button>
            </div>
          )}

          {displayStatus === 'pending_validation' && (
            <div className="text-center p-6 bg-orange-50 rounded-lg border border-orange-200">
              <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-orange-700 mb-2">Submission Pending Validation</h3>
              <p className="text-muted-foreground mb-4">
                Your submission has been received and is awaiting validation by the challenge creator or qualified validators.
              </p>
              {userSubmission?.proof_text && (
                <div className="text-left bg-white p-3 rounded-lg mb-4">
                  <h4 className="font-medium mb-2">Your Submission:</h4>
                  <p className="text-sm text-muted-foreground">{userSubmission.proof_text}</p>
                </div>
              )}
            </div>
          )}

          {displayStatus === 'rejected' && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Submission Rejected</h3>
                <p className="text-muted-foreground mb-2">
                  Your submission was not approved. You can try again with improvements.
                </p>
                {userSubmission?.rejection_reason && (
                  <div className="text-left bg-white p-3 rounded-lg mb-4">
                    <h4 className="font-medium text-red-700 mb-2">Rejection Reason:</h4>
                    <p className="text-sm text-red-600 mb-2">{userSubmission.rejection_reason}</p>
                    {userSubmission.validator_comment && (
                      <p className="text-sm text-muted-foreground italic">{userSubmission.validator_comment}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Try Again - Submit New Proof
                </h3>
                
                <div>
                  <Label htmlFor="retry-proof-text">Describe your experience</Label>
                  <Textarea
                    id="retry-proof-text"
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Tell us about how you completed this challenge..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="retry-proof-image">Upload photo/video (optional)</Label>
                  <Input
                    id="retry-proof-image"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setSubmissionImage(e.target.files?.[0] || null)}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={submitProof} 
                  className="w-full"
                  disabled={!submissionText || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Resubmit for Validation"}
                </Button>
              </div>
            </div>
          )}

          {displayStatus === 'completed' && (
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">Challenge Completed!</h3>
              <p className="text-muted-foreground">
                Your submission was approved! You've earned {challenge.points_reward} points.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeDetailDialog;