import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [lastReadTime, setLastReadTime] = useState<Date | null>(null);

  // Check for new messages
  const checkForNewMessages = async () => {
    if (!user) return;

    try {
      // Get the last time user visited messages page from localStorage
      const storedLastRead = localStorage.getItem(`lastReadMessages_${user.id}`);
      const lastRead = storedLastRead ? new Date(storedLastRead) : null;

      // Query for messages received after last read time
      let query = supabase
        .from('messages')
        .select('id, created_at')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastRead) {
        query = query.gt('created_at', lastRead.toISOString());
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('Error checking for new messages:', error);
        return;
      }

      setHasNewMessages(messages && messages.length > 0);
    } catch (error) {
      console.error('Error in checkForNewMessages:', error);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = () => {
    if (user) {
      const now = new Date();
      localStorage.setItem(`lastReadMessages_${user.id}`, now.toISOString());
      setLastReadTime(now);
      setHasNewMessages(false);
    }
  };

  // Check for new messages on mount and when user changes
  useEffect(() => {
    if (user) {
      // Get stored last read time
      const storedLastRead = localStorage.getItem(`lastReadMessages_${user.id}`);
      if (storedLastRead) {
        setLastReadTime(new Date(storedLastRead));
      }
      
      // Initial check
      checkForNewMessages();
    }
  }, [user]);

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
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          // Check if this is a new message after last read time
          const messageTime = new Date(payload.new.created_at);
          const storedLastRead = localStorage.getItem(`lastReadMessages_${user.id}`);
          
          if (!storedLastRead || messageTime > new Date(storedLastRead)) {
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
