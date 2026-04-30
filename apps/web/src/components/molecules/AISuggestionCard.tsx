import { Sparkles, X, Check } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';

interface AISuggestionCardProps {
  title: string;
  description: string;
  confidence?: number;
  reasoning?: string;
  onAccept?: () => void;
  onDismiss?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function AISuggestionCard({
  title,
  description,
  confidence,
  reasoning,
  onAccept,
  onDismiss,
  variant = 'default',
  className = '',
}: AISuggestionCardProps) {
  if (variant === 'compact') {
    return (
      <div
        className={`bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white text-sm">{title}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{description}</div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden ${className}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white mb-1">{title}</div>
              {confidence !== undefined && (
                <AIConfidenceIndicator confidence={confidence} size="sm" />
              )}
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{description}</p>

        {reasoning && (
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-black/20 rounded p-2 mb-3">
            <span className="font-medium">Reasoning: </span>
            {reasoning}
          </div>
        )}

        {(onAccept || onDismiss) && (
          <div className="flex gap-2 pt-2 border-t border-purple-200 dark:border-purple-800">
            {onAccept && (
              <Button
                onClick={onAccept}
                variant="primary"
                size="sm"
                className="flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Accept
              </Button>
            )}
            {onDismiss && (
              <Button onClick={onDismiss} variant="secondary" size="sm">
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
