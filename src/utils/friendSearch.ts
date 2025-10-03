import { supabase } from '@/integrations/supabase/client';

export interface FriendProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

/**
 * Search for friends by query string
 * This function uses a simpler approach that should be more reliable
 */
export const searchFriends = async (userId: string, query: string): Promise<FriendProfile[]> => {
  try {
    console.log(`Searching friends for user ${userId} with query: "${query}"`);

    // Method 1: Direct query with joins (most reliable)
    const { data: friends, error } = await supabase
      .from('user_friends')
      .select(`
        user_id,
        friend_id,
        profiles!user_friends_user_id_fkey (
          user_id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error with first query:', error);
      
      // Method 2: Fallback - separate queries
      return await searchFriendsFallback(userId, query);
    }

    const { data: friendsReverse, error: errorReverse } = await supabase
      .from('user_friends')
      .select(`
        user_id,
        friend_id,
        profiles!user_friends_friend_id_fkey (
          user_id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (errorReverse) {
      console.error('Error with reverse query:', errorReverse);
      return await searchFriendsFallback(userId, query);
    }

    // Combine results
    const allFriends = [
      ...(friends || []).map(f => ({
        ...f.profiles,
        friendshipId: f.friend_id
      })),
      ...(friendsReverse || []).map(f => ({
        ...f.profiles,
        friendshipId: f.user_id
      }))
    ];

    // Remove duplicates and filter by query
    const uniqueFriends = allFriends.filter((friend, index, self) => 
      index === self.findIndex(f => f.user_id === friend.user_id)
    );

    const filtered = uniqueFriends.filter(friend => 
      friend.username.toLowerCase().includes(query.toLowerCase()) ||
      (friend.display_name && friend.display_name.toLowerCase().includes(query.toLowerCase()))
    );

    console.log('Friends found:', filtered);
    return filtered;

  } catch (error) {
    console.error('Error in searchFriends:', error);
    return await searchFriendsFallback(userId, query);
  }
};

/**
 * Fallback method using separate queries
 */
const searchFriendsFallback = async (userId: string, query: string): Promise<FriendProfile[]> => {
  try {
    console.log('Using fallback search method');

    // Get friend IDs where user is the friend
    const { data: friendsAsUser, error: error1 } = await supabase
      .from('user_friends')
      .select('user_id')
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    // Get friend IDs where user is the user
    const { data: friendsAsFriend, error: error2 } = await supabase
      .from('user_friends')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error1 || error2) {
      console.error('Error in fallback:', error1 || error2);
      return [];
    }

    // Combine friend IDs
    const friendIds = [
      ...(friendsAsUser || []).map(f => f.user_id),
      ...(friendsAsFriend || []).map(f => f.friend_id)
    ];

    if (friendIds.length === 0) {
      console.log('No friends found');
      return [];
    }

    console.log('Friend IDs to search:', friendIds);

    // Search in profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', friendIds)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);

    if (profilesError) {
      console.error('Error fetching profiles in fallback:', profilesError);
      return [];
    }

    console.log('Profiles found in fallback:', profiles);
    return profiles || [];

  } catch (error) {
    console.error('Error in searchFriendsFallback:', error);
    return [];
  }
};

/**
 * Get all friends without search (for debugging)
 */
export const getAllFriends = async (userId: string): Promise<FriendProfile[]> => {
  try {
    const { data: friends, error } = await supabase
      .from('user_friends')
      .select(`
        user_id,
        friend_id,
        status
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error getting all friends:', error);
      return [];
    }

    const friendIds = friends?.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
    ) || [];

    if (friendIds.length === 0) {
      return [];
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', friendIds);

    if (profilesError) {
      console.error('Error getting friend profiles:', profilesError);
      return [];
    }

    return profiles || [];

  } catch (error) {
    console.error('Error in getAllFriends:', error);
    return [];
  }
};

