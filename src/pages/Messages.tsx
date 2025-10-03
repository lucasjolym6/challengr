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
import { MessageCircle, Send, Share2, Search, Users as UsersIcon, ArrowLeft } from "lucide-react";
import { SharedChallengeCard } from "@/components/messages/SharedChallengeCard";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchChallenges();
    }
  }, [user]);

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

  const fetchFriends = async () => {
    if (!user) return;

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
    } else {
      setFriends([]);
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
    <div className="h-[calc(100vh-8rem)] md:h-screen md:pt-0 flex md:gap-0">
      {/* Friends List - Full screen on mobile, sidebar on desktop */}
      {showFriendsList && (
        <div className={`${isMobile ? 'w-full' : 'w-80 border-r'} flex flex-col bg-card`}>
          <div className="border-b px-4 py-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </h2>
          </div>
          
          <ScrollArea className="flex-1">
            {friends.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <UsersIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Add friends to start chatting and share challenges!
                </p>
              </div>
            ) : (
              <div className="p-2">
                {friends.map((friend) => (
                  <Button
                    key={friend.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-4 mb-1"
                    onClick={() => {
                      setSelectedFriend(friend);
                      if (isMobile) setShowChat(true);
                    }}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={friend.profiles.avatar_url} />
                      <AvatarFallback>
                        {friend.profiles.display_name?.charAt(0) || friend.profiles.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{friend.profiles.display_name || friend.profiles.username}</p>
                      <p className="text-xs text-muted-foreground">@{friend.profiles.username}</p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Chat Area - Full screen on mobile when active, main area on desktop */}
      {showChatArea && (
        <div className="flex-1 flex flex-col bg-card">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowChat(false);
                        setSelectedFriend(null);
                      }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedFriend.profiles.avatar_url} />
                    <AvatarFallback>
                      {selectedFriend.profiles.display_name?.charAt(0) || selectedFriend.profiles.username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">
                      {selectedFriend.profiles.display_name || selectedFriend.profiles.username}
                    </h3>
                    <p className="text-xs text-muted-foreground">@{selectedFriend.profiles.username}</p>
                  </div>
                </div>
                
                {/* Share Challenge Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size={isMobile ? "icon" : "sm"} variant="outline">
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

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
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
                              className={`px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                                  : 'bg-muted rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground px-1">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-3 md:p-4 bg-card">
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
                    className="flex-1 rounded-full"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim()}
                    className="rounded-full flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center space-y-3">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a friend to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
