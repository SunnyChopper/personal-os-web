import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Sparkles, X } from 'lucide-react';
import BottomSheet from '@/components/molecules/BottomSheet';
import ReplyGeneratingState, {
  type ReplyGeneratingSubmittedDraft,
} from '@/components/molecules/personal-branding/ReplyGeneratingState';
import ReplyPolishingStrip from '@/components/molecules/personal-branding/ReplyPolishingStrip';
import ReplyGenerationPanel, {
  type ReplyGenerationControls,
} from '@/components/molecules/personal-branding/ReplyGenerationPanel';
import OperatorBriefingPanel from '@/components/molecules/personal-branding/OperatorBriefingPanel';
import ReplySuggestionsList from '@/components/molecules/personal-branding/ReplySuggestionsList';
import {
  buildManualInteractionIntent,
  isXStatusUrl,
  stripStatusUrlFromText,
  type PrompterIntentAction,
} from '@/lib/personal-branding/manual-prompter-paste';
import { REPLY_INTERACTION_INTENT_MAX } from '@/lib/personal-branding/recon-prompter-seed';
import { isSparseCreatorText } from '@/lib/personal-branding/creator-text-quality';
import { personalBrandingService } from '@/services/personal-branding.service';
import { reportClientError } from '@/lib/client-telemetry';
import { defaultIncludeOperatorBriefing } from '@/lib/personal-branding/operator-briefing-defaults';
import { queryKeys } from '@/lib/react-query/query-keys';
import { cn } from '@/lib/utils';
import { FormTextarea } from '../PersonalBrandingFormFields';
import { selectableChipClassName } from '../personal-branding-ui';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type CreatorConnection,
  type ReplyGenerationDraft,
  type ReplyRejectionFeedbackCategory,
  type ReplyRun,
  type ReplySuggestion,
  type ReconLearningCostTier,
} from '@/types/api/personal-branding.dto';
import { Select } from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';

const PLATFORMS: BrandPlatform[] = [
  'linkedin',
  'x',
  'medium',
  'youtube',
  'instagram',
  'newsletter',
];

export interface PrompterAcceptMeta {
  evidenceUrl?: string | null;
  platformPostId?: string | null;
  authorHandle?: string | null;
}

interface RolodexPrompterDrawerProps {
  open: boolean;
  connection: CreatorConnection | null;
  profiles: { id: string; name: string }[];
  defaultProfileId?: string | null;
  activeRun?: ReplyRun | null;
  isGenerating?: boolean;
  isUpdatingSuggestion?: boolean;
  initialCreatorText?: string;
  initialInteractionIntent?: string;
  initialIntentAction?: 'reply' | 'quote';
  initialAuthorHandle?: string | null;
  initialEvidenceUrl?: string | null;
  initialPlatformPostId?: string | null;
  initialLearningCost?: ReconLearningCostTier | null;
  onClose: () => void;
  onGenerate: (
    payload: {
      creatorText: string;
      platform: BrandPlatform;
      interactionIntent?: string;
      platformPostId?: string | null;
      evidenceUrl?: string | null;
    },
    draft: ReplyGenerationDraft,
    resolved: { provider: string; model: string }
  ) => void;
  onAcceptSuggestion: (
    suggestion: ReplySuggestion,
    creatorText: string,
    meta?: PrompterAcceptMeta
  ) => void;
  onRejectSuggestion: (
    suggestion: ReplySuggestion,
    feedbackText: string | null,
    feedbackCategory: ReplyRejectionFeedbackCategory
  ) => void;
}

export default function RolodexPrompterDrawer({
  open,
  connection,
  profiles,
  defaultProfileId,
  activeRun,
  isGenerating = false,
  isUpdatingSuggestion = false,
  initialCreatorText = '',
  initialInteractionIntent = '',
  initialIntentAction,
  initialAuthorHandle,
  initialEvidenceUrl,
  initialPlatformPostId,
  initialLearningCost,
  onClose,
  onGenerate,
  onAcceptSuggestion,
  onRejectSuggestion,
}: RolodexPrompterDrawerProps) {
  const [creatorText, setCreatorText] = useState('');
  const [platform, setPlatform] = useState<BrandPlatform>('x');
  const [interactionIntent, setInteractionIntent] = useState('');
  const [intentAction, setIntentAction] =
    useState<Extract<PrompterIntentAction, 'reply' | 'quote'>>('reply');
  const [authorHandle, setAuthorHandle] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [platformPostId, setPlatformPostId] = useState<string | null>(null);
  const [isResolvingPaste, setIsResolvingPaste] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<ReplyGeneratingSubmittedDraft | null>(null);
  const [progressNowMs, setProgressNowMs] = useState(() => Date.now());
  const [allowFullGenerationOnSparseText, setAllowFullGenerationOnSparseText] = useState(false);
  const [generateControls, setGenerateControls] = useState<ReplyGenerationControls | null>(null);
  const resolveRequestId = useRef(0);
  const queryClient = useQueryClient();
  const saveBriefingMutation = useMutation({
    mutationFn: () => {
      if (!activeRun?.id) throw new Error('No active run');
      return personalBrandingService.saveOperatorBriefingToVault(activeRun.id);
    },
    onSuccess: (data) => {
      if (!activeRun?.id) return;
      queryClient.setQueryData<ReplyRun>(
        queryKeys.personalBranding.replyRuns.detail(activeRun.id),
        (prev) => (prev ? { ...prev, operatorBriefing: data.operatorBriefing } : prev)
      );
    },
  });

  useEffect(() => {
    if (!open) return;
    setCreatorText(initialCreatorText);
    setPlatform('x');
    setInteractionIntent(initialInteractionIntent);
    setAuthorHandle(initialAuthorHandle ?? null);
    setEvidenceUrl(initialEvidenceUrl ?? null);
    setPlatformPostId(initialPlatformPostId ?? null);
    setAllowFullGenerationOnSparseText(false);
    setIntentAction(
      initialIntentAction ??
        (initialInteractionIntent.toLowerCase().includes('quote') ? 'quote' : 'reply')
    );
  }, [
    open,
    initialCreatorText,
    initialInteractionIntent,
    initialIntentAction,
    initialAuthorHandle,
    initialEvidenceUrl,
    initialPlatformPostId,
  ]);

  const applyIntentChip = (action: Extract<PrompterIntentAction, 'reply' | 'quote'>) => {
    setIntentAction(action);
    setInteractionIntent(
      buildManualInteractionIntent({
        action,
        authorUsername: authorHandle,
      })
    );
  };

  const resolvePastedUrl = async (raw: string) => {
    const { text, statusUrl } = stripStatusUrlFromText(raw);
    if (!statusUrl) return;

    setCreatorText(text);
    setEvidenceUrl(statusUrl.evidenceUrl);
    setPlatformPostId(statusUrl.platformPostId);
    if (statusUrl.authorUsername) {
      setAuthorHandle(statusUrl.authorUsername);
    }

    const requestId = ++resolveRequestId.current;
    setIsResolvingPaste(true);
    try {
      const result = await personalBrandingService.resolveXContent({
        url: statusUrl.evidenceUrl,
        authorUsername: statusUrl.authorUsername,
        platformPostId: statusUrl.platformPostId,
      });
      if (requestId !== resolveRequestId.current) return;
      if (result.authorUsername) {
        setAuthorHandle(result.authorUsername.replace(/^@+/, ''));
      }
      if (result.evidenceUrl) setEvidenceUrl(result.evidenceUrl);
      if (result.platformPostId) setPlatformPostId(result.platformPostId);
      if (result.creatorText?.trim()) {
        setCreatorText(result.creatorText.trim());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve pasted URL';
      void reportClientError({
        message: `Rolodex paste resolve failed: ${message}`,
        source: 'web',
        metadata: {
          kind: 'personal-branding-handler',
          feature: 'rolodexReply',
          action: 'resolvePaste',
        },
      });
    } finally {
      if (requestId === resolveRequestId.current) {
        setIsResolvingPaste(false);
      }
    }
  };

  const handleCreatorTextChange = (value: string) => {
    if (isXStatusUrl(value.trim())) {
      void resolvePastedUrl(value.trim());
      return;
    }
    setCreatorText(value);
  };

  const suggestions = activeRun?.suggestions ?? [];
  const showRunProgress =
    isGenerating || activeRun?.status === 'QUEUED' || activeRun?.status === 'RUNNING';
  const generatingMode = activeRun?.mode ?? lastSubmitted?.mode ?? 'SIMPLE';

  useEffect(() => {
    if (!showRunProgress || suggestions.length > 0) {
      return;
    }
    if (generatingMode !== 'AGENT') return;

    const tick = () => setProgressNowMs(Date.now());
    tick();
    const intervalId = window.setInterval(tick, 500);
    return () => window.clearInterval(intervalId);
  }, [showRunProgress, suggestions.length, generatingMode]);

  useEffect(() => {
    if (!showRunProgress) {
      setLastSubmitted(null);
    }
  }, [showRunProgress]);

  const drawerOpen = open && connection != null;
  const limitedTextContext = isSparseCreatorText(creatorText);
  const interactionIntentOverLimit = interactionIntent.length > REPLY_INTERACTION_INTENT_MAX;
  const lightweightLocked = limitedTextContext && !allowFullGenerationOnSparseText;
  const displayHandle = authorHandle ?? initialAuthorHandle;

  useEffect(() => {
    if (!drawerOpen) {
      setGenerateControls(null);
    }
  }, [drawerOpen]);

  const prompterHeader = connection ? (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Response prompter</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {connection.name}
            {displayHandle ? ` · @${displayHandle}` : ''}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  ) : null;

  const prompterFooter =
    connection && generateControls ? (
      <div className="flex w-full items-center gap-3">
        <p className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
          {generateControls.suggestionCount} suggestion
          {generateControls.suggestionCount === 1 ? '' : 's'}
        </p>
        <Button
          type="button"
          size="sm"
          className="min-w-0 flex-1"
          disabled={generateControls.disabled}
          onClick={generateControls.generate}
        >
          {generateControls.isGenerating ? 'Generating…' : 'Generate'}
        </Button>
      </div>
    ) : null;

  const handleReplyPanelGenerate = useCallback(
    (draft: ReplyGenerationDraft, resolved: { provider: string; model: string }) => {
      const outboundDraft: ReplyGenerationDraft = {
        ...draft,
        allowFullGenerationOnSparseText,
      };
      setLastSubmitted({
        suggestionCount: outboundDraft.suggestionCount,
        mode: outboundDraft.mode,
        researchEnabled: outboundDraft.researchEnabled,
        vaultGroundingEnabled: outboundDraft.vaultGroundingEnabled,
        submittedAtMs: Date.now(),
      });
      setProgressNowMs(Date.now());
      onGenerate(
        {
          creatorText: creatorText.trim(),
          platform,
          interactionIntent: interactionIntent.trim() || undefined,
          platformPostId,
          evidenceUrl,
        },
        outboundDraft,
        resolved
      );
    },
    [
      allowFullGenerationOnSparseText,
      creatorText,
      evidenceUrl,
      interactionIntent,
      onGenerate,
      platform,
      platformPostId,
    ]
  );

  return (
    <BottomSheet
      isOpen={drawerOpen}
      onClose={onClose}
      ariaLabel="Rolodex response prompter"
      header={prompterHeader}
      footer={prompterFooter}
      desktopPresentation="side-drawer"
      snapPoints={[0.55, 0.92]}
      initialSnapIndex={1}
      showDragHandle
      contentClassName="space-y-4 p-4 px-4 py-4"
    >
      {connection ? (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Platform
            </label>
            <Select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as BrandPlatform)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {BRAND_PLATFORM_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Creator text
            </label>
            <FormTextarea
              value={creatorText}
              onChange={(e) => handleCreatorTextChange(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text');
                if (isXStatusUrl(pasted.trim())) {
                  e.preventDefault();
                  void resolvePastedUrl(pasted.trim());
                }
              }}
              placeholder="Paste post URL or text…"
              className="min-h-[80px]"
            />
            {isResolvingPaste ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Resolving post from URL…
              </p>
            ) : null}
            {limitedTextContext ? (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="font-medium">Limited text context</p>
                <p className="mt-1 leading-relaxed">
                  This post looks media-heavy or caption-only. Full replies may invent context.
                  Prefer a short react, curious question, or meme-style reply — or paste what the
                  image shows.
                </p>
                <label className="mt-2 flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={allowFullGenerationOnSparseText}
                    onChange={(e) => setAllowFullGenerationOnSparseText(e.target.checked)}
                    disabled={showRunProgress}
                  />
                  <span>I know the media context — allow full generation</span>
                </label>
              </div>
            ) : null}
            {evidenceUrl ? (
              <a
                href={evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <ExternalLink className="h-3 w-3" />
                Evidence link
              </a>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Intent
              </p>
              <div className="flex flex-wrap gap-2">
                {(['reply', 'quote'] as const).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => applyIntentChip(action)}
                    className={cn(
                      selectableChipClassName(
                        intentAction === action,
                        intentAction === action ? 'ring-2 ring-blue-500/40' : undefined
                      ),
                      'capitalize'
                    )}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
            <FormTextarea
              value={interactionIntent}
              onChange={(e) => setInteractionIntent(e.target.value)}
              className="min-h-[72px]"
              maxLength={REPLY_INTERACTION_INTENT_MAX}
              placeholder={
                limitedTextContext && !interactionIntent.trim()
                  ? 'Short react, curious question, or meme-style reply…'
                  : 'Warm follow-up, technical debate, share resource…'
              }
            />
            <p
              className={cn(
                'mt-1 text-xs',
                interactionIntentOverLimit
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {interactionIntent.length}/{REPLY_INTERACTION_INTENT_MAX}
            </p>
          </div>

          <ReplyGenerationPanel
            platform={platform}
            profiles={profiles}
            defaultProfileId={defaultProfileId}
            defaultIncludeOperatorBriefing={defaultIncludeOperatorBriefing(initialLearningCost)}
            generateButtonPlacement="external"
            onGenerateControlsChange={setGenerateControls}
            disabled={!creatorText.trim() || showRunProgress || interactionIntentOverLimit}
            lightweightLocked={lightweightLocked}
            isGenerating={showRunProgress}
            onGenerate={handleReplyPanelGenerate}
          />

          {showRunProgress && !suggestions.length ? (
            <ReplyGeneratingState
              run={activeRun}
              submittedDraft={lastSubmitted}
              isPending={isGenerating && !activeRun}
              nowMs={progressNowMs}
            />
          ) : null}

          {showRunProgress && suggestions.length > 0 && activeRun?.status === 'RUNNING' ? (
            <ReplyPolishingStrip
              run={activeRun}
              submittedDraft={lastSubmitted}
              nowMs={progressNowMs}
            />
          ) : null}

          {activeRun?.status === 'PARTIAL' && activeRun.error ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">{activeRun.error}</p>
          ) : null}

          {activeRun?.status === 'FAILED' && activeRun.error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{activeRun.error}</p>
          ) : null}

          <OperatorBriefingPanel
            briefing={activeRun?.operatorBriefing}
            isSaving={saveBriefingMutation.isPending}
            onSaveToVault={
              activeRun?.id && activeRun.operatorBriefing?.markdown
                ? () => saveBriefingMutation.mutate()
                : undefined
            }
          />

          <ReplySuggestionsList
            suggestions={suggestions}
            isUpdating={isUpdatingSuggestion}
            onAccept={(s) =>
              onAcceptSuggestion(s, creatorText.trim(), {
                evidenceUrl,
                platformPostId,
                authorHandle: displayHandle,
              })
            }
            onReject={onRejectSuggestion}
          />
        </>
      ) : null}
    </BottomSheet>
  );
}
