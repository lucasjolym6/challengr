import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Heart, MessageCircle, Share2, Send, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  user_challenge_id: string | null;
  hashtags: string[] | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  user_challenges?: {
    challenges: {
      title: string;
      challenge_categories: {
        name: string;
        icon: string;
      } | null;
    };
  } | null;
  engagement_score?: number;
  is_high_engagement?: boolean;
}

const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
];

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

const ChallengeFeed: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'latest' | 'trending'>('latest');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [seenPosts, setSeenPosts] = useState<Set<string>>(new Set());
  const [showReactions, setShowReactions] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    loadSeenPosts();
  }, []);

  const loadSeenPosts = () => {
    const seen = localStorage.getItem('seenPosts');
    if (seen) {
      setSeenPosts(new Set(JSON.parse(seen)));
    }
  };

  const markAsSeen = (postId: string) => {
    const newSeen = new Set(seenPosts);
    newSeen.add(postId);
    setSeenPosts(newSeen);
    localStorage.setItem('seenPosts', JSON.stringify(Array.from(newSeen)));
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, display_name, avatar_url),
          user_challenges (
            challenges (
              title,
              challenge_categories (name, icon)
            )
          )
        `)
        .eq('verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate engagement score and mark high engagement posts
      const postsWithEngagement = (data || []).map(post => {
        const engagement_score = post.likes_count * 2 + post.comments_count * 3;
        return {
          ...post,
          engagement_score,
          is_high_engagement: engagement_score > 10, // Threshold for high engagement
        };
      });

      setPosts(postsWithEngagement);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load challenge feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (username, display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(prev => ({
        ...prev,
        [postId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        if (error) throw error;
      }

      // Refresh posts to update like count
      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const submitComment = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: commentInputs[postId].trim()
        }]);

      if (error) throw error;

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      fetchComments(postId);
      fetchPosts(); // Refresh to update comment count
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
    setExpandedComments(newExpanded);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getSortedPosts = () => {
    let sortedPosts = [...posts];
    
    if (viewMode === 'trending') {
      sortedPosts.sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
    }
    
    // Prioritize unseen posts
    sortedPosts.sort((a, b) => {
      const aSeen = seenPosts.has(a.id) ? 1 : 0;
      const bSeen = seenPosts.has(b.id) ? 1 : 0;
      return aSeen - bSeen;
    });
    
    return sortedPosts;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-32 h-10 bg-muted rounded-full animate-pulse" />
          <div className="w-32 h-10 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-[600px] bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  const sortedPosts = getSortedPosts();

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={viewMode === 'trending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('trending')}
          className="gap-2 rounded-full"
        >
          <Flame className="w-4 h-4" />
          Trending
        </Button>
        <Button
          variant={viewMode === 'latest' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('latest')}
          className="gap-2 rounded-full"
        >
          <Clock className="w-4 h-4" />
          Latest
        </Button>
      </div>

      {sortedPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">
            Complete some challenges and share your achievements with the community!
          </p>
        </div>
      ) : (
        <Carousel 
          className="w-full"
          opts={{
            align: "start",
            loop: false,
          }}
        >
          <CarouselContent className="-ml-4">
            {sortedPosts.map((post, index) => (
              <CarouselItem key={post.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Card 
                  className={cn(
                    "h-full overflow-hidden transition-all duration-300",
                    post.is_high_engagement && "ring-2 ring-primary/50 shadow-elegant scale-105",
                    seenPosts.has(post.id) && "opacity-75"
                  )}
                  onMouseEnter={() => !seenPosts.has(post.id) && markAsSeen(post.id)}
                >
                  {/* High Engagement Badge */}
                  {post.is_high_engagement && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gradient-primary text-white shadow-lg">
                        <Flame className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage src={post.profiles.avatar_url || undefined} />
                        <AvatarFallback className="text-lg font-bold bg-gradient-primary text-white">
                          {post.profiles.display_name?.charAt(0) || post.profiles.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base truncate">{post.profiles.display_name || post.profiles.username}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-4">
                    {/* Challenge Badge */}
                    {post.user_challenges?.challenges && (
                      <Badge variant="outline" className="gap-1">
                        <span>{post.user_challenges.challenges.challenge_categories?.icon}</span>
                        <span className="text-xs">{post.user_challenges.challenges.title}</span>
                      </Badge>
                    )}

                    {/* Post Image */}
                    {post.image_url && (
                      <div className="rounded-xl overflow-hidden shadow-soft">
                        <img 
                          src={post.image_url} 
                          alt="Challenge proof" 
                          className="w-full aspect-square object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed text-center px-2">{post.content}</p>
                      
                      {/* Hashtags */}
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                          {post.hashtags.map((hashtag, idx) => (
                            <span key={idx} className="text-xs font-bold text-primary">
                              {hashtag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reaction Bar */}
                    <div className="flex items-center justify-around pt-2 border-t border-border">
                      {/* Like/Reactions */}
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowReactions(showReactions === post.id ? null : post.id)}
                          className={cn(
                            "gap-2 transition-all hover:scale-110",
                            post.likes_count > 0 && "text-red-500"
                          )}
                        >
                          <Heart className={cn("w-5 h-5", post.likes_count > 0 && "fill-current")} />
                          <span className="font-semibold">{post.likes_count}</span>
                        </Button>
                        
                        {/* Reaction Picker */}
                        {showReactions === post.id && (
                          <div className="absolute bottom-full left-0 mb-2 p-2 bg-card border border-border rounded-full shadow-lg flex gap-1 animate-scale-in z-20">
                            {REACTION_EMOJIS.map((reaction) => (
                              <button
                                key={reaction.emoji}
                                onClick={() => {
                                  toggleLike(post.id);
                                  setShowReactions(null);
                                }}
                                className="text-2xl hover:scale-125 transition-transform"
                                title={reaction.label}
                              >
                                {reaction.emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Comments */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleComments(post.id)}
                        className="gap-2 hover:scale-110 transition-all"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-semibold">{post.comments_count}</span>
                      </Button>
                      
                      {/* Share */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="gap-2 hover:scale-110 transition-all"
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments.has(post.id) && (
                      <div className="space-y-3 pt-3 border-t border-border animate-fade-in">
                        {/* Comment Input */}
                        <div className="flex gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {user?.user_metadata?.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Textarea
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Write a comment..."
                              className="min-h-[60px] resize-none text-sm rounded-xl"
                            />
                            <Button 
                              size="sm"
                              onClick={() => submitComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                              className="rounded-full"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={comment.profiles.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {comment.profiles.display_name?.charAt(0) || comment.profiles.username?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-bold truncate">
                                    {comment.profiles.display_name || comment.profiles.username}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatTimeAgo(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed mt-1">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex items-center justify-center gap-2 mt-4">
            <CarouselPrevious className="static" />
            <CarouselNext className="static" />
          </div>
        </Carousel>
      )}
    </div>
  );
};

export default ChallengeFeed;