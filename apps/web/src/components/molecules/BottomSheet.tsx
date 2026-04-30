import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  maxHeight?: string;
  showDragHandle?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  maxHeight = '90vh',
  showDragHandle = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

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

  // Handle Escape key
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

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged down more than 100px or with sufficient velocity
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          />

          {/* Bottom Sheet - Mobile */}
          <div className="fixed inset-0 z-[70] pointer-events-none md:hidden">
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'bottom-sheet-title' : undefined}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col',
                className
              )}
              style={{ maxHeight, height: maxHeight }}
            >
              {/* Drag Handle */}
              {showDragHandle && (
                <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>
              )}

              {/* Header */}
              <div className="flex-shrink-0 px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  {title && (
                    <h3
                      id="bottom-sheet-title"
                      className="text-xl font-bold text-gray-900 dark:text-white"
                    >
                      {title}
                    </h3>
                  )}
                  <motion.button
                    onClick={onClose}
                    whileTap={{ scale: 0.95 }}
                    className="ml-auto -mr-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                    aria-label="Close"
                  >
                    <X size={24} />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 text-gray-700 dark:text-gray-300">
                {children}
              </div>
            </motion.div>
          </div>

          {/* Desktop: Use regular centered modal */}
          {/* Backdrop - Desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="hidden md:block fixed inset-0 bg-black/50 z-[60]"
          />
          {/* Modal Container - Desktop */}
          <div className="hidden md:flex fixed inset-0 items-center justify-center p-4 z-[70] pointer-events-none overflow-y-auto">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'bottom-sheet-title' : undefined}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl pointer-events-auto relative z-[70] flex flex-col max-h-[calc(100vh-4rem)]',
                className
              )}
            >
              <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label="Close dialog"
                >
                  <X size={24} />
                </button>

                {title && (
                  <h3
                    id="bottom-sheet-title"
                    className="text-2xl font-bold pr-8 text-gray-900 dark:text-white"
                  >
                    {title}
                  </h3>
                )}
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
