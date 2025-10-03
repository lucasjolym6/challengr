/**
 * Level System for Challengr
 * Based on total points accumulated by users
 */

export interface LevelInfo {
  level: number;
  pointsRequired: number;
  pointsForNextLevel: number;
  progressToNextLevel: number; // 0-1
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Level progression based on points:
 * Level 1: 0-49 points (Novice)
 * Level 2: 50-99 points (Rookie) 
 * Level 3: 100-199 points (Pro)
 * Level 4: 200-599 points (Expert)
 * Level 5: 600-1199 points (Master)
 * Level 6: 1200-2399 points (Champion)
 * Level 7: 2400-4799 points (Legend)
 * Level 8: 4800-9599 points (Elite)
 * Level 9: 9600-19199 points (Mythic)
 * Level 10: 19200+ points (Godlike)
 */
export const LEVEL_REQUIREMENTS = [
  { level: 1, points: 0, title: 'Novice', icon: '⭐' },
  { level: 2, points: 50, title: 'Rookie', icon: '⭐' },
  { level: 3, points: 100, title: 'Pro', icon: '⭐⭐' },
  { level: 4, points: 200, title: 'Expert', icon: '⭐⭐⭐' },
  { level: 5, points: 600, title: 'Master', icon: '⭐⭐⭐⭐' },
  { level: 6, points: 1200, title: 'Champion', icon: '🏆' },
  { level: 7, points: 2400, title: 'Legend', icon: '👑' },
  { level: 8, points: 4800, title: 'Elite', icon: '💎' },
  { level: 9, points: 9600, title: 'Mythic', icon: '🔥' },
  { level: 10, points: 19200, title: 'Godlike', icon: '⚡' },
];

export function getLevelFromPoints(totalPoints: number): number {
  // Ensure we handle the case where user has 0 points (should be level 1, not level 0)
  if (totalPoints < 0) totalPoints = 0;
  
  for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_REQUIREMENTS[i].points) {
      return LEVEL_REQUIREMENTS[i].level;
    }
  }
  return 1; // Default to level 1
}

export function getLevelInfo(totalPoints: number): LevelInfo {
  const currentLevel = getLevelFromPoints(totalPoints);
  const currentLevelData = LEVEL_REQUIREMENTS.find(l => l.level === currentLevel)!;
  const nextLevelData = LEVEL_REQUIREMENTS.find(l => l.level === currentLevel + 1);
  
  const pointsForNextLevel = nextLevelData ? nextLevelData.points - totalPoints : 0;
  const progressToNextLevel = nextLevelData 
    ? Math.min(1, (totalPoints - currentLevelData.points) / (nextLevelData.points - currentLevelData.points))
    : 1;

  const colors = getLevelColors(currentLevel);

  return {
    level: currentLevel,
    pointsRequired: currentLevelData.points,
    pointsForNextLevel,
    progressToNextLevel,
    title: currentLevelData.title,
    icon: currentLevelData.icon,
    ...colors
  };
}

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

/**
 * Calculate points earned from completing a challenge
 * Based on difficulty level and bonus multipliers
 */
export function calculateChallengePoints(difficultyLevel: number, basePoints: number = 10): number {
  const difficultyMultipliers = [1, 1.2, 1.5, 2, 3]; // Level 1-5 multipliers
  const multiplier = difficultyMultipliers[Math.min(difficultyLevel - 1, 4)] || 1;
  return Math.round(basePoints * multiplier);
}

/**
 * Update user level based on total points
 * This should be called whenever a user's points change
 */
export async function updateUserLevel(userId: string, totalPoints: number): Promise<number> {
  const newLevel = getLevelFromPoints(totalPoints);
  
  // Update the database
  const { supabase } = await import('@/integrations/supabase/client');
  const { error } = await supabase
    .from('profiles')
    .update({ 
      level: newLevel,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user level:', error);
    throw error;
  }

  return newLevel;
}
