import { useState, useEffect, useCallback } from 'react';
import { Sparkles, X, RefreshCw, ChevronRight } from 'lucide-react';
import { aiSuggestionsService } from '@/services/ai-suggestions.service';
import type { StoredSuggestion } from '@/types/llm';
import { llmConfig } from '@/lib/llm';

interface AISuggestionBannerProps {
  entityType?: 'task' | 'project' | null;
  entityId?: string;
  onRefresh?: () => Promise<void>;
  onActionClick?: (suggestion: StoredSuggestion) => void;
}

export function AISuggestionBanner({
  entityType,
  entityId,
  onRefresh,
  onActionClick,
}: AISuggestionBannerProps) {
  const [suggestions, setSuggestions] = useState<StoredSuggestion[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isConfigured = llmConfig.isConfigured();

  const loadSuggestions = useCallback(() => {
    aiSuggestionsService.clearExpiredDismissals();

    let loaded: StoredSuggestion[];
    if (entityType === 'task' && entityId) {
      loaded = aiSuggestionsService.getTaskSuggestions(entityId);
    } else if (entityType === 'project' && entityId) {
      loaded = aiSuggestionsService.getProjectSuggestions(entityId);
    } else if (entityType === 'task') {
      loaded = aiSuggestionsService.getAllTaskSuggestions();
    } else if (entityType === 'project') {
      loaded = aiSuggestionsService.getAllProjectSuggestions();
    } else {
      loaded = aiSuggestionsService.getGlobalSuggestions();
    }

    setSuggestions(loaded);
  }, [entityType, entityId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleDismiss = (id: string) => {
    aiSuggestionsService.dismissSuggestion(id);
    setSuggestions(suggestions.filter((s) => s.id !== id));
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      loadSuggestions();
    } catch (error) {
      // Silently handle errors - suggestions are non-critical
      console.error('Failed to refresh suggestions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isConfigured || suggestions.length === 0) {
    return null;
  }

  const displayedSuggestions = isExpanded ? suggestions : suggestions.slice(0, 2);

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-gray-900 dark:text-white">AI Insights</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">({suggestions.length})</span>
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayedSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-start justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-800"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {suggestion.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {suggestion.description}
              </p>
              {onActionClick && (
                <button
                  onClick={() => onActionClick(suggestion)}
                  className="flex items-center gap-1 mt-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => handleDismiss(suggestion.id)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {suggestions.length > 2 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
        >
          {isExpanded ? 'Show less' : `Show ${suggestions.length - 2} more`}
        </button>
      )}
    </div>
  );
}
