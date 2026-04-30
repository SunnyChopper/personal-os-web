import { useState } from 'react';
import { Plus, List, Mic, Camera, X } from 'lucide-react';
import type { Metric } from '@/types/growth-system';

interface MetricQuickActionsProps {
  metrics: Metric[];
  onQuickLog: (metric: Metric) => void;
  onBulkLog?: () => void;
  onVoiceLog?: () => void;
  onCameraLog?: () => void;
}

export function MetricQuickActions({
  metrics,
  onQuickLog,
  onBulkLog,
  onVoiceLog,
  onCameraLog,
}: MetricQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
        aria-label="Quick actions"
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[200px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {metrics.slice(0, 3).map((metric) => (
            <button
              key={metric.id}
              onClick={() => {
                onQuickLog(metric);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {metric.name}
            </button>
          ))}

          {onBulkLog && (
            <button
              onClick={() => {
                onBulkLog();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <List className="w-4 h-4" />
              Bulk Log
            </button>
          )}

          {onVoiceLog && (
            <button
              onClick={() => {
                onVoiceLog();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Mic className="w-4 h-4" />
              Voice Log
            </button>
          )}

          {onCameraLog && (
            <button
              onClick={() => {
                onCameraLog();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              Camera Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
