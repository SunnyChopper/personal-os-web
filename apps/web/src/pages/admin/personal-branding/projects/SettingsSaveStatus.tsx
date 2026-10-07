import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

export type SettingsSaveStatusState = 'idle' | 'saving' | 'saved' | 'error';

export interface SettingsSaveStatusProps {
  status: SettingsSaveStatusState;
  onRetry?: () => void;
}

export function SettingsSaveStatus({ status, onRetry }: SettingsSaveStatusProps) {
  if (status === 'idle') return null;

  if (status === 'error') {
    return (
      <div
        className="flex flex-wrap items-center gap-2 text-sm text-red-600 dark:text-red-400"
        role="status"
        aria-live="polite"
      >
        <span>Couldn&apos;t save</span>
        {onRetry ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  const label = status === 'saving' ? 'Saving…' : 'Saved';

  return (
    <p
      className={cn('text-sm text-gray-600 dark:text-gray-400')}
      role="status"
      aria-live="polite"
    >
      {label}
    </p>
  );
}
