import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import OverlayPortal from '@/components/molecules/OverlayPortal';
import { PlannerCalendarOverlay } from '@/components/organisms/planner/PlannerCalendarOverlay';
import { PlannerDayFocusPanel } from '@/components/organisms/planner/PlannerDayFocusPanel';
import { overlayBackdropClassName, overlaySurfaceClassName } from '@/lib/overlay-layer';
import { plannerDrawerShellClassName, plannerMutedClassName } from '@/lib/planner/planner-surfaces';
import { cn } from '@/lib/utils';

export interface PlannerDayDrawerProps {
  open: boolean;
  focusDateISO: string;
  onClose: () => void;
  onFocusDateChange: (iso: string) => void;
  onCommitted?: () => void;
}

export function PlannerDayDrawer({
  open,
  focusDateISO,
  onClose,
  onFocusDateChange,
  onCommitted,
}: PlannerDayDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
        <OverlayPortal>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-0 cursor-default bg-black/50 backdrop-blur-[2px]',
              overlayBackdropClassName
            )}
            aria-label="Close day planner"
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Day planner"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={cn(
              'fixed inset-y-0 right-0 flex w-full max-w-md flex-col',
              overlaySurfaceClassName,
              plannerDrawerShellClassName
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/10">
              <h2
                className={`text-sm font-semibold uppercase tracking-wide ${plannerMutedClassName}`}
              >
                Plan day
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <PlannerDayFocusPanel
                focusDateISO={focusDateISO}
                onFocusDateChange={onFocusDateChange}
                onCommitted={onCommitted}
              />
              <PlannerCalendarOverlay />
            </div>
          </motion.aside>
        </OverlayPortal>
      ) : null}
    </AnimatePresence>
  );
}
