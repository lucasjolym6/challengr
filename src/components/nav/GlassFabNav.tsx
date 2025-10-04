import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

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
  const [searchParams] = useSearchParams();
  const { triggerHaptic } = useHapticFeedback();

  // Hide navigation when in a conversation (messages page with conversation_id param)
  const isInConversation = location.pathname.startsWith('/messages') && searchParams.get('conversation_id');
  if (isInConversation) {
    return null;
  }

  const items = [
    { id: "home", label: "Home", icon: <img src={homeIcon} alt="Home" className="h-5 w-5" />, href: "/home" },
    { id: "challenges", label: "Challenges", icon: <img src={awardIcon} alt="Challenges" className="h-5 w-5" />, href: "/challenges" },
    { id: "community", label: "Community", icon: <img src={chatQuestionIcon} alt="Community" className="h-5 w-5" />, href: "/community" },
  ];

  const handleItemClick = (href: string) => {
    triggerHaptic('light');
    navigate(href);
  };

  const isActive = (href: string) => {
    const currentPath = location.pathname;
    
    // Exact match for home page
    if (href === '/home') {
      return currentPath === '/home';
    }
    
    // For other pages, check if current path starts with the href
    // This handles sub-routes like /community/thread/123 → Community stays active
    if (currentPath.startsWith(href)) {
      // Additional check: ensure we don't match partial paths
      // e.g., /challenge should not match /challenges
      if (currentPath !== href) {
        const nextChar = currentPath.charAt(href.length);
        return nextChar === '/' || nextChar === '';
      }
      return true;
    }
    
    return false;
  };

  // Get current path for debugging and key generation
  const currentPath = location.pathname;

  const containerClasses = position === 'bottom' 
    ? 'fixed safe-area-bottom left-1/2 -translate-x-1/2 z-50'
    : 'fixed top-4 left-1/2 -translate-x-1/2 z-50';

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-6 px-6 py-4 glass glass-transition rounded-3xl">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Button
              key={item.id}
              onClick={() => handleItemClick(item.href)}
              className={`
                fab-size glass glass-transition
                flex items-center justify-center
                ${active 
                  ? 'bg-gradient-to-r from-orange-400/30 to-pink-400/30 border-orange-400/60 shadow-lg shadow-orange-400/20' 
                  : 'hover:bg-white/10'
                }
                hover:scale-105 active:scale-95
                focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                transition-all duration-200
              `}
              aria-label={item.label}
              title={item.label}
            >
              <div className={`${active ? 'opacity-100 brightness-110' : 'opacity-80'} transition-all duration-200`}>
                {item.icon}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default GlassFabNav;
