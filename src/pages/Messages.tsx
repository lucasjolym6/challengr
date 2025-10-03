import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { MessageCircle, Send, Share2, Search, Users as UsersIcon, ArrowLeft, Plus } from "lucide-react";
import { SharedChallengeCard } from "@/components/messages/SharedChallengeCard";
import { CreateGroupDialog } from "@/components/messages/CreateGroupDialog";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import { useConversations } from "@/hooks/useConversations";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { ConversationListItem } from "@/types/conversations";
import { searchFriends as searchFriendsUtil, getAllFriends } from "@/utils/friendSearch";

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
  const { markMessagesAsRead } = useNotifications();
  
  // States
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { conversations, loading: conversationsLoading, fetchConversations, createIndividualConversation, createGroupConversation } = useConversations();
  const { messages, conversation, loading: messagesLoading, sendMessage, shareChallenge, markAsRead } = useConversationMessages(selectedConversationId);

  // Check if we're in a conversation based on URL params
  const conversationId = searchParams.get('conversation_id');
  const isInConversation = Boolean(conversationId);

  useEffect(() => {
    if (user) {
      console.log('Messages: Fetching conversations for user:', user.id);
      fetchConversations();
      fetchChallenges();
    }
  }, [user, fetchConversations]);

  // Debug: Log conversations changes
  useEffect(() => {
    console.log('Messages: Conversations updated:', {
      count: conversations.length,
      conversations: conversations.map(c => ({ id: c.id, name: c.name, type: c.type }))
    });
  }, [conversations]);

  // Mark messages as read when user visits messages page
  useEffect(() => {
    markMessagesAsRead();
  }, [markMessagesAsRead]);

  // Set selected conversation when conversation_id is in URL
  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
    } else {
      setSelectedConversationId(null);
    }
  }, [conversationId]);

  // Mark conversation as read when messages change
  useEffect(() => {
    if (selectedConversationId && messages.length > 0) {
      markAsRead();
    }
  }, [selectedConversationId, messages, markAsRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

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

  const searchFriends = async (query: string) => {
    if (!user) return;

    try {
      const results = await searchFriendsUtil(user.id, query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching friends:', error);
      setSearchResults([]);
    }
  };

  const startNewConversation = async (friendId: string) => {
    if (!user) return;

    try {
      const conversationId = await createIndividualConversation(friendId);
      
      if (conversationId) {
        setSearchParams({ conversation_id: conversationId });
        setShowFriendSearch(false);
        setFriendSearchQuery('');
        setSearchResults([]);
        
        toast({
          title: "Conversation démarrée",
          description: "La conversation a été créée avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer la conversation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la conversation",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
      scrollToBottom();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    }
  };

  const handleShareChallenge = async (challengeId: string) => {
    const success = await shareChallenge(challengeId);
    if (success) {
      scrollToBottom();
      toast({
        title: "Challenge partagé",
        description: "Le challenge a été partagé dans la conversation",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de partager le challenge",
        variant: "destructive"
      });
    }
  };

  const getMessagePreview = (conversation: ConversationListItem) => {
    if (!conversation.lastMessage) return "Aucun message";
    
    if (conversation.lastMessage.challenge_id) {
      return "Vous avez partagé un challenge";
    }
    
    if (conversation.lastMessage.sender_id === user?.id) {
      return `Envoyé: ${conversation.lastMessage.content}`;
    }
    
    return conversation.lastMessage.content;
  };

  const getPreviewStyle = (conversation: ConversationListItem) => {
    if (conversation.lastMessage && conversation.lastMessage.sender_id !== user?.id && conversation.unreadCount > 0) {
      return "font-semibold text-gray-900";
    }
    return "text-gray-600";
  };

  const getConversationDisplayName = (conversation: ConversationListItem) => {
    if (conversation.type === 'group') {
      return conversation.name;
    }
    return conversation.displayName || conversation.name;
  };

  const getConversationAvatar = (conversation: ConversationListItem) => {
    if (conversation.type === 'group') {
      // For groups, show a group icon or first letter of group name
      return null;
    }
    return conversation.avatarUrl;
  };

  const filteredChallenges = challenges.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.challenge_categories.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showFriendsList = !isMobile || !isInConversation;
  const showChatArea = !isMobile || isInConversation;


  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex">
      
      {/* Conversations List */}
      {showFriendsList && (
        <div className={`${isMobile ? 'w-full' : 'w-80'} flex flex-col h-screen`}>
          {/* Header */}
          <div className="bg-white/60 backdrop-blur-xl border-b border-white/20 px-4 py-4 rounded-t-2xl m-2 mb-0 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <MessageCircle className="h-5 w-5 text-orange-600" />
                Messages
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/30 backdrop-blur-sm border border-white/20 hover:bg-white/50 text-gray-700"
                  onClick={() => setShowCreateGroup(true)}
                  title="Créer un groupe"
                >
                  <UsersIcon className="h-5 w-5" />
                </Button>
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
                {conversations.map((conversation) => (
                  <Button
                    key={conversation.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-4 mb-1 rounded-xl bg-white/30 backdrop-blur-sm border border-gray-200/50 hover:bg-white/50 hover:shadow-md hover:border-gray-300/60 transition-all duration-200 relative"
                    onClick={() => setSearchParams({ conversation_id: conversation.id })}
                  >
                    <Avatar className="h-12 w-12 border-2 border-white/30">
                      <AvatarImage src={getConversationAvatar(conversation)} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white">
                        {conversation.type === 'group' 
                          ? conversation.name.charAt(0).toUpperCase()
                          : (conversation.displayName?.charAt(0) || conversation.name.charAt(0))
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-800 truncate">
                          {getConversationDisplayName(conversation)}
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
                      {conversation.type === 'group' && (
                        <p className="text-xs text-gray-500">
                          {conversation.members.length} membres
                        </p>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="absolute top-3 right-3 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-semibold">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Chat Area */}
      {showChatArea && (
        <div className="flex-1 flex flex-col h-screen">
          {selectedConversationId && conversation ? (
            <>
              {/* Chat Header - Fixed at top */}
              <div className="bg-white/60 backdrop-blur-xl border-b border-white/20 px-4 py-3 flex items-center justify-between m-2 mb-0 rounded-t-2xl shadow-lg flex-shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/30 backdrop-blur-sm border border-white/20 hover:bg-white/50"
                      onClick={() => setSearchParams({})}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10 border-2 border-white/30">
                    <AvatarImage src={conversation.type === 'individual' ? conversation.members.find(m => m.user_id !== user?.id)?.profiles.avatar_url : undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white">
                      {conversation.type === 'group' 
                        ? conversation.name.charAt(0).toUpperCase()
                        : (conversation.members.find(m => m.user_id !== user?.id)?.profiles.display_name?.charAt(0) || conversation.members.find(m => m.user_id !== user?.id)?.profiles.username?.charAt(0))
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-800">
                      {conversation.type === 'group' 
                        ? conversation.name
                        : (conversation.members.find(m => m.user_id !== user?.id)?.profiles.display_name || conversation.members.find(m => m.user_id !== user?.id)?.profiles.username)
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {conversation.type === 'group' 
                        ? `${conversation.members.length} membres`
                        : `@${conversation.members.find(m => m.user_id !== user?.id)?.profiles.username}`
                      }
                    </p>
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
                      <Input
                        placeholder="Search challenges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {filteredChallenges.map((challenge) => (
                            <Button
                              key={challenge.id}
                              variant="ghost"
                              className="w-full justify-start gap-3 h-auto py-3"
                              onClick={() => handleShareChallenge(challenge.id)}
                            >
                              <img src={challenge.image_url} alt={challenge.title} className="h-8 w-8 rounded-md object-cover" />
                              <div className="flex-1 text-left">
                                <p className="font-medium text-sm">{challenge.title}</p>
                                <p className="text-xs text-muted-foreground">{challenge.challenge_categories.name}</p>
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
              <div className="flex-1 overflow-hidden m-2 mt-0">
                <ScrollArea className="h-full bg-white/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
                  <div className="p-4 space-y-4">
                    {messages.map((message: any) => {
                      const isOwn = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            {!isOwn && conversation.type === 'group' && (
                              <p className="text-xs text-gray-500 px-1">
                                {message.sender_profile?.display_name || message.sender_profile?.username || 'Unknown'}
                              </p>
                            )}
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
              <div className="bg-white/60 backdrop-blur-xl border-t border-white/20 p-3 md:p-4 m-2 mt-0 rounded-b-2xl shadow-lg flex-shrink-0 sticky bottom-0 z-10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
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
                  Sélectionnez une conversation pour commencer
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
                    key={friend.user_id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => startNewConversation(friend.user_id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white">
                        {friend.display_name?.charAt(0) || friend.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{friend.display_name || friend.username}</p>
                      <p className="text-xs text-muted-foreground">@{friend.username}</p>
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

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onGroupCreated={(groupId) => {
          setSearchParams({ conversation_id: groupId });
          fetchConversations();
        }}
      />
    </div>
  );
}