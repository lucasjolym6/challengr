import React from 'react';
import { motion } from 'framer-motion';

interface WeeklyKpiCardProps {
  value: number;
  weeklyGoal: number;
}

// Animated number component with count-up effect
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0);
  
  React.useEffect(() => {
    const start = performance.now();
    const dur = 600;
    const from = 0;
    const to = value;
    
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(step);
    };
    
    requestAnimationFrame(step);
  }, [value]);

  return <span>{display}</span>;
}

export const WeeklyKpiCard: React.FC<WeeklyKpiCardProps> = ({ value, weeklyGoal }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const numberVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.2,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between">
        {/* Left: Text Content */}
        <div className="flex-1">
          <div className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
            Challenges completed this week
          </div>
          <div className="text-[14px] text-zinc-700 dark:text-zinc-300 mt-1">
            On track to beat last week's record
          </div>
        </div>

        {/* Right: Number */}
        <div className="flex-shrink-0 ml-4">
          <motion.div
            variants={numberVariants}
            initial="hidden"
            animate="visible"
            className="text-4xl font-extrabold text-blue-600 dark:text-blue-400"
          >
            <AnimatedNumber value={value} />
          </motion.div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10">
        <div className="flex items-center justify-between text-[12px] text-zinc-500 dark:text-zinc-400">
          <span>Notre objectif cette semaine</span>
          <span>{weeklyGoal} challenges</span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-white/10 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((value / weeklyGoal) * 100, 100)}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
};
