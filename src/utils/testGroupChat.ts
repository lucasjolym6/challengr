// Test utilities for group chat functionality
import { supabase } from '@/integrations/supabase/client';

export const testGroupChatSetup = async () => {
  try {
    console.log('Testing group chat setup...');
    
    // Test 1: Check if conversations table exists
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (convError) {
      console.error('Conversations table error:', convError);
      return false;
    }
    
    console.log('✅ Conversations table accessible');
    
    // Test 2: Check if conversation_members table exists
    const { data: members, error: membersError } = await supabase
      .from('conversation_members')
      .select('*')
      .limit(1);
    
    if (membersError) {
      console.error('Conversation members table error:', membersError);
      return false;
    }
    
    console.log('✅ Conversation members table accessible');
    
    // Test 3: Check if messages table has conversation_id column
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('conversation_id')
      .limit(1);
    
    if (messagesError) {
      console.error('Messages table conversation_id error:', messagesError);
      return false;
    }
    
    console.log('✅ Messages table has conversation_id column');
    
    return true;
  } catch (error) {
    console.error('Test setup error:', error);
    return false;
  }
};

export const createTestGroup = async (name: string, memberIds: string[]) => {
  try {
    console.log(`Creating test group: ${name} with ${memberIds.length} members`);
    
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        name,
        type: 'group'
      })
      .select()
      .single();
    
    if (convError) {
      console.error('Error creating conversation:', convError);
      return null;
    }
    
    console.log('✅ Conversation created:', conversation.id);
    
    // Add members
    const members = memberIds.map(userId => ({
      conversation_id: conversation.id,
      user_id: userId
    }));
    
    const { error: membersError } = await supabase
      .from('conversation_members')
      .insert(members);
    
    if (membersError) {
      console.error('Error adding members:', membersError);
      return null;
    }
    
    console.log('✅ Members added to conversation');
    
    return conversation;
  } catch (error) {
    console.error('Error creating test group:', error);
    return null;
  }
};

