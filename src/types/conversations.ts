import { Database } from '@/integrations/supabase/types';

// Base types from database
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationMember = Database['public']['Tables']['conversation_members']['Row'];
export type GroupConversationSettings = Database['public']['Tables']['group_conversation_settings']['Row'];

// Extended types for UI
export interface ConversationWithMembers extends Conversation {
  members: ConversationMemberWithProfile[];
  lastMessage?: MessageWithChallenge | null;
  unreadCount?: number;
  settings?: GroupConversationSettings;
}

export interface ConversationMemberWithProfile extends ConversationMember {
  profiles: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface MessageWithChallenge extends Database['public']['Tables']['messages']['Row'] {
  challenges?: {
    id: string;
    title: string;
    description: string;
    image_url: string;
    challenge_categories: {
      name: string;
      icon: string;
    };
  };
  sender_profile?: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

// UI helper types
export interface ConversationListItem {
  id: string;
  name: string;
  type: 'individual' | 'group';
  lastMessage?: {
    content: string;
    sender_id: string;
    created_at: string;
    read_at: string | null;
    challenge_id: string | null;
    sender_username?: string;
  } | null;
  unreadCount: number;
  members: ConversationMemberWithProfile[];
  displayName?: string; // For individual conversations, shows the other person's name
  avatarUrl?: string; // For individual conversations, shows the other person's avatar
}

// Group creation types
export interface CreateGroupData {
  name: string;
  memberIds: string[];
}

export interface AddMembersToGroupData {
  conversationId: string;
  memberIds: string[];
}

