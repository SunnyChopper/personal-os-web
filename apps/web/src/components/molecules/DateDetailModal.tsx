import { Plus, Trash2, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  onDeleteLog?: (log: HabitLog) => void;
  /** Pass `trimmedNote === ''` to clear notes (parent should send `{ note: null }`). */
  onEditLog?: (logId: string, completedAtIso: string, trimmedNote: string) => void | Promise<void>;
}

export function DateDetailModal({
  isOpen,
  onClose,
  habit: _habit,
  date,
  logs,
  onLog,
  onDeleteLog,
  onEditLog,
}: DateDetailModalProps) {
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEditingLogId(null);
      setEditDraft('');
      setSavePending(false);
    }
  }, [isOpen]);

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalAmount = logs.reduce((sum, log) => sum + (log.amount || 1), 0);

  const handleStartEdit = (log: HabitLog) => {
    setEditingLogId(log.id);
    setEditDraft(log.notes ?? '');
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setEditDraft('');
    setSavePending(false);
  };

  const handleSaveEdit = async (log: HabitLog) => {
    if (!onEditLog) return;
    setSavePending(true);
    try {
      await onEditLog(log.id, log.completedAt, editDraft.trim());
      setEditingLogId(null);
      setEditDraft('');
    } finally {
      setSavePending(false);
    }
  };

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
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCompletionDate(log.completedAt)}
                        </span>
                        {log.amount && log.amount > 1 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            × {log.amount}
                          </span>
                        )}
                      </div>

                      {editingLogId === log.id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                            aria-label="Edit completion notes"
                          />
                          <div className="flex gap-2 flex-wrap justify-end">
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={savePending}
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              disabled={savePending || !onEditLog}
                              onClick={() => {
                                void handleSaveEdit(log);
                              }}
                            >
                              {savePending ? 'Saving…' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {log.notes ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {log.notes}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">
                              No note
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {editingLogId !== log.id && (
                      <div className="flex items-start gap-1 shrink-0">
                        {onEditLog && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(log)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            aria-label="Edit completion note"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteLog && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this log entry?')) {
                                onDeleteLog(log);
                              }
                            }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            aria-label="Delete log entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
