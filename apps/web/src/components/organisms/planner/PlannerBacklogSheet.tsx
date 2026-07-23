import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';

import OverlayPortal from '@/components/molecules/OverlayPortal';
import { PlannerBacklogPanel } from '@/components/organisms/planner/PlannerBacklogPanel';
import { overlayBackdropClassName, overlaySurfaceClassName } from '@/lib/overlay-layer';
import { plannerHeadingClassName, plannerMutedClassName } from '@/lib/planner/planner-surfaces';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/growth-system';

export interface PlannerBacklogSheetProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  scheduledTaskIds: Set<string>;
}

export function PlannerBacklogSheet({
  open,
  onClose,
  tasks,
  scheduledTaskIds,
}: PlannerBacklogSheetProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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
            className={cn('fixed inset-0 cursor-default bg-black/40', overlayBackdropClassName)}
            aria-label="Close backlog"
            onClick={onClose}
          />

          <motion.section
            id="planner-backlog-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Backlog"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed inset-x-0 bottom-0 flex max-h-[min(50vh,420px)] flex-col rounded-t-2xl border border-gray-200 border-b-0 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-900',
              overlaySurfaceClassName
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
                <h2 className={`text-sm font-semibold ${plannerHeadingClassName}`}>Backlog</h2>
                <span className={`text-xs ${plannerMutedClassName}`}>Press B to toggle</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close backlog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <PlannerBacklogPanel tasks={tasks} scheduledTaskIds={scheduledTaskIds} />
            </div>
          </motion.section>
        </OverlayPortal>
      ) : null}
    </AnimatePresence>
  );
}
