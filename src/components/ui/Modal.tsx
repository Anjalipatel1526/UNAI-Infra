import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { Card } from './Card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  headerActions,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    full: 'max-w-full m-4'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${sizes[size]} z-10`}
          >
            <Card className="shadow-2xl">
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-brand-border bg-brand-light-grey gap-3">
                <div className="min-w-0 flex-1">
                  {typeof title === 'string' ? (
                    <h3 className="font-semibold text-base text-brand-text truncate">
                      {title}
                    </h3>
                  ) : (
                    title || null
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {headerActions}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-1 rounded-lg hover:bg-brand-border text-brand-dark-grey transition-all duration-150 focus:outline-none cursor-pointer"
                      title="Close"
                    >
                      <IoClose className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                {children}
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
