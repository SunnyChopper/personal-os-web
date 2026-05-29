import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import type { Habit, HabitLog } from '@/types/growth-system';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { formatCompletionDate, toLocalDateKey } from '@/utils/date-formatters';

interface DateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
  date: Date;
  logs: HabitLog[];
  onLog: (date: Date) => void;
  onDeleteLog?: (logId: string) => void;
  onUpdateCompletionNote?: (completionDate: string, note: string | null) => Promise<void>;
}

export function DateDetailModal({
  isOpen,
  onClose,
  habit,
  date,
  logs,
  onLog,
  onDeleteLog,
  onUpdateCompletionNote,
}: DateDetailModalProps) {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const title = `${habit.name} · ${dateStr}`;

  const totalAmount = logs.reduce((sum, log) => sum + (log.amount || 1), 0);

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [savingLogId, setSavingLogId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Optimistic note text after save until parent `logs` refresh. */
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string | null>>({});

  const isSaving = savingLogId !== null;

  useEffect(() => {
    if (!isOpen) {
      setEditingLogId(null);
      setDraftNote('');
      setSavingLogId(null);
      setSaveError(null);
      setNoteOverrides({});
    }
  }, [isOpen]);

  useEffect(() => {
    setNoteOverrides({});
  }, [logs]);

  const getDisplayNote = (log: HabitLog): string | null =>
    log.id in noteOverrides ? noteOverrides[log.id] : log.notes;

  const handleDialogClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleStartEdit = (log: HabitLog) => {
    setEditingLogId(log.id);
    setDraftNote(log.notes ?? '');
    setSaveError(null);
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setDraftNote('');
    setSaveError(null);
  };

  const handleSaveNote = async (log: HabitLog) => {
    if (!onUpdateCompletionNote) return;
    const trimmed = draftNote.trim();
    const payload = trimmed === '' ? null : trimmed;
    setSavingLogId(log.id);
    setSaveError(null);
    try {
      // PATCH key is the modal's calendar day (matches COMPLETION#{date} in Dynamo).
      await onUpdateCompletionNote(toLocalDateKey(date), payload);
      setNoteOverrides((prev) => ({ ...prev, [log.id]: payload }));
      setEditingLogId(null);
      setDraftNote('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSavingLogId(null);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleDialogClose} title={title} className="max-w-lg">
      <div className="relative space-y-4">
        {isSaving && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-3 px-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Saving note…</p>
            </div>
          </div>
        )}
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
              {logs.map((log) => {
                const displayNote = getDisplayNote(log);
                return (
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
                          <div className="mt-2 space-y-2" aria-busy={savingLogId === log.id}>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                              Completion note
                            </label>
                            <textarea
                              value={draftNote}
                              onChange={(e) => setDraftNote(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Optional note..."
                              disabled={savingLogId === log.id}
                            />
                            {saveError && (
                              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {saveError}
                              </p>
                            )}
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={handleCancelEdit}
                                disabled={savingLogId === log.id}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                onClick={() => handleSaveNote(log)}
                                disabled={savingLogId === log.id}
                              >
                                {savingLogId === log.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                                    Saving…
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {displayNote ? (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                                {displayNote}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 italic">
                                No note
                              </p>
                            )}
                            {onUpdateCompletionNote && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(log)}
                                disabled={isSaving}
                                className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit note
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      {onDeleteLog && editingLogId !== log.id && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this log entry?')) {
                              onDeleteLog(log.id);
                            }
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                          aria-label="Delete log entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
