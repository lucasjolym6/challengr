import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { ConversationListItem, ConversationWithMembers } from '@/types/conversations';
import { createConversationFallback, checkConversationTablesExist } from '@/utils/conversationFallback';

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fallback function to fetch conversations from old messages table
  const fetchFallbackConversations = useCallback(async (): Promise<ConversationListItem[]> => {
    if (!user) return [];

    try {
      console.log('fetchFallbackConversations: Fetching from old messages table');
      
      // Get all unique friend IDs from messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at, read_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fallback messages:', error);
        return [];
      }

      if (!messages || messages.length === 0) {
        console.log('fetchFallbackConversations: No messages found');
        return [];
      }

      // Group messages by friend ID
      const friendMessages: { [friendId: string]: any[] } = {};
      
      messages.forEach(message => {
        const friendId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        if (!friendMessages[friendId]) {
          friendMessages[friendId] = [];
        }
        friendMessages[friendId].push(message);
      });

      // Create conversation list items
      const conversationList: ConversationListItem[] = [];
      
      for (const [friendId, friendMsgs] of Object.entries(friendMessages)) {
        // Get friend profile
        const { data: friendProfile } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .eq('user_id', friendId)
          .single();

        if (!friendProfile) continue;

        const lastMessage = friendMsgs[0]; // Most recent message
        const unreadCount = friendMsgs.filter(msg => 
          msg.receiver_id === user.id && !msg.read_at
        ).length;

        conversationList.push({
          id: `fallback_${user.id}_${friendId}`,
          name: friendProfile.display_name || friendProfile.username,
          type: 'individual' as const,
          lastMessage: {
            content: lastMessage.content || '',
            sender_id: lastMessage.sender_id,
            created_at: lastMessage.created_at,
            read_at: lastMessage.read_at,
            challenge_id: null,
            sender_username: friendProfile.username
          },
          unreadCount,
          members: [
            { user_id: user.id, profiles: null },
            { user_id: friendId, profiles: friendProfile }
          ],
          displayName: friendProfile.display_name || friendProfile.username,
          avatarUrl: friendProfile.avatar_url
        });
      }

      // Sort by last message time
      conversationList.sort((a, b) => 
        new Date(b.lastMessage?.created_at || 0).getTime() - new Date(a.lastMessage?.created_at || 0).getTime()
      );

      console.log('fetchFallbackConversations: Created', conversationList.length, 'conversations');
      return conversationList;

    } catch (error) {
      console.error('Error in fetchFallbackConversations:', error);
      return [];
    }
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    console.log('useConversations: Starting fetchConversations for user:', user.id);
    setLoading(true);
    try {
      // First check if conversation tables exist
      const tablesExist = await checkConversationTablesExist();
      
      if (!tablesExist) {
        console.log('useConversations: Using fallback system - conversation tables do not exist');
        // Use fallback system with old messages table
        const fallbackConversations = await fetchFallbackConversations();
        setConversations(fallbackConversations);
        return;
      }

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
        console.log('useConversations: No conversations found for user');
        setConversations([]);
        return;
      }

      console.log('useConversations: Found user conversations:', userConversations.length);

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

      console.log('useConversations: Final conversation list:', conversationList);
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
        const result = await createConversationFallback(user.id, friendId);
        // Refresh conversations list after creation
        if (result) {
          setTimeout(() => fetchConversations(), 100);
        }
        return result;
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
        const result = await createConversationFallback(user.id, friendId);
        if (result) {
          setTimeout(() => fetchConversations(), 100);
        }
        return result;
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
        const result = await createConversationFallback(user.id, friendId);
        if (result) {
          setTimeout(() => fetchConversations(), 100);
        }
        return result;
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
        const result = await createConversationFallback(user.id, friendId);
        if (result) {
          setTimeout(() => fetchConversations(), 100);
        }
        return result;
      }

      console.log('Added members to conversation');
      
      // Refresh conversations list after successful creation
      setTimeout(() => fetchConversations(), 100);
      
      return conversation.id;

    } catch (error) {
      console.error('Error creating individual conversation:', error);
      // Try fallback as last resort
      const result = await createConversationFallback(user.id, friendId);
      if (result) {
        setTimeout(() => fetchConversations(), 100);
      }
      return result;
    }
  }, [user, fetchConversations]);

  const createGroupConversation = useCallback(async (name: string, memberIds: string[]) => {
    if (!user) return null;

    try {
      console.log(`Creating group conversation: ${name} with members:`, memberIds);

      // Check if conversation tables exist
      const tablesExist = await checkConversationTablesExist();
      
      if (!tablesExist) {
        console.log('Conversation tables don\'t exist, cannot create group conversation');
        return null;
      }

      // Create new group conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          name: name,
          type: 'group',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating group conversation:', convError);
        return null;
      }

      console.log('Created group conversation:', conversation.id);

      // Add all members including creator
      const members = [{ conversation_id: conversation.id, user_id: user.id }, ...memberIds.map(id => ({ conversation_id: conversation.id, user_id: id }))];
      
      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert(members);

      if (membersError) {
        console.error('Error adding members to group conversation:', membersError);
        return null;
      }

      console.log('Added members to group conversation');
      
      // Refresh conversations list after successful creation
      setTimeout(() => fetchConversations(), 100);
      
      return conversation.id;

    } catch (error) {
      console.error('Error creating group conversation:', error);
      return null;
    }
  }, [user, fetchConversations]);

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

  // Set up real-time subscriptions for conversations and messages
  useEffect(() => {
    if (!user) return;

    // Subscribe to conversation_members changes (new conversations, member changes)
    const conversationsSubscription = supabase
      .channel('conversations_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_members',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Conversation members changed:', payload);
        // Refresh conversations when membership changes
        setTimeout(() => fetchConversations(), 100);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, (payload) => {
        console.log('Conversations changed:', payload);
        // Refresh conversations when conversation details change
        setTimeout(() => fetchConversations(), 100);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('New message received:', payload);
        // Refresh conversations when new messages arrive to update last message and unread count
        setTimeout(() => fetchConversations(), 100);
      })
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    loading,
    fetchConversations,
    createIndividualConversation,
    createGroupConversation,
    markAsRead
  };
};
