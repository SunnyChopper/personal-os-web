'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: DialogSize;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] mx-auto',
};

export default function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50"
          />
          <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'dialog-title' : undefined}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className={cn(
                'relative my-4 flex w-full flex-col rounded-lg bg-white shadow-xl pointer-events-auto dark:bg-gray-800',
                sizeClasses[size],
                size === 'full' && 'h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]',
                size === 'xl' && 'max-h-[calc(100vh-4rem)] md:max-w-4xl',
                size !== 'full' && size !== 'xl' && 'max-h-[calc(100vh-4rem)]',
                className
              )}
            >
              <div className="flex-shrink-0 border-b border-gray-200 px-6 pb-4 pt-6 dark:border-gray-700">
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close dialog"
                  type="button"
                >
                  <X size={24} />
                </button>

                {title ? (
                  <h3
                    id="dialog-title"
                    className="pr-8 text-2xl font-bold text-gray-900 dark:text-white"
                  >
                    {title}
                  </h3>
                ) : null}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 text-gray-700 dark:text-gray-300">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
