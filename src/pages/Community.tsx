import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Trophy } from "lucide-react";
import ChallengeFeed from "@/components/challenges/ChallengeFeed";
import CommunityStats from "@/components/challenges/CommunityStats";

const Community = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Community
        </h1>
        <p className="text-muted-foreground">
          Connect with others, share your progress, and see who's leading the way
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Community Feed
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <ChallengeFeed />
        </TabsContent>

        <TabsContent value="leaderboard">
          <CommunityStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;
