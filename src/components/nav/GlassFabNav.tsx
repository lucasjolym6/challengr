import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Home, Trophy, MessageCircle } from 'lucide-react';

// Import custom icons
import homeIcon from '/icons/home-03-Stroke-Rounded.png';
import awardIcon from '/icons/award-01-Stroke-Rounded.png';
import chatQuestionIcon from '/icons/chat-question-Stroke-Rounded.png';

interface GlassFabNavProps {
  position?: 'bottom' | 'top';
}

const GlassFabNav: React.FC<GlassFabNavProps> = ({ 
  position = 'bottom'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerHaptic } = useHapticFeedback();

  const items = [
    { id: "home", label: "Home", icon: <img src={homeIcon} alt="Home" className="h-6 w-6" />, href: "/" },
    { id: "challenges", label: "Challenges", icon: <img src={awardIcon} alt="Challenges" className="h-6 w-6" />, href: "/challenges" },
    { id: "community", label: "Community", icon: <img src={chatQuestionIcon} alt="Community" className="h-6 w-6" />, href: "/community" },
  ];

  const handleItemClick = (href: string) => {
    triggerHaptic('light');
    navigate(href);
  };

  const isActive = (href: string) => {
    // Exact match for home page
    if (href === '/') {
      return location.pathname === '/';
    }
    // For other pages, check if pathname starts with the href
    return location.pathname.startsWith(href);
  };

  const containerClasses = position === 'bottom' 
    ? 'fixed safe-area-bottom left-1/2 -translate-x-1/2 z-50'
    : 'fixed top-4 left-1/2 -translate-x-1/2 z-50';

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-6 px-6 py-4 glass glass-transition rounded-3xl">
        {items.map((item) => (
          <Button
            key={item.id}
            onClick={() => handleItemClick(item.href)}
            className={`
              fab-size glass glass-transition
              flex items-center justify-center
              ${isActive(item.href) ? 'glass-active' : ''}
              hover:scale-105 active:scale-95
              focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
            `}
            aria-label={item.label}
            title={item.label}
          >
            <div className={`${isActive(item.href) ? 'opacity-100' : 'opacity-80'}`}>
              {item.icon}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GlassFabNav;
