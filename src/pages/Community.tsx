import React from 'react';
import CommunityFeed from "@/components/community/CommunityFeed";

const Community = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7F2] via-white to-[#FFF2EC]">
      <div className="pt-20 pb-6">
        <CommunityFeed />
      </div>
    </div>
  );
};

export default Community;