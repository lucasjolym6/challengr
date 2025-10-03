import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Trophy, 
  Flame, 
  CheckCircle,
  TrendingUp,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';

interface KPITileProps {
  icon: React.ReactNode;
  number: number;
  title: string;
  caption: string;
  color: string;
  iconBg: string;
  delay: number;
}

const KPITile: React.FC<KPITileProps> = ({ 
  icon, 
  number, 
  title, 
  caption, 
  color, 
  iconBg,
  delay 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/80 hover:shadow-lg transition-all duration-300">
        {/* Icon */}
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <div className={`w-6 h-6 ${color}`}>
            {icon}
          </div>
        </div>

        {/* Number */}
        <motion.div
          key={number}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "backOut" }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          {number}
          {title.toLowerCase().includes('validation rate') && <span className="text-lg">%</span>}
        </motion.div>

        {/* Title */}
        <div className="text-sm font-semibold text-gray-700 mb-1">
          {title}
        </div>

        {/* Caption */}
        <div className="text-xs text-gray-500">
          {caption}
        </div>
      </div>
    </motion.div>
  );
};

interface KPIGridProps {
  kpis: {
    challengesLaunchedToday: number;
    challengesCompletedThisWeek: number;
    streaksContinuedToday: number;
    validationRateToday: number;
  };
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => {
  const tiles = [
    {
      icon: <Zap className="w-6 h-6" />,
      number: kpis.challengesLaunchedToday,
      title: "Challenges launched today",
      caption: "+12% vs yesterday",
      color: "text-green-600",
      iconBg: "bg-green-100",
      delay: 0.1
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      number: kpis.challengesCompletedThisWeek,
      title: "Challenges completed this week",
      caption: "On track to beat last week",
      color: "text-blue-600",
      iconBg: "bg-blue-100",
      delay: 0.2
    },
    {
      icon: <Flame className="w-6 h-6" />,
      number: kpis.streaksContinuedToday,
      title: "Streaks continued today",
      caption: "Avg streak length: 4.2 days",
      color: "text-orange-600",
      iconBg: "bg-orange-100",
      delay: 0.3
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      number: kpis.validationRateToday,
      title: "Validation rate today",
      caption: "Top category: Cooking",
      color: "text-purple-600",
      iconBg: "bg-purple-100",
      delay: 0.4
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile, index) => (
        <KPITile key={index} {...tile} />
      ))}
    </div>
  );
};
