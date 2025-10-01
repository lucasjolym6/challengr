import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  image_url: string;
  challenge_categories: {
    name: string;
    icon: string;
  };
  profiles?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

interface SharedChallengeCardProps {
  challenge: Challenge;
}

export const SharedChallengeCard: React.FC<SharedChallengeCardProps> = ({ challenge }) => {
  const navigate = useNavigate();
  const creatorName = challenge.profiles?.display_name || challenge.profiles?.username || 'Unknown';
  const creatorInitials = creatorName.substring(0, 2).toUpperCase();

  const handleStartChallenge = () => {
    navigate('/challenges', { state: { selectedChallenge: challenge } });
  };

  return (
    <Card className="overflow-hidden hover-lift cursor-pointer" onClick={handleStartChallenge}>
      <CardContent className="p-0">
        {challenge.image_url && (
          <div className="relative h-40 overflow-hidden bg-muted">
            <img
              src={challenge.image_url}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}
        <div className="p-4 space-y-3">
          {/* Creator Info */}
          {challenge.profiles && (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={challenge.profiles.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-muted">{creatorInitials}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold">{creatorName}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {challenge.challenge_categories.name}
              </Badge>
            </div>
          )}
          
          {/* Title and Description */}
          <div>
            <h4 className="font-bold leading-tight mb-1">{challenge.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {challenge.description}
            </p>
          </div>
          
          {/* CTA Button */}
          <Button 
            onClick={handleStartChallenge}
            className="w-full"
            size="sm"
          >
            Start this Challenge
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
