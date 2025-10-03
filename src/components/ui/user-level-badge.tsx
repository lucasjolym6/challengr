import React from 'react';

interface UserLevelBadgeProps {
  level: number | string;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const UserLevelBadge: React.FC<UserLevelBadgeProps> = ({ 
  level, 
  size = 'sm', 
  showNumber = true 
}) => {
  // Convert level to number
  const levelNum = typeof level === 'string' ? parseInt(level) || 1 : level || 1;
  const normalizedLevel = Math.min(Math.max(levelNum, 1), 5);
  
  // Level colors and styles
  const getLevelStyle = (level: number) => {
    switch (level) {
      case 1: return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200',
        icon: '⭐',
        label: 'Novice'
      };
      case 2: return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: '⭐',
        label: 'Rookie'
      };
      case 3: return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: '⭐⭐',
        label: 'Pro'
      };
      case 4: return {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: '⭐⭐⭐',
        label: 'Expert'
      };
      case 5: return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: '⭐⭐⭐⭐',
        label: 'Master'
      };
      default: return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200',
        icon: '⭐',
        label: 'Novice'
      };
    }
  };
  
  const style = getLevelStyle(normalizedLevel);
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  return (
    <div className={`
      inline-flex items-center gap-1 rounded-full border
      ${style.bg} ${style.text} ${style.border}
      ${sizeClasses[size]}
      font-medium
    `}>
      <span className="text-xs">{style.icon}</span>
      {showNumber && <span className="font-bold">{normalizedLevel}</span>}
    </div>
  );
};
