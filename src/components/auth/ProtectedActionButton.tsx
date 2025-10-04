import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthGate } from '@/hooks/useAuthGate';
import { AuthModal } from './AuthModal';

interface ProtectedActionButtonProps {
  children: React.ReactNode;
  onAuthed?: () => void;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const ProtectedActionButton: React.FC<ProtectedActionButtonProps> = ({
  children,
  onAuthed,
  onClick,
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  type = 'button',
  ...props
}) => {
  const { guard, showAuthModal, closeModal } = useAuthGate();

  const handleClick = () => {
    if (disabled) return;
    
    // Exécuter l'action onClick si fournie
    onClick?.();
    
    // Utiliser le guard pour vérifier l'authentification
    guard(onAuthed);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className={className}
        variant={variant}
        size={size}
        disabled={disabled}
        type={type}
        {...props}
      >
        {children}
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={closeModal}
        title="Connexion requise"
        description="Cette action nécessite de créer un compte. Voulez-vous créer un compte maintenant ?"
      />
    </>
  );
};
