# 🎯 Level System Setup Guide

## 📋 Overview
This guide explains how to implement the new level system for Challengr based on points accumulation.

### 🎮 Level Progression
- **Level 1 (Novice)**: 0-49 points ⭐
- **Level 2 (Rookie)**: 50-99 points ⭐  
- **Level 3 (Pro)**: 100-199 points ⭐⭐
- **Level 4 (Expert)**: 200-599 points ⭐⭐⭐
- **Level 5 (Master)**: 600-1199 points ⭐⭐⭐⭐
- **Level 6 (Champion)**: 1200-2399 points 🏆
- **Level 7 (Legend)**: 2400-4799 points 👑
- **Level 8 (Elite)**: 4800-9599 points 💎
- **Level 9 (Mythic)**: 9600-19199 points 🔥
- **Level 10 (Godlike)**: 19200+ points ⚡

### 💰 Points Calculation
- **Difficulty 1**: 10 points (x1.0)
- **Difficulty 2**: 12 points (x1.2)
- **Difficulty 3**: 15 points (x1.5)
- **Difficulty 4**: 20 points (x2.0)
- **Difficulty 5**: 30 points (x3.0)

## 🚀 Installation Steps

### Step 1: Execute Core Level System
Run this SQL script in your Supabase SQL Editor:
```sql
-- Execute the contents of UPDATE_LEVEL_SYSTEM.sql
```

### Step 2: Integrate with Existing Challenges
Run this SQL script in your Supabase SQL Editor:
```sql
-- Execute the contents of INTEGRATE_LEVEL_SYSTEM.sql
```

### Step 3: Test the System
Run this SQL script to verify everything works:
```sql
-- Execute the contents of TEST_LEVEL_SYSTEM.sql
```

## 📁 Files Created/Modified

### New Files:
- `src/lib/levelSystem.ts` - Core level system logic
- `src/components/ui/level-progress.tsx` - Level progress component
- `UPDATE_LEVEL_SYSTEM.sql` - Database functions and triggers
- `INTEGRATE_LEVEL_SYSTEM.sql` - Integration with existing challenges
- `TEST_LEVEL_SYSTEM.sql` - Testing queries

### Modified Files:
- `src/components/ui/user-level-badge.tsx` - Updated to use new system
- `src/pages/Home.tsx` - Updated to use new level components

## 🔧 Database Changes

### New Functions:
- `calculate_level_from_points(points)` - Calculate level from total points
- `add_user_points(user_id, points)` - Add points and update level
- `calculate_challenge_points(difficulty, base_points)` - Calculate challenge points
- `complete_challenge_and_award_points(user_id, challenge_id)` - Complete challenge with points
- `handle_challenge_completion()` - Trigger function for automatic point awarding
- `get_user_recent_level_ups(user_id)` - Get recent level up events

### New Tables:
- `challenge_completions_log` - Log of all challenge completions and level ups

### New Views:
- `user_level_info` - User level information with progress
- `leaderboard_with_levels` - Leaderboard with level details

### New Triggers:
- `trigger_update_user_level` - Auto-update level when points change
- `trigger_award_points_on_completion` - Auto-award points when challenge completed

## 🎯 Usage Examples

### Award Points to User:
```sql
SELECT * FROM public.add_user_points('user-id-here', 50);
```

### Complete Challenge with Points:
```sql
SELECT * FROM public.complete_challenge_and_award_points('user-id-here', 'challenge-id-here');
```

### Get User Level Info:
```sql
SELECT * FROM public.user_level_info WHERE user_id = 'user-id-here';
```

### View Leaderboard:
```sql
SELECT * FROM public.leaderboard_with_levels LIMIT 10;
```

## 🔄 Frontend Integration

### Using UserLevelBadge:
```tsx
// Using points (recommended)
<UserLevelBadge totalPoints={user.total_points} size="md" />

// Using level directly
<UserLevelBadge level={user.level} size="sm" />
```

### Using LevelProgress:
```tsx
<LevelProgress totalPoints={user.total_points} size="md" showDetails={true} />
```

### Getting Level Info:
```tsx
import { getLevelInfo } from '@/lib/levelSystem';

const levelInfo = getLevelInfo(user.total_points);
console.log(levelInfo.title); // "Master"
console.log(levelInfo.progressToNextLevel); // 0.75 (75%)
```

## ⚠️ Important Notes

1. **Automatic Level Updates**: Levels are automatically calculated when points change
2. **Existing Data**: The integration script will award points for existing completed challenges
3. **Performance**: The system uses database functions for optimal performance
4. **Security**: All functions use proper RLS policies and security definer where needed
5. **Backward Compatibility**: Existing code will continue to work with the new system

## 🧪 Testing

After installation, test with these scenarios:
1. Complete a challenge and verify points are awarded
2. Check that level updates automatically
3. Verify progress bars show correct percentages
4. Test leaderboard displays correctly
5. Confirm level badges show proper colors and icons

## 🎉 Benefits

- **Gamification**: Clear progression system motivates users
- **Automatic**: No manual intervention needed
- **Scalable**: Supports up to level 10 with room for expansion
- **Performance**: Database-level calculations for speed
- **Flexible**: Easy to adjust point values and level requirements
