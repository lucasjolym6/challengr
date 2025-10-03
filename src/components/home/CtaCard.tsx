import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface CtaCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}

export const CtaCard: React.FC<CtaCardProps> = ({ icon, title, subtitle, href }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0, rotate: -10 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: 0.3,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <Link to={href} className="block">
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6 cursor-pointer group"
        role="button"
        aria-label={`${title} - ${subtitle}`}
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="relative flex items-center justify-between">
          {/* Left: Icon + Text */}
          <div className="flex items-center gap-4">
            {/* Icon Chip */}
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="w-12 h-12 bg-gradient-to-br from-white/30 to-white/15 border border-white/40 backdrop-blur-md rounded-2xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,.4)]"
            >
              {icon}
            </motion.div>

            {/* Text Block */}
            <div className="flex-1">
              <div className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {title}
              </div>
              <div className="text-[14px] text-zinc-600 dark:text-zinc-400">
                {subtitle}
              </div>
            </div>
          </div>

          {/* Right: Arrow Button */}
          <motion.div
            className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/10 border border-white/40 backdrop-blur-md rounded-xl flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,.3)]"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </motion.div>
        </div>

        {/* Subtle shine effect */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
    </Link>
  );
};
