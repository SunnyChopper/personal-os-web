import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { ManualModelListbox } from '@/components/molecules/assistant/ManualModelListbox';
import PlatformFormatSelect from '@/components/molecules/personal-branding/PlatformFormatSelect';
import { chatbotService } from '@/services/chatbot.service';
import { defaultReplyPlatformFormat } from '@/lib/personal-branding/platform-format-helpers';
import { draftFromSuggestedParams } from '@/lib/personal-branding/reply-generation-draft';
import { cn } from '@/lib/utils';
import type {
  BrandPlatform,
  QuestionFirstBias,
  ReplyGenerationDraft,
  ReplyGenerationMode,
  SuggestedReplyParams,
} from '@/types/api/personal-branding.dto';

const REASONING_EFFORTS = ['low', 'medium', 'high', 'xhigh'] as const;

const QUESTION_FIRST_OPTIONS: { value: QuestionFirstBias; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'on', label: 'On' },
  { value: 'auto', label: 'Auto' },
];

function resolveCatalogModelId(
  models: { id: string; apiModelId: string; provider: string }[],
  suggested?: SuggestedReplyParams | null
): string {
  if (!models.length) return '';
  if (suggested?.model) {
    const match = models.find(
      (m) =>
        m.apiModelId === suggested.model ||
        m.id === suggested.model ||
        `${m.provider}/${m.apiModelId}` === suggested.model
    );
    if (match) return match.id;
  }
  return models[0]?.id ?? '';
}

function resolveDefaultProfileId(
  profiles: { id: string; name: string }[],
  defaultProfileId?: string | null
): string {
  if (defaultProfileId && profiles.some((profile) => profile.id === defaultProfileId)) {
    return defaultProfileId;
  }
  return profiles[0]?.id ?? '';
}

export type ReplyGenerationGenerateButtonPlacement = 'inline' | 'external';

export interface ReplyGenerationControls {
  suggestionCount: number;
  disabled: boolean;
  isGenerating: boolean;
  generate: () => void;
}

export interface ReplyGenerationPanelProps {
  platform: BrandPlatform;
  profiles: { id: string; name: string }[];
  defaultProfileId?: string | null;
  suggestedParams?: SuggestedReplyParams | null;
  disabled?: boolean;
  isGenerating?: boolean;
  lightweightLocked?: boolean;
  defaultIncludeOperatorBriefing?: boolean;
  generateButtonPlacement?: ReplyGenerationGenerateButtonPlacement;
  onGenerateControlsChange?: (controls: ReplyGenerationControls | null) => void;
  onGenerate: (draft: ReplyGenerationDraft, resolved: { provider: string; model: string }) => void;
}

export default function ReplyGenerationPanel({
  platform,
  profiles,
  defaultProfileId,
  suggestedParams,
  disabled = false,
  isGenerating = false,
  lightweightLocked = false,
  defaultIncludeOperatorBriefing: defaultIncludeOperatorBriefingProp = false,
  generateButtonPlacement = 'inline',
  onGenerateControlsChange,
  onGenerate,
}: ReplyGenerationPanelProps) {
  const advancedPanelId = useId();

  const catalogQuery = useQuery({
    queryKey: ['assistant', 'model-catalog'],
    queryFn: () => chatbotService.getAssistantModelCatalog(),
    staleTime: 5 * 60 * 1000,
  });

  const models = catalogQuery.data?.models ?? [];
  const defaultModelId = useMemo(
    () => resolveCatalogModelId(models, suggestedParams),
    [models, suggestedParams]
  );
  const resolvedDefaultProfileId = useMemo(
    () => resolveDefaultProfileId(profiles, defaultProfileId),
    [profiles, defaultProfileId]
  );

  const [draft, setDraft] = useState<ReplyGenerationDraft>(() =>
    draftFromSuggestedParams(suggestedParams, defaultModelId, resolvedDefaultProfileId, platform)
  );

  useEffect(() => {
    if (!defaultModelId) return;
    setDraft(
      draftFromSuggestedParams(suggestedParams, defaultModelId, resolvedDefaultProfileId, platform)
    );
  }, [suggestedParams, defaultModelId, resolvedDefaultProfileId, platform]);

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      platformFormat: defaultReplyPlatformFormat(platform),
    }));
  }, [platform]);

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      includeOperatorBriefing: defaultIncludeOperatorBriefingProp,
    }));
  }, [defaultIncludeOperatorBriefingProp]);

  useEffect(() => {
    if (!lightweightLocked) return;
    setDraft((prev) => ({
      ...prev,
      mode: 'SIMPLE',
      researchEnabled: false,
      vaultGroundingEnabled: false,
    }));
  }, [lightweightLocked]);

  const selectedModel = models.find((m) => m.id === draft.catalogModelId) ?? models[0];
  const showEffort = selectedModel?.capabilityTags?.includes('configurableEffort') ?? false;
  const hasProfile = profiles.length > 0 && Boolean(draft.profileId);
  const settingsRationale = suggestedParams?.settingsRationale?.trim() ?? '';
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const advancedControlsDisabled = disabled || isGenerating || lightweightLocked;

  const advancedActive =
    draft.mode !== 'SIMPLE' ||
    draft.researchEnabled ||
    draft.vaultGroundingEnabled ||
    draft.includeOperatorBriefing ||
    (showEffort && (draft.reasoningEffort ?? 'medium') !== 'medium') ||
    (defaultModelId && draft.catalogModelId !== defaultModelId);

  const handleGenerate = useCallback(() => {
    if (!selectedModel || !hasProfile) return;
    const outbound: ReplyGenerationDraft = lightweightLocked
      ? {
          ...draft,
          mode: 'SIMPLE',
          researchEnabled: false,
          vaultGroundingEnabled: false,
        }
      : draft;
    onGenerate(outbound, { provider: selectedModel.provider, model: selectedModel.apiModelId });
  }, [draft, hasProfile, lightweightLocked, onGenerate, selectedModel]);

  const generateDisabled = disabled || isGenerating || !selectedModel || !hasProfile;
  const generateRef = useRef(handleGenerate);
  generateRef.current = handleGenerate;

  useEffect(() => {
    if (generateButtonPlacement !== 'external' || !onGenerateControlsChange) return;

    onGenerateControlsChange({
      suggestionCount: draft.suggestionCount,
      disabled: generateDisabled,
      isGenerating,
      generate: () => generateRef.current(),
    });

    return () => onGenerateControlsChange(null);
  }, [
    draft.suggestionCount,
    generateButtonPlacement,
    generateDisabled,
    isGenerating,
    onGenerateControlsChange,
  ]);

  return (
    <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generate reply</h3>
      </div>
      {suggestedParams ? (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          AI-suggested defaults based on this post — adjust before generating.
        </p>
      ) : null}

      {settingsRationale ? (
        <div>
          <button
            type="button"
            onClick={() => setRationaleOpen((prev) => !prev)}
            className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-xs font-medium text-blue-700 hover:bg-blue-100/60 dark:text-blue-300 dark:hover:bg-blue-950/40"
            aria-expanded={rationaleOpen}
          >
            {rationaleOpen ? (
              <ChevronDown className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            )}
            <span>Why these settings</span>
            {!rationaleOpen && selectedModel?.label ? (
              <span className="truncate text-[10px] font-normal text-gray-500 dark:text-gray-400">
                {selectedModel.label}
              </span>
            ) : null}
          </button>
          {rationaleOpen ? (
            <p className="mt-1 px-1 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              {settingsRationale}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Brand profile
        </label>
        {profiles.length > 0 ? (
          <Select
            value={draft.profileId}
            onChange={(e) => setDraft((d) => ({ ...d, profileId: e.target.value }))}
            disabled={disabled || isGenerating}
            className="w-full"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Create a Brand Identity profile first.
          </p>
        )}
      </div>

      <PlatformFormatSelect
        id="reply-gen-platform-format"
        platform={platform}
        value={draft.platformFormat}
        onChange={(value) => setDraft((d) => ({ ...d, platformFormat: value }))}
        disabled={disabled || isGenerating}
      />

      {defaultIncludeOperatorBriefingProp ? (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Key concepts briefing
          </label>
          <Select
            value={draft.includeOperatorBriefing ? 'on' : 'off'}
            onChange={(e) =>
              setDraft((d) => ({ ...d, includeOperatorBriefing: e.target.value === 'on' }))
            }
            disabled={disabled || isGenerating}
            className="w-full"
          >
            <option value="on">On (explain post / prep reply)</option>
            <option value="off">Off</option>
          </Select>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Suggestions ({draft.suggestionCount})
        </label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={draft.suggestionCount}
          disabled={disabled || isGenerating}
          onChange={(e) => setDraft((d) => ({ ...d, suggestionCount: Number(e.target.value) }))}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Question-first
        </label>
        <div className="flex gap-1">
          {QUESTION_FIRST_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled || isGenerating}
              onClick={() => setDraft((d) => ({ ...d, questionFirstBias: option.value }))}
              className={cn(
                'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                draft.questionFirstBias === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Auto reserves a curiosity-led opener for target/aware connections.
        </p>
      </div>

      {lightweightLocked ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Lightweight mode: Simple generation without research or vault grounding.
        </p>
      ) : null}

      <div className="border-t border-blue-200/80 pt-2 dark:border-blue-900/40">
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm font-medium text-gray-700',
            'hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50'
          )}
          aria-expanded={advancedOpen}
          aria-controls={advancedPanelId}
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          {advancedOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          )}
          Advanced
          {!advancedOpen && advancedActive ? (
            <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Active
            </span>
          ) : null}
        </button>

        {advancedOpen ? (
          <div id={advancedPanelId} className="mt-2 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Mode
                </label>
                <Select
                  value={draft.mode}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, mode: e.target.value as ReplyGenerationMode }))
                  }
                  disabled={advancedControlsDisabled}
                  className="w-full"
                >
                  <option value="SIMPLE">Simple — one pass</option>
                  <option value="AGENT">Agent — plan, research, polish</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Research
                </label>
                <Select
                  value={draft.researchEnabled ? 'on' : 'off'}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, researchEnabled: e.target.value === 'on' }))
                  }
                  disabled={advancedControlsDisabled}
                  className="w-full"
                >
                  <option value="off">Off</option>
                  <option value="on">On (Tavily)</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Vault grounding
                </label>
                <Select
                  value={draft.vaultGroundingEnabled ? 'on' : 'off'}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, vaultGroundingEnabled: e.target.value === 'on' }))
                  }
                  disabled={advancedControlsDisabled}
                  className="w-full"
                >
                  <option value="off">Off</option>
                  <option value="on">On (Knowledge Vault)</option>
                </Select>
              </div>
              {!defaultIncludeOperatorBriefingProp ? (
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Key concepts briefing
                  </label>
                  <Select
                    value={draft.includeOperatorBriefing ? 'on' : 'off'}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        includeOperatorBriefing: e.target.value === 'on',
                      }))
                    }
                    disabled={advancedControlsDisabled}
                    className="w-full"
                  >
                    <option value="off">Off</option>
                    <option value="on">On (explain post / prep reply)</option>
                  </Select>
                </div>
              ) : null}
            </div>

            <div>
              <ManualModelListbox
                label="Model"
                models={models}
                value={draft.catalogModelId}
                onChange={(id) => setDraft((d) => ({ ...d, catalogModelId: id }))}
                disabled={advancedControlsDisabled || catalogQuery.isLoading}
              />
            </div>

            {showEffort ? (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Reasoning effort
                </label>
                <Select
                  value={draft.reasoningEffort ?? 'medium'}
                  onChange={(e) => setDraft((d) => ({ ...d, reasoningEffort: e.target.value }))}
                  disabled={advancedControlsDisabled}
                  className="w-full"
                >
                  {REASONING_EFFORTS.map((effort) => (
                    <option key={effort} value={effort}>
                      {effort}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {generateButtonPlacement === 'inline' ? (
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={generateDisabled}
          onClick={handleGenerate}
        >
          {isGenerating ? 'Generating…' : 'Generate'}
        </Button>
      ) : null}
    </section>
  );
}
