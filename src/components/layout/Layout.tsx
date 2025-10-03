import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthPage } from '@/components/auth/AuthPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MessageCircle } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasNewMessages } = useNotifications();
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

  // Initialize search query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search') || '';
    setSearchQuery(searchParam);
  }, [location.search]);

  // Debounced search to avoid too many navigation calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentPath = location.pathname;
      const searchParam = searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery.trim())}` : '';
      
      if (currentPath.startsWith('/community')) {
        navigate(`/community${searchParam}`, { replace: true });
      } else if (currentPath.startsWith('/challenges')) {
        navigate(`/challenges${searchParam}`, { replace: true });
      } else if (currentPath.startsWith('/profile') || 
                 currentPath.startsWith('/messages') || 
                 currentPath.startsWith('/settings') || 
                 currentPath.startsWith('/validation') || 
                 currentPath.startsWith('/pricing')) {
        // For pages that don't support search, clear the search and stay on the page
        if (searchQuery.trim()) {
          // If there's a search query, redirect to challenges search instead
          navigate(`/challenges${searchParam}`, { replace: true });
        } else {
          // If clearing search, just update URL without search params
          navigate(currentPath, { replace: true });
        }
      } else {
        // For home page and other pages
        if (currentPath === '/' && !searchQuery.trim()) {
          // Stay on home page if no search query
          navigate('/', { replace: true });
        } else {
          // Default to challenges search for other cases
          navigate(`/challenges${searchParam}`, { replace: true });
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, navigate, location.pathname]);

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the debounced useEffect
  };

  // Get search placeholder based on current page
  const getSearchPlaceholder = () => {
    const currentPath = location.pathname;
    
    if (currentPath.startsWith('/community')) {
      return 'Search posts...';
    } else if (currentPath.startsWith('/challenges')) {
      return 'Search challenges...';
    } else {
      return 'Search challenges...';
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
      {/* Top Bar - iOS 26 style with 3 separate glass elements - Hidden on Messages and Profile pages */}
      {!location.pathname.startsWith('/messages') && !location.pathname.startsWith('/profile') && (
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
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-12 pl-10 pr-4 glass glass-transition rounded-2xl border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:ring-0"
            />
          </form>
        </div>

        {/* Messages Button - Right */}
        <Link to="/messages" className="flex-shrink-0 relative">
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
          {/* Notification Badge */}
          {hasNewMessages && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full"></div>
            </div>
          )}
        </Link>
      </div>
      )}

      <main className={(() => {
        const isMessagesPage = location.pathname.startsWith('/messages');
        const isProfilePage = location.pathname.startsWith('/profile');
        const isInConversation = isMessagesPage && searchParams.get('friend_id');
        
        if (isInConversation) {
          return 'pt-0 pb-0'; // No padding when in conversation
        } else if (isMessagesPage || isProfilePage) {
          return 'pt-0 pb-24'; // No top padding but bottom padding for FAB
        } else {
          return 'pt-20 pb-24'; // Full padding for other pages
        }
      })()}>
        {children}
      </main>
    </div>
  );
};