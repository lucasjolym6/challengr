import { supabase } from '@/integrations/supabase/client';

/**
 * Fallback function to create a conversation using the old message system
 * This is used when the new conversation tables don't exist yet
 */
export const createConversationFallback = async (userId: string, friendId: string): Promise<string | null> => {
  try {
    console.log('Using fallback conversation creation');
    
    // Check if messages already exist between these users
    const { data: existingMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .limit(1);

    if (messagesError) {
      console.error('Error checking existing messages:', messagesError);
      return null;
    }

    if (existingMessages && existingMessages.length > 0) {
      console.log('Messages already exist between users');
      // Return a placeholder ID - in the old system, we don't have conversation IDs
      return `fallback_${userId}_${friendId}`;
    }

    // Create a placeholder conversation ID
    const conversationId = `fallback_${userId}_${friendId}`;
    console.log('Created fallback conversation ID:', conversationId);
    
    return conversationId;
  } catch (error) {
    console.error('Error in fallback conversation creation:', error);
    return null;
  }
};

/**
 * Check if conversation tables exist
 */
export const checkConversationTablesExist = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Error checking conversation tables:', error);
    return false;
  }
};

/**
 * Parse fallback conversation ID to get user IDs
 */
export const parseFallbackConversationId = (conversationId: string): { userId: string; friendId: string } | null => {
  if (conversationId.startsWith('fallback_')) {
    const withoutPrefix = conversationId.replace('fallback_', '');
    
    // Split by underscore - should give us exactly 2 parts (userId_friendId)
    const parts = withoutPrefix.split('_');
    console.log('Parts from conversation ID:', parts);
    
    if (parts.length === 2) {
      return {
        userId: parts[0],
        friendId: parts[1]
      };
    }
  }
  
  // Legacy support for old format with dashes
  if (conversationId.startsWith('fallback-')) {
    const withoutPrefix = conversationId.replace('fallback-', '');
    const parts = withoutPrefix.split('-');
    console.log('Legacy parts from conversation ID:', parts);
    
    if (parts.length >= 10) { // Minimum for 2 UUIDs
      // Try to reconstruct the UUIDs
      const userId = parts.slice(0, 5).join('-');
      const friendId = parts.slice(5, 10).join('-');
      
      return {
        userId,
        friendId
      };
    }
  }
  
  console.error('Could not parse fallback conversation ID:', conversationId);
  return null;
};

/**
 * Fetch messages using the old system for fallback conversations
 */
export const fetchMessagesFallback = async (conversationId: string, userId: string): Promise<any[]> => {
  try {
    const parsed = parseFallbackConversationId(conversationId);
    if (!parsed) return [];

    console.log('Fetching messages with fallback for users:', parsed.userId, parsed.friendId);

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        challenges (
          id,
          title,
          description,
          image_url,
          challenge_categories (
            name,
            icon
          )
        ),
        profiles!messages_sender_id_fkey (
          user_id,
          username,
          display_name,
          avatar_url
        )
      `)
      .or(`and(sender_id.eq.${parsed.userId},receiver_id.eq.${parsed.friendId}),and(sender_id.eq.${parsed.friendId},receiver_id.eq.${parsed.userId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching fallback messages:', error);
      return [];
    }

    return messages || [];
  } catch (error) {
    console.error('Error in fetchMessagesFallback:', error);
    return [];
  }
};

/**
 * Create a fallback conversation object
 */
export const createFallbackConversation = async (conversationId: string, userId: string): Promise<any> => {
  try {
    console.log('Creating fallback conversation:', { conversationId, userId });
    
    const parsed = parseFallbackConversationId(conversationId);
    if (!parsed) {
      console.error('Could not parse conversation ID');
      return null;
    }

    console.log('Parsed conversation ID:', parsed);

    // Get the friend's profile
    const friendId = parsed.userId === userId ? parsed.friendId : parsed.userId;
    console.log('Friend ID to fetch:', friendId);
    
    const { data: friendProfile, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .eq('user_id', friendId)
      .single();

    if (error || !friendProfile) {
      console.error('Error fetching friend profile:', error);
      console.error('Friend ID was:', friendId);
      return null;
    }
    
    console.log('Friend profile found:', friendProfile);

    const conversationObject = {
      id: conversationId,
      name: null,
      type: 'individual',
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [
        {
          user_id: userId,
          last_read_at: null,
          profiles: {
            user_id: userId,
            username: 'current_user',
            display_name: 'Current User',
            avatar_url: null
          }
        },
        {
          user_id: friendId,
          last_read_at: null,
          profiles: friendProfile
        }
      ]
    };

    console.log('Created conversation object:', conversationObject);
    return conversationObject;
  } catch (error) {
    console.error('Error creating fallback conversation:', error);
    return null;
  }
};
