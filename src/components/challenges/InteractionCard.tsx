import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Heart, MessageCircle, Flame, Sparkles } from "lucide-react";

export interface ChallengeInteraction {
  id: string;
  challenge_id: string;
  challenge_title: string;
  challenge_image: string | null;
  category_name: string;
  category_color: string | null;
  interaction_type: 'completion' | 'join' | 'complete' | 'milestone';
  participants_count: number;
  likes_count: number;
  comments_count: number;
  // Interaction-specific data
  completion?: {
    content: string;
    user_name: string;
    user_avatar: string | null;
    created_at: string;
    verified: boolean;
  };
  participant?: {
    user_name: string;
    user_avatar: string | null;
    action: 'joined' | 'completed';
    created_at: string;
  };
  milestone?: {
    message: string;
    count: number;
  };
}

interface InteractionCardProps {
  interaction: ChallengeInteraction;
  onClick: () => void;
}

const InteractionCard: React.FC<InteractionCardProps> = ({ interaction, onClick }) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  };

  return (
    <Card 
      className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border-0 relative flex flex-col cursor-pointer"
      onClick={onClick}
    >
      {/* Full-bleed Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {interaction.challenge_image ? (
          <img 
            src={interaction.challenge_image} 
            alt={interaction.challenge_title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Header */}
        <div className="flex-shrink-0 space-y-3">
          {/* Category */}
          <Badge 
            variant="secondary" 
            className="bg-white/25 text-white backdrop-blur-md border-white/40 font-semibold"
          >
            {interaction.category_name}
          </Badge>

          {/* Challenge Title */}
          <h2 className="text-3xl font-black text-white drop-shadow-2xl leading-tight">
            {interaction.challenge_title}
          </h2>

          {/* Stats Line */}
          <div className="flex items-center gap-4 text-white/95">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="text-sm font-bold">{interaction.participants_count}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-bold">{interaction.likes_count}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-bold">{interaction.comments_count}</span>
            </div>
          </div>
        </div>

        {/* Center Highlight - Featured Interaction */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="bg-white/15 backdrop-blur-2xl border border-white/30 rounded-3xl p-5 shadow-xl max-w-full hover:bg-white/20 transition-all duration-300">
            {/* Completion Post */}
            {interaction.interaction_type === 'completion' && interaction.completion && (
              <div className="relative">
                <div className="bg-white/20 rounded-3xl p-5 backdrop-blur-lg border border-white/30">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-10 h-10 border-2 border-white/80 shadow-lg">
                      <AvatarImage src={interaction.completion.user_avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-sm font-semibold">
                        {interaction.completion.user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold text-sm">{interaction.completion.user_name}</p>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                      </div>
                      <p className="text-white/70 text-xs">{formatTimeAgo(interaction.completion.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-white font-medium text-base leading-relaxed line-clamp-3 break-words">
                    {interaction.completion.content}
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/20">
                    <p className="text-white/80 text-sm font-medium">
                      💬 Voir les réactions
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Join/Complete */}
            {(interaction.interaction_type === 'join' || interaction.interaction_type === 'complete') && interaction.participant && (
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12 border-3 border-white/70 shadow-lg">
                  <AvatarImage src={interaction.participant.user_avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold text-lg">
                    {interaction.participant.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg break-words">
                    <span className="text-orange-300">{interaction.participant.user_name}</span>
                    {' '}{interaction.participant.action === 'completed' ? 'a complété ⭐' : 'a rejoint 🎉'}
                  </p>
                  <p className="text-white/80 text-xs mt-1">{formatTimeAgo(interaction.participant.created_at)}</p>
                </div>
                <Sparkles className="w-6 h-6 text-yellow-300 flex-shrink-0" />
              </div>
            )}

            {/* Milestone */}
            {interaction.interaction_type === 'milestone' && interaction.milestone && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-black text-xl">
                    🔥 {interaction.milestone.message}
                  </p>
                  <p className="text-white/90 text-sm mt-1">Ce défi explose 🎉</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - subtle hint */}
        <div className="flex-shrink-0 flex justify-center">
          <p className="text-white/60 text-xs font-medium">Toucher pour voir le fil 👆</p>
        </div>
      </div>
    </Card>
  );
};

export default InteractionCard;
