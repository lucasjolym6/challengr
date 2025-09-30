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
import { Play, Users, CheckCircle, Clock, Trophy, Target } from "lucide-react";

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
  validation_status?: string;
  proof_text?: string;
  proof_image_url?: string;
  proof_video_url?: string;
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
  const [pendingValidations, setPendingValidations] = useState<UserChallenge[]>([]);

  useEffect(() => {
    if (user && challenge && isOpen) {
      checkCanValidate();
      fetchPendingValidations();
    }
  }, [user, challenge, isOpen]);

  const checkCanValidate = async () => {
    if (!user || !challenge) return;
    
    try {
      const { data, error } = await supabase.rpc('can_validate_challenge', {
        validator_user_id: user.id,
        challenge_id_param: challenge.id,
        submission_user_id: 'dummy-user-id' // We'll check this for each individual submission
      });
      
      if (error) throw error;
      setCanValidate(data || false);
    } catch (error) {
      console.error('Error checking validation capability:', error);
      setCanValidate(false);
    }
  };

  const fetchPendingValidations = async () => {
    if (!user || !challenge) return;
    
    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('challenge_id', challenge.id)
        .eq('validation_status', 'pending')
        .neq('user_id', user.id);
      
      if (error) throw error;
      setPendingValidations(data || []);
    } catch (error) {
      console.error('Error fetching pending validations:', error);
      setPendingValidations([]);
    }
  };

  if (!challenge) return null;

  const status = userChallenge?.status || 'to_do';
  const validationStatus = userChallenge?.validation_status;
  
  // Determine the actual display status
  const getDisplayStatus = () => {
    if (!userChallenge) return 'to_do';
    if (status === 'completed' && validationStatus === 'approved') return 'completed';
    if (status === 'in_progress' && validationStatus === 'pending') return 'pending_validation';
    if (validationStatus === 'rejected') return 'rejected';
    return status;
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
        const imageFileName = `${user.id}/${userChallenge.id}/${Date.now()}-${submissionImage.name}`;
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
        const videoFileName = `${user.id}/${userChallenge.id}/${Date.now()}-${submissionVideo.name}`;
        const { data: videoData, error: videoError } = await supabase.storage
          .from('user-uploads')
          .upload(videoFileName, submissionVideo);

        if (videoError) throw videoError;
        
        const { data: videoUrlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(videoFileName);
        
        proofVideoUrl = videoUrlData.publicUrl;
      }

      // Update user challenge with proof but keep status as in_progress, set validation_status to pending
      const { error: challengeError } = await supabase
        .from('user_challenges')
        .update({
          completed_at: new Date().toISOString(),
          proof_text: submissionText,
          proof_image_url: proofImageUrl,
          proof_video_url: proofVideoUrl,
          validation_status: 'pending'
          // Note: status remains 'in_progress' until validation is approved
        })
        .eq('id', userChallenge.id);

      if (challengeError) throw challengeError;

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
            user_challenge_id: userChallenge.id,
            validator_id: challenge.created_by,
            type: 'new_submission'
          }]);

        if (notificationError) console.warn('Failed to create validator notification:', notificationError);
      }

      // Also notify other eligible validators (users who have completed this challenge)
      const { data: eligibleValidators, error: validatorsError } = await supabase
        .from('user_challenges')
        .select('user_id')
        .eq('challenge_id', challenge.id)
        .eq('status', 'completed')
        .eq('validation_status', 'approved')
        .neq('user_id', user.id); // Exclude current user

      if (!validatorsError && eligibleValidators) {
        for (const validator of eligibleValidators) {
          await supabase
            .from('validator_notifications')
            .insert([{
              user_challenge_id: userChallenge.id,
              validator_id: validator.user_id,
              type: 'new_submission'
            }]);
        }
      }

      onStatusUpdate();
      onClose();
      toast({
        title: "Submission Pending Validation",
        description: "Your proof has been submitted and is awaiting validation by the challenge creator or qualified validators.",
      });
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
              {userChallenge?.proof_text && (
                <div className="text-left bg-white p-3 rounded-lg mb-4">
                  <h4 className="font-medium mb-2">Your Submission:</h4>
                  <p className="text-sm text-muted-foreground">{userChallenge.proof_text}</p>
                </div>
              )}
            </div>
          )}

          {displayStatus === 'rejected' && (
            <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
              <CheckCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Submission Rejected</h3>
              <p className="text-muted-foreground mb-4">
                Your submission was not approved. You can resubmit with improvements.
              </p>
              <Button 
                onClick={() => {
                  // Reset to in_progress state to allow resubmission
                  // This would need backend support
                }}
                variant="outline"
              >
                Try Again
              </Button>
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