import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { testGroupChatSetup, createTestGroup } from '@/utils/testGroupChat';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/components/auth/AuthProvider';

export const GroupChatTest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { conversations, fetchConversations } = useConversations();
  const [testing, setTesting] = useState(false);

  const handleTestSetup = async () => {
    setTesting(true);
    try {
      const success = await testGroupChatSetup();
      toast({
        title: success ? "Test réussi" : "Test échoué",
        description: success 
          ? "Le système de groupes est correctement configuré" 
          : "Il y a des problèmes avec la configuration",
        variant: success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Une erreur est survenue pendant le test",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCreateTestGroup = async () => {
    if (!user) return;
    
    setTesting(true);
    try {
      // Create a test group with just the current user for now
      const group = await createTestGroup("Test Group", [user.id]);
      if (group) {
        toast({
          title: "Groupe créé",
          description: "Le groupe de test a été créé avec succès",
        });
        fetchConversations(); // Refresh the conversations list
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le groupe de test",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Test des Groupes de Discussion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Testez le système de groupes de discussion
          </p>
          
          <Button 
            onClick={handleTestSetup}
            disabled={testing}
            className="w-full"
          >
            {testing ? "Test en cours..." : "Tester la Configuration"}
          </Button>
          
          <Button 
            onClick={handleCreateTestGroup}
            disabled={testing || !user}
            variant="outline"
            className="w-full"
          >
            {testing ? "Création..." : "Créer un Groupe de Test"}
          </Button>
        </div>
        
        {conversations.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Conversations existantes:</h4>
            <div className="space-y-1">
              {conversations.map(conv => (
                <div key={conv.id} className="text-sm p-2 bg-muted rounded">
                  <p><strong>{conv.name}</strong></p>
                  <p className="text-muted-foreground">
                    Type: {conv.type} | Membres: {conv.members.length}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

