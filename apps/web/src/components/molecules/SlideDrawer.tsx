import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SlideDrawerProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  title?: string;
  header?: ReactNode;
  maxWidth?: 'md' | 'lg';
  panelClassName?: string;
  children: ReactNode;
}

const maxWidthClassName: Record<NonNullable<SlideDrawerProps['maxWidth']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export default function SlideDrawer({
  open,
  onClose,
  ariaLabel,
  title,
  header,
  maxWidth = 'md',
  panelClassName,
  children,
}: SlideDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-[2px]"
            aria-label={`Close ${ariaLabel}`}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={cn(
              'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800',
              maxWidthClassName[maxWidth],
              panelClassName
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              {header ?? (
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
