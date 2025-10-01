import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Trophy } from "lucide-react";
import ChallengeFeed from "@/components/challenges/ChallengeFeed";
import CommunityStats from "@/components/challenges/CommunityStats";

const Community = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#FFF7F2] via-white to-[#FFF2EC] flex flex-col">
      {/* Navigation Tabs - Minimal */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mt-1 mb-0 bg-white/80 backdrop-blur shrink-0">
          <TabsTrigger value="feed" className="gap-2 text-sm py-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2 text-sm py-2">
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="flex-1 mt-0 overflow-hidden min-h-0">
          <ChallengeFeed />
        </TabsContent>

        <TabsContent value="leaderboard" className="flex-1 mt-0 overflow-hidden min-h-0">
          <CommunityStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;
