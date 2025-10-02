import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  challenge_id: string | null;
  created_at: string;
  read_at: string | null;
}

interface UseRealtimeMessagesProps {
  selectedFriendId: string | null;
  onNewMessage: (message: Message) => void;
  onConnectionStatusChange: (status: string) => void;
}

export const useRealtimeMessages = ({
  selectedFriendId,
  onNewMessage,
  onConnectionStatusChange
}: UseRealtimeMessagesProps) => {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('Cleaning up realtime channel:', channelRef.current.topic);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const setupRealtime = useCallback(() => {
    if (!user || !selectedFriendId) {
      console.log('Cannot setup realtime: missing user or selectedFriendId');
      return;
    }

    cleanup();

    const channelName = `messages_${user.id}_${selectedFriendId}`;
    console.log('Setting up realtime subscription for channel:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📨 Realtime message received (as receiver):', payload);
          const newMsg = payload.new as Message;
          
          if (newMsg.sender_id === selectedFriendId) {
            console.log('✅ Adding received message to chat:', newMsg);
            onNewMessage(newMsg);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📤 Realtime message received (as sender):', payload);
          const newMsg = payload.new as Message;
          
          if (newMsg.receiver_id === selectedFriendId) {
            console.log('✅ Adding sent message to chat:', newMsg);
            onNewMessage(newMsg);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Realtime subscription status:', status);
        onConnectionStatusChange(status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription successful');
          reconnectAttempts.current = 0;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription failed - WebSocket connection error');
          handleReconnect();
        } else if (status === 'TIMED_OUT') {
          console.warn('⏰ Realtime subscription timed out');
          handleReconnect();
        }
      });

    channelRef.current = channel;
  }, [user, selectedFriendId, onNewMessage, onConnectionStatusChange, cleanup]);

  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached, giving up');
      onConnectionStatusChange('FAILED');
      return;
    }

    reconnectAttempts.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000); // Exponential backoff, max 10s
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setupRealtime();
    }, delay);
  }, [setupRealtime]);

  useEffect(() => {
    setupRealtime();
    
    return cleanup;
  }, [setupRealtime, cleanup]);

  // Return connection status and manual reconnect function
  return {
    reconnect: setupRealtime,
    cleanup
  };
};
