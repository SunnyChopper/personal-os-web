import { useMemo, useState } from 'react';
import {
  Sparkles,
  Expand,
  FileText,
  Wand2,
  Tag,
  FolderTree,
  Brain,
  Loader2,
  X,
} from 'lucide-react';
import { noteAIService } from '@/services/knowledge-vault/note-ai.service';
import type { NoteAIOptions } from '@/services/knowledge-vault/note-ai-options';
import type { Area } from '@/types/growth-system';
import { cn } from '@/lib/utils';
import { BrainstormModelPicker } from '@/components/molecules/assistant/BrainstormModelPicker';
import { useVaultNoteAIModelPicker } from '@/hooks/knowledge-vault/useVaultNoteAIModelPicker';
import { useToast } from '@/hooks/use-toast';
import { NoteSuggestedTagsPreview } from '@/components/molecules/knowledge-vault/NoteSuggestedTagsPreview';
import { NoteAiContentPreviewDialog } from '@/components/molecules/knowledge-vault/NoteAiContentPreviewDialog';
import {
  extractProposedContent,
  noteAiContentPreviewTitle,
  noteAiContentSuccessMessage,
  shouldGateNoteAiContentWrite,
  type NoteAiContentAction,
  type NoteAiContentApiData,
} from '@/lib/knowledge-vault/note-ai-content-preview';
import {
  filterNovelSuggestedTags,
  mergeTags,
  normalizeSuggestedTagLabel,
  selectHighConfidenceTags,
  type SuggestedTagRow,
} from '@/lib/knowledge-vault/note-suggest-tags';
import {
  applyNoteAISnapshot,
  createNoteAISnapshot,
  NOTE_AI_UNDO_TOAST_DURATION_MS,
  NOTE_AI_WORKING_LABEL,
  shouldOfferUndoToast,
  type NoteAIActionId,
} from '@/lib/knowledge-vault/note-ai-undo';

interface NoteAIAssistPanelProps {
  content: string;
  title: string;
  area: Area;
  tags: string[];
  onContentChange: (content: string) => void;
  onTagsChange: (tags: string[]) => void;
  onAreaChange: (area: Area) => void;
  onClose: () => void;
}

type AIAction = NoteAIActionId;

interface ActionConfig {
  id: AIAction;
  label: string;
  icon: typeof Sparkles;
  description: string;
  category: 'content' | 'generation' | 'intelligence' | 'analysis';
}

const actions: ActionConfig[] = [
  {
    id: 'expand',
    label: 'Expand Content',
    icon: Expand,
    description: 'Add more detail and examples',
    category: 'content',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: FileText,
    description: 'Condense into key points',
    category: 'content',
  },
  {
    id: 'improve',
    label: 'Improve Clarity',
    icon: Wand2,
    description: 'Fix grammar and readability',
    category: 'content',
  },
  {
    id: 'generate',
    label: 'Generate from Title',
    icon: Sparkles,
    description: 'Create content from title',
    category: 'generation',
  },
  {
    id: 'suggestTags',
    label: 'Suggest Tags',
    icon: Tag,
    description: 'AI-suggested tags',
    category: 'intelligence',
  },
  {
    id: 'suggestArea',
    label: 'Suggest Area',
    icon: FolderTree,
    description: 'Auto-categorize note',
    category: 'intelligence',
  },
  {
    id: 'analyze',
    label: 'Analyze Content',
    icon: Brain,
    description: 'Key points and insights',
    category: 'analysis',
  },
];

function isActionDisabled(
  action: ActionConfig,
  loading: boolean,
  previewOpen: boolean,
  content: string,
  title: string
): boolean {
  if (loading || previewOpen) return true;
  switch (action.category) {
    case 'content':
      return !content.trim();
    case 'generation':
      return !title.trim();
    case 'intelligence':
      return !content.trim() && !title.trim();
    case 'analysis':
      return !content.trim();
    default:
      return false;
  }
}

interface ContentPreviewState {
  action: NoteAiContentAction;
  originalContent: string;
  proposedContent: string;
  apiData?: NoteAiContentApiData;
}

export default function NoteAIAssistPanel({
  content,
  title,
  area,
  tags,
  onContentChange,
  onTagsChange,
  onAreaChange,
  onClose,
}: NoteAIAssistPanelProps) {
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [tagSuggestions, setTagSuggestions] = useState<SuggestedTagRow[] | null>(null);
  const [tagInfoMessage, setTagInfoMessage] = useState<string | null>(null);
  const [contentPreview, setContentPreview] = useState<ContentPreviewState | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const { showToast } = useToast();

  const { catalog, isCatalogLoading, picker, setPicker, resolveApiModel } =
    useVaultNoteAIModelPicker();

  const aiOptions: NoteAIOptions = useMemo(() => {
    const model = resolveApiModel();
    return model ? { model } : {};
  }, [resolveApiModel]);

  const showUndoToast = (
    successTitle: string,
    snapshot: ReturnType<typeof createNoteAISnapshot>
  ) => {
    if (!snapshot) return;
    showToast({
      type: 'success',
      title: successTitle,
      duration: NOTE_AI_UNDO_TOAST_DURATION_MS,
      action: {
        label: 'Undo',
        onClick: () => applyNoteAISnapshot(snapshot, onContentChange, onTagsChange),
      },
    });
  };

  const clearTagPreview = () => {
    setTagSuggestions(null);
    setTagInfoMessage(null);
  };

  const applySuggestedTags = (tagsToAdd: string[]) => {
    if (tagsToAdd.length === 0) {
      return;
    }

    const snapshot = createNoteAISnapshot('suggestTags', content, tags);
    onTagsChange(mergeTags(tags, tagsToAdd));
    if (shouldOfferUndoToast('suggestTags', tagsToAdd.length)) {
      showUndoToast(
        `Added ${tagsToAdd.length} suggested tag${tagsToAdd.length === 1 ? '' : 's'}`,
        snapshot
      );
    }
    setError(null);
  };

  const handleToggleSuggestedTag = (tag: string) => {
    const normalized = normalizeSuggestedTagLabel(tag);
    const isApplied = tags.some((t) => normalizeSuggestedTagLabel(t) === normalized);

    if (isApplied) {
      onTagsChange(tags.filter((t) => normalizeSuggestedTagLabel(t) !== normalized));
      return;
    }

    applySuggestedTags([normalized]);
  };

  const handleApplyHighConfidenceTags = () => {
    if (!tagSuggestions) {
      return;
    }

    const appliedSet = new Set(tags.map(normalizeSuggestedTagLabel));
    const toAdd = selectHighConfidenceTags(tagSuggestions)
      .map((item) => item.tag)
      .filter((tag) => !appliedSet.has(tag));

    applySuggestedTags(toAdd);
  };

  const handleClose = () => {
    clearTagPreview();
    setContentPreview(null);
    onClose();
  };

  const applyContentResult = (
    action: NoteAiContentAction,
    originalContent: string,
    data: NoteAiContentApiData,
    snapshot: ReturnType<typeof createNoteAISnapshot>
  ) => {
    const proposed = extractProposedContent(action, data);

    if (shouldGateNoteAiContentWrite(action, originalContent)) {
      setContentPreview({
        action,
        originalContent,
        proposedContent: proposed,
        apiData: data,
      });
      return;
    }

    onContentChange(proposed);
    if (shouldOfferUndoToast(action) && snapshot) {
      showUndoToast(noteAiContentSuccessMessage(action, data), snapshot);
    }
  };

  const runContentAction = async (
    action: NoteAiContentAction,
    originalContent: string
  ): Promise<NoteAiContentApiData> => {
    switch (action) {
      case 'expand': {
        const result = await noteAIService.expandContent(
          originalContent,
          { title, area },
          aiOptions
        );
        if (result.success && result.data) {
          return result.data;
        }
        throw new Error(result.error?.message || 'Failed to expand content');
      }
      case 'summarize': {
        const result = await noteAIService.summarizeContent(originalContent, aiOptions);
        if (result.success && result.data) {
          return result.data;
        }
        throw new Error(result.error?.message || 'Failed to summarize content');
      }
      case 'improve': {
        const result = await noteAIService.improveClarity(originalContent, aiOptions);
        if (result.success && result.data) {
          return result.data;
        }
        throw new Error(result.error?.message || 'Failed to improve content');
      }
      case 'generate': {
        if (!title.trim()) {
          throw new Error('Please enter a title first');
        }
        const result = await noteAIService.generateFromTitle(title, area, aiOptions);
        if (result.success && result.data) {
          return result.data;
        }
        throw new Error(result.error?.message || 'Failed to generate content');
      }
      default:
        throw new Error('Unsupported content action');
    }
  };

  const handlePreviewAccept = () => {
    if (!contentPreview) return;

    const snapshot = createNoteAISnapshot(
      contentPreview.action,
      contentPreview.originalContent,
      tags
    );
    onContentChange(contentPreview.proposedContent);
    if (shouldOfferUndoToast(contentPreview.action) && snapshot) {
      showUndoToast(
        noteAiContentSuccessMessage(contentPreview.action, contentPreview.apiData),
        snapshot
      );
    }
    setContentPreview(null);
  };

  const handlePreviewDiscard = () => {
    setContentPreview(null);
    setRegenerating(false);
  };

  const handlePreviewRegenerate = async () => {
    if (!contentPreview) return;

    setRegenerating(true);
    setError(null);

    try {
      const data = await runContentAction(contentPreview.action, contentPreview.originalContent);
      setContentPreview((prev) =>
        prev
          ? {
              ...prev,
              proposedContent: extractProposedContent(prev.action, data),
              apiData: data,
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRegenerating(false);
    }
  };

  const handleAction = async (action: AIAction) => {
    if (loading || contentPreview) return;

    setActiveAction(action);
    setLoading(true);
    setError(null);
    setLastResult(null);
    clearTagPreview();

    const snapshot = createNoteAISnapshot(action, content, tags);
    const originalContent = content;

    try {
      switch (action) {
        case 'expand':
        case 'summarize':
        case 'improve':
        case 'generate': {
          const data = await runContentAction(action, originalContent);
          applyContentResult(action, originalContent, data, snapshot);
          break;
        }
        case 'suggestTags': {
          const result = await noteAIService.suggestTags(content, title, tags, aiOptions);
          if (result.success && result.data) {
            const novelSuggestions = filterNovelSuggestedTags(result.data.suggestedTags, tags);
            if (novelSuggestions.length > 0) {
              setTagSuggestions(novelSuggestions);
            } else {
              setTagInfoMessage('No new tags to suggest');
            }
          } else {
            throw new Error(result.error?.message || 'Failed to suggest tags');
          }
          break;
        }
        case 'suggestArea': {
          const result = await noteAIService.suggestArea(content, title, aiOptions);
          if (result.success && result.data) {
            onAreaChange(result.data.suggestedArea);
            setLastResult(`Area changed to ${result.data.suggestedArea}`);
          } else {
            throw new Error(result.error?.message || 'Failed to suggest area');
          }
          break;
        }
        case 'analyze': {
          const result = await noteAIService.analyzeContent(content, title, aiOptions);
          if (result.success && result.data) {
            const analysis = result.data;
            const summary = `Sentiment: ${analysis.sentiment} | Readability: ${analysis.readabilityScore}/100 | Completeness: ${analysis.completeness.score}/100`;
            setLastResult(summary);
          } else {
            throw new Error(result.error?.message || 'Failed to analyze content');
          }
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const renderActionButton = (action: ActionConfig) => {
    const Icon = action.icon;
    const isActive = activeAction === action.id && loading;
    const disabled = isActionDisabled(action, loading, contentPreview != null, content, title);

    return (
      <button
        key={action.id}
        type="button"
        onClick={() => handleAction(action.id)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition text-left',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isActive && 'bg-blue-50 dark:bg-blue-900/20'
        )}
      >
        {isActive ? (
          <Loader2 size={16} className="text-blue-600 dark:text-blue-400 animate-spin" />
        ) : (
          <Icon size={16} className="text-gray-600 dark:text-gray-400" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {isActive ? NOTE_AI_WORKING_LABEL : action.label}
          </p>
          {!isActive && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
          )}
        </div>
      </button>
    );
  };

  const groupedActions = {
    content: actions.filter((a) => a.category === 'content'),
    generation: actions.filter((a) => a.category === 'generation'),
    intelligence: actions.filter((a) => a.category === 'intelligence'),
    analysis: actions.filter((a) => a.category === 'analysis'),
  };

  return (
    <>
      {contentPreview && (
        <NoteAiContentPreviewDialog
          isOpen
          title={noteAiContentPreviewTitle(contentPreview.action)}
          originalContent={contentPreview.originalContent}
          proposedContent={contentPreview.proposedContent}
          regenerating={regenerating}
          onAccept={handlePreviewAccept}
          onRegenerate={handlePreviewRegenerate}
          onDiscard={handlePreviewDiscard}
        />
      )}
      <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-[80] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              aria-label="Close AI panel"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {lastResult && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">{lastResult}</p>
            </div>
          )}

          {tagInfoMessage && !lastResult && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">{tagInfoMessage}</p>
            </div>
          )}

          {tagSuggestions && tagSuggestions.length > 0 && (
            <NoteSuggestedTagsPreview
              suggestions={tagSuggestions}
              appliedTags={tags}
              onToggleTag={handleToggleSuggestedTag}
              onApplyHighConfidence={handleApplyHighConfidenceTags}
              disabled={loading}
            />
          )}

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Model
            </h4>
            <BrainstormModelPicker
              catalog={catalog}
              isLoading={isCatalogLoading}
              value={picker}
              onChange={setPicker}
              disabled={loading}
              autoModeDescription="Uses server vault defaults (VAULT_AI_PROVIDER / VAULT_AI_MODEL). Switch to Manual to pick any model from the assistant catalog."
            />
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Content
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {groupedActions.content.map(renderActionButton)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Generation
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {groupedActions.generation.map(renderActionButton)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Intelligence
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {groupedActions.intelligence.map(renderActionButton)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Analysis
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {groupedActions.analysis.map(renderActionButton)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
