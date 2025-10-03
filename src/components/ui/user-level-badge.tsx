import React from 'react';
import { cn } from '@/lib/utils';
import { getLevelInfo, LEVEL_REQUIREMENTS } from '@/lib/levelSystem';

interface UserLevelBadgeProps {
  level?: number;
  totalPoints?: number;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

export const UserLevelBadge: React.FC<UserLevelBadgeProps> = ({ 
  level, 
  totalPoints, 
  size = 'md', 
  showTitle = true 
}) => {
  // Use totalPoints if provided, otherwise use level
  const levelInfo = totalPoints ? getLevelInfo(totalPoints) : 
    (level ? LEVEL_REQUIREMENTS.find(l => l.level === level) : LEVEL_REQUIREMENTS[0]);

  if (!levelInfo) {
    return null;
  }

  const colors = getLevelColors(levelInfo.level);
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      colors.bgColor,
      colors.color,
      colors.borderColor,
      sizeClasses[size]
    )}>
      <span className="text-xs">{levelInfo.icon}</span>
      <span className="font-bold">{levelInfo.level}</span>
      {showTitle && size !== 'sm' && <span className="ml-1">{levelInfo.title}</span>}
    </div>
  );
};

function getLevelColors(level: number) {
  switch (level) {
    case 1: return {
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200'
    };
    case 2: return {
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200'
    };
    case 3: return {
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200'
    };
    case 4: return {
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200'
    };
    case 5: return {
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200'
    };
    case 6: return {
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200'
    };
    case 7: return {
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200'
    };
    case 8: return {
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-100',
      borderColor: 'border-indigo-200'
    };
    case 9: return {
      color: 'text-pink-700',
      bgColor: 'bg-pink-100',
      borderColor: 'border-pink-200'
    };
    case 10: return {
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      borderColor: 'border-emerald-200'
    };
    default: return {
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200'
    };
  }
}