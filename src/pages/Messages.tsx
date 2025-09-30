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
import { MessageCircle, Send, Share2, Search, Users as UsersIcon } from "lucide-react";
import { SharedChallengeCard } from "@/components/messages/SharedChallengeCard";
import { format } from "date-fns";

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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
        challenges (
          id,
          title,
          description,
          image_url,
          challenge_categories (
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
        challenge_categories (
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

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex gap-4 p-4">
      {/* Friends List */}
      <Card className="w-full md:w-80 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4 pb-4">
            {friends.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Add friends to start chatting and share challenges!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <Button
                    key={friend.id}
                    variant={selectedFriend?.id === friend.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.profiles.avatar_url} />
                      <AvatarFallback>
                        {friend.profiles.display_name?.charAt(0) || friend.profiles.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{friend.profiles.display_name || friend.profiles.username}</p>
                      <p className="text-xs text-muted-foreground">@{friend.profiles.username}</p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedFriend.profiles.avatar_url} />
                    <AvatarFallback>
                      {selectedFriend.profiles.display_name?.charAt(0) || selectedFriend.profiles.username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedFriend.profiles.display_name || selectedFriend.profiles.username}</h3>
                    <p className="text-xs text-muted-foreground">@{selectedFriend.profiles.username}</p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
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
                      <ScrollArea className="h-96">
                        <div className="space-y-2">
                          {filteredChallenges.map((challenge) => (
                            <Button
                              key={challenge.id}
                              variant="outline"
                              className="w-full h-auto justify-start p-4"
                              onClick={() => sendMessage(challenge.id)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                {challenge.image_url && (
                                  <img
                                    src={challenge.image_url}
                                    alt={challenge.title}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 text-left">
                                  <p className="font-medium">{challenge.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {challenge.description}
                                  </p>
                                </div>
                                <Badge variant="secondary">
                                  {challenge.challenge_categories.icon} {challenge.challenge_categories.name}
                                </Badge>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          {message.challenge_id && message.challenges ? (
                            <SharedChallengeCard challenge={message.challenges} />
                          ) : (
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
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
            </CardContent>
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Select a friend to start chatting
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
