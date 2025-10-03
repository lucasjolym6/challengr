import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { MessageWithChallenge, ConversationWithMembers } from '@/types/conversations';
import { checkConversationTablesExist, fetchMessagesFallback, createFallbackConversation, parseFallbackConversationId } from '@/utils/conversationFallback';

export const useConversationMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationWithMembers | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    setLoading(true);
    try {
      console.log('Fetching messages for conversation:', conversationId);

      // Check if this is a fallback conversation
      const isFallback = conversationId.startsWith('fallback_') || conversationId.startsWith('fallback-');
      
      if (isFallback) {
        console.log('Using fallback message fetching');
        
        // Fetch messages using fallback
        const messagesData = await fetchMessagesFallback(conversationId, user.id);
        setMessages(messagesData);

        // Create fallback conversation object
        const conversationData = await createFallbackConversation(conversationId, user.id);
        setConversation(conversationData);
        
      } else {
        console.log('Using new conversation system');
        
        // Check if conversation tables exist
        const tablesExist = await checkConversationTablesExist();
        
        if (!tablesExist) {
          console.log('Tables don\'t exist, falling back to old system');
          // Convert to fallback format
          const fallbackId = `fallback_${user.id}_${conversationId}`;
          const messagesData = await fetchMessagesFallback(fallbackId, user.id);
          setMessages(messagesData);
          
          const conversationData = await createFallbackConversation(fallbackId, user.id);
          setConversation(conversationData);
          return;
        }

        // Fetch messages for this conversation
        const { data: messagesData, error: messagesError } = await supabase
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
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        setMessages(messagesData || []);

        // Fetch conversation details with members
        const { data: conversationData, error: convError } = await supabase
          .from('conversations')
          .select(`
            *,
            conversation_members (
              user_id,
              last_read_at,
              profiles!inner (
                user_id,
                username,
                display_name,
                avatar_url
              )
            ),
            group_conversation_settings (*)
          `)
          .eq('id', conversationId)
          .single();

        if (convError) throw convError;

        setConversation(conversationData);
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
      
      // Try fallback as last resort
      try {
        console.log('Trying fallback after error');
        const fallbackId = conversationId.startsWith('fallback_') || conversationId.startsWith('fallback-') ? conversationId : `fallback_${user.id}_${conversationId}`;
        const messagesData = await fetchMessagesFallback(fallbackId, user.id);
        setMessages(messagesData);
        
        const conversationData = await createFallbackConversation(fallbackId, user.id);
        setConversation(conversationData);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  const sendMessage = useCallback(async (content: string, challengeId?: string) => {
    if (!conversationId || !user || !content.trim()) return false;

    try {
      console.log('Sending message:', content, 'to conversation:', conversationId);

      // Check if this is a fallback conversation
      const isFallback = conversationId.startsWith('fallback_') || conversationId.startsWith('fallback-');
      
      if (isFallback) {
        console.log('Sending message using fallback system');
        
        const parsed = parseFallbackConversationId(conversationId);
        if (!parsed) return false;

        const receiverId = parsed.userId === user.id ? parsed.friendId : parsed.userId;

        const { data: newMessage, error } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content: content.trim(),
            challenge_id: challengeId || null
          })
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
          .single();

        if (error) throw error;

        // Add to local state
        setMessages(prev => [...prev, newMessage]);

        return true;
      } else {
        // Check if conversation tables exist
        const tablesExist = await checkConversationTablesExist();
        
        if (!tablesExist) {
          console.log('Tables don\'t exist, using fallback for sending');
          // Convert to fallback and use fallback logic
          const parsed = parseFallbackConversationId(`fallback_${user.id}_${conversationId}`);
          if (!parsed) return false;

          const receiverId = parsed.userId === user.id ? parsed.friendId : parsed.userId;

          const { data: newMessage, error } = await supabase
            .from('messages')
            .insert({
              sender_id: user.id,
              receiver_id: receiverId,
              content: content.trim(),
              challenge_id: challengeId || null
            })
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
            .single();

          if (error) throw error;

          setMessages(prev => [...prev, newMessage]);
          return true;
        }

        const { data: newMessage, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            receiver_id: user.id, // Keep for backward compatibility, will be ignored
            content: content.trim(),
            challenge_id: challengeId || null
          })
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
          .single();

        if (error) throw error;

        // Add to local state
        setMessages(prev => [...prev, newMessage]);

        // Update conversation updated_at
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        return true;
      }

    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [conversationId, user]);

  const shareChallenge = useCallback(async (challengeId: string) => {
    if (!conversationId || !user) return false;

    try {
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          receiver_id: user.id, // Keep for backward compatibility
          content: null,
          challenge_id: challengeId
        })
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
        .single();

      if (error) throw error;

      // Add to local state
      setMessages(prev => [...prev, newMessage]);

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;

    } catch (error) {
      console.error('Error sharing challenge:', error);
      return false;
    }
  }, [conversationId, user]);

  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversationId, user]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMessage = payload.new as MessageWithChallenge;
        
        // Fetch the full message with relations
        supabase
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
          .eq('id', newMessage.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setMessages(prev => [...prev, data]);
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    console.log('useConversationMessages useEffect triggered:', { conversationId, user: !!user });
    if (conversationId) {
      fetchMessages();
    } else {
      console.log('No conversation ID, clearing messages and conversation');
      setMessages([]);
      setConversation(null);
    }
  }, [conversationId, fetchMessages]);

  return {
    messages,
    conversation,
    loading,
    sendMessage,
    shareChallenge,
    markAsRead,
    fetchMessages
  };
};
