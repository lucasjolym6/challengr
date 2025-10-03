import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { ConversationListItem, ConversationWithMembers } from '@/types/conversations';
import { createConversationFallback, checkConversationTablesExist } from '@/utils/conversationFallback';

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch conversations where user is a member
      const { data: userConversations, error: convError } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          last_read_at,
          conversations!inner (
            id,
            name,
            type,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      if (!userConversations || userConversations.length === 0) {
        setConversations([]);
        return;
      }

      // Get conversation details with members and last message
      const conversationPromises = userConversations.map(async (userConv) => {
        const conversation = userConv.conversations;

        // Get all members for this conversation
        const { data: members, error: membersError } = await supabase
          .from('conversation_members')
          .select(`
            user_id,
            profiles!inner (
              user_id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('conversation_id', conversation.id);

        if (membersError) throw membersError;

        // Get last message
        const { data: lastMessage, error: messageError } = await supabase
          .from('messages')
          .select(`
            content,
            sender_id,
            created_at,
            read_at,
            challenge_id,
            profiles!messages_sender_id_fkey (
              username
            )
          `)
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Calculate unread count for this user
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', user.id)
          .gt('created_at', userConv.last_read_at || '1900-01-01');

        // For individual conversations, get the other person's info
        let displayName = conversation.name;
        let avatarUrl = null;

        if (conversation.type === 'individual' && members && members.length === 2) {
          const otherMember = members.find(m => m.user_id !== user.id);
          if (otherMember?.profiles) {
            displayName = otherMember.profiles.display_name || otherMember.profiles.username;
            avatarUrl = otherMember.profiles.avatar_url;
          }
        }

        return {
          id: conversation.id,
          name: displayName,
          type: conversation.type as 'individual' | 'group',
          lastMessage: lastMessage ? {
            content: lastMessage.content || '',
            sender_id: lastMessage.sender_id,
            created_at: lastMessage.created_at,
            read_at: lastMessage.read_at,
            challenge_id: lastMessage.challenge_id,
            sender_username: lastMessage.profiles?.username
          } : null,
          unreadCount: unreadCount || 0,
          members: members || [],
          displayName,
          avatarUrl
        };
      });

      const conversationList = await Promise.all(conversationPromises);
      
      // Sort by last message time or creation time
      conversationList.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.members[0]?.user_id || '';
        const bTime = b.lastMessage?.created_at || b.members[0]?.user_id || '';
        return bTime.localeCompare(aTime);
      });

      setConversations(conversationList);

    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createIndividualConversation = useCallback(async (friendId: string) => {
    if (!user) return null;

    try {
      console.log(`Creating individual conversation between ${user.id} and ${friendId}`);

      // First, check if conversation tables exist
      const tablesExist = await checkConversationTablesExist();
      
      if (!tablesExist) {
        console.log('Conversation tables don\'t exist, using fallback');
        return await createConversationFallback(user.id, friendId);
      }

      // First, check if a conversation already exists between these two users
      const { data: existingConversations, error: checkError } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          conversations!inner (
            id,
            type
          )
        `)
        .eq('user_id', user.id);

      if (checkError) {
        console.error('Error checking existing conversations:', checkError);
        // Try fallback if there's an error
        return await createConversationFallback(user.id, friendId);
      }

      // Check if any of these conversations are individual conversations with the friend
      for (const conv of existingConversations || []) {
        if (conv.conversations.type === 'individual') {
          const { data: otherMembers } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id)
            .in('user_id', [user.id, friendId]);

          if (otherMembers && otherMembers.length === 2) {
            console.log('Found existing conversation:', conv.conversation_id);
            return conv.conversation_id;
          }
        }
      }

      console.log('No existing conversation found, creating new one');

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'individual',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        // Try fallback if there's an error
        return await createConversationFallback(user.id, friendId);
      }

      console.log('Created conversation:', conversation.id);

      // Add both users as members
      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: friendId }
        ]);

      if (membersError) {
        console.error('Error adding members:', membersError);
        // Try fallback if there's an error
        return await createConversationFallback(user.id, friendId);
      }

      console.log('Added members to conversation');
      return conversation.id;

    } catch (error) {
      console.error('Error creating individual conversation:', error);
      // Try fallback as last resort
      return await createConversationFallback(user.id, friendId);
    }
  }, [user]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    loading,
    fetchConversations,
    createIndividualConversation,
    markAsRead
  };
};
