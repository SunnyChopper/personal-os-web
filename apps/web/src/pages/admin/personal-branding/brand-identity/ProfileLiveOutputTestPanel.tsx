import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, Loader2, Sparkles, X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import ProfileOutputTestHistory from './ProfileOutputTestHistory';
import { contentTextStats } from '../content-workbench/content-workbench-helpers';
import type {
  BrandPlatform,
  BrandProfileOutputTest,
  BrandProfileStatus,
  GenerateProfileOutputTestInput,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';
import { LOCAL_DRAFT_PROFILE_ID } from './brand-identity.constants';

const PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

export interface ProfileFormSnapshot {
  name: string;
  description: string | null;
  pillars: string[];
  targetAudience: string | null;
  toneMetrics: Record<string, number>;
  bannedPhrases: string[];
  status: BrandProfileStatus;
}

interface ProfileLiveOutputTestPanelProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
  isLocalDraft: boolean;
  formSnapshot: ProfileFormSnapshot;
  onEnsureSaved: (snapshot: ProfileFormSnapshot) => Promise<string>;
  onGenerate: (
    profileId: string,
    body: GenerateProfileOutputTestInput
  ) => Promise<BrandProfileOutputTest>;
  history: BrandProfileOutputTest[];
  historyLoading?: boolean;
  disabled?: boolean;
}

export default function ProfileLiveOutputTestPanel({
  open,
  onClose,
  profileId,
  profileName,
  isLocalDraft,
  formSnapshot,
  onEnsureSaved,
  onGenerate,
  history,
  historyLoading = false,
  disabled = false,
}: ProfileLiveOutputTestPanelProps) {
  const [topic, setTopic] = useState('How I approach building in public');
  const [platform, setPlatform] = useState<BrandPlatform>('linkedin');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [brainstormError, setBrainstormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<BrandProfileOutputTest | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const effectivePolicyQuery = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.effective(platform, profileId),
    queryFn: () => personalBrandingService.getEffectivePlatformRules(platform, profileId),
    enabled: open && Boolean(profileId) && profileId !== LOCAL_DRAFT_PROFILE_ID && !isLocalDraft,
  });

  const resolvedPolicy = effectivePolicyQuery.data?.resolvedPolicy;

  const selectedTest = useMemo(
    () => history.find((test) => test.id === selectedTestId) ?? null,
    [history, selectedTestId]
  );

  const displayedResult = latestResult ?? selectedTest;
  const hasPillars = formSnapshot.pillars.length > 0;
  const busy = disabled || isGenerating || isBrainstorming;

  const compliance = useMemo(() => {
    if (!displayedResult?.body) return null;
    const stats = contentTextStats(displayedResult.body);
    return {
      ...stats,
      characterCount: displayedResult.body.length,
      characterLimit: resolvedPolicy?.characterLimit ?? null,
      readTimeLimitMinutes: resolvedPolicy?.readTimeLimitMinutes ?? null,
    };
  }, [displayedResult, resolvedPolicy]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating && !isBrainstorming) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isGenerating, isBrainstorming]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const handleGenerate = async () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError('Enter a sample topic to generate a preview.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    try {
      const savedProfileId = isLocalDraft ? await onEnsureSaved(formSnapshot) : profileId;
      const saved = await onGenerate(savedProfileId, {
        topic: trimmedTopic,
        contentType: 'DEEP_DIVE_BLOG',
        platform,
      });
      setSelectedTestId(null);
      setLatestResult(saved);
    } catch (err) {
      setLatestResult(null);
      setError(err instanceof Error ? err.message : 'Preview generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBrainstorm = async () => {
    if (!hasPillars) {
      setBrainstormError('Add at least one brand pillar before brainstorming topics.');
      return;
    }

    setBrainstormError(null);
    setIsBrainstorming(true);
    try {
      const result = await personalBrandingService.generateTopicSuggestions({
        pillars: formSnapshot.pillars,
        targetAudience: formSnapshot.targetAudience,
        platform,
        count: 5,
      });
      setSuggestedTopics(result.topics);
      if (result.topics.length > 0) {
        setTopic(result.topics[0]);
      }
    } catch (err) {
      setSuggestedTopics([]);
      setBrainstormError(err instanceof Error ? err.message : 'Topic brainstorm failed');
    } finally {
      setIsBrainstorming(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setTopic(suggestion);
    setError(null);
    setBrainstormError(null);
  };

  const handleSelectHistory = (test: BrandProfileOutputTest) => {
    setSelectedTestId(test.id);
    setLatestResult(null);
    setError(null);
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-[2px]"
            aria-label="Close live output test"
            onClick={() => {
              if (!isGenerating && !isBrainstorming) onClose();
            }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Live output test"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Live Output Test
                </h2>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Preview how <span className="font-medium">{profileName}</span> shapes a generated
                  draft. Unsaved edits are saved before generating.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating || isBrainstorming}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close live output test panel"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Sample topic
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleBrainstorm()}
                      disabled={busy || !hasPillars}
                      className="inline-flex shrink-0 items-center gap-1.5 px-2 py-1 text-xs"
                      title={
                        hasPillars
                          ? 'Brainstorm on-brand topics from your pillars'
                          : 'Add brand pillars to enable brainstorming'
                      }
                    >
                      {isBrainstorming ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          Brainstorming…
                        </>
                      ) : (
                        <>
                          <Lightbulb className="size-3.5" aria-hidden />
                          Brainstorm topics
                        </>
                      )}
                    </Button>
                  </div>
                  <FormInput
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What should the draft be about?"
                    disabled={busy}
                    className="w-full"
                  />
                  {!hasPillars ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Add brand pillars on the profile to brainstorm on-brand topics.
                    </p>
                  ) : null}
                  {brainstormError ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">{brainstormError}</p>
                  ) : null}
                  {suggestedTopics.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {suggestedTopics.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          disabled={busy}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-left text-xs transition-colors',
                            topic === suggestion
                              ? 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/20'
                          )}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <label
                    htmlFor="profile-output-target-platform"
                    className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Target platform
                  </label>
                  <Select
                    id="profile-output-target-platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as BrandPlatform)}
                    disabled={busy}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                  >
                    {PLATFORMS.map((value) => (
                      <option key={value} value={value}>
                        {BRAND_PLATFORM_LABELS[value]}
                      </option>
                    ))}
                  </Select>
                </div>

                {resolvedPolicy && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-gray-950/50">
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      Applied platform policy
                    </p>
                    <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                      {resolvedPolicy.characterLimit != null && (
                        <li>Character limit: {resolvedPolicy.characterLimit}</li>
                      )}
                      {resolvedPolicy.readTimeLimitMinutes != null && (
                        <li>Read time cap: {resolvedPolicy.readTimeLimitMinutes} min</li>
                      )}
                      {resolvedPolicy.rhetoricalModes.length > 0 && (
                        <li>
                          Modes:{' '}
                          {resolvedPolicy.rhetoricalModes
                            .map((m) => `${m.mode} (${m.strength})`)
                            .join(', ')}
                        </li>
                      )}
                      {resolvedPolicy.rhetoricalDevices.length > 0 && (
                        <li>Devices: {resolvedPolicy.rhetoricalDevices.join(', ')}</li>
                      )}
                      {resolvedPolicy.requirements && (
                        <li className="whitespace-pre-wrap">{resolvedPolicy.requirements}</li>
                      )}
                    </ul>
                  </div>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleGenerate()}
                  disabled={busy || !topic.trim()}
                  className="inline-flex w-full items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Generating preview…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" aria-hidden />
                      Generate preview
                    </>
                  )}
                </Button>
              </div>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </p>
              ) : null}

              <div
                className={cn(
                  'min-h-[200px] overflow-y-auto rounded-lg border-2 border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-950/40',
                  !displayedResult && 'flex items-center justify-center'
                )}
              >
                {displayedResult ? (
                  <article className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {displayedResult.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {BRAND_PLATFORM_LABELS[displayedResult.platform]} ·{' '}
                        {new Date(displayedResult.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {displayedResult.profileVersionId
                          ? ` · version ${displayedResult.profileVersionId.slice(0, 8)}`
                          : ''}
                      </p>
                    </div>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {displayedResult.body}
                    </div>
                    {compliance && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {compliance.wordCount} words · ~{compliance.readingTimeMinutes} min read
                        {compliance.characterLimit != null
                          ? ` · ${compliance.characterCount}/${compliance.characterLimit} chars`
                          : ` · ${compliance.characterCount} chars`}
                        {compliance.readTimeLimitMinutes != null
                          ? ` (cap ${compliance.readTimeLimitMinutes} min)`
                          : ''}
                      </p>
                    )}
                  </article>
                ) : (
                  <p className="max-w-xs text-center text-xs text-gray-500 dark:text-gray-400">
                    Adjust tone metrics and pillars, then generate a preview to see how they
                    influence the draft voice.
                  </p>
                )}
              </div>

              <ProfileOutputTestHistory
                tests={history}
                isLoading={historyLoading}
                selectedTestId={selectedTestId}
                onSelect={handleSelectHistory}
              />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
