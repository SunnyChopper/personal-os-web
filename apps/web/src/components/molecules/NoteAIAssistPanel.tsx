import { useState } from 'react';
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
  Check,
} from 'lucide-react';
import { noteAIService } from '@/services/knowledge-vault/note-ai.service';
import type { Area } from '@/types/growth-system';
import { cn } from '@/lib/utils';

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

type AIAction =
  | 'expand'
  | 'summarize'
  | 'improve'
  | 'suggestTags'
  | 'suggestArea'
  | 'generate'
  | 'analyze';

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
  // This panel is now a fixed right-side panel, so we don't need to return the full structure here
  // The structure will be handled by the parent component
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleAction = async (action: AIAction) => {
    if (loading) return;

    setActiveAction(action);
    setLoading(true);
    setError(null);
    setLastResult(null);

    try {
      switch (action) {
        case 'expand': {
          const result = await noteAIService.expandContent(content, { title, area });
          if (result.success && result.data) {
            onContentChange(result.data.expandedContent);
            setLastResult('Content expanded successfully');
          } else {
            throw new Error(result.error?.message || 'Failed to expand content');
          }
          break;
        }
        case 'summarize': {
          const result = await noteAIService.summarizeContent(content);
          if (result.success && result.data) {
            onContentChange(result.data.summary);
            setLastResult(
              `Summarized from ${result.data.wordCount} to ${result.data.summaryWordCount} words`
            );
          } else {
            throw new Error(result.error?.message || 'Failed to summarize content');
          }
          break;
        }
        case 'improve': {
          const result = await noteAIService.improveClarity(content);
          if (result.success && result.data) {
            onContentChange(result.data.improvedContent);
            setLastResult(`Improved with ${result.data.changes.length} changes`);
          } else {
            throw new Error(result.error?.message || 'Failed to improve content');
          }
          break;
        }
        case 'generate': {
          if (!title.trim()) {
            throw new Error('Please enter a title first');
          }
          const result = await noteAIService.generateFromTitle(title, area);
          if (result.success && result.data) {
            onContentChange(result.data.generatedContent);
            setLastResult('Content generated successfully');
          } else {
            throw new Error(result.error?.message || 'Failed to generate content');
          }
          break;
        }
        case 'suggestTags': {
          const result = await noteAIService.suggestTags(content, title, tags);
          if (result.success && result.data) {
            const newTags = result.data.suggestedTags
              .filter((t) => t.relevance > 0.5)
              .map((t) => t.tag.toLowerCase())
              .filter((t) => !tags.includes(t));
            if (newTags.length > 0) {
              onTagsChange([...tags, ...newTags]);
              setLastResult(`Added ${newTags.length} suggested tags`);
            } else {
              setLastResult('No new relevant tags found');
            }
          } else {
            throw new Error(result.error?.message || 'Failed to suggest tags');
          }
          break;
        }
        case 'suggestArea': {
          const result = await noteAIService.suggestArea(content, title);
          if (result.success && result.data) {
            onAreaChange(result.data.suggestedArea);
            setLastResult(`Area changed to ${result.data.suggestedArea}`);
          } else {
            throw new Error(result.error?.message || 'Failed to suggest area');
          }
          break;
        }
        case 'analyze': {
          const result = await noteAIService.analyzeContent(content, title);
          if (result.success && result.data) {
            const analysis = result.data;
            const summary = `Sentiment: ${analysis.sentiment} | Readability: ${analysis.readabilityScore}/100 | Completeness: ${analysis.completeness.score}/100`;
            setLastResult(summary);
            // Could show a modal with full analysis here
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

  const groupedActions = {
    content: actions.filter((a) => a.category === 'content'),
    generation: actions.filter((a) => a.category === 'generation'),
    intelligence: actions.filter((a) => a.category === 'intelligence'),
    analysis: actions.filter((a) => a.category === 'analysis'),
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-[80] overflow-y-auto">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
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
          <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <Check size={16} className="text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-200">{lastResult}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Content Actions */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Content
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {groupedActions.content.map((action) => {
                const Icon = action.icon;
                const isActive = activeAction === action.id && loading;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={loading || !content.trim()}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition text-left',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isActive && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    {isActive ? (
                      <Loader2
                        size={16}
                        className="text-blue-600 dark:text-blue-400 animate-spin"
                      />
                    ) : (
                      <Icon size={16} className="text-gray-600 dark:text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generation Actions */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Generation
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {groupedActions.generation.map((action) => {
                const Icon = action.icon;
                const isActive = activeAction === action.id && loading;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={loading || !title.trim()}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition text-left',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isActive && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    {isActive ? (
                      <Loader2
                        size={16}
                        className="text-blue-600 dark:text-blue-400 animate-spin"
                      />
                    ) : (
                      <Icon size={16} className="text-gray-600 dark:text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intelligence Actions */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Intelligence
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {groupedActions.intelligence.map((action) => {
                const Icon = action.icon;
                const isActive = activeAction === action.id && loading;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={loading || (!content.trim() && !title.trim())}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition text-left',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isActive && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    {isActive ? (
                      <Loader2
                        size={16}
                        className="text-blue-600 dark:text-blue-400 animate-spin"
                      />
                    ) : (
                      <Icon size={16} className="text-gray-600 dark:text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Analysis Actions */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Analysis
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {groupedActions.analysis.map((action) => {
                const Icon = action.icon;
                const isActive = activeAction === action.id && loading;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={loading || !content.trim()}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition text-left',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isActive && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    {isActive ? (
                      <Loader2
                        size={16}
                        className="text-blue-600 dark:text-blue-400 animate-spin"
                      />
                    ) : (
                      <Icon size={16} className="text-gray-600 dark:text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
