import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Heart, MessageCircle, Trophy, Clock, Target, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserLevelBadge } from '@/components/ui/user-level-badge';

// Import category images (same as Challenges.tsx)
import sportsImg from "@/assets/category-sports.jpg";
import drawingImg from "@/assets/category-drawing.jpg";
import musicImg from "@/assets/category-music.jpg";
import cookingImg from "@/assets/category-cooking.jpg";
import writingImg from "@/assets/category-writing.jpg";
import codingImg from "@/assets/category-coding.jpg";
import gardeningImg from "@/assets/category-gardening.jpg";

interface Challenge {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  points_reward: number;
  difficulty_level: string;
  category_id: string;
  created_at: string;
  challenge_categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface CommentReply {
  id: string;
  content: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_level: number | null;
  created_at: string;
  likes_count: number;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  is_completion: boolean;
  verified: boolean;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    level: number | null;
  };
  replies?: CommentReply[];
}

const ChallengeFeed: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<{ [postId: string]: string }>({});

  const fetchChallenge = async () => {
    if (!challengeId) return;

    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          id,
          title,
          description,
          image_url,
          points_reward,
          difficulty_level,
          category_id,
          created_at,
          challenge_categories!category_id (
            name,
            icon,
            color
          )
        `)
        .eq('id', challengeId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setChallenge(data);
    } catch (error) {
      console.error('Error fetching challenge:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le défi.",
        variant: "destructive",
      });
    }
  };

  const fetchComments = async () => {
    if (!challengeId) return;

    try {
      // Get user challenges for this challenge
      const { data: userChallenges, error: ucError } = await supabase
        .from('user_challenges')
        .select('id')
        .eq('challenge_id', challengeId);

      if (ucError) throw ucError;

      if (!userChallenges || userChallenges.length === 0) {
        setComments([]);
        return;
      }

      // Get posts/comments
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          user_id,
          created_at,
          verified,
          profiles!posts_user_id_fkey (
            username,
            display_name,
            avatar_url,
            level
          )
        `)
        .in('user_challenge_id', userChallenges.map(uc => uc.id))
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get replies for each post
      const postIds = (posts || []).map(p => p.id);
      const { data: replies } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          user_id,
          created_at,
          post_id,
          profiles!comments_user_id_fkey (
            username,
            display_name,
            avatar_url,
            level
          )
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      // Transform posts to comments with their replies
      const transformedComments: Comment[] = (posts || []).map(post => ({
        id: post.id,
        content: post.content,
        user_id: post.user_id,
        created_at: post.created_at,
        is_completion: post.verified || false,
        verified: post.verified || false,
        profiles: post.profiles,
        replies: (replies || [])
          .filter(reply => reply.post_id === post.id)
          .map(reply => ({
            id: reply.id,
            content: reply.content,
            user_id: reply.user_id,
            user_name: reply.profiles?.display_name || reply.profiles?.username || 'Utilisateur',
            user_avatar: reply.profiles?.avatar_url || null,
            user_level: reply.profiles?.level || 1,
            created_at: reply.created_at,
            likes_count: 0,
          }))
      }));

      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || !challengeId) return;

    setIsSubmitting(true);
    try {
      // Check if user has a user_challenge for this challenge
      let userChallengeId = null;
      
      const { data: userChallenges, error: ucError } = await supabase
        .from('user_challenges')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId);

      if (ucError) throw ucError;

      if (userChallenges && userChallenges.length > 0) {
        userChallengeId = userChallenges[0].id;
      } else {
        // Create a user_challenge if it doesn't exist
        const { data: newUserChallenge, error: createUcError } = await supabase
          .from('user_challenges')
          .insert([{
            user_id: user.id,
            challenge_id: challengeId,
            status: 'to_do'
          }])
          .select('id')
          .single();

        if (createUcError) throw createUcError;
        userChallengeId = newUserChallenge.id;
      }

      if (replyingTo) {
        // Create a reply (comment to existing post)
        const { data: newReply, error: replyError } = await supabase
          .from('comments')
          .insert([{
            post_id: replyingTo,
            user_id: user.id,
            content: newComment.trim()
          }])
          .select(`
            id,
            content,
            user_id,
            created_at,
            post_id,
            profiles!comments_user_id_fkey (
              username,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (replyError) throw replyError;

        // For replies, we'll refresh the comments to show the new reply
        await fetchComments();
        setNewComment('');
        setReplyingTo(null);
      } else {
        // Create a new main comment (post)
        const { data: newPost, error: postError } = await supabase
          .from('posts')
          .insert([{
            user_challenge_id: userChallengeId,
            user_id: user.id,
            content: newComment.trim(),
            verified: false
          }])
          .select(`
            id,
            content,
            user_id,
            created_at,
            verified,
            profiles!posts_user_id_fkey (
              username,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (postError) throw postError;

        // Add to comments
        const newCommentData: Comment = {
          id: newPost.id,
          content: newPost.content,
          user_id: newPost.user_id,
          created_at: newPost.created_at,
          is_completion: false,
          verified: false,
          profiles: newPost.profiles
        };

        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
      }
      
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès.",
      });
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le commentaire.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (postId: string) => {
    const replyText = replyTexts[postId];
    if (!user || !replyText?.trim() || !postId) return;

    setIsSubmitting(true);
    try {
      // Create a reply (comment to existing post)
      const { data: newReply, error: replyError } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: replyText.trim()
        }])
        .select(`
          id,
          content,
          user_id,
          created_at,
          post_id,
          profiles!comments_user_id_fkey (
            username,
            display_name,
            avatar_url,
            level
          )
        `)
        .single();

      if (replyError) throw replyError;

      // Refresh comments to show the new reply
      await fetchComments();
      
      // Clear the reply text for this post
      setReplyTexts(prev => ({ ...prev, [postId]: '' }));
      
      toast({
        title: "Réponse ajoutée",
        description: "Votre réponse a été publiée avec succès.",
      });
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: "Erreur",
        description: "Impossible de publier la réponse.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent, postId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReplySubmit(postId);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchChallenge(), fetchComments()]);
      setLoading(false);
    };
    
    loadData();
  }, [challengeId]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getCategoryImage = (categoryName: string): string => {
    const categoryImages: { [key: string]: string } = {
      'Sports': sportsImg,
      'Drawing': drawingImg,
      'Music': musicImg,
      'Cooking': cookingImg,
      'Writing': writingImg,
      'Coding': codingImg,
      'Gardening': gardeningImg
    };
    return categoryImages[categoryName] || sportsImg;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return level;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="px-4 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-48 bg-gray-200 rounded-3xl"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Défi non trouvé</h2>
          <Button onClick={() => navigate('/challenges')}>
            Retour aux défis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Integrated Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        {/* Navigation */}
        <div className="px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/challenges')}
            className="text-gray-600 hover:text-gray-900 p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Button>
        </div>
        
        {/* Challenge Header */}
        <div className="px-4 pb-4">
          <div className="relative h-40 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl overflow-hidden">
            <img
              src={challenge.image_url || getCategoryImage(challenge.challenge_categories?.name || '')}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <h1 className="text-xl font-bold mb-1 leading-tight">{challenge.title}</h1>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <Badge className="bg-white/20 text-white border-white/30 text-xs px-2 py-0.5">
                  {challenge.challenge_categories?.name || 'Général'}
                </Badge>
                <Badge className={`${getDifficultyColor(challenge.difficulty_level)} text-xs px-2 py-0.5`}>
                  {getDifficultyLabel(challenge.difficulty_level)}
                </Badge>
                <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                  <Trophy className="w-3 h-3" />
                  <span className="text-xs">{challenge.points_reward} pts</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <p className="text-gray-700 leading-relaxed text-sm mb-3">{challenge.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{comments.length} participants</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeAgo(challenge.created_at)}</span>
                </div>
              </div>
              
              <Button
                onClick={() => navigate(`/challenges`)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-9 rounded-xl text-sm px-4"
              >
                <Target className="w-4 h-4 mr-1" />
                Commencer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="px-4 py-4">

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              💬 Discussion ({comments.length})
            </h2>
          </div>

          {/* Comment Input */}
          <Card className="shadow-lg rounded-3xl">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    placeholder="Partagez vos progrès..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="border-0 bg-gray-50 focus:bg-white transition-colors rounded-2xl h-12 text-sm"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-end mt-3">
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl h-9 px-6"
                      size="sm"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Publier
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <Card className="text-center py-8 rounded-3xl">
                <CardContent>
                  <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-600 mb-1">
                    Aucun commentaire pour le moment
                  </h3>
                  <p className="text-sm text-gray-500">
                    Soyez le premier à partager vos progrès !
                  </p>
                </CardContent>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card
                  key={comment.id}
                  className={`shadow-lg transition-all rounded-3xl ${
                    comment.verified
                      ? 'ring-2 ring-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
                      : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                          {comment.profiles?.display_name?.charAt(0) || 
                           comment.profiles?.username?.charAt(0) || 
                           'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {comment.profiles?.display_name || comment.profiles?.username || 'Utilisateur'}
                          </h4>
                          <UserLevelBadge level={comment.profiles?.level || 1} size="sm" />
                          {comment.verified && (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
                              <Trophy className="w-3 h-3 mr-1" />
                              Terminé
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 ml-auto">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm mb-3">
                          {comment.content}
                        </p>
                        
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                            <Heart className="w-4 h-4" />
                            <span className="text-xs">0</span>
                          </button>
                          <button 
                            onClick={() => setReplyingTo(comment.id)}
                            className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">Répondre</span>
                          </button>
                        </div>
                        
                        {/* Reply Input - appears when replying to this comment */}
                        {replyingTo === comment.id && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex gap-3">
                              <Avatar className="w-6 h-6 flex-shrink-0">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <Input
                                  placeholder="Répondre..."
                                  value={replyTexts[comment.id] || ''}
                                  onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                  onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                                  className="border-0 bg-gray-50 focus:bg-white transition-colors rounded-xl h-8 text-xs"
                                  disabled={isSubmitting}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyTexts(prev => ({ ...prev, [comment.id]: '' }));
                                    }}
                                    className="h-6 px-3 text-xs"
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    onClick={() => handleReplySubmit(comment.id)}
                                    disabled={!replyTexts[comment.id]?.trim() || isSubmitting}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl h-6 px-3 text-xs"
                                    size="sm"
                                  >
                                    {isSubmitting ? (
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <Send className="w-3 h-3 mr-1" />
                                        Répondre
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-11 mt-3 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3 p-3 bg-gray-50 rounded-2xl">
                            <Avatar className="w-6 h-6 flex-shrink-0">
                              <AvatarImage src={reply.user_avatar || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                {reply.user_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-xs">{reply.user_name}</span>
                                <UserLevelBadge level={reply.user_level || 1} size="sm" />
                                <span className="text-xs text-gray-500 ml-auto">
                                  {formatTimeAgo(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 break-words">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeFeed;
