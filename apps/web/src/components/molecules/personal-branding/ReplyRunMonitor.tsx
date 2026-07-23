import { Loader2, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/atoms/Card';
import type { ReplyRun } from '@/types/api/personal-branding.dto';

interface ReplyRunMonitorProps {
  runs: ReplyRun[];
  connectionNameById: Map<string, string>;
  onView: (run: ReplyRun) => void;
}

function statusLabel(status: ReplyRun['status']): string {
  switch (status) {
    case 'QUEUED':
      return 'Queued — waiting for worker';
    case 'RUNNING':
      return 'Drafting replies…';
    default:
      return status;
  }
}

export default function ReplyRunMonitor({
  runs,
  connectionNameById,
  onView,
}: ReplyRunMonitorProps) {
  if (runs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
          Reply drafts in progress
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Agent runs continue in the background. You can close Find Content and return here anytime.
        </p>
      </CardHeader>
      <CardBody className="space-y-3">
        {runs.map((run) => {
          const connectionName = connectionNameById.get(run.connectionId) ?? 'Connection';
          const inFlight = run.status === 'QUEUED' || run.status === 'RUNNING';
          return (
            <RunRow
              key={run.id}
              connectionName={connectionName}
              statusLabel={statusLabel(run.status)}
              inFlight={inFlight}
              onView={() => onView(run)}
            />
          );
        })}
      </CardBody>
    </Card>
  );
}

function RunRow({
  connectionName,
  statusLabel: label,
  inFlight,
  onView,
}: {
  connectionName: string;
  statusLabel: string;
  inFlight: boolean;
  onView: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{connectionName}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {inFlight ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : null}
          {label}
        </p>
      </div>
      <Button type="button" size="sm" variant="secondary" onClick={onView}>
        View
      </Button>
    </div>
  );
}
