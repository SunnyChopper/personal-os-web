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
}

export default function RhetoricalDeviceSelector({
  catalog,
  value,
  onChange,
  disabled = false,
}: RhetoricalDeviceSelectorProps) {
  const selected = new Set(value);

  const toggle = (deviceId: RhetoricalDeviceId) => {
    if (selected.has(deviceId)) {
      onChange(value.filter((id) => id !== deviceId));
      return;
    }
    onChange([...value, deviceId]);
  };

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="text-sm font-medium text-gray-900 dark:text-white">
        Allowed rhetorical devices
      </legend>
      <ul className="grid gap-2 sm:grid-cols-2">
        {catalog.map((entry) => {
          const deviceId = entry.id as RhetoricalDeviceId;
          const checked = selected.has(deviceId);
          return (
            <li key={entry.id}>
              <label
                className={cn(
                  'flex h-full cursor-pointer items-start gap-2 rounded-lg border p-3',
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
                  <span className="font-medium text-gray-900 dark:text-white">{entry.label}</span>
                  <p
                    id={`device-${entry.id}-desc`}
                    className="mt-1 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {entry.definition}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {checked ? entry.enabledEffect : entry.disabledEffect}
                  </p>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
