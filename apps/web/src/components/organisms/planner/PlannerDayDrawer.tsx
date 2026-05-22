import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { PlannerCalendarOverlay } from '@/components/organisms/planner/PlannerCalendarOverlay';
import { PlannerDayFocusPanel } from '@/components/organisms/planner/PlannerDayFocusPanel';

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
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-[2px]"
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
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-gradient-to-b from-gray-900 to-gray-950 shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                Plan day
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
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
        </>
      ) : null}
    </AnimatePresence>
  );
}
