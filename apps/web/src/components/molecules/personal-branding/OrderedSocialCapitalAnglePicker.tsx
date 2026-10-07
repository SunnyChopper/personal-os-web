import { ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  SOCIAL_CAPITAL_ANGLE_LABELS,
  type SocialCapitalAngle,
} from '@/types/api/personal-branding.dto';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import { cn } from '@/lib/utils';

const ANGLE_ORDER: SocialCapitalAngle[] = [
  'knowledge',
  'perspective',
  'humor',
  'joinConnections',
  'warmth',
  'other',
];

export interface OrderedSocialCapitalAnglePickerProps {
  label: string;
  value: SocialCapitalAngle[];
  onChange: (value: SocialCapitalAngle[]) => void;
  maxItems?: number;
  disabled?: boolean;
  hint?: string;
}

export default function OrderedSocialCapitalAnglePicker({
  label,
  value,
  onChange,
  maxItems = 3,
  disabled = false,
  hint,
}: OrderedSocialCapitalAnglePickerProps) {
  const atMax = value.length >= maxItems;

  const toggle = (angle: SocialCapitalAngle) => {
    if (disabled) return;
    if (value.includes(angle)) {
      onChange(value.filter((item) => item !== angle));
      return;
    }
    if (atMax) return;
    onChange([...value, angle]);
  };

  const move = (index: number, delta: number) => {
    if (disabled) return;
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  const remove = (angle: SocialCapitalAngle) => {
    if (disabled) return;
    onChange(value.filter((item) => item !== angle));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>
      {hint ? <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${label} options`}>
        {ANGLE_ORDER.map((angle) => {
          const isActive = value.includes(angle);
          return (
            <button
              key={angle}
              type="button"
              onClick={() => toggle(angle)}
              disabled={disabled || (!isActive && atMax)}
              className={cn(
                selectableChipClassName(isActive),
                disabled && 'opacity-60',
                !isActive && atMax && 'opacity-40'
              )}
              aria-pressed={isActive}
            >
              {SOCIAL_CAPITAL_ANGLE_LABELS[angle]}
            </button>
          );
        })}
      </div>

      {value.length > 0 ? (
        <ol className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/80 p-2 dark:border-gray-700 dark:bg-gray-900/40">
          {value.map((angle, index) => (
            <li
              key={angle}
              className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200"
            >
              <span className="w-5 shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                {index + 1}.
              </span>
              <span className="flex-1">{SOCIAL_CAPITAL_ANGLE_LABELS[angle]}</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-700"
                  onClick={() => move(index, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Move ${SOCIAL_CAPITAL_ANGLE_LABELS[angle]} up`}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-700"
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === value.length - 1}
                  aria-label={`Move ${SOCIAL_CAPITAL_ANGLE_LABELS[angle]} down`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => remove(angle)}
                  disabled={disabled}
                  aria-label={`Remove ${SOCIAL_CAPITAL_ANGLE_LABELS[angle]}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No preference — model chooses engagement mode.
        </p>
      )}
    </div>
  );
}
