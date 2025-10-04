import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export const useAuthGate = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const guard = (action?: () => void) => {
    if (user) {
      // Utilisateur connecté - exécuter l'action
      action?.();
    } else {
      // Utilisateur non connecté - ouvrir la modal
      setShowAuthModal(true);
    }
  };

  const closeModal = () => {
    setShowAuthModal(false);
  };

  return {
    guard,
    showAuthModal,
    closeModal,
    isAuthenticated: !!user
  };
};
