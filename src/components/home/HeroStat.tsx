import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface HeroStatProps {
  number: number;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

export const HeroStat: React.FC<HeroStatProps> = ({ 
  number, 
  label, 
  subtitle, 
  icon 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8 shadow-xl"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
      
      <div className="relative z-10 flex items-center gap-6">
        {/* Animated Icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {icon}
          </div>
        </motion.div>

        <div className="flex-1">
          {/* Large Animated Number */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: "backOut",
              delay: 0.2 
            }}
            className="text-5xl md:text-6xl font-bold text-white mb-2"
          >
            <motion.span
              key={number}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {number}
            </motion.span>
          </motion.div>

          {/* Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg md:text-xl font-semibold text-white/90 mb-1"
          >
            {label}
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-sm text-white/70"
          >
            {subtitle}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
