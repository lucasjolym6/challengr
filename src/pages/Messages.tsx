import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { MessageCircle, Send, Share2, Search, Users as UsersIcon, ArrowLeft, Plus } from "lucide-react";
import { SharedChallengeCard } from "@/components/messages/SharedChallengeCard";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  profiles: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface ConversationPreview {
  friend: Friend;
  lastMessage: {
    content: string;
    sender_id: string;
    created_at: string;
    read_at: string | null;
    challenge_id: string | null;
  } | null;
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  challenge_id: string | null;
  created_at: string;
  read_at: string | null;
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
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  image_url: string;
  challenge_categories: {
    name: string;
    icon: string;
  };
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { markMessagesAsRead } = useNotifications();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchChallenges();
    }
  }, [user]);

  // Mark messages as read when user visits messages page
  useEffect(() => {
    markMessagesAsRead();
  }, [markMessagesAsRead]);

  // Search friends when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (friendSearchQuery.trim()) {
        searchFriends(friendSearchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [friendSearchQuery]);

  // Check if we're in a conversation based on URL params
  const friendId = searchParams.get('friend_id');
  const isInConversation = Boolean(friendId);

  // Set selected friend when friend_id is in URL
  useEffect(() => {
    if (friendId && friends.length > 0) {
      const friend = friends.find(f => f.friend_id === friendId);
      if (friend) {
        setSelectedFriend(friend);
        setShowChat(true);
      }
    } else if (!friendId) {
      setSelectedFriend(null);
      setShowChat(false);
    }
  }, [friendId, friends]);

  useEffect(() => {
    if (selectedFriend && user) {
      fetchMessages();
      
      // Set up realtime subscription for new messages
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            const friendId = selectedFriend.profiles.user_id;
            
            if (newMsg.sender_id === friendId) {
              setMessages(prev => [...prev, newMsg]);
              scrollToBottom();
              markAsRead(newMsg.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedFriend, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Fetch friends where current user is user_id
      const { data: friendsAsUser } = await supabase
        .from('user_friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      // Fetch friends where current user is friend_id
      const { data: friendsAsFriend } = await supabase
        .from('user_friends')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'accepted');

      const allFriendships = [...(friendsAsUser || []), ...(friendsAsFriend || [])];

      if (allFriendships.length > 0) {
        // Extract friend IDs from both directions
        const friendIds = allFriendships.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', friendIds);

        const friendsWithProfiles = allFriendships.map(friend => {
          const friendUserId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
          const profile = profilesData?.find(p => p.user_id === friendUserId);
          return {
            ...friend,
            profiles: profile || {
              user_id: friendUserId,
              username: 'Unknown',
              display_name: 'Unknown User',
              avatar_url: ''
            }
          };
        });

        setFriends(friendsWithProfiles as Friend[]);

        // Now get conversation previews for each friend - only those with messages
        const conversationsWithPreview = await Promise.all(
          friendsWithProfiles.map(async (friend) => {
            const friendUserId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
            
            // Get last message between user and friend
            const { data: lastMessage, error: messageError } = await supabase
              .from('messages')
              .select('content, sender_id, created_at, read_at, challenge_id')
              .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendUserId}),and(sender_id.eq.${friendUserId},receiver_id.eq.${user.id})`)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Only return conversations that have messages
            if (!lastMessage) {
              return null;
            }

            // Get unread count (messages received by user from this friend)
            const { data: unreadMessages } = await supabase
              .from('messages')
              .select('id')
              .eq('sender_id', friendUserId)
              .eq('receiver_id', user.id)
              .is('read_at', null);

            const unreadCount = unreadMessages?.length || 0;

            return {
              friend,
              lastMessage: lastMessage,
              unreadCount,
            };
          })
        );

        // Filter out null conversations (friends without messages)
        const validConversations = conversationsWithPreview.filter(conv => conv !== null);

        // Sort conversations by last message date (most recent first)
        validConversations.sort((a, b) => {
          return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
        });

        setConversations(validConversations);
      } else {
        setFriends([]);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      });
    }
  };

  const fetchFriends = async () => {
    // This function now calls fetchConversations
    fetchConversations();
  };

  // Function to search for friends to start new conversations
  const searchFriends = async (query: string) => {
    if (!user || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('user_id', user.id) // Exclude current user
        .limit(10);

      if (error) {
        console.error('Error searching friends:', error);
        return;
      }

      // Filter out users who are already friends
      const existingFriendIds = friends.map(f => {
        return f.user_id === user.id ? f.friend_id : f.user_id;
      });

      const availableFriends = profiles?.filter(profile => 
        !existingFriendIds.includes(profile.user_id)
      ) || [];

      setSearchResults(availableFriends.map(profile => ({
        id: `search-${profile.user_id}`,
        user_id: user.id,
        friend_id: profile.user_id,
        profiles: profile
      })));
    } catch (error) {
      console.error('Error in searchFriends:', error);
    }
  };

  // Function to start a new conversation
  const startNewConversation = async (friendId: string) => {
    if (!user) return;

    try {
      // Check if friendship already exists
      const { data: existingFriendship } = await supabase
        .from('user_friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .single();

      if (!existingFriendship) {
        // Create friendship
        const { error: friendshipError } = await supabase
          .from('user_friends')
          .insert({
            user_id: user.id,
            friend_id: friendId,
            status: 'accepted'
          });

        if (friendshipError) {
          console.error('Error creating friendship:', friendshipError);
          toast({
            title: "Erreur",
            description: "Impossible de créer la conversation",
            variant: "destructive",
          });
          return;
        }
      }

      // Navigate to conversation
      setSearchParams({ friend_id: friendId });
      setShowFriendSearch(false);
      setFriendSearchQuery('');
      setSearchResults([]);
      
      // Refresh conversations
      fetchConversations();

      toast({
        title: "Conversation créée",
        description: "Vous pouvez maintenant commencer à échanger",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
    }
  };

  // Function to generate preview text based on message state
  const getMessagePreview = (conversation: ConversationPreview) => {
    if (!conversation.lastMessage) {
      return "Aucun message";
    }

    const { lastMessage } = conversation;
    const isSentByUser = lastMessage.sender_id === user?.id;
    const isUnread = lastMessage.read_at === null && !isSentByUser;

    // Handle challenge sharing
    if (lastMessage.challenge_id) {
      const prefix = isSentByUser ? "Vous avez partagé un challenge" : "a partagé un challenge";
      return prefix;
    }

    // Handle text messages
    let preview = lastMessage.content;
    
    if (isSentByUser) {
      // Message sent by user (no response yet)
      preview = `Envoyé: ${preview}`;
    }

    return preview;
  };

  // Function to get preview text style
  const getPreviewStyle = (conversation: ConversationPreview) => {
    if (!conversation.lastMessage) {
      return "text-gray-500 text-sm";
    }

    const { lastMessage } = conversation;
    const isSentByUser = lastMessage.sender_id === user?.id;
    const isUnread = lastMessage.read_at === null && !isSentByUser;

    if (isUnread) {
      return "text-gray-900 text-sm font-semibold"; // Bold for unread received messages
    } else if (isSentByUser) {
      return "text-gray-600 text-sm"; // Normal for sent messages
    } else {
      return "text-gray-700 text-sm"; // Normal for read received messages
    }
  };

  const fetchMessages = async () => {
    if (!user || !selectedFriend) return;

    const friendId = selectedFriend.profiles.user_id;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        challenges!messages_challenge_id_fkey (
          id,
          title,
          description,
          image_url,
          challenge_categories!challenges_category_id_fkey (
            name,
            icon
          )
        )
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);

    // Mark unread messages as read
    const unreadIds = data?.filter(m => m.receiver_id === user.id && !m.read_at).map(m => m.id) || [];
    if (unreadIds.length > 0) {
      unreadIds.forEach(id => markAsRead(id));
    }
  };

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from('challenges')
      .select(`
        id,
        title,
        description,
        image_url,
        challenge_categories!challenges_category_id_fkey (
          name,
          icon
        )
      `)
      .eq('is_active', true)
      .limit(20);

    if (data) {
      setChallenges(data);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);
  };

  const sendMessage = async (challengeId?: string) => {
    if (!user || !selectedFriend || (!newMessage.trim() && !challengeId)) return;

    const friendId = selectedFriend.profiles.user_id;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: challengeId ? null : newMessage.trim(),
        challenge_id: challengeId || null
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return;
    }

    setNewMessage('');
    fetchMessages();
    // Refresh conversations to update previews
    fetchConversations();

    if (challengeId) {
      toast({
        title: "Challenge Shared!",
        description: "Your friend can now start this challenge"
      });
    }
  };

  const filteredChallenges = challenges.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please log in to view messages</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile: Show friends list OR chat, not both
  // Desktop: Show both side-by-side
  const showFriendsList = !isMobile || !showChat;
  const showChatArea = !isMobile || showChat;

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex">
      {/* Friends List - Full screen on mobile, sidebar on desktop */}
      {showFriendsList && (
        <div className={`${isMobile ? 'w-full' : 'w-80'} flex flex-col h-screen`}>
          {/* Header with Liquid Glass effect */}
          <div className="bg-white/60 backdrop-blur-xl border-b border-white/20 px-4 py-4 rounded-t-2xl m-2 mb-0 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <MessageCircle className="h-5 w-5 text-orange-600" />
                Messages
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/30 backdrop-blur-sm border border-white/20 hover:bg-white/50 text-gray-700"
                onClick={() => setShowFriendSearch(true)}
                title="Nouvelle conversation"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 bg-white/40 backdrop-blur-xl m-2 mt-0 rounded-b-2xl shadow-lg border border-white/20">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <MessageCircle className="h-16 w-16 mx-auto text-orange-400" />
                <p className="text-sm text-gray-600">
                  Aucune conversation
                </p>
                <p className="text-xs text-gray-500">
                  Cliquez sur + pour commencer une nouvelle discussion
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {conversations.map((conversation) => {
                  const friend = conversation.friend;
                  const friendUserId = friend.user_id === user?.id ? friend.friend_id : friend.user_id;
                  
                  return (
                    <Button
                      key={friend.id}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto py-4 mb-1 rounded-xl bg-white/30 backdrop-blur-sm border border-gray-200/50 hover:bg-white/50 hover:shadow-md hover:border-gray-300/60 transition-all duration-200 relative"
                      onClick={() => {
                        setSearchParams({ friend_id: friendUserId });
                        setSelectedFriend(friend);
                        if (isMobile) setShowChat(true);
                      }}
                    >
                      <Avatar className="h-12 w-12 border-2 border-white/30">
                        <AvatarImage src={friend.profiles.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white">
                          {friend.profiles.display_name?.charAt(0) || friend.profiles.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-800 truncate">
                            @{friend.profiles.username}
                          </p>
                          {conversation.lastMessage && (
                            <p className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {format(new Date(conversation.lastMessage.created_at), 'HH:mm')}
                            </p>
                          )}
                        </div>
                        <p className={`truncate ${getPreviewStyle(conversation)}`}>
                          {getMessagePreview(conversation)}
                        </p>
                      </div>
                      {/* Unread indicator */}
                      {conversation.unreadCount > 0 && (
                        <div className="absolute top-3 right-3 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-semibold">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Chat Area - Full screen on mobile when active, main area on desktop */}
      {showChatArea && (
        <div className="flex-1 flex flex-col h-screen">
          {selectedFriend ? (
            <>
              {/* Chat Header - Fixed at top */}
              <div className="bg-white/60 backdrop-blur-xl border-b border-white/20 px-4 py-3 flex items-center justify-between m-2 mb-0 rounded-t-2xl shadow-lg flex-shrink-0">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/30 backdrop-blur-sm border border-white/20 hover:bg-white/50"
                      onClick={() => {
                        setSearchParams({});
                        setShowChat(false);
                        setSelectedFriend(null);
                      }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10 border-2 border-white/30">
                    <AvatarImage src={selectedFriend.profiles.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white">
                      {selectedFriend.profiles.display_name?.charAt(0) || selectedFriend.profiles.username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base text-gray-800">
                      {selectedFriend.profiles.display_name || selectedFriend.profiles.username}
                    </h3>
                    <p className="text-xs text-gray-500">@{selectedFriend.profiles.username}</p>
                  </div>
                </div>
                
                {/* Share Challenge Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size={isMobile ? "icon" : "sm"} 
                      className="bg-white/30 backdrop-blur-sm border border-white/20 hover:bg-white/50 text-gray-700"
                    >
                      <Share2 className="h-4 w-4" />
                      {!isMobile && <span className="ml-2">Share</span>}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-full md:max-w-2xl mx-4">
                    <DialogHeader>
                      <DialogTitle>Share a Challenge</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search challenges..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <ScrollArea className="h-[60vh] md:h-96">
                        <div className="space-y-2">
                          {filteredChallenges.map((challenge) => (
                            <Button
                              key={challenge.id}
                              variant="outline"
                              className="w-full h-auto justify-start p-3 text-left"
                              onClick={() => sendMessage(challenge.id)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                {challenge.image_url && (
                                  <img
                                    src={challenge.image_url}
                                    alt={challenge.title}
                                    className="w-12 h-12 object-cover rounded flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{challenge.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {challenge.description}
                                  </p>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Messages - Scrollable area */}
              <div className="flex-1 overflow-hidden m-2 mt-0">
                <ScrollArea className="h-full bg-white/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
                  <div className="p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          {message.challenge_id && message.challenges ? (
                            <SharedChallengeCard challenge={message.challenges} />
                          ) : (
                            <div
                              className={`px-4 py-2 rounded-2xl backdrop-blur-sm border ${
                                isOwn
                                  ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white border-orange-300/30 rounded-br-sm shadow-lg'
                                  : 'bg-white/60 border-white/30 rounded-bl-sm shadow-md'
                              }`}
                            >
                              <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-800'}`}>{message.content}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 px-1">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Message Input - Fixed at bottom */}
              <div className="bg-white/60 backdrop-blur-xl border-t border-white/20 p-3 md:p-4 m-2 mt-0 rounded-b-2xl shadow-lg flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 rounded-full bg-white/50 backdrop-blur-sm border-white/30 focus:bg-white/70 focus:border-orange-300/50"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim()}
                    className="rounded-full flex-shrink-0 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 border-0 shadow-lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 m-2">
              <div className="text-center space-y-3 bg-white/40 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20">
                <MessageCircle className="h-16 w-16 mx-auto text-orange-400" />
                <p className="text-gray-600 font-medium">
                  Select a friend to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Friend Search Dialog */}
      <Dialog open={showFriendSearch} onOpenChange={setShowFriendSearch}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((friend) => (
                  <Button
                    key={friend.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => startNewConversation(friend.profiles.user_id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.profiles.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white">
                        {friend.profiles.display_name?.charAt(0) || friend.profiles.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{friend.profiles.display_name || friend.profiles.username}</p>
                      <p className="text-xs text-muted-foreground">@{friend.profiles.username}</p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            {friendSearchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
