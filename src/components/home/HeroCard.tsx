import React from 'react';
import { motion } from 'framer-motion';

interface HeroCardProps {
  today: number;
  deltaPct?: number;
}

// Animated number component with count-up effect
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0);
  
  React.useEffect(() => {
    const start = performance.now();
    const dur = 800;
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

export const HeroCard: React.FC<HeroCardProps> = ({ today, deltaPct = 0 }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const numberVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.3,
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white bg-gradient-to-r from-[#FF7A3D] via-[#FF4D7E] to-[#A855F7] shadow-[0_10px_30px_rgba(0,0,0,.15)]"
    >
      <div className="flex items-center justify-between">
        {/* Left: Icon Circle */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,.4)] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 ml-4">
          <motion.div
            variants={numberVariants}
            initial="hidden"
            animate="visible"
            className="text-5xl font-extrabold tracking-tight"
          >
            <AnimatedNumber value={today} />
          </motion.div>
          
          <div className="text-lg font-semibold mt-1">
            challenges launched today
          </div>
          
          <div className="text-sm text-white/80 mt-1">
            New adventures await!
          </div>
        </div>

        {/* Delta Badge */}
        {deltaPct > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex-shrink-0 ml-3"
          >
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full px-2.5 py-1">
              <span className="text-xs font-semibold text-green-100">
                +{Math.round(deltaPct)}%
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    </motion.div>
  );
};
