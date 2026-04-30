import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, Clock3, RefreshCw, Save, Search } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import TagInput from '@/components/molecules/TagInput';
import { assistantMemoryService } from '@/services/assistant-memory.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { Area } from '@/types/growth-system';
import type { AssistantMemoryFile, LongTermMemoryEntry } from '@/types/assistant-memory';

const AREAS: Area[] = ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'];

type MemoryTab = 'shortTerm' | 'longTerm';

function dateLabel(file: AssistantMemoryFile): string {
  return file.path.split('/').pop()?.replace('.md', '') || file.name;
}

function contentPreview(content: string | null | undefined): string {
  return (content || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function AssistantMemoryPanel() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MemoryTab>('shortTerm');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [search, setSearch] = useState('');
  const [editingEntry, setEditingEntry] = useState<LongTermMemoryEntry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editArea, setEditArea] = useState<Area>('Operations');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const currentMemoryQuery = useQuery({
    queryKey: queryKeys.chatbot.memory.shortTerm(),
    queryFn: () => assistantMemoryService.getShortTerm(),
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.chatbot.memory.history(),
    queryFn: () => assistantMemoryService.getShortTermHistory(true),
  });

  const historyFiles = useMemo(() => {
    const files = historyQuery.data?.files || [];
    const currentFile = currentMemoryQuery.data?.file;
    if (!currentFile) return files;
    if (files.some((file) => file.id === currentFile.id)) return files;
    return [currentFile, ...files];
  }, [currentMemoryQuery.data, historyQuery.data]);

  const selectedFile = useMemo(() => {
    if (!selectedFileId) return currentMemoryQuery.data?.file || historyFiles[0] || null;
    return (
      historyFiles.find((file) => file.id === selectedFileId) ||
      (currentMemoryQuery.data?.file.id === selectedFileId ? currentMemoryQuery.data.file : null)
    );
  }, [currentMemoryQuery.data, historyFiles, selectedFileId]);

  useEffect(() => {
    if (!selectedFileId && currentMemoryQuery.data?.file.id) {
      setSelectedFileId(currentMemoryQuery.data.file.id);
    }
  }, [currentMemoryQuery.data, selectedFileId]);

  const selectedContentQuery = useQuery({
    queryKey: ['assistant-memory-file-content', selectedFile?.id],
    enabled: !!selectedFile?.id,
    queryFn: async () => {
      const memory = currentMemoryQuery.data;
      if (memory && selectedFile?.id === memory.file.id) {
        return memory.content;
      }
      return assistantMemoryService.getShortTermContent(selectedFile!.id);
    },
  });

  useEffect(() => {
    if (selectedContentQuery.data !== undefined) {
      setDraftContent(selectedContentQuery.data);
    }
  }, [selectedContentQuery.data]);

  const longTermQuery = useQuery({
    queryKey: queryKeys.chatbot.memory.longTerm(search),
    queryFn: () => assistantMemoryService.getLongTermNotes(search),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile?.id) {
        throw new Error('No memory file selected');
      }
      return assistantMemoryService.updateShortTerm(selectedFile.id, draftContent);
    },
    onSuccess: async (result) => {
      queryClient.setQueryData(queryKeys.chatbot.memory.shortTerm(), result);
      queryClient.setQueryData(['assistant-memory-file-content', result.file.id], result.content);
      await queryClient.invalidateQueries({ queryKey: queryKeys.chatbot.memory.history() });
    },
  });

  const consolidateMutation = useMutation({
    mutationFn: async () => {
      const file = selectedFile;
      const date = file ? dateLabel(file) : undefined;
      return assistantMemoryService.consolidate(date);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.chatbot.memory.shortTerm() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.chatbot.memory.history() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.chatbot.memory.longTerm() }),
      ]);
    },
  });

  const isShortTermLoading =
    currentMemoryQuery.isPending || historyQuery.isPending || selectedContentQuery.isPending;

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assistant Memory</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review today&apos;s thread memory and the consolidated long-term knowledge notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('shortTerm')}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              activeTab === 'shortTerm'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Short-Term
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('longTerm')}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              activeTab === 'longTerm'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Long-Term
          </button>
        </div>
      </div>

      {activeTab === 'shortTerm' ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
              <Clock3 size={18} />
              <h4 className="font-medium">Daily Memory Files</h4>
            </div>
            <div className="space-y-2">
              {historyFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                    selectedFile?.id === file.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <div className="font-medium">{dateLabel(file)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {new Date(file.updatedAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-h-0 flex flex-col p-4 gap-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {selectedFile ? dateLabel(selectedFile) : 'Daily memory'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Edit the markdown memory directly or consolidate it into long-term notes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    currentMemoryQuery.refetch();
                    historyQuery.refetch();
                    selectedContentQuery.refetch();
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={!selectedFile || saveMutation.isPending}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center gap-2"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => consolidateMutation.mutate()}
                  disabled={!selectedFile || consolidateMutation.isPending}
                  className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white flex items-center gap-2"
                >
                  <Brain size={16} />
                  Consolidate
                </button>
              </div>
            </div>

            {isShortTermLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Loading memory...
              </div>
            ) : (
              <textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                className="flex-1 min-h-[400px] w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100 resize-none"
              />
            )}

            {(saveMutation.error || consolidateMutation.error) && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {String(saveMutation.error || consolidateMutation.error)}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search long-term memory"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {longTermQuery.isPending ? (
            <div className="text-gray-500 dark:text-gray-400">Loading long-term memory...</div>
          ) : longTermQuery.data && longTermQuery.data.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {longTermQuery.data.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setEditingEntry(entry);
                    setEditTitle(entry.title);
                    setEditSummary(entry.summary);
                    setEditArea((entry.area as Area) || 'Operations');
                    setEditTags(entry.tags || []);
                    setEditError(null);
                  }}
                  className="text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-green-400 dark:hover:border-green-500 transition"
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{entry.title}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{entry.area}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {contentPreview(entry.summary) || 'No summary yet.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(entry.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-gray-600 dark:text-gray-400">
              Assistant long-term memory (semantic, stored in Postgres) appears here after
              consolidation or when the assistant saves durable facts.
            </div>
          )}
        </div>
      )}

      <Dialog
        isOpen={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
        title={editingEntry ? `Edit ${editingEntry.title}` : 'Edit long-term memory'}
        size="full"
      >
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          {editingEntry && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setEditSaving(true);
                setEditError(null);
                try {
                  await assistantMemoryService.updateLongTermMemory(editingEntry.id, {
                    title: editTitle.trim(),
                    summary: editSummary.trim(),
                    area: editArea,
                    tags: editTags,
                  });
                  setEditingEntry(null);
                  await queryClient.invalidateQueries({
                    queryKey: queryKeys.chatbot.memory.longTerm(),
                  });
                } catch (err) {
                  setEditError(err instanceof Error ? err.message : 'Save failed');
                } finally {
                  setEditSaving(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(ev) => setEditTitle(ev.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Summary
                </label>
                <textarea
                  value={editSummary}
                  onChange={(ev) => setEditSummary(ev.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Area
                </label>
                <select
                  value={editArea}
                  onChange={(ev) => setEditArea(ev.target.value as Area)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                >
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <TagInput value={editTags} onChange={setEditTags} />
              {editError && (
                <div className="text-sm text-red-600 dark:text-red-400">{editError}</div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50"
                >
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Dialog>
    </div>
  );
}
