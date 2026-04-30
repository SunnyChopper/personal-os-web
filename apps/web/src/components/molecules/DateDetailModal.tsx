import { Plus, Trash2 } from 'lucide-react';
import type { Habit, HabitLog } from '@/types/growth-system';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { formatCompletionDate } from '@/utils/date-formatters';

interface DateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
  date: Date;
  logs: HabitLog[];
  onLog: (date: Date) => void;
  onDeleteLog?: (logId: string) => void;
}

export function DateDetailModal({
  isOpen,
  onClose,
  habit: _habit,
  date,
  logs,
  onLog,
  onDeleteLog,
}: DateDetailModalProps) {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalAmount = logs.reduce((sum, log) => sum + (log.amount || 1), 0);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={dateStr} className="max-w-lg">
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No completions logged for this date.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                onLog(date);
                onClose();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Completion
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Completions</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalAmount}</div>
            </div>

            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCompletionDate(log.completedAt)}
                        </span>
                        {log.amount && log.amount > 1 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            × {log.amount}
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.notes}</p>
                      )}
                    </div>
                    {onDeleteLog && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this log entry?')) {
                            onDeleteLog(log.id);
                          }
                        }}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label="Delete log entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                onClick={() => {
                  onLog(date);
                  onClose();
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Completion
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
