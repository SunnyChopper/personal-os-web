import { useMemo, useState } from 'react';
import { AssistantCurrentDefaultsSummary } from '@/components/molecules/assistant/AssistantCurrentDefaultsSummary';
import { ManualModelListbox } from '@/components/molecules/assistant/ManualModelListbox';
import {
  AssistantModelManualSortChips,
  AssistantModelModeToggle,
} from '@/components/molecules/assistant/AssistantModelPickerPrimitives';
import {
  isRoutingOrientedCatalogEntry,
  ROUTING_RESPONSE_PICKER_WARNING,
  sortAssistantModels,
  type ManualModelSortKey,
} from '@/lib/assistant/model-picker-utils';
import type { ModelPickerDraft } from '@/lib/assistant/run-config-picker-draft';
import type { AssistantModelCatalogData } from '@/types/chatbot';

type LastResolvedModelsDisplay = {
  reasoningLabel: string;
  responseLabel: string;
  modelMode: string;
};

export type AssistantRunConfigPickerFormProps = {
  catalog: AssistantModelCatalogData | null;
  isLoading: boolean;
  draft: ModelPickerDraft;
  onDraftChange: (patch: Partial<ModelPickerDraft>) => void;
  /** When set (e.g. chat page), show “last reply” model line under Auto optimize chips. */
  lastResolved?: LastResolvedModelsDisplay | null;
  disabled?: boolean;
  /** Hint under manual listboxes (chat vs proactive wording). */
  manualHelpText?: string;
  /** When Auto and `lastResolved` is absent, show this note (e.g. chat: “after next reply”). */
  autoLastReplyPlaceholder?: string | null;
  /** When false, hide context compaction controls (e.g. settings default-models section). */
  showCompaction?: boolean;
  /** Override compaction help copy (e.g. proactive automation wording). */
  compactionHelpText?: string;
  /** Settings card: elevated mode toggle, summary-first manual layout, muted sort chips. */
  layout?: 'default' | 'settings';
};

const OPTIMIZE_OPTIONS = [
  ['speed', 'Speed'],
  ['intelligence', 'Intelligence'],
  ['cost', 'Cost / economy'],
  ['balanced', 'Balanced'],
  ['value', 'Value (quality per $)'],
] as const;

export function AssistantRunConfigPickerForm({
  catalog,
  isLoading,
  draft,
  onDraftChange,
  lastResolved,
  disabled,
  manualHelpText = 'Manual choices apply after you tap Save — your next message uses the saved models.',
  autoLastReplyPlaceholder = null,
  showCompaction = true,
  compactionHelpText,
  layout = 'default',
}: AssistantRunConfigPickerFormProps) {
  const [manualSortBy, setManualSortBy] = useState<ManualModelSortKey>('default');
  const isSettingsLayout = layout === 'settings';

  const sortedPickerModels = useMemo(
    () => (catalog ? sortAssistantModels(catalog.models, manualSortBy) : []),
    [catalog, manualSortBy]
  );

  const selectedResponseEntry = useMemo(() => {
    if (!catalog || draft.mode !== 'manual') return undefined;
    return catalog.models.find((m) => m.id === draft.responseModelId);
  }, [catalog, draft.mode, draft.responseModelId]);

  const showRoutingResponseWarning =
    draft.mode === 'manual' &&
    selectedResponseEntry != null &&
    isRoutingOrientedCatalogEntry(selectedResponseEntry);

  if (isLoading || !catalog) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">Loading models…</p>;
  }
  if (catalog.models.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        No models available. Configure LLM API keys for your deployment.
      </p>
    );
  }

  const modeToggle = (
    <AssistantModelModeToggle
      mode={draft.mode}
      disabled={disabled}
      variant={isSettingsLayout ? 'settings' : 'default'}
      onChange={(m) => onDraftChange({ mode: m })}
    />
  );

  const settingsSummary = isSettingsLayout ? (
    <AssistantCurrentDefaultsSummary
      mode={draft.mode}
      reasoningModelId={draft.reasoningModelId}
      responseModelId={draft.responseModelId}
      optimizeFor={draft.optimizeFor}
      models={catalog.models}
    />
  ) : null;

  const manualListboxes = (
    <div className={isSettingsLayout ? 'space-y-3 mb-2' : 'space-y-2 mb-1'}>
      <ManualModelListbox
        label="Reasoning / planning"
        models={sortedPickerModels}
        value={draft.reasoningModelId}
        disabled={disabled}
        density={isSettingsLayout ? 'comfortable' : 'default'}
        onChange={(id) => onDraftChange({ reasoningModelId: id })}
      />
      <ManualModelListbox
        label="Response"
        models={sortedPickerModels}
        value={draft.responseModelId}
        disabled={disabled}
        density={isSettingsLayout ? 'comfortable' : 'default'}
        onChange={(id) => onDraftChange({ responseModelId: id })}
      />
      {showRoutingResponseWarning ? (
        <p
          className="text-[11px] text-amber-800 dark:text-amber-200/90 rounded-md border border-amber-200/80 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/30 px-2.5 py-2"
          role="note"
        >
          {ROUTING_RESPONSE_PICKER_WARNING}
        </p>
      ) : null}
    </div>
  );

  const sortChips = (
    <AssistantModelManualSortChips
      sortBy={manualSortBy}
      disabled={disabled}
      variant={isSettingsLayout ? 'muted' : 'default'}
      onSortByChange={setManualSortBy}
    />
  );

  const manualHelp = (
    <p
      className={`text-gray-500 dark:text-gray-400 ${
        isSettingsLayout ? 'text-[11px] mt-1' : 'text-[11px] mt-2'
      }`}
    >
      {manualHelpText}
    </p>
  );

  const optimizeSection = (
    <>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Optimize for
      </p>
      <div className="flex flex-col gap-1.5 mb-2">
        {OPTIMIZE_OPTIONS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onDraftChange({ optimizeFor: key })}
            className={`px-2 py-2 sm:py-1.5 rounded-md text-xs text-left min-h-[44px] sm:min-h-0 ${
              draft.optimizeFor === key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
        Auto ranks models from your configured API keys using catalog scores. Cost bars mean
        cheapness (higher = lower $). Balanced uses 0.4×intel + 0.3×speed + 0.3×cost. The LLM router
        (if enabled server-side) can also weigh capability tags like vision or realtime web.
      </p>
    </>
  );

  return (
    <>
      {modeToggle}
      {showCompaction ? (
        <>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 mt-3">
            Context compaction
          </p>
          <div className="flex flex-col gap-1.5 mb-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDraftChange({ compactionMode: 'auto' })}
                className={`px-2 py-2 sm:py-1.5 rounded-md text-xs text-left min-h-[44px] sm:min-h-0 flex-1 sm:flex-none ${
                  (draft.compactionMode ?? 'auto') !== 'manual'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                Auto compact
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDraftChange({ compactionMode: 'manual' })}
                className={`px-2 py-2 sm:py-1.5 rounded-md text-xs text-left min-h-[44px] sm:min-h-0 flex-1 sm:flex-none ${
                  (draft.compactionMode ?? 'auto') === 'manual'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                Manual compact
              </button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {compactionHelpText ?? (
                <>
                  <strong>Auto</strong> lets the server summarize older turns when you are near the
                  model limit. <strong>Manual</strong> never does that silently—you run
                  &quot;Compact thread&quot; in chat (or start a new thread) when the meter says it
                  is required.
                </>
              )}
            </p>
          </div>
        </>
      ) : null}
      {draft.mode === 'auto' ? (
        <>
          {settingsSummary}
          {optimizeSection}
          {lastResolved ? (
            <>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Last reply (this chat)
              </p>
              <div className="text-xs text-gray-800 dark:text-gray-200 space-y-1 mb-1">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Reasoning: </span>
                  {lastResolved.reasoningLabel}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Response: </span>
                  {lastResolved.responseLabel}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  Mode: {lastResolved.modelMode || '—'}
                </div>
              </div>
            </>
          ) : autoLastReplyPlaceholder ? (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0">
              {autoLastReplyPlaceholder}
            </p>
          ) : null}
        </>
      ) : isSettingsLayout ? (
        <>
          {settingsSummary}
          {manualListboxes}
          {sortChips}
          {manualHelp}
        </>
      ) : (
        <>
          {sortChips}
          {manualListboxes}
          {manualHelp}
        </>
      )}
    </>
  );
}
