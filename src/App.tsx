import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Layout } from "@/components/layout/Layout";
import GlassFabNav from "@/components/nav/GlassFabNav";
import SupabaseConfigError from "@/components/SupabaseConfigError";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import Community from "./pages/Community";
import Coaching from "./pages/Coaching";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ValidationQueue from "./pages/ValidationQueue";
import Pricing from "./pages/Pricing";
import Messages from "./pages/Messages";
import ChallengeFeed from "./pages/ChallengeFeed";
import NotFound from "./pages/NotFound";
import { AuthPage } from "./components/auth/AuthPage";

const queryClient = new QueryClient();

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return url && key && url !== 'your_supabase_url_here' && key !== 'your_supabase_anon_key_here';
};

const App = () => {
  // Show configuration error if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return <SupabaseConfigError />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            <NotificationProvider>
              <Layout>
              <Routes>
                <Route path="/" element={<Challenges />} />
                <Route path="/home" element={<Home />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/feed/:challengeId" element={<ChallengeFeed />} />
                <Route path="/community" element={<Community />} />
                <Route path="/coaching" element={<Coaching />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/validation" element={<ValidationQueue />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/auth" element={<AuthPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              
              {/* Glass FAB Navigation */}
              <GlassFabNav />
            </Layout>
            </NotificationProvider>
          </AuthProvider>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
