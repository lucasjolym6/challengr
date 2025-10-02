import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ensureUserProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        console.log('Checking user profile for:', user.id);
        
        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching profile:', fetchError);
          throw fetchError;
        }

        if (existingProfile) {
          console.log('Profile exists:', existingProfile);
          setProfile(existingProfile);
        } else {
          console.log('Profile does not exist, creating one...');
          
          // Create profile
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              user_id: user.id,
              username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              avatar_url: user.user_metadata?.avatar_url || null
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            throw createError;
          }

          console.log('Profile created:', newProfile);
          setProfile(newProfile);
        }
      } catch (err: any) {
        console.error('Failed to ensure user profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    ensureUserProfile();
  }, [user]);

  const refreshProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
    } catch (err: any) {
      console.error('Failed to refresh profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refreshProfile,
    hasProfile: !!profile
  };
};
