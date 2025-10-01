import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Trophy } from "lucide-react";
import ChallengeFeed from "@/components/challenges/ChallengeFeed";
import CommunityStats from "@/components/challenges/CommunityStats";

const Community = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');

  return (
    <div className="fixed inset-0 top-16 overflow-hidden bg-gradient-to-b from-[#FFF7F2] via-white to-[#FFF2EC]">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full">
        {/* Fixed Header Tabs */}
        <TabsList className="fixed top-16 left-1/2 -translate-x-1/2 z-40 grid w-full max-w-md grid-cols-2 bg-white/80 backdrop-blur shadow-lg">
          <TabsTrigger 
            value="feed" 
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-pink-400 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Feed
          </TabsTrigger>
          <TabsTrigger 
            value="leaderboard" 
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-blue-400 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="h-full pt-16">
          <ChallengeFeed />
        </TabsContent>

        <TabsContent value="leaderboard" className="h-full pt-16">
          <CommunityStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;
