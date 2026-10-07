import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import { useBrandProfilesList } from '@/hooks/useBrandProfilesList';
import {
  useBrandProjectSettings,
  usePersonalBrandingProjectsMutations,
} from '@/hooks/usePersonalBrandingProjects';
import { cn } from '@/lib/utils';
import { PageCard } from '../PersonalBrandingPageTemplate';
import {
  pbFieldGroupStackClassName,
  pbSectionDescriptionClassName,
  pbSectionStackClassName,
  pbSectionTitleClassName,
} from '../personal-branding-ui';
import AutomationScheduleSection from './AutomationScheduleSection';
import IdeationSteeringSection from './IdeationSteeringSection';
import { ProjectSettingsPanelSkeleton } from './ProjectSettingsPanelSkeleton';
import { isValidStartTime, START_TIME_RANGE_ERROR } from './project-settings-validation';
import type { ProjectSettingsSaveAttempt } from './project-settings-save';
import { SettingsSaveStatus } from './SettingsSaveStatus';
import { useProjectSettingsSave } from './useProjectSettingsSave';

export default function BuildIdeasSettingsPanel() {
  const settingsQ = useBrandProjectSettings();
  const { updateSettings } = usePersonalBrandingProjectsMutations();
  const { profileOptions } = useBrandProfilesList();

  const settings = settingsQ.data;

  const [startTimeDraft, setStartTimeDraft] = useState('');
  const [dirtyStartTime, setDirtyStartTime] = useState(false);
  const [dirtyDirection, setDirtyDirection] = useState(false);
  const [startTimeError, setStartTimeError] = useState<string | null>(null);
  const [dailyCountError, setDailyCountError] = useState<string | null>(null);
  const [directionServerError, setDirectionServerError] = useState<string | null>(null);

  const hasUnsavedDraft = dirtyStartTime || dirtyDirection;

  const onSaveSuccess = useCallback(
    (attempt: ProjectSettingsSaveAttempt) => {
      const { field, payload } = attempt;
      if (field === 'startTime' && payload.startTime !== undefined) {
        if (startTimeDraft.trim() === payload.startTime) {
          setDirtyStartTime(false);
          setStartTimeError(null);
        }
      }
      if (field === 'direction') {
        setDirtyDirection(false);
        setDirectionServerError(null);
      }
      if (field === 'dailyCount') {
        setDailyCountError(null);
      }
    },
    [startTimeDraft]
  );

  const onSaveError = useCallback((attempt: ProjectSettingsSaveAttempt, message: string) => {
    switch (attempt.field) {
      case 'startTime':
        setStartTimeError(message);
        break;
      case 'direction':
        setDirectionServerError(message);
        break;
      case 'dailyCount':
        setDailyCountError(message);
        break;
      default:
        break;
    }
  }, []);

  const { saveField, saveStatus, handleRetrySave, clearSavedOnEdit } = useProjectSettingsSave(
    updateSettings,
    { hasUnsavedDraft, onSaveSuccess, onSaveError }
  );

  const seedStartTime = useCallback(() => {
    if (!settings || dirtyStartTime) return;
    setStartTimeDraft(settings.startTime);
    setStartTimeError(isValidStartTime(settings.startTime) ? null : START_TIME_RANGE_ERROR);
  }, [settings, dirtyStartTime]);

  useEffect(() => {
    seedStartTime();
  }, [seedStartTime]);

  const commitStartTime = () => {
    if (!settings) return;
    const trimmed = startTimeDraft.trim();
    if (trimmed === settings.startTime) {
      setDirtyStartTime(false);
      setStartTimeError(isValidStartTime(trimmed) ? null : START_TIME_RANGE_ERROR);
      return;
    }
    if (!isValidStartTime(trimmed)) {
      setStartTimeError(START_TIME_RANGE_ERROR);
      return;
    }
    setStartTimeError(null);
    saveField('startTime', { startTime: trimmed });
  };

  if (settingsQ.isPending && !settingsQ.data) {
    return <ProjectSettingsPanelSkeleton />;
  }

  if (settingsQ.isError) {
    const message =
      settingsQ.error instanceof Error ? settingsQ.error.message : 'Failed to load settings';
    return (
      <PageCard className="space-y-3">
        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        <Button type="button" onClick={() => void settingsQ.refetch()}>
          Retry
        </Button>
      </PageCard>
    );
  }

  if (!settings) return null;

  return (
    <PageCard className={cn(pbSectionStackClassName, 'text-left')}>
      <SettingsSaveStatus status={saveStatus} onRetry={handleRetrySave} />

      <section aria-labelledby="build-ideas-automation-heading" className={pbSectionStackClassName}>
        <div>
          <h2 id="build-ideas-automation-heading" className={pbSectionTitleClassName}>
            Automation
          </h2>
          <p className={pbSectionDescriptionClassName}>
            Automatic runs start at this UTC time after Trend Stream ingest.
          </p>
        </div>
        <AutomationScheduleSection
          autoEnabled={settings.autoEnabled}
          nextDueAt={settings.nextDueAt}
          lastRunAt={settings.lastRunAt}
          startTimeDraft={startTimeDraft}
          startTimeError={startTimeError}
          onAutoEnabledChange={(enabled) => {
            clearSavedOnEdit();
            saveField('autoEnabled', { autoEnabled: enabled });
          }}
          onStartTimeChange={(value) => {
            clearSavedOnEdit();
            setDirtyStartTime(true);
            setStartTimeDraft(value);
            setStartTimeError(null);
          }}
          onStartTimeBlur={commitStartTime}
        />
      </section>

      <section aria-labelledby="build-ideas-generation-heading" className={pbSectionStackClassName}>
        <div>
          <h2 id="build-ideas-generation-heading" className={pbSectionTitleClassName}>
            What gets generated
          </h2>
          <p className={pbSectionDescriptionClassName}>
            Count, optional direction, and brand profile apply to automatic and manual runs.
          </p>
        </div>
        <div className={pbFieldGroupStackClassName}>
          <IdeationSteeringSection
            settings={settings}
            profileOptions={profileOptions}
            dailyCountError={dailyCountError}
            directionServerError={directionServerError}
            onCommit={(patch) => {
              if ('dailyCount' in patch && patch.dailyCount !== undefined) {
                saveField('dailyCount', patch);
                return;
              }
              if ('direction' in patch && patch.direction !== undefined) {
                saveField('direction', patch);
                return;
              }
              if ('brandProfileId' in patch) {
                clearSavedOnEdit();
                saveField('brandProfileId', patch);
              }
            }}
            onEditing={() => {
              clearSavedOnEdit();
              setDailyCountError(null);
              setDirectionServerError(null);
            }}
            onDirectionDirtyChange={setDirtyDirection}
          />
        </div>
      </section>
    </PageCard>
  );
}
