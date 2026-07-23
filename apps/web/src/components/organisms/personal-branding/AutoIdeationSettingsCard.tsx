import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { Select } from '@/components/atoms/Select';
import type { Toast } from '@/hooks/use-toast';
import { useProactiveSettings } from '@/hooks/useProactive';
import type { useSignalRadar } from '@/hooks/useSignalRadar';
import { queryKeys } from '@/lib/react-query/query-keys';
import { isBrandProfileReadyForIdeation } from '@/pages/admin/personal-branding/content-workbench/content-workbench-helpers';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import { PageCard } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';
import { ROUTES } from '@/routes';
import { personalBrandingService } from '@/services/personal-branding.service';
import { BRAND_PLATFORM_LABELS, type BrandPlatform } from '@/types/api/personal-branding.dto';
import { formatDateTimeInTimeZone } from '@/utils/date-formatters';

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const DEFAULT_AUTO_START_TIME = '21:00';
const DEFAULT_TOP_N = 5;
const DEFAULT_IDEA_COUNT = 6;
const DEFAULT_MIN_AI_RELEVANCE = 0.7;
const ALL_PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];
const EXCLUDE_CHIP_SELECTED =
  'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-100';

export interface AutoIdeationSettingsCardProps {
  signalRadar: SignalRadarHook;
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function AutoIdeationSettingsCard({
  signalRadar,
  showToast,
}: AutoIdeationSettingsCardProps) {
  const settings = signalRadar.settings.data;
  const { timeZone: timeZonePrefQ } = useProactiveSettings();

  const effectiveTimeZone = useMemo(
    () => timeZonePrefQ.data?.timeZone || settings?.syncTimezone || BROWSER_TIMEZONE,
    [settings?.syncTimezone, timeZonePrefQ.data?.timeZone]
  );

  const [enabled, setEnabled] = useState(false);
  const [topN, setTopN] = useState(DEFAULT_TOP_N);
  const [startTime, setStartTime] = useState(DEFAULT_AUTO_START_TIME);
  const [brandProfileId, setBrandProfileId] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<BrandPlatform>('linkedin');
  const [ideaCount, setIdeaCount] = useState(DEFAULT_IDEA_COUNT);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [minAiRelevanceEnabled, setMinAiRelevanceEnabled] = useState(false);
  const [minAiRelevanceScore, setMinAiRelevanceScore] = useState(DEFAULT_MIN_AI_RELEVANCE);
  const [excludedSourceIds, setExcludedSourceIds] = useState<string[]>([]);

  const profilesQ = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(1, 50),
    queryFn: async () => {
      const res = await personalBrandingService.listProfiles(1, 50);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load brand profiles');
      }
      return res.data;
    },
  });

  const templatesQ = useQuery({
    queryKey: queryKeys.personalBranding.contentTemplates.list(1, 100),
    queryFn: () => personalBrandingService.listContentTemplates(1, 100),
  });

  const readyProfiles = useMemo(
    () => (profilesQ.data?.data ?? []).filter(isBrandProfileReadyForIdeation),
    [profilesQ.data?.data]
  );
  const templates = templatesQ.data?.data ?? [];
  const sources = signalRadar.sources.data?.data ?? [];
  const excludedSourceIdSet = useMemo(() => new Set(excludedSourceIds), [excludedSourceIds]);

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.autoIdeationEnabled ?? false);
    setTopN(settings.autoIdeationTopN ?? DEFAULT_TOP_N);
    setStartTime(settings.autoIdeationStartTime || DEFAULT_AUTO_START_TIME);
    setBrandProfileId(settings.autoIdeationBrandProfileId ?? '');
    setTargetPlatform(settings.autoIdeationTargetPlatform ?? 'linkedin');
    setIdeaCount(settings.autoIdeationCount ?? DEFAULT_IDEA_COUNT);
    setSelectedTemplateIds(settings.autoIdeationTemplateIds ?? []);
    setNotifyEmail(settings.autoIdeationNotifyEmail ?? false);
    const savedMin = settings.autoIdeationMinAiRelevanceScore;
    setMinAiRelevanceEnabled(savedMin != null);
    setMinAiRelevanceScore(savedMin ?? DEFAULT_MIN_AI_RELEVANCE);
    setExcludedSourceIds(settings.autoIdeationExcludeSourceIds ?? []);
  }, [settings]);

  useEffect(() => {
    if (brandProfileId || readyProfiles.length === 0) return;
    setBrandProfileId(readyProfiles[0]?.id ?? '');
  }, [brandProfileId, readyProfiles]);

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplateIds((current) => {
      if (current.includes(templateId)) {
        return current.filter((id) => id !== templateId);
      }
      if (current.length >= 5) return current;
      return [...current, templateId];
    });
  };

  const toggleExcludedSource = (sourceId: string) => {
    setExcludedSourceIds((current) => {
      if (current.includes(sourceId)) {
        return current.filter((id) => id !== sourceId);
      }
      return [...current, sourceId];
    });
  };

  const canEnable = Boolean(brandProfileId) && readyProfiles.length > 0;
  const saveDisabled = signalRadar.updateSettings.isPending || (enabled && !canEnable);

  const handleSave = async () => {
    try {
      await signalRadar.updateSettings.mutateAsync({
        autoIdeationEnabled: enabled,
        autoIdeationTopN: topN,
        autoIdeationStartTime: startTime,
        autoIdeationBrandProfileId: brandProfileId || null,
        autoIdeationTargetPlatform: targetPlatform,
        autoIdeationCount: ideaCount,
        autoIdeationTemplateIds: selectedTemplateIds,
        autoIdeationNotifyEmail: notifyEmail,
        autoIdeationMinAiRelevanceScore: minAiRelevanceEnabled ? minAiRelevanceScore : null,
        autoIdeationExcludeSourceIds: excludedSourceIds,
      });
      showToast({ type: 'success', title: 'Auto ideation settings saved' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Save failed',
      });
    }
  };

  return (
    <PageCard className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Auto ideation</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Every night, brainstorm content ideas from the day&apos;s highest-relevance Trend Stream
        cards and drop them into Trend Ideas.
      </p>

      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <FormCheckbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>Enable nightly auto-brainstorm</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Top N cards
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            disabled={!enabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Run time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={!enabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">Local time ({effectiveTimeZone})</p>
        </div>
        <div className="sm:col-span-2">
          <fieldset disabled={!enabled} className="space-y-3 disabled:opacity-60">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <FormCheckbox
                checked={minAiRelevanceEnabled}
                onChange={(e) => setMinAiRelevanceEnabled(e.target.checked)}
              />
              <span>Require minimum AI relevance for cards</span>
            </label>
            {minAiRelevanceEnabled ? (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Min AI relevance ({Math.round(minAiRelevanceScore * 100)}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(minAiRelevanceScore * 100)}
                  onChange={(e) => setMinAiRelevanceScore(Number(e.target.value) / 100)}
                  className="h-2 w-full cursor-pointer accent-blue-600"
                />
              </label>
            ) : (
              <p className="text-xs text-gray-500">
                No minimum — all default-visible cards from today can compete for top N.
              </p>
            )}
          </fieldset>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Brand profile
          </label>
          <Select
            value={brandProfileId}
            onChange={(e) => setBrandProfileId(e.target.value)}
            disabled={!enabled || profilesQ.isPending}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">Select profile…</option>
            {readyProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target platform
          </label>
          <Select
            value={targetPlatform}
            onChange={(e) => setTargetPlatform(e.target.value as BrandPlatform)}
            disabled={!enabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900"
          >
            {ALL_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {BRAND_PLATFORM_LABELS[platform]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ideas per run
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={ideaCount}
            onChange={(e) => setIdeaCount(Number(e.target.value))}
            disabled={!enabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
      </div>

      {enabled && readyProfiles.length === 0 ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Add pillars and a target audience to a Brand Identity profile before enabling auto
          ideation.
        </p>
      ) : null}

      <fieldset disabled={!enabled} className="space-y-2 disabled:opacity-60">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Exclude sources from nightly brainstorm
        </legend>
        <p className="text-xs text-gray-500">
          Excluded sources still ingest into Trend Stream. To stop ingest entirely, pause the source
          under Source Management.
        </p>
        {sources.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => {
              const isExcluded = excludedSourceIdSet.has(source.id);
              return (
                <button
                  key={source.id}
                  type="button"
                  aria-pressed={isExcluded}
                  onClick={() => toggleExcludedSource(source.id)}
                  className={selectableChipClassName(
                    isExcluded,
                    isExcluded ? EXCLUDE_CHIP_SELECTED : undefined
                  )}
                >
                  {source.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Add Signal Radar sources to configure exclusions.</p>
        )}
      </fieldset>

      <fieldset disabled={!enabled} className="space-y-2 disabled:opacity-60">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Optional templates (up to 5)
        </legend>
        {templates.length > 0 ? (
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {templates.map((template) => (
              <label
                key={template.id}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <FormCheckbox
                  checked={selectedTemplateIds.includes(template.id)}
                  onChange={() => toggleTemplate(template.id)}
                />
                <span>{template.title}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No content templates yet.{' '}
            <Link
              to={`${ROUTES.admin.personalBrandingWorkbench}?tab=content-templates`}
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Create templates in Content Workbench
            </Link>
            .
          </p>
        )}
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <FormCheckbox
          checked={notifyEmail}
          onChange={(e) => setNotifyEmail(e.target.checked)}
          disabled={!enabled}
        />
        <span>Email me when ideas are ready</span>
      </label>

      {settings ? (
        <p className="text-xs text-gray-500">
          Last run {formatDateTimeInTimeZone(settings.autoIdeationLastRunAt, effectiveTimeZone)} ·
          Next due {formatDateTimeInTimeZone(settings.autoIdeationNextDueAt, effectiveTimeZone)}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveDisabled}
          className="inline-flex items-center gap-2"
        >
          {signalRadar.updateSettings.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Save auto ideation settings
        </Button>
      </div>
    </PageCard>
  );
}
