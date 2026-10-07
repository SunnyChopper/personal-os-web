import { useQuery } from '@tanstack/react-query';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { FormInput } from '@/components/atoms/FormInput';
import { FormField } from '@/components/molecules/FormField';
import { queryKeys } from '@/lib/react-query/query-keys';
import { unwrapApiData } from '@/lib/api-client/unwrap-api-response';
import { proactiveService } from '@/services/proactive.service';
import {
  buildStartTimeClockHint,
  resolveLastRunStatusLabel,
  resolveNextRunStatusLabel,
  START_TIME_DISABLED_HINT,
} from './automation-schedule-display';

export interface AutomationScheduleSectionProps {
  autoEnabled: boolean;
  nextDueAt: string | null | undefined;
  lastRunAt: string | null | undefined;
  startTimeDraft: string;
  startTimeError: string | null;
  onAutoEnabledChange: (enabled: boolean) => void;
  onStartTimeChange: (value: string) => void;
  onStartTimeBlur: () => void;
}

function ScheduleStatusCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

export default function AutomationScheduleSection({
  autoEnabled,
  nextDueAt,
  lastRunAt,
  startTimeDraft,
  startTimeError,
  onAutoEnabledChange,
  onStartTimeChange,
  onStartTimeBlur,
}: AutomationScheduleSectionProps) {
  const preferencesTimeZone = useQuery({
    queryKey: queryKeys.preferences.timeZone(),
    queryFn: async () => unwrapApiData(await proactiveService.getTimeZone()),
    refetchOnWindowFocus: false,
  });

  const nextRunLabel = resolveNextRunStatusLabel(autoEnabled, nextDueAt);
  const lastRunLabel = resolveLastRunStatusLabel(lastRunAt);

  const startTimeHint = autoEnabled
    ? buildStartTimeClockHint(
        startTimeDraft,
        preferencesTimeZone.data?.timeZone,
        !preferencesTimeZone.isPending
      )
    : START_TIME_DISABLED_HINT;

  return (
    <div className="space-y-4">
      <dl className="grid gap-4 sm:grid-cols-2">
        <ScheduleStatusCell label="Next run" value={nextRunLabel} />
        <ScheduleStatusCell label="Last automatic run" value={lastRunLabel} />
      </dl>

      <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
        <FormCheckbox
          checked={autoEnabled}
          onChange={(e) => onAutoEnabledChange(e.target.checked)}
        />
        Run automatically after Trend Stream ingest
      </label>

      <FormField
        label="Start time"
        htmlFor="project-settings-start-time"
        error={startTimeError}
        hint={startTimeHint}
      >
        <FormInput
          id="project-settings-start-time"
          type="time"
          className="w-32"
          value={startTimeDraft}
          disabled={!autoEnabled}
          onChange={(e) => onStartTimeChange(e.target.value)}
          onBlur={onStartTimeBlur}
        />
      </FormField>
    </div>
  );
}
