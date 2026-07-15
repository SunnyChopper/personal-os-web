import { cn } from '@/lib/utils';
import { Select } from '@/components/atoms/Select';
import type {
  PlatformRuleCatalogEntry,
  RhetoricalModeId,
  RhetoricalModeSetting,
  RhetoricalStrength,
} from '@/types/api/personal-branding.dto';

const STRENGTH_LABELS: Record<RhetoricalStrength, string> = {
  subtle: 'Subtle',
  light: 'Light',
  moderate: 'Moderate',
  strong: 'Strong',
  dominant: 'Dominant',
};

interface RhetoricalModeSelectorProps {
  catalog: PlatformRuleCatalogEntry[];
  strengths: RhetoricalStrength[];
  value: RhetoricalModeSetting[];
  onChange: (next: RhetoricalModeSetting[]) => void;
  disabled?: boolean;
}

export default function RhetoricalModeSelector({
  catalog,
  strengths,
  value,
  onChange,
  disabled = false,
}: RhetoricalModeSelectorProps) {
  const selectedIds = new Set(value.map((entry) => entry.mode));

  const toggleMode = (modeId: RhetoricalModeId) => {
    if (selectedIds.has(modeId)) {
      onChange(value.filter((entry) => entry.mode !== modeId));
      return;
    }
    onChange([...value, { mode: modeId, strength: 'moderate' }]);
  };

  const setStrength = (modeId: RhetoricalModeId, strength: RhetoricalStrength) => {
    onChange(value.map((entry) => (entry.mode === modeId ? { ...entry, strength } : entry)));
  };

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="text-sm font-medium text-gray-900 dark:text-white">
        Rhetorical modes
      </legend>
      <ul className="space-y-3">
        {catalog.map((entry) => {
          const checked = selectedIds.has(entry.id as RhetoricalModeId);
          const current = value.find((v) => v.mode === entry.id);
          return (
            <li
              key={entry.id}
              className={cn(
                'rounded-lg border p-3',
                checked
                  ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => toggleMode(entry.id as RhetoricalModeId)}
                  aria-describedby={`mode-${entry.id}-desc`}
                />
                <span>
                  <span className="font-medium text-gray-900 dark:text-white">{entry.label}</span>
                  <p
                    id={`mode-${entry.id}-desc`}
                    className="mt-1 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {entry.definition}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    When enabled: {entry.enabledEffect}
                  </p>
                </span>
              </label>
              {checked && current && (
                <div className="mt-3 pl-6">
                  <label htmlFor={`mode-strength-${entry.id}`} className="text-xs font-medium">
                    Strength
                  </label>
                  <Select
                    id={`mode-strength-${entry.id}`}
                    className="mt-1 block w-full text-sm"
                    value={current.strength}
                    onChange={(e) =>
                      setStrength(
                        entry.id as RhetoricalModeId,
                        e.target.value as RhetoricalStrength
                      )
                    }
                    aria-label={`${entry.label} strength`}
                  >
                    {strengths.map((strength) => (
                      <option key={strength} value={strength}>
                        {STRENGTH_LABELS[strength]}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
