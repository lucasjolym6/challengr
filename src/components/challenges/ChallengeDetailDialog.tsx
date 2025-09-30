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
      // Update user challenge with proof and mark as completed
      const { error: challengeError } = await supabase
        .from('user_challenges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          proof_text: submissionText,
          proof_image_url: submissionImage ? 'placeholder-url' : null // Handle image upload separately
        })
        .eq('id', userChallenge.id);

      if (challengeError) throw challengeError;

      // Create a post for the community feed
      const { error: postError } = await supabase.from('posts').insert([{
        user_id: user.id,
        user_challenge_id: userChallenge.id,
        content: submissionText,
        hashtags: [`#${challenge.challenge_categories?.name?.toLowerCase()}`]
      }]);

      if (postError) throw postError;

      onStatusUpdate();
      onClose();
      toast({
        title: "Challenge Completed!",
        description: `Congratulations! You earned ${challenge.points_reward} points`,
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
          {status === 'to_do' && (
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

          {status === 'in_progress' && (
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
                {isSubmitting ? "Submitting..." : "Submit & Complete Challenge"}
              </Button>
            </div>
          )}

          {status === 'completed' && (
            <div className="text-center p-6 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-success mb-2">Challenge Completed!</h3>
              <p className="text-muted-foreground">
                You've successfully completed this challenge and earned {challenge.points_reward} points.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeDetailDialog;