import React from 'react';

interface DifficultyCircleProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const DifficultyCircle: React.FC<DifficultyCircleProps> = ({ 
  level, 
  size = 'md', 
  showNumber = true 
}) => {
  // Normalize level to 0-1 range (assuming 1-5 scale)
  const normalizedLevel = Math.min(Math.max((level - 1) / 4, 0), 1);
  
  // Calculate circumference and stroke-dasharray
  const sizeMap = {
    sm: { radius: 12, stroke: 2 },
    md: { radius: 16, stroke: 3 },
    lg: { radius: 20, stroke: 4 }
  };
  
  const { radius, stroke } = sizeMap[size];
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - normalizedLevel);
  
  // Color based on difficulty level
  const getDifficultyColor = (level: number) => {
    if (level <= 1.5) return '#10b981'; // green-500 - easy
    if (level <= 2.5) return '#84cc16'; // lime-500 - beginner
    if (level <= 3.5) return '#f59e0b'; // amber-500 - moderate
    if (level <= 4.5) return '#f97316'; // orange-500 - hard
    return '#ef4444'; // red-500 - expert
  };
  
  const color = getDifficultyColor(level);
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textSizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';
  
  return (
    <div className={`relative ${sizeClass} flex items-center justify-center`}>
      <svg
        className="absolute inset-0 w-full h-full transform -rotate-90"
        viewBox={`0 0 ${(radius + stroke) * 2} ${(radius + stroke) * 2}`}
      >
        {/* Background circle */}
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {showNumber && (
        <span className={`font-bold ${textSizeClass} text-gray-700 relative z-10`}>
          {level}
        </span>
      )}
    </div>
  );
};
