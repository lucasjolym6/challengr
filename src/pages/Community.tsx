import React from 'react';
import CommunityFeed from "@/components/community/CommunityFeed";

const Community = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7F2] via-white to-[#FFF2EC]">
      {/* Orange header section like Home page */}
      <div className="relative bg-gradient-to-br from-orange-500/20 via-orange-400/15 to-orange-300/10 border-b border-border/40 -mt-20 pt-20">
        <div className="h-16"></div>
      </div>
      
      <div className="pb-6">
        <CommunityFeed />
      </div>
    </div>
  );
};

export default Community;