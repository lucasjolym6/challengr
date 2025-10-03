import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthProvider';
import { SearchBar } from './SearchBar';
import { 
  Home, 
  Trophy, 
  Users, 
  User,
  LogOut,
  Zap,
  Shield,
  Settings,
  Crown,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);

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

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <>
      {/* Mobile-first: Top bar - LinkedIn style */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-md border-b border-border z-50 flex items-center px-4 md:hidden">
        <div className="flex items-center w-full">
          {/* Profile Avatar - Left */}
          <Link to="/profile" className="flex-shrink-0">
            <Avatar className="h-8 w-8 border-2 border-transparent hover:border-primary/50 transition-colors">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs font-medium">
                {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Search Bar - Center */}
          <div className="flex-1 mx-3">
            <SearchBar />
          </div>

          {/* Messages Button - Right */}
          <Link to="/messages" className="flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isActive('/messages') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile-first: Bottom navigation (3 main items) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border z-50 md:hidden">
        <div className="flex justify-around items-center h-full px-1">
          <Link to="/" className="flex flex-col items-center justify-center flex-1 py-2">
            <Home className={`h-6 w-6 mb-1 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive('/') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              Home
            </span>
          </Link>

          <Link to="/challenges" className="flex flex-col items-center justify-center flex-1 py-2">
            <Trophy className={`h-6 w-6 mb-1 ${isActive('/challenges') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive('/challenges') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              Challenges
            </span>
          </Link>

          <Link to="/community" className="flex flex-col items-center justify-center flex-1 py-2">
            <Users className={`h-6 w-6 mb-1 ${isActive('/community') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive('/community') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              Community
            </span>
          </Link>
        </div>
      </nav>

      {/* Desktop: Sidebar navigation */}
      <nav className="hidden md:block fixed top-0 left-0 w-64 h-full bg-card border-r border-border z-40">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-text">Challengr</span>
          </Link>
        </div>

        <div className="flex flex-col p-4 space-y-2">
          <Link to="/">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>

          <Link to="/challenges">
            <Button
              variant={isActive('/challenges') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <Trophy className="h-4 w-4" />
              Challenges
            </Button>
          </Link>

          <Link to="/community">
            <Button
              variant={isActive('/community') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <Users className="h-4 w-4" />
              Community
            </Button>
          </Link>

          <Link to="/messages">
            <Button
              variant={isActive('/messages') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Messages
            </Button>
          </Link>

          <Link to="/validation">
            <Button
              variant={isActive('/validation') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <Shield className="h-4 w-4" />
              Validation
            </Button>
          </Link>

          <Link to="/pricing">
            <Button
              variant={isActive('/pricing') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <Crown className="h-4 w-4" />
              Premium
            </Button>
          </Link>

          <Link to="/profile">
            <Button
              variant={isActive('/profile') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
          </Link>

          <div className="mt-auto pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
};