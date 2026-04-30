import type { CookedTaskResult } from '@/types/planner';
import Dialog from '@/components/molecules/Dialog';

import { RescueMicroStepList } from './RescueMicroStepList';

export interface CookedTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  result: CookedTaskResult | null;
  error: string | null;
}

export function CookedTaskDrawer({ open, onClose, result, error }: CookedTaskDrawerProps) {
  return (
    <Dialog isOpen={open} onClose={onClose} title="Cooked — micro-steps" size="md">
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
      {result && (
        <div className="space-y-4">
          <RescueMicroStepList steps={result.microSteps} />
          {result.insertedBlocks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Scheduled blocks today
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {result.insertedBlocks.map((b) => (
                  <li key={b.id}>
                    {b.startAt} → {b.endAt}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
