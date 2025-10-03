import React from 'react';
import { Progress } from '@/components/ui/progress';
import { getLevelInfo } from '@/lib/levelSystem';
import { cn } from '@/lib/utils';

interface LevelProgressProps {
  totalPoints: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ 
  totalPoints, 
  size = 'md',
  showDetails = true 
}) => {
  const levelInfo = getLevelInfo(totalPoints);
  const isMaxLevel = levelInfo.level === 10;
  
  // Debug: Force reload to see new format
  console.log('LevelProgress NEW FORMAT:', {
    totalPoints,
    pointsRequired: levelInfo.pointsRequired,
    pointsForNextLevel: levelInfo.pointsForNextLevel,
    displayFormat: `${totalPoints - levelInfo.pointsRequired}/${levelInfo.pointsForNextLevel} pts`
  });

  const sizeClasses = {
    sm: {
      progress: 'h-2',
      text: 'text-xs',
      spacing: 'gap-1',
      compact: true
    },
    md: {
      progress: 'h-3',
      text: 'text-sm',
      spacing: 'gap-2',
      compact: false
    },
    lg: {
      progress: 'h-4',
      text: 'text-base',
      spacing: 'gap-3',
      compact: false
    }
  };

  const classes = sizeClasses[size];

  // Compact mode for mobile
  if (classes.compact && !showDetails) {
    return (
      <div className="space-y-1">
        <Progress 
          value={levelInfo.progressToNextLevel * 100} 
          className={cn(classes.progress)}
        />
        <div className="flex justify-between items-center">
          <span className={cn('text-muted-foreground font-medium', classes.text)}>
            Niveau {levelInfo.level}
          </span>
          {!isMaxLevel && (
            <span className={cn('text-muted-foreground', classes.text)}>
              {totalPoints - levelInfo.pointsRequired}/{levelInfo.pointsForNextLevel} pts
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', classes.spacing)}>
      {showDetails && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={cn('font-semibold', classes.text)}>
              Niveau {levelInfo.level}
            </span>
            <span className={cn('text-muted-foreground', classes.text)}>
              {levelInfo.title}
            </span>
          </div>
          <span className={cn('text-muted-foreground', classes.text)}>
            {totalPoints} pts
          </span>
        </div>
      )}
      
      <div className="relative">
        <Progress 
          value={levelInfo.progressToNextLevel * 100} 
          className={cn(classes.progress)}
        />
        {!isMaxLevel && showDetails && (
          <div className="flex justify-between mt-1">
            <span className={cn('text-muted-foreground', classes.text)}>
              {totalPoints - levelInfo.pointsRequired}/{levelInfo.pointsForNextLevel} pts
            </span>
            <span className={cn('text-muted-foreground', classes.text)}>
              vers niveau {levelInfo.level + 1}
            </span>
          </div>
        )}
        {isMaxLevel && showDetails && (
          <div className="text-center mt-1">
            <span className={cn('text-emerald-600 font-semibold', classes.text)}>
              Niveau maximum atteint ! 🎉
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
