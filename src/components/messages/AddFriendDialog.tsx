import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserPlus, Search, Users } from 'lucide-react';

interface User {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

interface AddFriendDialogProps {
  onFriendAdded?: () => void;
}

export const AddFriendDialog: React.FC<AddFriendDialogProps> = ({ onFriendAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = users.filter(u => 
      u.user_id !== user?.id && // Don't show current user
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery, user?.id]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching all users for friend addition...');
      
      // Use the function we created in the SQL script
      const { data, error } = await supabase
        .rpc('get_all_users_for_messaging');

      console.log('Users fetch result:', { data, error });

      if (error) {
        console.error('Error fetching users:', error);
        // Fallback to direct query if function doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .neq('user_id', user?.id || '');

        if (fallbackError) {
          throw fallbackError;
        }
        setUsers(fallbackData || []);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendUserId: string) => {
    if (!user) return;

    setAddingFriend(friendUserId);
    try {
      console.log('Adding friend:', { user_id: user.id, friend_id: friendUserId });

      // Use the function we created in the SQL script
      const { data, error } = await supabase
        .rpc('add_test_friendship', {
          user1_id: user.id,
          user2_id: friendUserId
        });

      console.log('Add friend result:', { data, error });

      if (error) {
        console.error('Error adding friend:', error);
        // Fallback to direct insert if function doesn't exist
        const { error: insertError } = await supabase
          .from('user_friends')
          .insert([
            { user_id: user.id, friend_id: friendUserId, status: 'accepted' },
            { user_id: friendUserId, friend_id: user.id, status: 'accepted' }
          ]);

        if (insertError) {
          throw insertError;
        }
      }

      toast({
        title: "Friend Added!",
        description: "You can now send messages to this user"
      });

      onFriendAdded?.();
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: "Error",
        description: "Failed to add friend",
        variant: "destructive"
      });
    } finally {
      setAddingFriend(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Add a Friend
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-64">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No users found matching your search' : 'No other users found'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.display_name?.charAt(0) || user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.display_name || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addFriend(user.user_id)}
                      disabled={addingFriend === user.user_id}
                    >
                      {addingFriend === user.user_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
