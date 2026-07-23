import { cn } from '@/lib/utils';
import type {
  PlatformRuleCatalogEntry,
  RhetoricalDeviceId,
} from '@/types/api/personal-branding.dto';

interface RhetoricalDeviceSelectorProps {
  catalog: PlatformRuleCatalogEntry[];
  value: RhetoricalDeviceId[];
  onChange: (next: RhetoricalDeviceId[]) => void;
  disabled?: boolean;
  hideLegend?: boolean;
  density?: 'comfortable' | 'compact';
}

export default function RhetoricalDeviceSelector({
  catalog,
  value,
  onChange,
  disabled = false,
  hideLegend = false,
  density = 'comfortable',
}: RhetoricalDeviceSelectorProps) {
  const compact = density === 'compact';
  const selected = new Set(value);

  const toggle = (deviceId: RhetoricalDeviceId) => {
    if (selected.has(deviceId)) {
      onChange(value.filter((id) => id !== deviceId));
      return;
    }
    onChange([...value, deviceId]);
  };

  return (
    <fieldset disabled={disabled} className={cn(compact ? 'space-y-2' : 'space-y-3')}>
      {!hideLegend && (
        <legend className="text-sm font-medium text-gray-900 dark:text-white">
          Allowed rhetorical devices
        </legend>
      )}
      <ul className={cn('grid gap-2 sm:grid-cols-2', compact && 'gap-1.5')}>
        {catalog.map((entry) => {
          const deviceId = entry.id as RhetoricalDeviceId;
          const checked = selected.has(deviceId);
          return (
            <li key={entry.id}>
              <label
                className={cn(
                  'flex h-full cursor-pointer items-start gap-2 rounded-lg border',
                  compact ? 'p-2' : 'p-3',
                  checked
                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => toggle(deviceId)}
                  aria-describedby={`device-${entry.id}-desc`}
                />
                <span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {entry.label}
                  </span>
                  <p
                    id={`device-${entry.id}-desc`}
                    className={cn(
                      'mt-1 text-gray-600 dark:text-gray-400',
                      compact && !checked ? 'text-xs line-clamp-2' : 'text-sm'
                    )}
                  >
                    {entry.definition}
                  </p>
                  {checked && <p className="mt-1 text-xs text-gray-500">{entry.enabledEffect}</p>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
