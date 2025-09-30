import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, AlertCircle, Clock, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ValidationCardProps {
  userChallenge: {
    id: string;
    proof_text?: string;
    proof_image_url?: string;
    completed_at?: string;
    validation_status: string;
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
  };
  currentUserId: string;
  canValidate: boolean;
  onValidationComplete: () => void;
}

const REJECTION_REASONS = [
  "No evidence provided",
  "Evidence doesn't match challenge requirements",
  "Poor quality submission",
  "Late submission (past deadline)",
  "Inappropriate content",
  "Duplicate submission",
  "Other"
];

export function ValidationCard({ 
  userChallenge, 
  currentUserId, 
  canValidate, 
  onValidationComplete 
}: ValidationCardProps) {
  const { toast } = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [comment, setComment] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const handleApprove = async () => {
    if (!canValidate) return;
    
    setIsApproving(true);
    try {
      // Update user challenge status
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({
          validation_status: 'approved',
          validated_by: currentUserId,
          validated_at: new Date().toISOString()
        })
        .eq('id', userChallenge.id);

      if (updateError) throw updateError;

      // Log the validation action
      const { error: auditError } = await supabase
        .from('validation_audit')
        .insert({
          user_challenge_id: userChallenge.id,
          validator_id: currentUserId,
          action: 'approved',
          comment: comment || null
        });

      if (auditError) throw auditError;

      // Award points to validator
      const { data: validatorConfig } = await supabase
        .from('admin_config')
        .select('value')
        .eq('key', 'points_for_validator')
        .single();

      const validatorPoints = validatorConfig?.value ? parseInt(validatorConfig.value as string) : 5;
      
      // Update validator points directly
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('user_id', currentUserId)
        .single();
      
      const currentPoints = currentProfile?.total_points || 0;
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ 
          total_points: currentPoints + validatorPoints
        })
        .eq('user_id', currentUserId);

      if (pointsError) console.warn('Failed to award validator points:', pointsError);

      toast({
        title: "Submission approved",
        description: `You've successfully approved this submission and earned ${validatorPoints} points.`,
      });

      setShowApproveDialog(false);
      onValidationComplete();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!canValidate || !rejectionReason) return;
    
    setIsRejecting(true);
    try {
      // Update user challenge status
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({
          validation_status: 'rejected',
          validated_by: currentUserId,
          validated_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          validator_comment: comment || null
        })
        .eq('id', userChallenge.id);

      if (updateError) throw updateError;

      // Log the validation action
      const { error: auditError } = await supabase
        .from('validation_audit')
        .insert({
          user_challenge_id: userChallenge.id,
          validator_id: currentUserId,
          action: 'rejected',
          reason: rejectionReason,
          comment: comment || null
        });

      if (auditError) throw auditError;

      toast({
        title: "Submission rejected",
        description: "The submission has been rejected with feedback for the user.",
      });

      setShowRejectDialog(false);
      onValidationComplete();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;
    
    try {
      const { error } = await supabase
        .from('submission_reports')
        .insert({
          user_challenge_id: userChallenge.id,
          reporter_id: currentUserId,
          reason: reportReason,
          description: reportDescription || null
        });

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: "Thank you for reporting this submission. It will be reviewed by moderators.",
      });

      setShowReportDialog(false);
      setReportReason("");
      setReportDescription("");
    } catch (error) {
      console.error('Error reporting submission:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    switch (userChallenge.validation_status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pending Validation</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="w-3 h-3" />Approved ✅</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected ❌</Badge>;
      default:
        return <Badge variant="outline">Unknown Status</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={userChallenge.profiles.avatar_url || ""} />
              <AvatarFallback>
                {userChallenge.profiles.display_name?.[0] || userChallenge.profiles.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {userChallenge.profiles.display_name || userChallenge.profiles.username}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Challenge: {userChallenge.challenges.title}
              </p>
              <p className="text-xs text-muted-foreground">
                Submitted {userChallenge.completed_at ? formatDistanceToNow(new Date(userChallenge.completed_at), { addSuffix: true }) : 'recently'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Flag className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Submission</DialogTitle>
                  <DialogDescription>
                    Help us maintain quality by reporting inappropriate or problematic submissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={reportReason} onValueChange={setReportReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                      <SelectItem value="spam">Spam or fake submission</SelectItem>
                      <SelectItem value="fraud">Fraudulent evidence</SelectItem>
                      <SelectItem value="violation">Violates community guidelines</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Additional details (optional)"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleReport} disabled={!reportReason}>
                    Submit Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Proof Content */}
        {userChallenge.proof_image_url && (
          <div>
            <img 
              src={userChallenge.proof_image_url} 
              alt="Submission proof" 
              className="w-full max-w-md rounded-lg"
            />
          </div>
        )}
        
        {userChallenge.proof_text && (
          <div>
            <h4 className="text-sm font-medium mb-2">Description:</h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {userChallenge.proof_text}
            </p>
          </div>
        )}

        {/* Rejection feedback */}
        {userChallenge.validation_status === 'rejected' && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</h4>
            <p className="text-sm text-red-700">{userChallenge.rejection_reason}</p>
            {userChallenge.validator_comment && (
              <>
                <h4 className="text-sm font-medium text-red-800 mb-1 mt-2">Validator Comment:</h4>
                <p className="text-sm text-red-700">{userChallenge.validator_comment}</p>
              </>
            )}
          </div>
        )}

        {/* Validation Actions */}
        {canValidate && userChallenge.validation_status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t">
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Submission</DialogTitle>
                  <DialogDescription>
                    Approve this submission and award {userChallenge.challenges.points_reward || 10} points to the user?
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <Textarea
                    placeholder="Optional comment for the submitter"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApprove} disabled={isApproving}>
                    {isApproving ? "Approving..." : "Approve Submission"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Submission</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this submission.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={rejectionReason} onValueChange={setRejectionReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rejection reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {REJECTION_REASONS.map(reason => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Additional feedback for the submitter"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleReject} 
                    disabled={isRejecting || !rejectionReason}
                  >
                    {isRejecting ? "Rejecting..." : "Reject Submission"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}