import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Kpi = { 
  id: 'points' | 'active' | 'level'; 
  value: number; 
  label: string; 
  icon: React.ReactNode;
};

type Props = { 
  items: Kpi[];
};

// Animated number component with count-up effect
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    const start = performance.now();
    const dur = 500;
    const from = display;
    const to = value;
    
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(step);
    };
    
    requestAnimationFrame(step);
  }, [value, display]);

  return <span>{display}</span>;
}

export default function UserKpiTiles({ items }: Props) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.18,
        staggerChildren: 0.1
      }
    }
  };

  const tileVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.18,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-3 sm:gap-4"
      role="group"
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          variants={tileVariants}
          className="relative overflow-hidden rounded-2xl border border-white/25 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_10px_30px_rgba(0,0,0,.12)] px-3 py-4 sm:py-5 flex flex-col items-center text-center"
          role="group"
          aria-label={`${item.value} ${item.label.toLowerCase()}`}
        >
          {/* Icon Chip */}
          <motion.div
            className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-white/30 to-white/10 border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,.6)] mb-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {item.icon}
          </motion.div>

          {/* Number */}
          <motion.div
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
          >
            <AnimatedNumber value={item.value} />
          </motion.div>

          {/* Micro-accent underline */}
          <motion.div
            className="mt-1 h-1.5 w-8 sm:w-9 rounded-full bg-gradient-to-r from-orange-400/70 to-pink-500/70"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
          />

          {/* Label */}
          <motion.div
            className="mt-1 text-[11px] sm:text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
          >
            {item.label}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}
