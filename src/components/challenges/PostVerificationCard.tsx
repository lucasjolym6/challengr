import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  verified: boolean;
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
}

interface PostVerificationCardProps {
  post: Post;
  onVerificationComplete: () => void;
}

export function PostVerificationCard({ post, onVerificationComplete }: PostVerificationCardProps) {
  const { toast } = useToast();

  const handleVerifyPost = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ verified: true })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: "Post verified",
        description: "The post is now visible to the community",
      });

      onVerificationComplete();
    } catch (error) {
      console.error('Error verifying post:', error);
      toast({
        title: "Error",
        description: "Failed to verify post",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.profiles.avatar_url || undefined} />
              <AvatarFallback>
                {post.profiles.display_name?.charAt(0) || post.profiles.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.profiles.display_name || post.profiles.username}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatTimeAgo(post.created_at)}</span>
                {post.user_challenges?.challenges && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span>{post.user_challenges.challenges.challenge_categories?.icon}</span>
                      <span>{post.user_challenges.challenges.title}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            Pending Verification
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="leading-relaxed">{post.content}</p>
        
        {post.image_url && (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Challenge proof" 
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((hashtag, index) => (
              <span key={index} className="text-primary text-sm">
                {hashtag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-border">
          <Button 
            onClick={handleVerifyPost}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Verify Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
