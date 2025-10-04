import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, User, Lock, Mail, Trophy, Sparkles } from 'lucide-react';
import { useSpring, animated } from '@react-spring/web';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Connexion requise",
  description = "Cette action nécessite de créer un compte. Voulez-vous créer un compte maintenant ?"
}) => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Animation pour l'ouverture/fermeture
  const backdropAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { tension: 300, friction: 30 }
  });

  const modalAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.96,
    y: isOpen ? 0 : 8,
    config: { 
      type: 'spring', 
      stiffness: 420, 
      damping: 28 
    }
  });

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus sur le modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restaurer le focus
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Gérer Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.documentElement.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleGoBack = () => {
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Échec de la connexion",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bienvenue !",
        description: "Vous êtes maintenant connecté.",
      });
      onClose();
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    if (!email || !password || !username) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, username);

    if (error) {
      toast({
        title: "Échec de l'inscription",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bienvenue sur Challengr !",
        description: "Votre compte a été créé avec succès.",
      });
      onClose();
    }

    setLoading(false);
  };

  const handleCreateAccount = () => {
    onClose();
    navigate('/auth');
  };

  if (!isOpen) return null;

  const modalContent = (
    <animated.div
      style={backdropAnimation}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <animated.div
        ref={modalRef}
        style={modalAnimation}
        className="relative w-full max-w-sm rounded-2xl bg-white/80 dark:bg-zinc-900/80 shadow-xl ring-1 ring-black/5 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="relative p-5 pb-4">
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </button>

          {/* Icône et titre */}
          <div className="text-center pr-8">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 id="modal-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h2>
            <p id="modal-description" className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                onClick={handleCreateAccount}
                className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-400 transition-colors w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Créer un compte
              </Button>
            </motion.div>
            <Button
              onClick={onClose}
              variant="outline"
              className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-orange-400 transition-colors"
            >
              Non, plus tard
            </Button>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );

  // Rendre dans un portal
  const modalRoot = document.getElementById('modal-root') || document.body;
  return createPortal(modalContent, modalRoot);
};