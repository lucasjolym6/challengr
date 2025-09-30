import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';

interface CoachingCardProps {
  id: string;
  title: string;
  description: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isPremium: boolean;
  userIsPremium: boolean;
  categoryName?: string;
  difficultyLevel: number;
  onClick: () => void;
}

export const CoachingCard: React.FC<CoachingCardProps> = ({
  title,
  description,
  mediaUrl,
  mediaType,
  isPremium,
  userIsPremium,
  categoryName,
  difficultyLevel,
  onClick,
}) => {
  const isLocked = isPremium && !userIsPremium;
  const difficultyLabels = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden group"
      onClick={onClick}
    >
      {mediaUrl && (
        <div className="relative h-48 overflow-hidden">
          {mediaType === 'video' ? (
            <video 
              src={mediaUrl} 
              className="w-full h-full object-cover"
              poster={mediaUrl}
            />
          ) : (
            <img 
              src={mediaUrl} 
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
          {isLocked && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center space-y-2">
                <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Premium Content</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {isLocked && (
            <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {categoryName && (
            <Badge variant="secondary">{categoryName}</Badge>
          )}
          <Badge variant="outline">
            {difficultyLabels[difficultyLevel - 1] || 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground text-sm line-clamp-3">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
