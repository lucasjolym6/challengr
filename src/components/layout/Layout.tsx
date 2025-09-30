import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigation } from './Navigation';
import { AuthPage } from '@/components/auth/AuthPage';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();

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
      <Navigation />
      <main className="pb-20 md:pb-0 md:ml-64">
        {children}
      </main>
    </div>
  );
};