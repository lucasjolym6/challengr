import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  Palette, 
  Heart, 
  Users, 
  Star,
  Plus,
  CheckCircle,
  Trophy,
  Flame,
  Sparkles
} from "lucide-react";
import { useSpring, animated } from '@react-spring/web';

export type FilterType = 'all' | 'fitness' | 'creative' | 'lifestyle' | 'friends' | 'my_challenges' | 'trending' | 'verified' | 'completed';

interface FeedFiltersProps {
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
}

const filterConfig = {
  all: { 
    label: 'All', 
    emoji: '🌟', 
    shortLabel: 'All',
    color: '#8B5CF6'
  },
  trending: { 
    label: 'Trending', 
    emoji: '🔥', 
    shortLabel: 'Trending',
    color: '#F59E0B'
  },
  verified: { 
    label: 'Verified', 
    emoji: '✅', 
    shortLabel: 'Verified',
    color: '#10B981'
  },
  completed: { 
    label: 'Completed', 
    emoji: '🏆', 
    shortLabel: 'Completed',
    color: '#3B82F6'
  },
  fitness: { 
    label: 'Fitness', 
    emoji: '🏋️', 
    shortLabel: 'Fitness',
    color: '#EF4444'
  },
  creative: { 
    label: 'Creative', 
    emoji: '🎨', 
    shortLabel: 'Creative',
    color: '#8B5CF6'
  },
  lifestyle: { 
    label: 'Lifestyle', 
    emoji: '🌱', 
    shortLabel: 'Lifestyle',
    color: '#10B981'
  },
  friends: { 
    label: 'Friends', 
    emoji: '👥', 
    shortLabel: 'Friends',
    color: '#06B6D4'
  },
  my_challenges: { 
    label: 'My Challenges', 
    emoji: '⭐', 
    shortLabel: 'Mine',
    color: '#F59E0B'
  },
};

const FeedFilters: React.FC<FeedFiltersProps> = ({ activeFilters, onFilterChange }) => {
  const [showMoreModal, setShowMoreModal] = useState(false);
  
  const [filterAnimation, setFilterAnimation] = useSpring(() => ({
    scale: 1,
    opacity: 1,
  }));

  const handleFilterToggle = (filter: FilterType) => {
    setFilterAnimation.start({
      from: { scale: 1, opacity: 1 },
      to: { scale: 0.95, opacity: 0.8 },
      reset: true
    });

    if (filter === 'all') {
      onFilterChange(['all']);
      return;
    }

    const newFilters = activeFilters.includes(filter)
      ? activeFilters.filter(f => f !== filter)
      : [...activeFilters.filter(f => f !== 'all'), filter];

    // If no filters selected, default to 'all'
    if (newFilters.length === 0) {
      onFilterChange(['all']);
    } else {
      onFilterChange(newFilters);
    }
  };

  // Main filter chips (always visible)
  const mainFilters: FilterType[] = ['all', 'trending', 'verified', 'completed', 'fitness', 'creative', 'lifestyle'];
  
  // Additional filters (in + More modal)
  const additionalFilters: FilterType[] = ['friends', 'my_challenges'];

  return (
    <div className="space-y-3">
      {/* iOS26-Style Filter Chips - Horizontal Scrollable */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Main Filter Chips */}
        {mainFilters.map((filterKey) => {
          const config = filterConfig[filterKey];
          const isActive = activeFilters.includes(filterKey);

          return (
            <animated.div
              key={filterKey}
              style={filterAnimation}
              className="flex-shrink-0"
            >
              <button
                onClick={() => handleFilterToggle(filterKey)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-300 backdrop-blur-xl border ${
                  isActive
                    ? 'text-white shadow-lg transform scale-105'
                    : 'bg-white/60 text-gray-700 border-white/20 hover:bg-white/80 hover:scale-105'
                }`}
                style={isActive ? {
                  background: `linear-gradient(135deg, ${config.color}CC 0%, ${config.color}99 100%)`,
                  boxShadow: `0 8px 32px ${config.color}40, inset 0 1px 0 rgba(255,255,255,0.3)`
                } : {}}
              >
                <span className="text-base">{config.emoji}</span>
                <span>{config.shortLabel}</span>
              </button>
            </animated.div>
          );
        })}

        {/* + More Chip */}
        <animated.div
          style={filterAnimation}
          className="flex-shrink-0"
        >
          <button
            onClick={() => setShowMoreModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-white/60 backdrop-blur-xl border border-white/20 text-gray-700 hover:bg-white/80 hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            <span>More</span>
          </button>
        </animated.div>
      </div>

      {/* More Filters Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white/90 backdrop-blur-xl rounded-t-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">More Filters</h3>
              <button
                onClick={() => setShowMoreModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45 text-gray-600" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {additionalFilters.map((filterKey) => {
                const config = filterConfig[filterKey];
                const isActive = activeFilters.includes(filterKey);

                return (
                  <button
                    key={filterKey}
                    onClick={() => {
                      handleFilterToggle(filterKey);
                      setShowMoreModal(false);
                    }}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 backdrop-blur-xl border ${
                      isActive
                        ? 'text-white shadow-lg'
                        : 'bg-white/60 text-gray-700 border-white/20 hover:bg-white/80'
                    }`}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${config.color}CC 0%, ${config.color}99 100%)`,
                      boxShadow: `0 8px 32px ${config.color}40, inset 0 1px 0 rgba(255,255,255,0.3)`
                    } : {}}
                  >
                    <span className="text-base">{config.emoji}</span>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedFilters;
