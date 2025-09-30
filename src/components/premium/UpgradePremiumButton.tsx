import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePremiumButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const UpgradePremiumButton = ({ 
  variant = 'default', 
  size = 'default',
  className = ''
}: UpgradePremiumButtonProps) => {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => navigate('/pricing')}
    >
      <Crown className="w-4 h-4 mr-2" />
      Upgrade to Premium
    </Button>
  );
};
