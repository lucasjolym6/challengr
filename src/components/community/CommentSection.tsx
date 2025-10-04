import React, { useState, useEffect } from 'react';
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProtectedActionButton } from "@/components/auth/ProtectedActionButton";
import { 
  Send, 
  Smile, 
  Flame, 
  Zap, 
  PartyPopper, 
  ChevronDown, 
  ChevronUp,
  MoreHorizontal,
  Pin,
  Reply,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSpring, animated } from '@react-spring/web';
import { CommunityComment } from './CommunityFeed';

interface CommentSectionProps {
  postId: string;
}

interface CommentWithReplies extends CommunityComment {
  replies: CommentWithReplies[];
  user_reactions?: {
    fire: boolean;
    muscle: boolean;
    party: boolean;
  };
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);

  // Animation for new comments
  const [commentAnimation, setCommentAnimation] = useSpring(() => ({
    opacity: 1,
    transform: 'translateY(0px)',
  }));

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          parent_id,
          profiles!inner (
            username,
            avatar_url,
            level
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform to nested structure
      const commentsMap = new Map<string, CommentWithReplies>();
      const rootComments: CommentWithReplies[] = [];

      (data || []).forEach(comment => {
        const commentWithReplies: CommentWithReplies = {
          ...comment,
          user: comment.profiles,
          reactions: { fire: 0, muscle: 0, party: 0 }, // TODO: Implement reactions
          replies: [],
          user_reactions: { fire: false, muscle: false, party: false },
        };

        commentsMap.set(comment.id, commentWithReplies);

        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      // Cette fonction ne sera appelée que si l'utilisateur est connecté
      // grâce au ProtectedActionButton
      return;
    }
    
    if (!newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: replyingTo,
        })
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          parent_id,
          profiles!inner (
            username,
            avatar_url,
            level
          )
        `)
        .single();

      if (error) throw error;

      // Add to local state
      const newCommentWithReplies: CommentWithReplies = {
        ...data,
        user: data.profiles,
        reactions: { fire: 0, muscle: 0, party: 0 },
        replies: [],
        user_reactions: { fire: false, muscle: false, party: false },
      };

      if (replyingTo) {
        // Add as reply
        setComments(prev => prev.map(comment => {
          if (comment.id === replyingTo) {
            return { ...comment, replies: [...comment.replies, newCommentWithReplies] };
          }
          return comment;
        }));
      } else {
        // Add as root comment
        setComments(prev => [...prev, newCommentWithReplies]);
      }

      // Animate new comment
      setCommentAnimation.start({
        opacity: 0,
        transform: 'translateY(-20px)',
      });
      setTimeout(() => {
        setCommentAnimation.start({
          opacity: 1,
          transform: 'translateY(0px)',
        });
      }, 100);

      setNewComment('');
      setReplyingTo(null);

      // Update post comment count
      await supabase
        .from('posts')
        .update({ comments_count: comments.length + 1 })
        .eq('id', postId);

    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de publier le commentaire",
        variant: "destructive",
      });
    }
  };

  const handleReaction = async (commentId: string, reaction: 'fire' | 'muscle' | 'party') => {
    if (!user) {
      // Cette fonction ne sera appelée que si l'utilisateur est connecté
      // grâce au ProtectedActionButton
      return;
    }

    // TODO: Implement comment reactions
    toast({
      title: "Réaction ajoutée",
      description: `${reaction} réaction ajoutée !`,
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const CommentItem: React.FC<{ 
    comment: CommentWithReplies; 
    isReply?: boolean; 
    depth?: number 
  }> = ({ comment, isReply = false, depth = 0 }) => {
    const [showReplies, setShowReplies] = useState(depth < 2);
    const [isReplying, setIsReplying] = useState(false);

    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="flex space-x-3 py-3">
          <Avatar className="w-8 h-8 ring-2 ring-orange-100">
            <AvatarImage src={comment.user.avatar_url} alt={comment.user.username} />
            <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
              {comment.user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">{comment.user.username}</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Lvl {comment.user.level}
              </Badge>
              <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
            </div>
            
            <p className="text-sm text-gray-800 leading-relaxed mb-2">{comment.content}</p>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleReaction(comment.id, 'fire')}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-orange-500 transition-colors"
                >
                  <Flame className="w-3 h-3" />
                  <span>{comment.reactions.fire}</span>
                </button>
                <button
                  onClick={() => handleReaction(comment.id, 'muscle')}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  <span>{comment.reactions.muscle}</span>
                </button>
                <button
                  onClick={() => handleReaction(comment.id, 'party')}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-purple-500 transition-colors"
                >
                  <PartyPopper className="w-3 h-3" />
                  <span>{comment.reactions.party}</span>
                </button>
              </div>
              
              {depth < 2 && (
                <button
                  onClick={() => {
                    setIsReplying(!isReplying);
                    setReplyingTo(comment.id);
                  }}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <Reply className="w-3 h-3" />
                  <span>Reply</span>
                </button>
              )}
            </div>

            {/* Reply Form */}
            {isReplying && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder={`Reply to ${comment.user.username}...`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyingTo(null);
                      setNewComment('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-2"
                >
                  {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                </button>
                
                {showReplies && (
                  <div className="space-y-0">
                    {comment.replies.map((reply) => (
                      <CommentItem 
                        key={reply.id} 
                        comment={reply} 
                        isReply={true}
                        depth={depth + 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <div className="p-4">
      {/* Comment Input */}
      <div className="flex space-x-3 mb-4">
        <Avatar className="w-8 h-8 ring-2 ring-orange-100">
          <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
          <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
            {user?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-500">
                <Smile className="w-4 h-4" />
              </Button>
            </div>
            <ProtectedActionButton
              size="sm"
              onAuthed={handleSubmitComment}
              disabled={!newComment.trim()}
              className="rounded-full"
            >
              <Send className="w-4 h-4 mr-1" />
              {replyingTo ? 'Reply' : 'Comment'}
            </ProtectedActionButton>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <animated.div style={commentAnimation} className="space-y-0">
          {displayedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          
          {comments.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllComments(!showAllComments)}
              className="w-full mt-4 text-orange-600 hover:text-orange-700"
            >
              {showAllComments ? 'Show less' : `Show ${comments.length - 3} more comments`}
            </Button>
          )}
          
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </animated.div>
      )}
    </div>
  );
};

export default CommentSection;
