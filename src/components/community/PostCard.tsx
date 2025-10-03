import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal, 
  Play, 
  Pause,
  Flame,
  Zap,
  PartyPopper,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Upload,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CommentSection from './CommentSection';
import { useSpring, animated } from '@react-spring/web';
import { CommunityPost } from './CommunityFeed';

interface PostCardProps {
  post: CommunityPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  // Animation for reactions
  const [reactionAnimation, setReactionAnimation] = useSpring(() => ({
    scale: 1,
    rotate: 0,
  }));

  const [likeAnimation, setLikeAnimation] = useSpring(() => ({
    scale: 1,
  }));

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getInteractionType = () => {
    if (post.content && post.image_url) {
      return { type: 'uploaded', text: 'posted in' };
    } else if (post.content && !post.image_url) {
      return { type: 'posted', text: 'posted in' };
    } else {
      return { type: 'joined', text: 'joined' };
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const categoryIcons: Record<string, string> = {
      'Cooking': '🍳',
      'Creative': '🎨',
      'Music': '🎵',
      'Wellness': '🧘',
      'Art': '🖌️',
      'Fitness': '🏋️',
      'Lifestyle': '🌱',
      'Sports': '⚽',
      'Writing': '✍️',
      'Gardening': '🌿',
      'Coding': '💻'
    };
    return categoryIcons[categoryName] || '🎯';
  };

  const interaction = getInteractionType();

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour liker",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);
        
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: post.id,
          });
        
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        
        // Animate heart
        setLikeAnimation.start({
          from: { scale: 1 },
          to: { scale: 1.3 },
          reset: true
        });
      }

      // Update post likes count
      await supabase
        .from('posts')
        .update({ likes_count: isLiked ? likesCount - 1 : likesCount + 1 })
        .eq('id', post.id);

    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleReaction = (reaction: 'fire' | 'muscle' | 'party') => {
    setReactionAnimation.start({
      from: { scale: 1, rotate: 0 },
      to: { scale: 1.2, rotate: 10 },
      reset: true
    });

    // TODO: Implement reaction system
    toast({
      title: "Réaction ajoutée",
      description: `${reaction} réaction ajoutée !`,
    });
  };

  const contentPreview = post.content && post.content.length > 80 
    ? post.content.substring(0, 80) + '...' 
    : post.content;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to challenge feed with this post highlighted - same logic as swipable cards
    navigate(`/feed/${post.challenge_id}?highlight=${post.id}`);
  };

  const handleReactionClick = (e: React.MouseEvent, reaction: string) => {
    e.stopPropagation();
    if (reaction === 'like') {
      handleLike();
    } else if (reaction === 'comment') {
      // Navigate to challenge with comments open
      console.log('Navigate to comments for post:', post.id);
    } else if (reaction === 'share') {
      // Handle share
      console.log('Share post:', post.id);
    }
  };

  return (
    <div className="relative group">
      {/* iOS26 Glassmorphic Card */}
      <div 
        onClick={handleCardClick}
        className="relative w-full bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/10 active:scale-[0.98] cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)'
        }}
      >
        {/* Inner Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
        
        {/* Main Content */}
        <div className="relative p-5">
          {/* Top Row - User Info */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              <Avatar className="w-12 h-12 ring-4 ring-white/50 shadow-lg">
                <AvatarImage src={post.user.avatar_url} alt={post.user.username} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white font-bold text-lg">
                  {post.user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Avatar Glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/30 to-pink-400/30 blur-sm -z-10" />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Username */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 text-lg leading-tight">
                  {post.user.username}
                </span>
                <span className="text-gray-600 text-sm font-medium">{interaction.text}</span>
              </div>
            </div>
          </div>

          {/* Challenge Name - More Subtle */}
          <div className="mb-4">
            <div 
              className="inline-flex items-center px-3 py-1.5 rounded-xl font-medium text-gray-700 text-sm backdrop-blur-sm border border-gray-200/50 transform transition-all duration-300 hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)`,
                boxShadow: `0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)`
              }}
            >
              <span className="text-sm mr-1.5">{getCategoryIcon(post.challenge.category.name)}</span>
              <span>{post.challenge.title}</span>
            </div>
          </div>

          {/* Body - Content Preview */}
          {contentPreview && (
            <div className="mb-4">
              <p className="text-gray-800 text-base leading-relaxed line-clamp-2 font-medium">
                {contentPreview}
              </p>
            </div>
          )}

          {/* Media Thumbnail */}
          {post.image_url && (
            <div className="mb-4">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={post.image_url}
                  alt="Post content"
                  className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Image Overlay Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row - Meta Info */}
        <div className="relative px-5 pb-4">
          <div className="flex items-center justify-between">
            {/* Timestamp */}
            <span className="text-gray-500 text-sm font-medium">
              {formatTimeAgo(post.created_at)}
            </span>
            
            {/* Gamified Reaction Bar */}
            <div className="flex items-center space-x-3">
              {/* Like */}
              <button
                onClick={(e) => handleReactionClick(e, 'like')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 transition-all duration-200 hover:scale-105"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-red-400'}`} />
                <span className="text-red-600 font-bold text-sm">{likesCount}</span>
              </button>

              {/* Comments */}
              <button
                onClick={(e) => handleReactionClick(e, 'comment')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-all duration-200 hover:scale-105"
              >
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <span className="text-blue-600 font-bold text-sm">{post.comments_count}</span>
              </button>

              {/* Share */}
              <button
                onClick={(e) => handleReactionClick(e, 'share')}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105"
              >
                <Share className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Card Glow Effect */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${post.challenge.category.color}10 0%, transparent 70%)`
          }}
        />
      </div>
    </div>
  );
};

export default PostCard;
