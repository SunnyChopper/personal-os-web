import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, FileCheck, RefreshCw, Tag } from 'lucide-react';
import { PageContainer } from '@/components/templates/PageContainer';
import Button from '@/components/atoms/Button';
import { documentService } from '@/services/knowledge-vault/document.service';
import { vaultItemsService } from '@/services/knowledge-vault/vault-items.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import type { Document, VaultDocumentReingestInput } from '@/types/knowledge-vault';

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function indexingLabel(status: Document['indexingStatus']): string {
  if (status === 'pending') return 'Indexing…';
  if (status === 'failed') return 'Index failed';
  if (status === 'complete') return 'Indexed';
  return 'Not indexed';
}

export default function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reingestError, setReingestError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: queryKeys.knowledgeVault.documentDetail(documentId ?? ''),
    enabled: Boolean(documentId),
    queryFn: () => documentService.getDetail(documentId!),
  });

  const detail = detailQuery.data;
  const doc = detail?.document;

  const [chunkSizeTokens, setChunkSizeTokens] = useState(500);
  const [chunkOverlapTokens, setChunkOverlapTokens] = useState(50);
  const [maxChunks, setMaxChunks] = useState('');
  const [maxChars, setMaxChars] = useState('');

  useEffect(() => {
    if (!detail) return;
    setChunkSizeTokens(detail.defaultChunkSizeTokens);
    setChunkOverlapTokens(detail.defaultChunkOverlapTokens);
    setMaxChunks(String(detail.defaultMaxChunks));
    setMaxChars(String(detail.defaultMaxChars));
  }, [detail]);

  useEffect(() => {
    if (!documentId) return;
    void vaultItemsService.markAccessed(documentId);
  }, [documentId]);

  const reingestMutation = useMutation({
    mutationFn: (body: VaultDocumentReingestInput) => documentService.reingest(documentId!, body),
    onSuccess: async () => {
      setReingestError(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgeVault.documentDetail(documentId!),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgeVault.documentChunks(documentId!),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeVault.vaultItems() });
    },
    onError: (err: unknown) => {
      setReingestError(err instanceof Error ? err.message : 'Re-ingestion failed');
    },
  });

  const chunks = useMemo(() => detail?.chunks ?? [], [detail?.chunks]);

  if (!documentId) {
    return <p className="p-6 text-red-600">Missing document id</p>;
  }

  if (detailQuery.isPending) {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading document…</p>
      </div>
    );
  }

  if (detailQuery.isError || !doc) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-600">Failed to load document.</p>
        <Button variant="ghost" onClick={() => navigate(ROUTES.admin.knowledgeVaultLibrary)}>
          Back to Library
        </Button>
      </div>
    );
  }

  const handleReingest = () => {
    const body: VaultDocumentReingestInput = {
      chunkSizeTokens,
      chunkOverlapTokens,
    };
    const parsedMaxChunks = maxChunks.trim() ? Number(maxChunks) : undefined;
    const parsedMaxChars = maxChars.trim() ? Number(maxChars) : undefined;
    if (parsedMaxChunks != null && Number.isFinite(parsedMaxChunks)) {
      body.maxChunks = parsedMaxChunks;
    }
    if (parsedMaxChars != null && Number.isFinite(parsedMaxChars)) {
      body.maxChars = parsedMaxChars;
    }
    reingestMutation.mutate(body);
  };

  return (
    <PageContainer width="narrow" className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.admin.knowledgeVaultLibrary)}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Library
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileCheck size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{doc.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Document · {doc.area} · {indexingLabel(doc.indexingStatus)}
                {doc.chunkCount != null ? ` · ${doc.chunkCount} chunks` : ''}
              </p>
            </div>
          </div>
        </div>
        {detail.downloadUrl && (
          <a
            href={detail.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Download size={16} />
            Open original file
          </a>
        )}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">Metadata</h2>
          <p>
            <span className="text-gray-500">File type:</span> {doc.fileType?.toUpperCase() || '—'}
          </p>
          <p>
            <span className="text-gray-500">Pages:</span> {doc.pageCount ?? '—'}
          </p>
          <p>
            <span className="text-gray-500">Updated:</span> {formatDate(doc.updatedAt)}
          </p>
          {detail.upload && (
            <p>
              <span className="text-gray-500">Upload:</span> {detail.upload.originalFilename}
            </p>
          )}
          {doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Re-ingest chunks</h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Re-runs chunking and embeddings. Existing chunks for this document are replaced.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-gray-500">Chunk size (tokens)</span>
              <input
                type="number"
                min={32}
                max={8000}
                value={chunkSizeTokens}
                onChange={(e) => setChunkSizeTokens(Number(e.target.value))}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500">Overlap (tokens)</span>
              <input
                type="number"
                min={0}
                max={4000}
                value={chunkOverlapTokens}
                onChange={(e) => setChunkOverlapTokens(Number(e.target.value))}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500">Max chunks</span>
              <input
                type="number"
                min={1}
                value={maxChunks}
                onChange={(e) => setMaxChunks(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500">Max chars</span>
              <input
                type="number"
                min={100}
                value={maxChars}
                onChange={(e) => setMaxChars(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1"
              />
            </label>
          </div>
          {reingestError && <p className="text-sm text-red-600">{reingestError}</p>}
          <Button
            onClick={handleReingest}
            disabled={reingestMutation.isPending}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw size={16} className={reingestMutation.isPending ? 'animate-spin' : ''} />
            {reingestMutation.isPending ? 'Re-ingesting…' : 'Re-ingest document'}
          </Button>
        </div>
      </section>

      {doc.content && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extracted content</h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/40 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
            {doc.content}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Saved chunks ({chunks.length})
        </h2>
        {chunks.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No chunks indexed yet. Upload indexing may still be running, or re-ingest with custom
            parameters.
          </p>
        ) : (
          <div className="space-y-3">
            {chunks.map((chunk) => (
              <article
                key={chunk.chunkIndex}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Chunk #{chunk.chunkIndex + 1}
                  </span>
                  <span>{chunk.tokenCount} tokens</span>
                  {chunk.pageFrom != null && (
                    <span>
                      Pages {chunk.pageFrom}
                      {chunk.pageTo != null && chunk.pageTo !== chunk.pageFrom
                        ? `–${chunk.pageTo}`
                        : ''}
                    </span>
                  )}
                  <span>{chunk.embeddingModel}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap line-clamp-6">
                  {chunk.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
