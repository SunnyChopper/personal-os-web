import { useCallback, useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { formFieldClassName } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type {
  BrandProjectSettings,
  UpdateBrandProjectSettingsInput,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import { DIRECTION_DEBOUNCE_MS } from './project-settings-save';
import { directionLengthError, isValidDailyCount } from './project-settings-validation';

const DAILY_COUNT_MIN = 3;
const DAILY_COUNT_MAX = 10;
const DIRECTION_PLACEHOLDER = 'A weekend CLI that turns one paper into a demo.';
const DIRECTION_HINT = 'Sent with Generate now and automatic runs.';
const BRAND_PROFILE_NONE_HINT = 'Ideas will not use pillars or audience from a brand profile.';

export type ProfileOption = { id: string; name: string };

export type IdeationSteeringSectionProps = {
  settings: BrandProjectSettings;
  profileOptions: ProfileOption[];
  dailyCountError?: string | null;
  directionServerError?: string | null;
  onCommit: (patch: UpdateBrandProjectSettingsInput) => void;
  onEditing: () => void;
  onDirectionDirtyChange: (dirty: boolean) => void;
};

export default function IdeationSteeringSection({
  settings,
  profileOptions,
  dailyCountError = null,
  directionServerError = null,
  onCommit,
  onEditing,
  onDirectionDirtyChange,
}: IdeationSteeringSectionProps) {
  const [directionDraft, setDirectionDraft] = useState('');
  const [dirtyDirection, setDirtyDirection] = useState(false);
  const [directionValidationError, setDirectionValidationError] = useState<string | null>(null);

  const debouncedDirection = useDebouncedValue(directionDraft, DIRECTION_DEBOUNCE_MS);

  const dailyCount = isValidDailyCount(settings.dailyCount) ? settings.dailyCount : DAILY_COUNT_MIN;

  const directionError = directionServerError ?? directionValidationError;

  const seedDirection = useCallback(() => {
    if (!dirtyDirection) {
      setDirectionDraft(settings.direction ?? '');
      setDirectionValidationError(directionLengthError(settings.direction ?? ''));
    }
  }, [settings.direction, dirtyDirection]);

  useEffect(() => {
    seedDirection();
  }, [seedDirection]);

  useEffect(() => {
    onDirectionDirtyChange(dirtyDirection);
  }, [dirtyDirection, onDirectionDirtyChange]);

  const tryCommitDirection = useCallback(
    (value: string) => {
      const lenErr = directionLengthError(value);
      if (lenErr) {
        setDirectionValidationError(lenErr);
        return;
      }
      const serverDir = settings.direction ?? '';
      if (value === serverDir) {
        setDirectionValidationError(null);
        setDirtyDirection(false);
        return;
      }
      setDirectionValidationError(null);
      onCommit({ direction: value });
    },
    [settings.direction, onCommit]
  );

  useEffect(() => {
    if (!dirtyDirection) return;
    if (debouncedDirection !== directionDraft) return;
    tryCommitDirection(debouncedDirection);
  }, [debouncedDirection, directionDraft, dirtyDirection, tryCommitDirection]);

  const flushDirectionOnBlur = () => {
    if (!dirtyDirection) return;
    if (debouncedDirection !== directionDraft) {
      tryCommitDirection(directionDraft);
      return;
    }
    const serverDir = settings.direction ?? '';
    if (directionDraft === serverDir) {
      setDirtyDirection(false);
      setDirectionValidationError(directionLengthError(directionDraft));
      return;
    }
    tryCommitDirection(directionDraft);
  };

  const commitDailyCount = (next: number) => {
    if (!isValidDailyCount(next) || next === settings.dailyCount) return;
    onEditing();
    onCommit({ dailyCount: next });
  };

  const brandProfileHint =
    !settings.brandProfileId || settings.brandProfileId === ''
      ? BRAND_PROFILE_NONE_HINT
      : undefined;

  return (
    <div className="space-y-6">
      <FormField
        label="Ideas per day"
        htmlFor="project-settings-daily-count"
        error={dailyCountError}
      >
        <div
          className={cn(formFieldClassName, 'inline-flex w-auto items-center gap-1 p-1 shadow-sm')}
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            aria-label="Decrease ideas per day"
            disabled={dailyCount <= DAILY_COUNT_MIN}
            onClick={() => commitDailyCount(dailyCount - 1)}
          >
            <Minus className="size-4" aria-hidden />
          </Button>
          <span
            id="project-settings-daily-count"
            role="spinbutton"
            tabIndex={0}
            aria-valuemin={DAILY_COUNT_MIN}
            aria-valuemax={DAILY_COUNT_MAX}
            aria-valuenow={dailyCount}
            className="min-w-[2ch] px-2 text-center font-medium tabular-nums"
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                commitDailyCount(Math.min(DAILY_COUNT_MAX, dailyCount + 1));
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                commitDailyCount(Math.max(DAILY_COUNT_MIN, dailyCount - 1));
              }
            }}
          >
            {dailyCount}
          </span>
          <span className="px-1 text-xs text-gray-500 dark:text-gray-400" aria-hidden>
            3–10
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            aria-label="Increase ideas per day"
            disabled={dailyCount >= DAILY_COUNT_MAX}
            onClick={() => commitDailyCount(dailyCount + 1)}
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </FormField>

      <FormField
        label="Direction"
        htmlFor="project-settings-direction"
        error={directionError}
        hint={DIRECTION_HINT}
      >
        <Textarea
          id="project-settings-direction"
          rows={2}
          placeholder={DIRECTION_PLACEHOLDER}
          className="min-h-0 resize-none"
          value={directionDraft}
          onChange={(e) => {
            onEditing();
            setDirtyDirection(true);
            setDirectionDraft(e.target.value);
            setDirectionValidationError(null);
          }}
          onBlur={flushDirectionOnBlur}
        />
      </FormField>

      {profileOptions.length > 0 ? (
        <FormField
          label="Brand profile"
          htmlFor="project-settings-brand-profile"
          hint={brandProfileHint}
        >
          <Select
            id="project-settings-brand-profile"
            value={settings.brandProfileId ?? ''}
            onChange={(e) => {
              onEditing();
              onCommit({ brandProfileId: e.target.value });
            }}
          >
            <option value="">None</option>
            {profileOptions.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}
    </div>
  );
}
