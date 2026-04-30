import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import Button from '@/components/atoms/Button';
import { useState } from 'react';
import { logger } from '@/lib/logger';

export function BackendStatusBanner({ className }: { className?: string }) {
  const { status, checkConnection } = useBackendStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if:
  // - Online
  // - Dismissed
  // - Still checking (initial load) and no error yet
  // - No error has occurred
  if (
    status.isOnline ||
    isDismissed ||
    (status.isChecking && !status.lastError) ||
    !status.lastError
  ) {
    return null;
  }

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await checkConnection();
    } catch (error) {
      logger.error('Unexpected error during connection check:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div
      className={`bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-3 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Backend connection unavailable
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              {status.lastError?.message ||
                'Some features may not work properly. Please check if the backend server is running.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying || status.isChecking}
            className="bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRetrying || status.isChecking ? 'animate-spin' : ''}`}
            />
            {isRetrying || status.isChecking ? 'Checking...' : 'Retry Connection'}
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 transition"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
