import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, TrendingUp } from 'lucide-react';

const Community = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 top-16 overflow-hidden bg-gradient-to-b from-[#FFF7F2] via-white to-[#FFF2EC]">
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Communauté
            </h2>
            <p className="text-gray-600 mb-8">
              Rejoignez la discussion autour des défis et partagez vos progrès avec la communauté.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/challenges')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Voir les défis et leurs discussions
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/feed/5526054b-77c2-4d64-8269-13896170c676')}
              className="w-full"
              size="lg"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Exemple de feed de défi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
