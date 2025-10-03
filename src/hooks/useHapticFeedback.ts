import { useCallback } from 'react';

/**
 * Hook for haptic feedback on mobile devices
 * Provides vibration feedback when available
 */
export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    // Check if vibration is supported
    if ('vibrate' in navigator) {
      try {
        switch (type) {
          case 'light':
            navigator.vibrate(10);
            break;
          case 'medium':
            navigator.vibrate(20);
            break;
          case 'heavy':
            navigator.vibrate([50, 10, 50]);
            break;
        }
      } catch (error) {
        // Silently fail if vibration is not allowed
        console.debug('Haptic feedback not available:', error);
      }
    }
  }, []);

  return { triggerHaptic };
};
