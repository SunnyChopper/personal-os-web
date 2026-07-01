import { useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
import type { Metric } from '@/types/growth-system';
import type { RecoveryLinkableField } from '@/types/fitness';
import { cn } from '@/lib/utils';
import { Select } from '@/components/atoms/Select';

type Props = {
  field: RecoveryLinkableField;
  linkedMetricId: string | undefined;
  metrics: Metric[];
  onLink: (metricId: string) => Promise<void>;
  onUnlink: () => Promise<void>;
  disabled?: boolean;
};

export function RecoveryMetricLinkControl({
  field,
  linkedMetricId,
  metrics,
  onLink,
  onUnlink,
  disabled,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState('');
  const [busy, setBusy] = useState(false);

  const linkedMetric = linkedMetricId ? metrics.find((m) => m.id === linkedMetricId) : undefined;

  const handleLink = async () => {
    if (!selectedMetricId) return;
    setBusy(true);
    try {
      await onLink(selectedMetricId);
      setPickerOpen(false);
      setSelectedMetricId('');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    setBusy(true);
    try {
      await onUnlink();
    } finally {
      setBusy(false);
    }
  };

  if (linkedMetricId) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
        <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Linked to <span className="font-medium">{linkedMetric?.name ?? linkedMetricId}</span>
          {linkedMetric?.unit ? ` (${linkedMetric.unit})` : ''}
        </span>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={handleUnlink}
          className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-0.5 font-medium hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:hover:bg-blue-950/40"
        >
          <Unlink className="h-3 w-3" aria-hidden />
          Unlink
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!pickerOpen ? (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => setPickerOpen(true)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Link to Growth metric
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`metric-link-${field}`}>
            Select metric for {field}
          </label>
          <Select
            id={`metric-link-${field}`}
            value={selectedMetricId}
            onChange={(e) => setSelectedMetricId(e.target.value)}
            disabled={disabled || busy}
            className={cn(
              'rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900'
            )}
          >
            <option value="">Choose metric…</option>
            {metrics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.unit ? ` (${m.unit})` : ''}
              </option>
            ))}
          </Select>
          <button
            type="button"
            disabled={disabled || busy || !selectedMetricId}
            onClick={handleLink}
            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Link
          </button>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => {
              setPickerOpen(false);
              setSelectedMetricId('');
            }}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
