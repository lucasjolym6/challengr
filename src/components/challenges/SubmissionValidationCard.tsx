import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, AlertTriangle, Video } from "lucide-react";

interface Submission {
  id: string;
  proof_text?: string;
  proof_image_url?: string;
  proof_video_url?: string;
  created_at: string;
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

interface SubmissionValidationCardProps {
  submission: Submission;
  currentUserId: string;
  canValidate: boolean;
  onValidationComplete: () => void;
}

const REJECTION_REASONS = [
  "Does not meet challenge requirements",
  "Insufficient proof provided",
  "Appears to be fake or staged",
  "Does not match challenge description",
  "Poor quality submission",
  "Other"
];

export function SubmissionValidationCard({
  submission,
  currentUserId,
  canValidate,
  onValidationComplete
}: SubmissionValidationCardProps) {
  const { toast } = useToast();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionComment, setRejectionComment] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [validatorComment, setValidatorComment] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    try {
      // Update submission status
      const { error: submissionError } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          validator_id: currentUserId,
          validator_comment: validatorComment,
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (submissionError) throw submissionError;

      // Award points to the submitter
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('user_id', submission.user_id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_points: (profile.total_points || 0) + (submission.challenges.points_reward || 10)
          })
          .eq('user_id', submission.user_id);
      }

      // Award validation points to the validator
      const { data: validatorProfile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('user_id', currentUserId)
        .single();

      if (validatorProfile) {
        await supabase
          .from('profiles')
          .update({
            total_points: (validatorProfile.total_points || 0) + 5 // Validator gets 5 points
          })
          .eq('user_id', currentUserId);
      }

      // Update user_challenges to mark as completed
      const { data: existingChallenge } = await supabase
        .from('user_challenges')
        .select('id')
        .eq('user_id', submission.user_id)
        .eq('challenge_id', submission.challenge_id)
        .maybeSingle();

      if (existingChallenge) {
        await supabase
          .from('user_challenges')
          .update({
            status: 'completed',
            validation_status: 'approved',
            completed_at: new Date().toISOString()
          })
          .eq('id', existingChallenge.id);
      }

      // Log validation action
      await supabase
        .from('validation_audit')
        .insert([{
          submission_id: submission.id,
          user_challenge_id: existingChallenge?.id || null,
          validator_id: currentUserId,
          action: 'approved',
          comment: validatorComment
        }]);

      setShowApproveDialog(false);
      onValidationComplete();
      toast({
        title: "Submission Approved",
        description: `${submission.profiles.display_name || submission.profiles.username} earned ${submission.challenges.points_reward} points!`,
      });
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve submission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast({
        title: "Rejection reason required",
        description: "Please select a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update submission status
      const { error: submissionError } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          validator_id: currentUserId,
          rejection_reason: rejectionReason,
          validator_comment: rejectionComment,
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (submissionError) throw submissionError;

      // Increment defeat counter
      const { data: existingDefeat } = await supabase
        .from('user_challenge_defeats')
        .select('*')
        .eq('user_id', submission.user_id)
        .eq('challenge_id', submission.challenge_id)
        .maybeSingle();

      if (existingDefeat) {
        await supabase
          .from('user_challenge_defeats')
          .update({
            defeats_count: existingDefeat.defeats_count + 1,
            last_defeated_at: new Date().toISOString()
          })
          .eq('id', existingDefeat.id);
      } else {
        await supabase
          .from('user_challenge_defeats')
          .insert([{
            user_id: submission.user_id,
            challenge_id: submission.challenge_id,
            defeats_count: 1,
            last_defeated_at: new Date().toISOString()
          }]);
      }

      // Increment total defeats in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_defeats')
        .eq('user_id', submission.user_id)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_defeats: (profile.total_defeats || 0) + 1
          })
          .eq('user_id', submission.user_id);
      }

      // Log validation action
      const { data: existingChallenge } = await supabase
        .from('user_challenges')
        .select('id')
        .eq('user_id', submission.user_id)
        .eq('challenge_id', submission.challenge_id)
        .maybeSingle();

      await supabase
        .from('validation_audit')
        .insert([{
          submission_id: submission.id,
          user_challenge_id: existingChallenge?.id || null,
          validator_id: currentUserId,
          action: 'rejected',
          reason: rejectionReason,
          comment: rejectionComment
        }]);

      setShowRejectDialog(false);
      onValidationComplete();
      toast({
        title: "Submission Rejected",
        description: "The submitter can try again with improvements",
      });
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason || !reportDescription) {
      toast({
        title: "Missing information",
        description: "Please provide both reason and description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: existingChallenge } = await supabase
        .from('user_challenges')
        .select('id')
        .eq('user_id', submission.user_id)
        .eq('challenge_id', submission.challenge_id)
        .maybeSingle();

      await supabase
        .from('submission_reports')
        .insert([{
          submission_id: submission.id,
          user_challenge_id: existingChallenge?.id || null,
          reporter_id: currentUserId,
          reason: reportReason,
          description: reportDescription
        }]);

      setShowReportDialog(false);
      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep the community safe",
      });
    } catch (error) {
      console.error('Error reporting submission:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (submission.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-orange-100 text-orange-700">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={submission.profiles.avatar_url || undefined} />
                <AvatarFallback>
                  {submission.profiles.display_name?.charAt(0) || submission.profiles.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{submission.profiles.display_name || submission.profiles.username}</p>
                <p className="text-sm text-muted-foreground">{submission.challenges.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Badge variant="secondary">{submission.challenges.points_reward} pts</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Submission Proof */}
          {submission.proof_text && (
            <div>
              <h4 className="font-medium mb-2">Submission Description:</h4>
              <p className="text-sm text-muted-foreground">{submission.proof_text}</p>
            </div>
          )}

          {submission.proof_image_url && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={submission.proof_image_url} 
                alt="Submission proof" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          {submission.proof_video_url && (
            <div className="rounded-lg overflow-hidden bg-secondary/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">Video Submission</span>
              </div>
              <a 
                href={submission.proof_video_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View Video
              </a>
            </div>
          )}

          {/* Validation Actions */}
          {canValidate && submission.status === 'pending' && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => setShowApproveDialog(true)}
                variant="default"
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          {/* Show rejection feedback if rejected */}
          {submission.status === 'rejected' && submission.rejection_reason && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-700 mb-2">Rejection Reason:</h4>
              <p className="text-sm text-red-600 mb-2">{submission.rejection_reason}</p>
              {submission.validator_comment && (
                <p className="text-sm text-muted-foreground italic">{submission.validator_comment}</p>
              )}
            </div>
          )}

          {/* Report button (visible to all users) */}
          <Button
            onClick={() => setShowReportDialog(true)}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Submission
          </Button>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
            <DialogDescription>
              This will award {submission.challenges.points_reward} points to {submission.profiles.display_name || submission.profiles.username}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-comment">Comment (optional)</Label>
              <Textarea
                id="approve-comment"
                value={validatorComment}
                onChange={(e) => setValidatorComment(e.target.value)}
                placeholder="Add a positive comment or feedback..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowApproveDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={loading} className="flex-1">
                {loading ? "Approving..." : "Approve Submission"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason so the user can improve their next attempt
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rejection-comment">Additional Comment</Label>
              <Textarea
                id="rejection-comment"
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Provide specific feedback to help them improve..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowRejectDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleReject} 
                disabled={loading || !rejectionReason} 
                variant="destructive"
                className="flex-1"
              >
                {loading ? "Rejecting..." : "Reject Submission"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Submission</DialogTitle>
            <DialogDescription>
              Help us maintain community standards by reporting inappropriate content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason">Reason *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="fake">Fake/Fraudulent</SelectItem>
                  <SelectItem value="offensive">Offensive</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="report-description">Description *</Label>
              <Textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide details about why you're reporting this submission..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowReportDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleReport} 
                disabled={loading || !reportReason || !reportDescription} 
                variant="destructive"
                className="flex-1"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
