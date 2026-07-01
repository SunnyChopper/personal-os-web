import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import InboxPage from '@/pages/admin/InboxPage';
import type { InboxItem, InboxIngestionJob } from '@/services/knowledge-vault/inbox.service';

const { list, file, getIngestionJob } = vi.hoisted(() => ({
  list: vi.fn(),
  file: vi.fn(),
  getIngestionJob: vi.fn(),
}));

vi.mock('@/services/knowledge-vault/inbox.service', () => ({
  inboxService: {
    list,
    create: vi.fn(),
    triageAll: vi.fn(),
    file,
    getIngestionJob,
    remove: vi.fn(),
  },
}));

vi.mock('@/services/knowledge-vault/file-upload.service', () => ({
  vaultFileUploadService: {
    uploadFile: vi.fn(),
  },
}));

const triagedUrlItem: InboxItem = {
  id: 'in-1',
  rawContent: 'https://example.com/article',
  sourceType: 'url',
  sourceUrl: 'https://example.com/article',
  aiSuggestedTitle: 'Example Article',
  aiSuggestedType: 'note',
  aiSuggestedTags: ['web'],
  aiSuggestedArea: 'Learning',
  aiTriageStatus: 'triaged',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const queuedJob: InboxIngestionJob = {
  jobId: 'job-1',
  inboxItemId: 'in-1',
  status: 'queued',
  stage: 'fetching',
  message: 'Queued',
  graphEdgesCreated: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <InboxPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('InboxPage ingestion UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue({ success: true, data: { items: [triagedUrlItem] } });
  });

  it('starts ingestion job when filing a URL item', async () => {
    file.mockResolvedValue({
      success: true,
      data: { ingestionJob: queuedJob },
    });

    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/example\.com\/article/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/example\.com\/article/i));
    await user.click(screen.getByRole('button', { name: /file into vault/i }));

    await waitFor(() => {
      expect(file).toHaveBeenCalledWith('in-1', expect.objectContaining({ targetType: 'note' }));
    });
    await waitFor(() => {
      expect(screen.getByText(/stage:\s*fetching/i)).toBeInTheDocument();
    });
  });

  it('shows manual upload CTA when ingestion needs upload', async () => {
    const needsUpload: InboxItem = {
      ...triagedUrlItem,
      ingestionStatus: 'needsManualUpload',
      ingestionError: '404',
    };
    list.mockResolvedValue({ success: true, data: { items: [needsUpload] } });

    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/needs manual upload/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/example\.com\/article/i));

    await waitFor(() => {
      expect(screen.getByText(/upload pdf, html export, or markdown/i)).toBeInTheDocument();
    });
  });
});
