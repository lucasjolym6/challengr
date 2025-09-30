import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Home, 
  Trophy, 
  Users, 
  User, 
  LogOut,
  Zap,
  Shield,
  GraduationCap
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border z-50 md:top-0 md:bottom-auto md:left-0 md:w-64 md:h-full md:border-t-0 md:border-r">
      {/* Desktop Header */}
      <div className="hidden md:block p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold gradient-text">Challengr</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex md:flex-col justify-around md:justify-start md:p-4 md:space-y-2 py-2 md:py-0">
        <Link to="/">
          <Button
            variant={isActive('/') ? 'default' : 'ghost'}
            size="sm"
            className={`flex-col md:flex-row md:w-full md:justify-start gap-1 md:gap-2 h-auto md:h-10 py-2 md:py-2 px-2 md:px-3 ${
              isActive('/') ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            <Home className="h-5 w-5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">Home</span>
          </Button>
        </Link>

        <Link to="/challenges">
          <Button
            variant={isActive('/challenges') ? 'default' : 'ghost'}
            size="sm"
            className={`flex-col md:flex-row md:w-full md:justify-start gap-1 md:gap-2 h-auto md:h-10 py-2 md:py-2 px-2 md:px-3 ${
              isActive('/challenges') ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            <Trophy className="h-5 w-5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">Challenges</span>
          </Button>
        </Link>

        <Link to="/community">
          <Button
            variant={isActive('/community') ? 'default' : 'ghost'}
            size="sm"
            className={`flex-col md:flex-row md:w-full md:justify-start gap-1 md:gap-2 h-auto md:h-10 py-2 md:py-2 px-2 md:px-3 ${
              isActive('/community') ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            <Users className="h-5 w-5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">Community</span>
          </Button>
        </Link>

        <Link to="/coaching">
          <Button
            variant={isActive('/coaching') ? 'default' : 'ghost'}
            size="sm"
            className={`flex-col md:flex-row md:w-full md:justify-start gap-1 md:gap-2 h-auto md:h-10 py-2 md:py-2 px-2 md:px-3 ${
              isActive('/coaching') ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            <GraduationCap className="h-5 w-5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">Coaching</span>
          </Button>
        </Link>

        <Link to="/validation">
          <Button
            variant={isActive('/validation') ? 'default' : 'ghost'}
            size="sm"
            className={`flex-col md:flex-row md:w-full md:justify-start gap-1 md:gap-2 h-auto md:h-10 py-2 md:py-2 px-2 md:px-3 ${
              isActive('/validation') ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            <Shield className="h-5 w-5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">Validation</span>
          </Button>
        </Link>

        <Link to="/profile">
          <Button
            variant={isActive('/profile') ? 'default' : 'ghost'}
            size="sm"
            className={`flex-col md:flex-row md:w-full md:justify-start gap-1 md:gap-2 h-auto md:h-10 py-2 md:py-2 px-2 md:px-3 ${
              isActive('/profile') ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            <User className="h-5 w-5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">Profile</span>
          </Button>
        </Link>

        {/* Sign Out Button - Desktop Only */}
        <div className="hidden md:block mt-auto pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};