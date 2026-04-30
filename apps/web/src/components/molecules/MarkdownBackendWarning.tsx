import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useMarkdownBackendStatus } from '@/hooks/useMarkdownBackendStatus';
import { useState } from 'react';
import Button from '@/components/atoms/Button';

export default function MarkdownBackendWarning() {
  const { isOnline, isChecking, lastError, consecutiveErrorCount, checkHealth } =
    useMarkdownBackendStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if online, dismissed, or less than 3 consecutive errors
  if (isOnline || isDismissed || consecutiveErrorCount < 3) {
    return null;
  }

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await checkHealth();
    } catch (error) {
      // Error is already handled by the hook
      console.error('Error checking markdown backend health:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertTriangle size={16} className="flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-800 dark:text-amber-300 flex-1">
            Markdown backend is unavailable. Files are only being saved locally.
            {lastError && (
              <span className="text-xs text-amber-700 dark:text-amber-400 ml-2">
                ({lastError.message})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying || isChecking}
            className="bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRetrying || isChecking ? 'animate-spin' : ''}`}
            />
            {isRetrying || isChecking ? 'Checking...' : 'Retry'}
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 transition"
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
