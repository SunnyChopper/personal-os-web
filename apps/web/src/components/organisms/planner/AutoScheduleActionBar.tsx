import Button from '@/components/atoms/Button';

export interface AutoScheduleActionBarProps {
  onAutoSchedule: () => void;
  isBusy: boolean;
}

export function AutoScheduleActionBar({ onAutoSchedule, isBusy }: AutoScheduleActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" disabled={isBusy} onClick={() => onAutoSchedule()}>
        {isBusy ? 'Drafting…' : 'Auto-schedule'}
      </Button>
    </div>
  );
}
