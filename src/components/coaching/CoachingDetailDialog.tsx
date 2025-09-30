import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UpgradePremiumButton } from '@/components/premium/UpgradePremiumButton';

interface CoachingContent {
  id: string;
  title: string;
  description: string;
  full_content?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  is_premium: boolean;
  difficulty_level: number;
  category_id?: string;
  related_challenge_ids?: string[];
}

interface CoachingDetailDialogProps {
  content: CoachingContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userIsPremium: boolean;
  categoryName?: string;
}

export const CoachingDetailDialog: React.FC<CoachingDetailDialogProps> = ({
  content,
  open,
  onOpenChange,
  userIsPremium,
  categoryName,
}) => {
  const navigate = useNavigate();
  const difficultyLabels = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];

  if (!content) return null;

  const isLocked = content.is_premium && !userIsPremium;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>{content.title}</span>
            {isLocked && <Lock className="w-5 h-5 text-muted-foreground" />}
          </DialogTitle>
          <div className="flex gap-2 flex-wrap pt-2">
            {categoryName && (
              <Badge variant="secondary">{categoryName}</Badge>
            )}
            <Badge variant="outline">
              {difficultyLabels[content.difficulty_level - 1] || 'Unknown'}
            </Badge>
          </div>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Section */}
          {content.media_url && (
            <div className="relative rounded-lg overflow-hidden">
              {isLocked ? (
                <div className="relative h-64 bg-muted flex items-center justify-center">
                  <div className="text-center space-y-4 p-6">
                    <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Premium Content Locked</h3>
                      <p className="text-muted-foreground mb-4">
                        Upgrade to Premium to unlock full tutorials and coaching content
                      </p>
                      <UpgradePremiumButton size="lg" />
                    </div>
                  </div>
                </div>
              ) : content.media_type === 'video' ? (
                <video 
                  src={content.media_url} 
                  controls
                  className="w-full rounded-lg"
                />
              ) : (
                <img 
                  src={content.media_url} 
                  alt={content.title}
                  className="w-full rounded-lg"
                />
              )}
            </div>
          )}

          {/* Full Content */}
          {isLocked ? (
            <div className="p-6 border rounded-lg bg-muted/50 text-center space-y-3">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Full tutorial content is only available for Premium members
              </p>
              <UpgradePremiumButton size="lg" />
            </div>
          ) : (
            content.full_content && (
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{content.full_content}</div>
              </div>
            )
          )}

          {/* Related Challenges */}
          {!isLocked && content.related_challenge_ids && content.related_challenge_ids.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Related Challenges
              </h3>
              <Button 
                variant="outline" 
                onClick={() => navigate('/challenges')}
              >
                View Challenges
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
