import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Search, Users, X } from "lucide-react";
import { searchFriends as searchFriendsUtil } from "@/utils/friendSearch";

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (groupId: string) => void;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  open,
  onOpenChange,
  onGroupCreated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setGroupName('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedMembers([]);
    }
  }, [open]);

  // Search for friends when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchFriends(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchFriends = async (query: string) => {
    if (!user) return;

    try {
      const results = await searchFriendsUtil(user.id, query);
      
      // Remove already selected members
      const availableFriends = results.filter(profile => 
        !selectedMembers.some(member => member.user_id === profile.user_id)
      );

      setSearchResults(availableFriends);
    } catch (error) {
      console.error('Error searching friends:', error);
      setSearchResults([]);
    }
  };

  const addMember = (profile: Profile) => {
    if (!selectedMembers.some(member => member.user_id === profile.user_id)) {
      setSelectedMembers([...selectedMembers, profile]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(member => member.user_id !== userId));
  };

  const createGroup = async () => {
    if (!user || selectedMembers.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un membre",
        variant: "destructive"
      });
      return;
    }

    if (!groupName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez donner un nom au groupe",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          name: groupName.trim(),
          type: 'group',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) {
        throw convError;
      }

      // Add creator as member
      const membersToAdd = [
        { conversation_id: conversation.id, user_id: user.id },
        ...selectedMembers.map(member => ({
          conversation_id: conversation.id,
          user_id: member.user_id
        }))
      ];

      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert(membersToAdd);

      if (membersError) {
        throw membersError;
      }

      toast({
        title: "Groupe créé",
        description: `Le groupe "${groupName}" a été créé avec ${selectedMembers.length + 1} membres`,
      });

      onGroupCreated(conversation.id);
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le groupe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            Créer un groupe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom du groupe</label>
            <Input
              placeholder="Nom du groupe..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="rounded-full"
            />
          </div>

          {/* Search Friends */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ajouter des membres</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des amis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Résultats</p>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {searchResults.map((profile) => (
                    <Button
                      key={profile.user_id}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto py-2"
                      onClick={() => addMember(profile)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-xs">
                          {profile.display_name?.charAt(0) || profile.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{profile.display_name || profile.username}</p>
                        <p className="text-xs text-muted-foreground">@{profile.username}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Membres sélectionnés ({selectedMembers.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <Badge key={member.user_id} variant="secondary" className="flex items-center gap-2 py-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-xs">
                        {member.display_name?.charAt(0) || member.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{member.display_name || member.username}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeMember(member.user_id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Create Button */}
          <Button
            onClick={createGroup}
            disabled={loading || selectedMembers.length === 0 || !groupName.trim()}
            className="w-full bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500"
          >
            {loading ? "Création..." : `Créer le groupe (${selectedMembers.length + 1} membres)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
