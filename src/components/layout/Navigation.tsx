import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Home, 
  Trophy, 
  Users, 
  User,
  Menu,
  LogOut,
  Zap,
  Shield,
  Settings,
  Crown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <>
      {/* Mobile-first: Top bar with logo and menu */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-4 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold gradient-text">Challengr</span>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card">
            <DropdownMenuItem asChild>
              <Link to="/validation" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4" />
                Validation Queue
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/pricing" className="flex items-center gap-2 cursor-pointer">
                <Crown className="h-4 w-4" />
                Premium
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile-first: Bottom navigation (4 main items) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border z-50 md:hidden">
        <div className="flex justify-around items-center h-full px-2">
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

          <Link to="/profile" className="flex flex-col items-center justify-center flex-1 py-2">
            <User className={`h-6 w-6 mb-1 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive('/profile') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              Profile
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