import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { Inbox, Trash2, Sparkles, FileInput, Loader2, Upload, ExternalLink } from 'lucide-react';
import {
  inboxService,
  type InboxItem,
  type InboxIngestionJob,
  type InboxIngestionStatus,
  type InboxTriageStatus,
} from '@/services/knowledge-vault/inbox.service';
import { vaultFileUploadService } from '@/services/knowledge-vault/file-upload.service';
import FileUploadZone from '@/components/molecules/FileUploadZone';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';

const STATUSES: InboxTriageStatus[] = ['pending', 'triaged', 'filed'];

const STATUS_DESCRIPTIONS: Record<InboxTriageStatus, string> = {
  pending: 'awaiting AI triage',
  triaged: 'AI-analyzed, ready to file',
  filed: 'saved to vault',
  dismissed: 'dismissed',
};

const ACTIVE_INGESTION: InboxIngestionStatus[] = ['queued', 'running'];

function groupLabel(s: string) {
  if (s === 'pending') return 'Pending';
  if (s === 'triaged') return 'Triaged';
  if (s === 'filed') return 'Filed';
  return s;
}

function ingestionLabel(status?: InboxIngestionStatus | null) {
  if (!status) return null;
  if (status === 'needsManualUpload') return 'Needs manual upload';
  if (status === 'running') return 'Ingesting…';
  if (status === 'queued') return 'Queued';
  if (status === 'complete') return 'Ingestion complete';
  if (status === 'failed') return 'Ingestion failed';
  return status;
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
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<InboxIngestionJob | null>(null);
  const [fallbackFileId, setFallbackFileId] = useState<string | null>(null);
  const [manualUploading, setManualUploading] = useState(false);

  const listQuery = useQuery({
    queryKey: queryKeys.knowledgeVault.inbox(),
    queryFn: async () => {
      const res = await inboxService.list();
      if (!res.success || !res.data) throw new Error(res.error || 'Failed');
      return res.data.items;
    },
    refetchInterval: (query) => {
      const rows = query.state.data ?? [];
      const hasActive = rows.some(
        (i) => i.ingestionStatus && ACTIVE_INGESTION.includes(i.ingestionStatus)
      );
      return hasActive || activeJob ? 2500 : false;
    },
  });

  const pollJob = useCallback(
    async (jobId: string) => {
      const res = await inboxService.getIngestionJob(jobId);
      if (res.success && res.data) {
        setActiveJob(res.data);
        if (!ACTIVE_INGESTION.includes(res.data.status)) {
          void qc.invalidateQueries({ queryKey: queryKeys.knowledgeVault.inbox() });
        }
      }
    },
    [qc]
  );

  useEffect(() => {
    if (!activeJob?.jobId) return undefined;
    if (!ACTIVE_INGESTION.includes(activeJob.status)) return undefined;
    const id = window.setInterval(() => {
      void pollJob(activeJob.jobId);
    }, 2500);
    return () => window.clearInterval(id);
  }, [activeJob?.jobId, activeJob?.status, pollJob]);

  useEffect(() => {
    if (!selected?.ingestionJobId) return;
    if (selected.ingestionStatus && ACTIVE_INGESTION.includes(selected.ingestionStatus)) {
      void pollJob(selected.ingestionJobId);
    }
  }, [selected?.id, selected?.ingestionJobId, selected?.ingestionStatus, pollJob]);

  const items = useMemo(() => {
    const all = listQuery.data ?? [];
    if (filter === 'all') return all;
    return all.filter((i) => i.aiTriageStatus === filter);
  }, [listQuery.data, filter]);

  const captureMut = useMutation({
    mutationFn: async () => {
      setCaptureError(null);
      const raw = capture.trim();
      if (!raw) return;
      const isUrl = /^https?:\/\//i.test(raw);
      const res = await inboxService.create(raw, isUrl ? 'url' : 'text', isUrl ? raw : undefined);
      if (!res.success) throw new Error(res.error);
      setCapture('');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.knowledgeVault.inbox() });
    },
    onError: (e: Error) => setCaptureError(e.message),
  });

  const triageMut = useMutation({
    mutationFn: () => inboxService.triageAll(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.knowledgeVault.inbox() }),
  });

  const fileMut = useMutation({
    mutationFn: async (item: InboxItem) => {
      setFileError(null);
      const res = await inboxService.file(item.id, {
        targetType: overrideType,
        title: item.aiSuggestedTitle || undefined,
        tags: item.aiSuggestedTags,
        area: item.aiSuggestedArea || undefined,
        fallbackFileId: fallbackFileId ?? undefined,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.ingestionJob) {
        setActiveJob(data.ingestionJob);
        setFallbackFileId(null);
      } else {
        setSelected(null);
        setActiveJob(null);
      }
      void qc.invalidateQueries({ queryKey: queryKeys.knowledgeVault.inbox() });
    },
    onError: (e: Error) => setFileError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => inboxService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.knowledgeVault.inbox() });
      setSelected(null);
      setActiveJob(null);
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
        void qc.invalidateQueries({ queryKey: queryKeys.knowledgeVault.inbox() });
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploadingFiles((prev) => prev.filter((n) => n !== file.name));
      }
    }
  };

  const handleManualFallbackUpload = async (files: File[]) => {
    if (!files.length) return;
    setManualUploading(true);
    setUploadError(null);
    try {
      const file = files[0];
      const { fileId } = await vaultFileUploadService.uploadFile(file);
      setFallbackFileId(fileId);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Manual upload failed');
    } finally {
      setManualUploading(false);
    }
  };

  const displayJob = activeJob ?? null;
  const needsManual =
    selected?.ingestionStatus === 'needsManualUpload' || displayJob?.status === 'needsManualUpload';

  const renderIngestionStatus = (item: InboxItem) => {
    const label = ingestionLabel(item.ingestionStatus);
    if (!label) return null;
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
        {(item.ingestionStatus === 'queued' || item.ingestionStatus === 'running') && (
          <Loader2 className="w-3 h-3 animate-spin" />
        )}
        {label}
        {item.ingestionError ? ` — ${item.ingestionError}` : ''}
      </p>
    );
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
        {captureError && <p className="text-sm text-red-600 dark:text-red-400">{captureError}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex gap-2 flex-wrap">
          {(['all', ...STATUSES] as const).map((f) => (
            <button
              key={f}
              type="button"
              title={f === 'all' ? 'Show all items' : STATUS_DESCRIPTIONS[f]}
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
                            setFileError(null);
                            setFallbackFileId(null);
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
                            {item.extractedPreview || item.rawContent}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{item.aiTriageStatus}</p>
                          {renderIngestionStatus(item)}
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
                    {item.extractedPreview || item.rawContent}
                  </p>
                  {renderIngestionStatus(item)}
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
                  {selected.extractedPreview || selected.rawContent}
                </pre>
                {selected.sourceUrl && (
                  <a
                    href={selected.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-green-600 dark:text-green-400 mt-2 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {selected.sourceUrl}
                  </a>
                )}
              </div>

              {(displayJob || selected.ingestionStatus) && (
                <div className="text-sm rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 space-y-1">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    {ingestionLabel(displayJob?.status ?? selected.ingestionStatus)}
                  </p>
                  {(displayJob?.stage || selected.ingestionStatus === 'running') && (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Stage: {displayJob?.stage ?? 'running'}
                      {displayJob?.message ? ` — ${displayJob.message}` : ''}
                    </p>
                  )}
                  {selected.ingestionError && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {selected.ingestionError}
                    </p>
                  )}
                  {(displayJob?.noteId || selected.sourceDocumentId) && (
                    <div className="flex flex-wrap gap-3 pt-1 text-xs">
                      {displayJob?.noteId && (
                        <Link
                          to={`/admin/knowledge-vault?highlight=${displayJob.noteId}`}
                          className="text-green-700 dark:text-green-300 underline"
                        >
                          Open note
                        </Link>
                      )}
                      {(displayJob?.sourceDocumentId || selected.sourceDocumentId) && (
                        <Link
                          to={`/admin/knowledge-vault/documents/${displayJob?.sourceDocumentId ?? selected.sourceDocumentId}`}
                          className="text-green-700 dark:text-green-300 underline"
                        >
                          Open source document
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {needsManual && (
                <div className="space-y-2 border border-dashed border-amber-400 rounded-lg p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {displayJob?.manualUpload?.hint ??
                      'Upload PDF, HTML export, or Markdown, then file again.'}
                  </p>
                  <FileUploadZone
                    onFilesSelected={(fs) => void handleManualFallbackUpload(fs)}
                    multiple={false}
                    maxSizeMB={25}
                    className="w-full"
                  />
                  {manualUploading && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading fallback file…
                    </p>
                  )}
                  {fallbackFileId && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Fallback file ready — click File into vault to retry.
                    </p>
                  )}
                </div>
              )}

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
                <Select
                  value={overrideType}
                  onChange={(e) => setOverrideType(e.target.value as typeof overrideType)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                >
                  <option value="note">Note</option>
                  <option value="document">Document</option>
                  <option value="flashcard">Flashcard deck</option>
                  <option value="course">Course</option>
                </Select>
              </div>

              {fileError && <p className="text-sm text-red-600 dark:text-red-400">{fileError}</p>}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => fileMut.mutate(selected)}
                  disabled={
                    fileMut.isPending ||
                    selected.aiTriageStatus === 'filed' ||
                    (needsManual &&
                      !fallbackFileId &&
                      selected.ingestionStatus === 'needsManualUpload')
                  }
                >
                  {fileMut.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Filing…
                    </>
                  ) : needsManual && fallbackFileId ? (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Retry with upload
                    </>
                  ) : (
                    'File into vault'
                  )}
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
