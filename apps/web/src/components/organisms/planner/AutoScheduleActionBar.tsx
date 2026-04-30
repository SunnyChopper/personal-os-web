import Button from '@/components/atoms/Button';

export interface AutoScheduleActionBarProps {
  onGenerate: (withLlm: boolean) => void;
  onAutoSchedule: () => void;
  isBusy: boolean;
}

export function AutoScheduleActionBar({
  onGenerate,
  onAutoSchedule,
  isBusy,
}: AutoScheduleActionBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button variant="secondary" disabled={isBusy} onClick={() => onGenerate(false)}>
        Seed week (no LLM)
      </Button>
      <Button variant="secondary" disabled={isBusy} onClick={() => onGenerate(true)}>
        Generate + LLM
      </Button>
      <Button variant="primary" disabled={isBusy} onClick={() => onAutoSchedule()}>
        Auto-schedule
      </Button>
    </div>
  );
}
