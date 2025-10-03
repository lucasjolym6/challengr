import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Target, Activity, CheckCircle } from 'lucide-react';

interface ChallengesHeaderProps {
  activeChallenges: number;
  completedChallenges: number;
  onCreateChallenge: () => void;
}

// Generate consistent daily numbers based on date (same for all users)
const generateDailyConsistentNumber = (baseRange: number, maxRange: number, seed: string): number => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const combinedSeed = `${dateString}-${seed}`;
  
  // Simple hash function to generate consistent number
  let hash = 0;
  for (let i = 0; i < combinedSeed.length; i++) {
    const char = combinedSeed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert hash to number within range
  const normalized = Math.abs(hash) / 2147483647; // Normalize to 0-1
  return Math.floor(baseRange + (normalized * (maxRange - baseRange)));
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  delay?: number;
}> = ({ icon, value, label, color, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-lite p-4 rounded-2xl text-center"
    >
      <div className="flex justify-center mb-3">
        <div className="chip w-12 h-12 flex items-center justify-center">
          <div className={`${color} text-lg`}>
            {icon}
          </div>
        </div>
      </div>
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.2 }}
        className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-1 ${color}`}
      >
        {value}
      </motion.div>
      <div className="text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-2 h-1 w-8 mx-auto rounded-full bg-gradient-to-r from-orange-400/70 to-pink-500/70" />
    </motion.div>
  );
};

export const ChallengesHeader: React.FC<ChallengesHeaderProps> = ({
  activeChallenges,
  completedChallenges,
  onCreateChallenge
}) => {
  const [launchedToday, setLaunchedToday] = useState(0);

  useEffect(() => {
    // Get the same number as Home page for consistency
    const launchedTodayValue = generateDailyConsistentNumber(5, 18, 'launched');
    setLaunchedToday(launchedTodayValue);
  }, []);
  return (
    <div className="relative bg-gradient-to-br from-orange-500/20 via-orange-400/15 to-orange-300/10 border-b border-border/40 -mt-20 pt-20">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Challenges
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Push your limits, track your progress, and achieve your goals
          </p>
        </motion.div>

        {/* Create Challenge Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <Button
            size="lg"
            onClick={onCreateChallenge}
            className="h-14 px-8 font-semibold shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 rounded-full"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Challenge
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          <StatCard
            icon={<Target className="w-5 h-5" />}
            value={launchedToday}
            label="Posted Today"
            color="text-zinc-900 dark:text-zinc-100"
            delay={0.5}
          />
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            value={activeChallenges}
            label="Active"
            color="text-orange-600 dark:text-orange-400"
            delay={0.6}
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            value={completedChallenges}
            label="Completed"
            color="text-green-600 dark:text-green-400"
            delay={0.7}
          />
        </motion.div>
      </div>
    </div>
  );
};
