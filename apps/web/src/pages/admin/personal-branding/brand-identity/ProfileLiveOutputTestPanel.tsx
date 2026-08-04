import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import MarkdownRenderer, {
  type MarkdownCollapseActionsHandle,
} from '@/components/molecules/MarkdownRenderer';
import OverlayPortal from '@/components/molecules/OverlayPortal';
import LiveOutputPreviewActionBar from '@/components/molecules/personal-branding/LiveOutputPreviewActionBar';
import OutputTestCompareColumn from '@/components/molecules/personal-branding/OutputTestCompareColumn';
import OutputTestStructuralDiffStrip from '@/components/molecules/personal-branding/OutputTestStructuralDiffStrip';
import PlatformComparePicker from '@/components/molecules/personal-branding/PlatformComparePicker';
import PlatformFormatSelect from '@/components/molecules/personal-branding/PlatformFormatSelect';
import PlatformRulePolicySummary from '@/components/molecules/personal-branding/PlatformRulePolicySummary';
import UniversalRulesFallbackNotice from '@/components/molecules/personal-branding/UniversalRulesFallbackNotice';
import { useToast } from '@/hooks/use-toast';
import { reportClientError } from '@/lib/client-telemetry';
import { useEffectivePlatformRules } from '@/hooks/useEffectivePlatformRules';
import { overlayBackdropClassName, overlaySurfaceClassName } from '@/lib/overlay-layer';
import {
  buildStructuralDiff,
  DEFAULT_COMPARE_PLATFORMS,
  findReusableOutputTest,
  isValidCompareSelection,
  MAX_COMPARE_PLATFORMS,
  MIN_COMPARE_PLATFORMS,
  normalizeOutputTestTopic,
} from '@/lib/personal-branding/output-test-compare';
import { PLATFORM_RULE_CATALOG } from '@/lib/personal-branding/platform-rule-catalog';
import {
  buildOutputTestGenerateInput,
  defaultPlatformFormat,
  type PlatformFormat,
} from '@/lib/personal-branding/platform-format-helpers';
import {
  formatAppliedPlatformRuleNames,
  hasResolvedPlatformPolicy,
  normalizeToneMetrics,
  resolvePlatformRuleSource,
  shouldShowUniversalFallbackNotice,
} from '@/lib/personal-branding/profile-strength';
import { statusPillClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import { ROUTES } from '@/routes';
import BrainstormTopicSuggestionList from '@/components/molecules/personal-branding/BrainstormTopicSuggestionList';
import OutputTestPreviewSkeleton from '@/components/molecules/personal-branding/OutputTestPreviewSkeleton';
import OutputTestToneScorecard from '@/components/molecules/personal-branding/OutputTestToneScorecard';
import ProfileOutputTestHistory from './ProfileOutputTestHistory';
import { contentTextStats } from '../content-workbench/content-workbench-helpers';
import { variantCopyText } from '../content-pipeline/variant-card-helpers';
import type {
  BrandPlatform,
  BrandProfileOutputTest,
  BrandProfileStatus,
  GenerateProfileOutputTestInput,
  TopicSuggestion,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';
import { LOCAL_DRAFT_PROFILE_ID } from './brand-identity.constants';
import { buildLiveOutputWorkbenchDraftInput } from './live-output-workbench-draft';

const PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

const LIVE_OUTPUT_PREVIEW_MARKDOWN_CLASS =
  'prose-headings:border-l-2 prose-headings:border-blue-500/30 prose-headings:pl-2.5 prose-ul:marker:text-blue-600/70 dark:prose-ul:marker:text-blue-400/70 prose-ol:marker:text-blue-600/70 dark:prose-ol:marker:text-blue-400/70';

export interface ProfileFormSnapshot {
  name: string;
  description: string | null;
  pillars: string[];
  targetAudience: string | null;
  toneMetrics: Record<string, number>;
  bannedPhrases: string[];
  status: BrandProfileStatus;
  platforms: BrandPlatform[];
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
  const navigate = useNavigate();
  const { showToast } = useToast();
  const collapseActionsRef = useRef<MarkdownCollapseActionsHandle>(null);
  const [topic, setTopic] = useState('How I approach building in public');
  const [platform, setPlatform] = useState<BrandPlatform>('linkedin');
  const [platformFormat, setPlatformFormat] = useState<PlatformFormat>(
    defaultPlatformFormat('linkedin')
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<TopicSuggestion[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [generateProgress, setGenerateProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [brainstormError, setBrainstormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<BrandProfileOutputTest | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [isOpeningWorkbench, setIsOpeningWorkbench] = useState(false);
  const [sectionsCollapsed, setSectionsCollapsed] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlatforms, setComparePlatforms] =
    useState<BrandPlatform[]>(DEFAULT_COMPARE_PLATFORMS);
  const [compareResults, setCompareResults] = useState<
    Partial<Record<BrandPlatform, BrandProfileOutputTest>>
  >({});
  const [compareErrors, setCompareErrors] = useState<Partial<Record<BrandPlatform, string>>>({});
  const [compareGeneratingPlatforms, setCompareGeneratingPlatforms] = useState<BrandPlatform[]>([]);
  const [isCompareGenerating, setIsCompareGenerating] = useState(false);
  const [scoringFailed, setScoringFailed] = useState(false);

  const effectivePolicyQuery = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.effective(platform, profileId),
    queryFn: () => personalBrandingService.getEffectivePlatformRules(platform, profileId),
    enabled:
      open &&
      !compareMode &&
      Boolean(profileId) &&
      profileId !== LOCAL_DRAFT_PROFILE_ID &&
      !isLocalDraft,
  });

  const compareProfileByPlatform = useMemo(() => {
    if (!profileId || profileId === LOCAL_DRAFT_PROFILE_ID) return {};
    const map: Partial<Record<BrandPlatform, string>> = {};
    for (const comparePlatform of comparePlatforms) {
      map[comparePlatform] = profileId;
    }
    return map;
  }, [comparePlatforms, profileId]);

  const compareEffectiveRules = useEffectivePlatformRules(
    compareProfileByPlatform,
    compareMode ? comparePlatforms : []
  );

  const catalogQuery = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.catalog(),
    queryFn: () => personalBrandingService.getPlatformRuleCatalog(),
    enabled: open && !isLocalDraft,
    staleTime: Infinity,
    initialData: PLATFORM_RULE_CATALOG,
  });

  const resolvedPolicy = effectivePolicyQuery.data?.resolvedPolicy;
  const contributingRules = effectivePolicyQuery.data?.rules ?? [];
  const ruleSource = effectivePolicyQuery.data
    ? resolvePlatformRuleSource(contributingRules)
    : 'none';
  const appliedRuleNames = formatAppliedPlatformRuleNames(contributingRules);
  const bannedPhrases = formSnapshot.bannedPhrases.filter((phrase) => phrase.trim().length > 0);
  const hasPolicyConstraints = resolvedPolicy ? hasResolvedPlatformPolicy(resolvedPolicy) : false;
  const showPolicySection =
    open && Boolean(profileId) && profileId !== LOCAL_DRAFT_PROFILE_ID && !isLocalDraft;

  const selectedTest = useMemo(
    () => history.find((test) => test.id === selectedTestId) ?? null,
    [history, selectedTestId]
  );

  const displayedResult = latestResult ?? selectedTest;
  const hasPillars = formSnapshot.pillars.length > 0;
  const isCompareBusy = compareGeneratingPlatforms.length > 0 || isCompareGenerating;
  const busy = disabled || isGenerating || isBrainstorming || isCompareBusy;
  const brainstormPlatform = compareMode ? (comparePlatforms[0] ?? platform) : platform;
  const effectiveTopicCount = selectedTopics.size > 0 ? selectedTopics.size : topic.trim() ? 1 : 0;
  const canGenerate = effectiveTopicCount > 0;
  const profileToneMetrics = useMemo(
    () => normalizeToneMetrics(formSnapshot.toneMetrics),
    [formSnapshot.toneMetrics]
  );
  const hasToneMetrics = Object.keys(profileToneMetrics).length > 0;

  const structuralDiff = useMemo(() => {
    if (!compareMode) return null;
    const columns = comparePlatforms
      .map((comparePlatform) => {
        const result = compareResults[comparePlatform];
        if (!result?.body) return null;
        return {
          platform: comparePlatform,
          body: result.body,
          resolvedPolicy:
            compareEffectiveRules.byPlatform.get(comparePlatform)?.data?.resolvedPolicy,
        };
      })
      .filter((column): column is NonNullable<typeof column> => column != null);
    if (columns.length < 2) return null;
    return buildStructuralDiff(columns);
  }, [compareMode, comparePlatforms, compareResults, compareEffectiveRules.byPlatform]);

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
    setSectionsCollapsed(false);
  }, [displayedResult?.id]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating && !isBrainstorming && !isCompareBusy) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isGenerating, isBrainstorming, isCompareBusy]);

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

  const handleGenerateCompare = async (forceRegenerate = false) => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError('Enter a sample topic to generate a preview.');
      return;
    }
    if (!isValidCompareSelection(comparePlatforms)) {
      setError(`Select ${MIN_COMPARE_PLATFORMS}–${MAX_COMPARE_PLATFORMS} platforms to compare.`);
      return;
    }

    setError(null);
    setIsCompareGenerating(true);
    setCompareGeneratingPlatforms([...comparePlatforms]);

    try {
      const savedProfileId = isLocalDraft ? await onEnsureSaved(formSnapshot) : profileId;

      await Promise.all(
        comparePlatforms.map(async (comparePlatform) => {
          try {
            let saved = forceRegenerate
              ? undefined
              : findReusableOutputTest(history, {
                  topic: trimmedTopic,
                  platform: comparePlatform,
                  platformFormat: defaultPlatformFormat(comparePlatform),
                  profileId: savedProfileId,
                });

            if (!saved) {
              saved = await onGenerate(
                savedProfileId,
                buildOutputTestGenerateInput({
                  topic: trimmedTopic,
                  platform: comparePlatform,
                })
              );
            }

            setCompareResults((current) => ({ ...current, [comparePlatform]: saved }));
            setCompareErrors((current) => {
              const next = { ...current };
              delete next[comparePlatform];
              return next;
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Preview generation failed';
            void reportClientError({
              message: `Live output test compare failed (${comparePlatform}): ${message}`,
              source: 'web',
              metadata: {
                kind: 'personal-branding-handler',
                feature: 'brandProfileExtraction',
                action: 'compare',
              },
            });
            setCompareErrors((current) => ({
              ...current,
              [comparePlatform]: message,
            }));
            setCompareResults((current) => {
              const next = { ...current };
              delete next[comparePlatform];
              return next;
            });
          } finally {
            setCompareGeneratingPlatforms((current) =>
              current.filter((value) => value !== comparePlatform)
            );
          }
        })
      );

      setSelectedTestId(null);
      setLatestResult(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Comparison generation failed';
      void reportClientError({
        message: `Live output test compare failed: ${message}`,
        source: 'web',
        metadata: {
          kind: 'personal-branding-handler',
          feature: 'brandProfileExtraction',
          action: 'compare',
        },
      });
      setError(message);
    } finally {
      setIsCompareGenerating(false);
      setCompareGeneratingPlatforms([]);
    }
  };

  const handleGenerate = async (toneBiasKey?: string) => {
    if (compareMode) {
      await handleGenerateCompare(false);
      return;
    }

    const trimmedTopic = topic.trim();
    const queue =
      selectedTopics.size > 0 ? Array.from(selectedTopics) : trimmedTopic ? [trimmedTopic] : [];

    if (queue.length === 0) {
      setError('Enter a sample topic or select brainstormed topics to generate a preview.');
      return;
    }

    setError(null);
    setScoringFailed(false);
    setIsGenerating(true);
    setGenerateProgress({ current: 0, total: queue.length });

    let successCount = 0;
    let lastSaved: BrandProfileOutputTest | null = null;
    let lastError: string | null = null;

    try {
      const savedProfileId = isLocalDraft ? await onEnsureSaved(formSnapshot) : profileId;

      for (let index = 0; index < queue.length; index += 1) {
        const queueTopic = queue[index];
        setGenerateProgress({ current: index + 1, total: queue.length });
        try {
          const saved = await onGenerate(
            savedProfileId,
            buildOutputTestGenerateInput({
              topic: queueTopic,
              platform,
              platformFormat,
              ...(toneBiasKey ? { toneBiasKey } : {}),
            })
          );
          lastSaved = saved;
          successCount += 1;
          if (hasToneMetrics && saved.toneScores == null && index === queue.length - 1) {
            setScoringFailed(true);
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Preview generation failed';
          void reportClientError({
            message: `Live output test generate failed: ${lastError}`,
            source: 'web',
            metadata: {
              kind: 'personal-branding-handler',
              feature: 'brandProfileExtraction',
              action: 'generate',
            },
          });
        }
      }

      if (lastSaved) {
        setSelectedTestId(null);
        setLatestResult(lastSaved);
      } else {
        setLatestResult(null);
      }

      if (queue.length > 1) {
        if (successCount === queue.length) {
          showToast({
            type: 'success',
            title: 'Previews generated',
            message: `${successCount} of ${queue.length} previews saved.`,
          });
        } else if (successCount > 0) {
          showToast({
            type: 'warning',
            title: 'Some previews failed',
            message: `${successCount} of ${queue.length} previews saved.`,
          });
          setError(lastError);
        } else {
          setError(lastError ?? 'Preview generation failed');
        }
      } else if (successCount === 0) {
        setError(lastError ?? 'Preview generation failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Preview generation failed';
      void reportClientError({
        message: `Live output test generate failed: ${message}`,
        source: 'web',
        metadata: {
          kind: 'personal-branding-handler',
          feature: 'brandProfileExtraction',
          action: 'generate',
        },
      });
      setLatestResult(null);
      setError(message);
    } finally {
      setIsGenerating(false);
      setGenerateProgress(null);
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
        platform: brainstormPlatform,
        count: 5,
      });
      setSuggestedTopics(result.topics);
      if (result.topics.length > 0) {
        setSelectedTopics(new Set([result.topics[0].topic]));
        setTopic(result.topics[0].topic);
      } else {
        setSelectedTopics(new Set());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Topic brainstorm failed';
      void reportClientError({
        message: `Live output test brainstorm failed: ${message}`,
        source: 'web',
        metadata: {
          kind: 'personal-branding-handler',
          feature: 'brandProfileExtraction',
          action: 'brainstorm',
        },
      });
      setSuggestedTopics([]);
      setSelectedTopics(new Set());
      setBrainstormError(message);
    } finally {
      setIsBrainstorming(false);
    }
  };

  const handleToggleSuggestion = (suggestionTopic: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(suggestionTopic)) {
        next.delete(suggestionTopic);
      } else {
        next.add(suggestionTopic);
      }
      return next;
    });
    setError(null);
    setBrainstormError(null);
  };

  const handleSelectHistory = (test: BrandProfileOutputTest) => {
    if (compareMode) {
      setTopic(test.topic);
      setError(null);
      const normalizedTopic = normalizeOutputTestTopic(test.topic);
      const fills: Partial<Record<BrandPlatform, BrandProfileOutputTest>> = {};
      for (const comparePlatform of comparePlatforms) {
        const match = history.find(
          (row) =>
            row.profileId === profileId &&
            row.platform === comparePlatform &&
            normalizeOutputTestTopic(row.topic) === normalizedTopic
        );
        if (match) {
          fills[comparePlatform] = match;
        }
      }
      setCompareResults(fills);
      setCompareErrors({});
      setSelectedTestId(null);
      setLatestResult(null);
      return;
    }

    setSelectedTestId(test.id);
    setLatestResult(null);
    setPlatform(test.platform);
    setPlatformFormat(test.platformFormat ?? defaultPlatformFormat(test.platform));
    setError(null);
    setScoringFailed(false);
  };

  const handleBiasMetric = (metricKey: string) => {
    void handleGenerate(metricKey);
  };

  const handleCopy = async () => {
    if (!displayedResult) return;
    const text = variantCopyText(displayedResult.title, displayedResult.body);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast({ type: 'success', title: 'Copied', message: 'Preview copied to clipboard.' });
    } catch (err) {
      showToast({
        type: 'error',
        title: "Couldn't copy",
        message: err instanceof Error ? err.message : 'Clipboard access failed',
      });
    }
  };

  const handleToggleSections = () => {
    if (sectionsCollapsed) {
      collapseActionsRef.current?.expandAll();
      setSectionsCollapsed(false);
      return;
    }
    collapseActionsRef.current?.collapseAll();
    setSectionsCollapsed(true);
  };

  const handleOpenWorkbench = async () => {
    if (!displayedResult) return;
    setIsOpeningWorkbench(true);
    try {
      const node = await personalBrandingService.createContentNode(
        buildLiveOutputWorkbenchDraftInput({
          outputTest: displayedResult,
          pillars: formSnapshot.pillars,
          appliedRuleNames,
          appliedRuleIds: resolvedPolicy?.appliedRuleIds ?? [],
        })
      );
      navigate(
        `${ROUTES.admin.personalBrandingWorkbench}?tab=sandbox&contentId=${encodeURIComponent(node.id)}`
      );
      showToast({ type: 'success', title: 'Opened in Workbench' });
      onClose();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Could not open in Workbench',
        message: err instanceof Error ? err.message : 'Failed to create draft',
      });
    } finally {
      setIsOpeningWorkbench(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <OverlayPortal>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'fixed inset-0 cursor-default bg-black/50 backdrop-blur-[2px]',
              overlayBackdropClassName
            )}
            aria-label="Close live output test"
            onClick={() => {
              if (!isGenerating && !isBrainstorming && !isCompareBusy) onClose();
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
            className={cn(
              'fixed inset-y-0 right-0 flex w-full flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900',
              compareMode ? 'max-w-5xl' : 'max-w-md',
              overlaySurfaceClassName
            )}
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
                disabled={isGenerating || isBrainstorming || isCompareBusy}
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
                    <BrainstormTopicSuggestionList
                      suggestions={suggestedTopics}
                      selectedTopics={selectedTopics}
                      onToggle={handleToggleSuggestion}
                      disabled={busy}
                    />
                  ) : null}
                </div>

                <PlatformComparePicker
                  compareMode={compareMode}
                  selectedPlatforms={comparePlatforms}
                  availablePlatforms={PLATFORMS}
                  disabled={busy}
                  onCompareModeChange={setCompareMode}
                  onPlatformsChange={setComparePlatforms}
                />

                {!compareMode ? (
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
                      onChange={(e) => {
                        const nextPlatform = e.target.value as BrandPlatform;
                        setPlatform(nextPlatform);
                        setPlatformFormat(defaultPlatformFormat(nextPlatform));
                      }}
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
                ) : null}

                {!compareMode ? (
                  <PlatformFormatSelect
                    platform={platform}
                    value={platformFormat}
                    onChange={setPlatformFormat}
                    disabled={busy}
                  />
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Compare mode uses each platform&apos;s default content format.
                  </p>
                )}

                {!compareMode && showPolicySection ? (
                  <div className="space-y-3">
                    {effectivePolicyQuery.isLoading ? (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Loading platform policy…
                      </p>
                    ) : effectivePolicyQuery.isError ? (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                        Could not load platform policy. Try again or check Platform Rules.
                      </p>
                    ) : (
                      <>
                        {shouldShowUniversalFallbackNotice(ruleSource) ? (
                          <UniversalRulesFallbackNotice
                            platformLabel={BRAND_PLATFORM_LABELS[platform]}
                            mode={ruleSource === 'none' ? 'none' : 'universalOnly'}
                          />
                        ) : null}
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-gray-950/50">
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            Applied platform policy
                          </p>
                          {appliedRuleNames.length > 0 ? (
                            <ul className="mt-2 flex flex-wrap gap-1.5" role="list">
                              {appliedRuleNames.map((name) => (
                                <li key={name}>
                                  <span className={statusPillClassName('neutral')}>{name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {hasPolicyConstraints && resolvedPolicy ? (
                            <PlatformRulePolicySummary
                              className="mt-3"
                              catalog={catalogQuery.data}
                              characterLimit={resolvedPolicy.characterLimit}
                              readTimeLimitMinutes={resolvedPolicy.readTimeLimitMinutes}
                              rhetoricalModes={resolvedPolicy.rhetoricalModes}
                              rhetoricalDevices={resolvedPolicy.rhetoricalDevices}
                              requirements={resolvedPolicy.requirements}
                            />
                          ) : null}
                          {bannedPhrases.length > 0 ? (
                            <div className="mt-3">
                              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                Banned phrases
                              </p>
                              <ul className="mt-2 flex flex-wrap gap-1.5" role="list">
                                {bannedPhrases.map((phrase) => (
                                  <li key={phrase}>
                                    <span className={statusPillClassName('warning')}>{phrase}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleGenerate()}
                    disabled={
                      busy ||
                      !canGenerate ||
                      (compareMode && !isValidCompareSelection(comparePlatforms))
                    }
                    className="inline-flex w-full items-center justify-center gap-2"
                  >
                    {compareMode ? (
                      isCompareBusy ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Generating comparison…
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4" aria-hidden />
                          Generate comparison
                        </>
                      )
                    ) : isGenerating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        {generateProgress && generateProgress.total > 1
                          ? `Generating ${generateProgress.current}/${generateProgress.total}…`
                          : 'Generating preview…'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" aria-hidden />
                        {effectiveTopicCount >= 2
                          ? `Generate ${effectiveTopicCount} previews`
                          : 'Generate preview'}
                      </>
                    )}
                  </Button>
                  {compareMode && Object.keys(compareResults).length > 0 && !isCompareBusy ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleGenerateCompare(true)}
                      disabled={busy || !canGenerate || !isValidCompareSelection(comparePlatforms)}
                      className="inline-flex w-full items-center justify-center gap-2"
                    >
                      <RefreshCw className="size-4" aria-hidden />
                      Force regenerate all
                    </Button>
                  ) : null}
                </div>
              </div>

              {!compareMode ? (
                <OutputTestToneScorecard
                  scores={displayedResult?.toneScores}
                  targets={formSnapshot.toneMetrics}
                  overallToneMatch={displayedResult?.overallToneMatch}
                  activeBiasKey={displayedResult?.toneBiasKey}
                  onBiasMetric={handleBiasMetric}
                  disabled={busy || !canGenerate}
                  isScoringFailed={scoringFailed}
                />
              ) : null}

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </p>
              ) : null}

              {compareMode ? (
                <div className="space-y-3">
                  {structuralDiff ? (
                    <OutputTestStructuralDiffStrip
                      diff={structuralDiff}
                      catalog={catalogQuery.data}
                    />
                  ) : null}
                  <div
                    className={cn(
                      'grid gap-3',
                      comparePlatforms.length === 2
                        ? 'md:grid-cols-2'
                        : 'md:grid-cols-2 lg:grid-cols-3'
                    )}
                  >
                    {comparePlatforms.map((comparePlatform) => {
                      const policyEntry = compareEffectiveRules.byPlatform.get(comparePlatform);
                      return (
                        <OutputTestCompareColumn
                          key={comparePlatform}
                          platform={comparePlatform}
                          result={compareResults[comparePlatform]}
                          isGenerating={compareGeneratingPlatforms.includes(comparePlatform)}
                          error={compareErrors[comparePlatform]}
                          effectivePolicy={policyEntry?.data}
                          policyLoading={policyEntry?.isPending}
                          policyError={policyEntry?.isError}
                          catalog={catalogQuery.data}
                          bannedPhrases={bannedPhrases}
                          showPolicySection={showPolicySection}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'min-h-[200px] overflow-y-auto rounded-lg border-2 border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-950/40',
                    !isGenerating && !displayedResult && 'flex items-center justify-center'
                  )}
                >
                  {isGenerating ? (
                    <OutputTestPreviewSkeleton />
                  ) : displayedResult ? (
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
                      <LiveOutputPreviewActionBar
                        disabled={busy}
                        isRegenerating={isGenerating}
                        isOpeningWorkbench={isOpeningWorkbench}
                        sectionsCollapsed={sectionsCollapsed}
                        onCopy={() => void handleCopy()}
                        onRegenerate={() => void handleGenerate()}
                        onToggleSections={handleToggleSections}
                        onOpenWorkbench={() => void handleOpenWorkbench()}
                      />
                      <MarkdownRenderer
                        content={displayedResult.body}
                        filePath={`live-output-test/${displayedResult.id}`}
                        collapseActionsRef={collapseActionsRef}
                        className={LIVE_OUTPUT_PREVIEW_MARKDOWN_CLASS}
                      />
                      {compliance ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {compliance.wordCount} words · ~{compliance.readingTimeMinutes} min read
                          {compliance.characterLimit != null
                            ? ` · ${compliance.characterCount}/${compliance.characterLimit} chars`
                            : ` · ${compliance.characterCount} chars`}
                          {compliance.readTimeLimitMinutes != null
                            ? ` (cap ${compliance.readTimeLimitMinutes} min)`
                            : ''}
                        </p>
                      ) : null}
                    </article>
                  ) : (
                    <p className="max-w-xs text-center text-xs text-gray-500 dark:text-gray-400">
                      Adjust tone metrics and pillars, then generate a preview to see how they
                      influence the draft voice.
                    </p>
                  )}
                </div>
              )}

              <ProfileOutputTestHistory
                tests={history}
                isLoading={historyLoading}
                selectedTestId={selectedTestId}
                onSelect={handleSelectHistory}
                onGenerateFirst={() => void handleGenerate()}
                generateDisabled={busy || !canGenerate}
              />
            </div>
          </motion.aside>
        </OverlayPortal>
      ) : null}
    </AnimatePresence>
  );
}
