import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DocumentDetailPage from '@/pages/admin/DocumentDetailPage';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { VaultDocumentDetail } from '@/types/knowledge-vault';

const mockDetail: VaultDocumentDetail = {
  document: {
    id: 'doc-1',
    type: 'document',
    title: 'Test Document',
    content: 'Extracted text content for preview',
    tags: ['tag-a'],
    area: 'Operations',
    status: 'active',
    searchableText: '',
    userId: 'user-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    lastAccessedAt: null,
    fileUrl: 'vault/uploads/doc-1.pdf',
    fileType: 'pdf',
    pageCount: 3,
    indexingStatus: 'complete',
    chunkCount: 1,
  },
  upload: {
    fileId: 'file-1',
    originalFilename: 'test.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1024,
    s3Key: 'vault/uploads/doc-1.pdf',
  },
  downloadUrl: 'https://example.com/presigned',
  chunks: [
    {
      chunkIndex: 0,
      content: 'First chunk text',
      tokenCount: 12,
      pageFrom: 1,
      pageTo: 1,
      embeddingModel: 'text-embedding-3-small',
      embeddingVersion: 1,
      createdAt: '2025-01-01T00:00:00Z',
    },
  ],
  defaultChunkSizeTokens: 500,
  defaultChunkOverlapTokens: 50,
  defaultMaxChunks: 100,
  defaultMaxChars: 50000,
};

const getDetail = vi.fn();
const reingest = vi.fn();
const markAccessed = vi.fn();

vi.mock('@/services/knowledge-vault/document.service', () => ({
  documentService: {
    getDetail: (...args: unknown[]) => getDetail(...args),
    reingest: (...args: unknown[]) => reingest(...args),
  },
}));

vi.mock('@/services/knowledge-vault/vault-items.service', () => ({
  vaultItemsService: {
    markAccessed: (...args: unknown[]) => markAccessed(...args),
  },
}));

function renderPage(documentId = 'doc-1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    qc,
    ...render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[`/admin/knowledge-vault/documents/${documentId}`]}>
          <Routes>
            <Route
              path="/admin/knowledge-vault/documents/:documentId"
              element={<DocumentDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  };
}

describe('DocumentDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDetail.mockResolvedValue(mockDetail);
    reingest.mockResolvedValue({
      documentId: 'doc-1',
      indexingStatus: 'complete',
      chunkCount: 2,
    });
    markAccessed.mockResolvedValue(undefined);
  });

  it('shows loading state while detail is pending', () => {
    getDetail.mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByText('Loading document…')).toBeInTheDocument();
  });

  it('shows error state when detail fails', async () => {
    getDetail.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(await screen.findByText('Failed to load document.')).toBeInTheDocument();
  });

  it('renders metadata, extracted content, and chunk rows', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Test Document' })).toBeInTheDocument();
    expect(screen.getByText(/Document · Operations · Indexed/)).toBeInTheDocument();
    expect(screen.getByText('Extracted text content for preview')).toBeInTheDocument();
    expect(screen.getByText('First chunk text')).toBeInTheDocument();
    expect(screen.getByText('Saved chunks (1)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open original file/i })).toHaveAttribute(
      'href',
      'https://example.com/presigned'
    );
    expect(markAccessed).toHaveBeenCalledWith('doc-1');
  });

  it('re-ingest sends camelCase params and invalidates queries', async () => {
    const user = userEvent.setup();
    const { qc } = renderPage();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    expect(await screen.findByRole('heading', { name: 'Test Document' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Re-ingest document' }));

    await waitFor(() => {
      expect(reingest).toHaveBeenCalledWith(
        'doc-1',
        expect.objectContaining({
          chunkSizeTokens: 500,
          chunkOverlapTokens: 50,
          maxChunks: 100,
          maxChars: 50000,
        })
      );
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.knowledgeVault.documentDetail('doc-1'),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.knowledgeVault.documentChunks('doc-1'),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.knowledgeVault.vaultItems(),
      });
    });
  });
});
