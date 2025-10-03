import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface NotificationContextType {
  hasNewMessages: boolean;
  markMessagesAsRead: () => void;
  checkForNewMessages: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Check for new messages using the conversation system
  const checkForNewMessages = useCallback(async () => {
    if (!user) return;

    try {
      // Query for conversations where user has unread messages
      const { data: conversations, error } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          last_read_at
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error checking for new messages:', error);
        return;
      }

      if (!conversations || conversations.length === 0) {
        setHasNewMessages(false);
        return;
      }

      // Check each conversation for unread messages
      let hasUnread = false;
      for (const conv of conversations) {
        const lastReadTime = conv.last_read_at ? new Date(conv.last_read_at) : new Date(0);
        
        const { data: unreadMessages, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conv.conversation_id)
          .neq('sender_id', user.id)
          .gt('created_at', lastReadTime.toISOString())
          .limit(1);

        if (messagesError) {
          console.error('Error checking conversation messages:', messagesError);
          continue;
        }

        if (unreadMessages && unreadMessages.length > 0) {
          hasUnread = true;
          break;
        }
      }

      setHasNewMessages(hasUnread);
    } catch (error) {
      console.error('Error in checkForNewMessages:', error);
    }
  }, [user]);

  // Mark messages as read by updating conversation member last_read_at
  const markMessagesAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      
      // Update all conversation members for this user
      const { error } = await supabase
        .from('conversation_members')
        .update({ last_read_at: now })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      setHasNewMessages(false);
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  }, [user]);

  // Check for new messages on mount and when user changes
  useEffect(() => {
    if (user) {
      checkForNewMessages();
    } else {
      setHasNewMessages(false);
    }
  }, [user, checkForNewMessages]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('message_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Check if this message is for a conversation where the current user is a member
          const { data: memberCheck, error } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', payload.new.conversation_id)
            .eq('user_id', user.id)
            .single();

          if (error || !memberCheck) return;

          // Only show notification if the message is not from the current user
          if (payload.new.sender_id !== user.id) {
            setHasNewMessages(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value: NotificationContextType = {
    hasNewMessages,
    markMessagesAsRead,
    checkForNewMessages,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};