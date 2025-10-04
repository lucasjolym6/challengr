import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthGate } from '@/hooks/useAuthGate';
import { AuthModal } from './AuthModal';

interface ProtectedLinkProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: () => void;
}

export const ProtectedLink: React.FC<ProtectedLinkProps> = ({
  children,
  href,
  className,
  onClick,
  ...props
}) => {
  const { guard, showAuthModal, closeModal } = useAuthGate();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Exécuter l'action onClick si fournie
    onClick?.();
    
    // Utiliser le guard pour vérifier l'authentification
    guard(() => {
      navigate(href);
    });
  };

  return (
    <>
      <Link
        to={href}
        onClick={handleClick}
        className={className}
        {...props}
      >
        {children}
      </Link>

      <AuthModal
        isOpen={showAuthModal}
        onClose={closeModal}
        title="Connexion requise"
        description="Cette action nécessite de créer un compte. Voulez-vous créer un compte maintenant ?"
      />
    </>
  );
};
