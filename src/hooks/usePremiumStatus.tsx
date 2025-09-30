import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export const usePremiumStatus = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['premium-status', user?.id],
    queryFn: async () => {
      if (!user) return { isPremium: false, isAdmin: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('user_id', user.id)
        .single();

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(r => r.role === 'admin') ?? false;

      return {
        isPremium: profile?.is_premium ?? false,
        isAdmin,
      };
    },
    enabled: !!user,
  });
};
