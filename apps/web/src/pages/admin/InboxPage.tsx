import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Trash2, Sparkles, FileInput, Loader2 } from 'lucide-react';
import {
  inboxService,
  type InboxItem,
  type InboxTriageStatus,
} from '@/services/knowledge-vault/inbox.service';
import { vaultFileUploadService } from '@/services/knowledge-vault/file-upload.service';
import FileUploadZone from '@/components/molecules/FileUploadZone';
import Button from '@/components/atoms/Button';

const STATUSES: InboxTriageStatus[] = ['pending', 'triaged', 'filed'];

function groupLabel(s: string) {
  if (s === 'pending') return 'Pending';
  if (s === 'triaged') return 'Triaged';
  if (s === 'filed') return 'Filed';
  return s;
}

export default function InboxPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<InboxTriageStatus | 'all'>('all');
  const [capture, setCapture] = useState('');
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [overrideType, setOverrideType] = useState<'note' | 'flashcard' | 'course' | 'document'>(
    'note'
  );
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['knowledge-inbox'],
    queryFn: async () => {
      const res = await inboxService.list();
      if (!res.success || !res.data) throw new Error(res.error || 'Failed');
      return res.data.items;
    },
  });

  const items = useMemo(() => {
    const all = listQuery.data ?? [];
    if (filter === 'all') return all;
    return all.filter((i) => i.aiTriageStatus === filter);
  }, [listQuery.data, filter]);

  const captureMut = useMutation({
    mutationFn: async () => {
      const raw = capture.trim();
      if (!raw) return;
      const isUrl = /^https?:\/\//i.test(raw);
      const res = await inboxService.create(raw, isUrl ? 'url' : 'text', isUrl ? raw : undefined);
      if (!res.success) throw new Error(res.error);
      setCapture('');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-inbox'] });
    },
  });

  const triageMut = useMutation({
    mutationFn: () => inboxService.triageAll(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['knowledge-inbox'] }),
  });

  const fileMut = useMutation({
    mutationFn: async (item: InboxItem) => {
      const res = await inboxService.file(item.id, {
        targetType: overrideType,
        title: item.aiSuggestedTitle || undefined,
        tags: item.aiSuggestedTags,
        area: item.aiSuggestedArea || undefined,
      });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-inbox'] });
      setSelected(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => inboxService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-inbox'] });
      setSelected(null);
    },
  });

  const grouped = STATUSES.map((st) => ({
    st,
    rows: (listQuery.data ?? []).filter((i) => i.aiTriageStatus === st),
  }));

  const handleDroppedFiles = async (files: File[]) => {
    setUploadError(null);
    for (const file of files) {
      setUploadingFiles((prev) => [...prev, file.name]);
      try {
        await vaultFileUploadService.uploadFile(file);
        void qc.invalidateQueries({ queryKey: ['knowledge-inbox'] });
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploadingFiles((prev) => prev.filter((n) => n !== file.name));
      }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-8 h-8" />
            Knowledge Inbox
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Capture first, triage with AI, file into the vault.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => triageMut.mutate()}
            disabled={triageMut.isPending}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Triage pending
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <FileUploadZone
          onFilesSelected={(fs) => void handleDroppedFiles(fs)}
          multiple
          maxSizeMB={25}
          className="w-full"
        />
        {uploadingFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading: {uploadingFiles.join(', ')}
          </div>
        )}
        {uploadError && <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>}
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-200 dark:border-gray-600">
          <input
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            placeholder="Quick capture — text or paste a URL"
            className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
          />
          <Button type="button" onClick={() => captureMut.mutate()} disabled={captureMut.isPending}>
            <FileInput className="w-4 h-4 mr-2" />
            Add to inbox
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', ...STATUSES] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              filter === f
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : groupLabel(f)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {listQuery.isLoading && <p className="text-gray-500">Loading…</p>}
          {filter === 'all'
            ? grouped.map(({ st, rows }) => (
                <div key={st}>
                  <h2 className="text-sm font-semibold text-gray-500 mb-2">{groupLabel(st)}</h2>
                  <ul className="space-y-2">
                    {rows.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(item);
                            const t = item.aiSuggestedType;
                            if (
                              t === 'flashcard' ||
                              t === 'course' ||
                              t === 'document' ||
                              t === 'note'
                            ) {
                              setOverrideType(t);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition ${
                            selected?.id === item.id
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300'
                          }`}
                        >
                          <p className="text-sm line-clamp-2 text-gray-900 dark:text-white">
                            {item.rawContent}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{item.aiTriageStatus}</p>
                        </button>
                      </li>
                    ))}
                    {rows.length === 0 && (
                      <p className="text-sm text-gray-500">No items in {groupLabel(st)}.</p>
                    )}
                  </ul>
                </div>
              ))
            : items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selected?.id === item.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <p className="text-sm line-clamp-3 text-gray-900 dark:text-white">
                    {item.rawContent}
                  </p>
                </button>
              ))}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[320px]">
          {!selected ? (
            <p className="text-gray-500">Select an inbox item to preview and file.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Preview</h3>
                <pre className="mt-2 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-lg max-h-48 overflow-auto">
                  {selected.rawContent}
                </pre>
              </div>
              {selected.aiTriageStatus === 'triaged' || selected.aiSuggestedTitle ? (
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-500">Suggested title:</span>{' '}
                    {selected.aiSuggestedTitle || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Type:</span> {selected.aiSuggestedType || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Tags:</span>{' '}
                    {(selected.aiSuggestedTags || []).join(', ') || '—'}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-xs text-gray-500">File as</label>
                <select
                  value={overrideType}
                  onChange={(e) => setOverrideType(e.target.value as typeof overrideType)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                >
                  <option value="note">Note</option>
                  <option value="document">Document</option>
                  <option value="flashcard">Flashcard deck</option>
                  <option value="course">Course</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => fileMut.mutate(selected)}
                  disabled={fileMut.isPending || selected.aiTriageStatus === 'filed'}
                >
                  File into vault
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => deleteMut.mutate(selected.id)}
                  disabled={deleteMut.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
