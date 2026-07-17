import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { ManualModelListbox } from '@/components/molecules/assistant/ManualModelListbox';
import { chatbotService } from '@/services/chatbot.service';
import { draftFromSuggestedParams } from '@/lib/personal-branding/reply-generation-draft';
import type {
  ReplyGenerationDraft,
  ReplyGenerationMode,
  SuggestedReplyParams,
} from '@/types/api/personal-branding.dto';

const REASONING_EFFORTS = ['low', 'medium', 'high', 'xhigh'] as const;

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

export interface ReplyGenerationPanelProps {
  suggestedParams?: SuggestedReplyParams | null;
  disabled?: boolean;
  isGenerating?: boolean;
  onGenerate: (draft: ReplyGenerationDraft, resolved: { provider: string; model: string }) => void;
}

export default function ReplyGenerationPanel({
  suggestedParams,
  disabled = false,
  isGenerating = false,
  onGenerate,
}: ReplyGenerationPanelProps) {
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

  const [draft, setDraft] = useState<ReplyGenerationDraft>(() =>
    draftFromSuggestedParams(suggestedParams, defaultModelId)
  );

  useEffect(() => {
    if (!defaultModelId) return;
    setDraft(draftFromSuggestedParams(suggestedParams, defaultModelId));
  }, [suggestedParams, defaultModelId]);

  const selectedModel = models.find((m) => m.id === draft.catalogModelId) ?? models[0];
  const showEffort = selectedModel?.capabilityTags?.includes('configurableEffort') ?? false;

  const handleGenerate = () => {
    if (!selectedModel) return;
    onGenerate(draft, { provider: selectedModel.provider, model: selectedModel.apiModelId });
  };

  return (
    <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generate reply</h3>
      </div>
      {suggestedParams ? (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          AI-suggested defaults based on this post — adjust before generating.
        </p>
      ) : null}

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
            disabled={disabled || isGenerating}
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
            onChange={(e) => setDraft((d) => ({ ...d, researchEnabled: e.target.value === 'on' }))}
            disabled={disabled || isGenerating}
            className="w-full"
          >
            <option value="off">Off</option>
            <option value="on">On (Tavily)</option>
          </Select>
        </div>
      </div>

      <div>
        <ManualModelListbox
          label="Model"
          models={models}
          value={draft.catalogModelId}
          onChange={(id) => setDraft((d) => ({ ...d, catalogModelId: id }))}
          disabled={disabled || isGenerating || catalogQuery.isLoading}
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
            disabled={disabled || isGenerating}
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

      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={disabled || isGenerating || !selectedModel}
        onClick={handleGenerate}
      >
        {isGenerating ? 'Generating…' : 'Generate'}
      </Button>
    </section>
  );
}
