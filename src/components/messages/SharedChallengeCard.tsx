import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

interface SharedChallengeCardProps {
  challenge: Challenge;
}

export const SharedChallengeCard: React.FC<SharedChallengeCardProps> = ({ challenge }) => {
  const navigate = useNavigate();

  const handleStartChallenge = () => {
    navigate('/challenges', { state: { selectedChallenge: challenge } });
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-muted">
      <CardContent className="p-0">
        {challenge.image_url && (
          <div className="relative h-32 overflow-hidden">
            <img
              src={challenge.image_url}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <Badge className="absolute top-2 right-2" variant="secondary">
              {challenge.challenge_categories.icon} {challenge.challenge_categories.name}
            </Badge>
          </div>
        )}
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-semibold mb-1">{challenge.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {challenge.description}
            </p>
          </div>
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
