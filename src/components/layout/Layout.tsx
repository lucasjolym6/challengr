import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthPage } from '@/components/auth/AuthPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Search, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import userCircleIcon from '../../../icons/user-circle-Stroke-Rounded.png';
import bubbleChatIcon from '../../../icons/bubble-chat-Stroke-Rounded.png';

interface LayoutProps {
  children: React.ReactNode;
}

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/challenges?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-white text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
          <h2 className="text-xl font-semibold">Loading Challengr...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - iOS 26 style with 3 separate glass elements */}
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between gap-3 md:hidden">
        {/* Profile Button - Left */}
        <Link to="/profile" className="flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 glass glass-transition rounded-2xl"
          >
            <img 
              src={userCircleIcon} 
              alt="Profile" 
              className="h-6 w-6"
            />
          </Button>
        </Link>

        {/* Search Bar - Center */}
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-10 pr-4 glass glass-transition rounded-2xl border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:ring-0"
            />
          </form>
        </div>

        {/* Messages Button - Right */}
        <Link to="/messages" className="flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 glass glass-transition rounded-2xl"
          >
            <img 
              src={bubbleChatIcon} 
              alt="Messages" 
              className="h-6 w-6"
            />
          </Button>
        </Link>
      </div>

      <main className="pt-20 pb-24">
        {children}
      </main>
    </div>
  );
};