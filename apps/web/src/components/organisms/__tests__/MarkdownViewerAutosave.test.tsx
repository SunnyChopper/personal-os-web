import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MarkdownFile } from '@/types/markdown-files';
import MarkdownViewer from '@/components/organisms/MarkdownViewer';

const FILE_PATH = 'notes/test.md';

let mockFile: MarkdownFile | undefined;

vi.mock('@/hooks/useMarkdownFile', () => ({
  useMarkdownFile: () => ({
    file: mockFile,
    isLoading: false,
    error: null,
    isUpdating: false,
    isLocalOnly: false,
  }),
}));

vi.mock('@/hooks/useMarkdownBackendStatus', () => ({
  useMarkdownBackendStatus: () => ({ isOnline: true }),
}));

vi.mock('@/hooks/useFileTree', () => ({
  useFileTree: () => ({ isLoading: false, tree: [] }),
}));

vi.mock('@/hooks/useRecentFiles', () => ({
  addRecentFile: vi.fn(),
}));

vi.mock('@/hooks/markdown/useFileSave', () => ({
  useFileSave: () => ({ saveFile: vi.fn() }),
}));

vi.mock('@/hooks/markdown/useMarkdownAutosave', () => ({
  useMarkdownAutosave: () => ({
    status: 'idle',
    lastSavedAt: null,
    errorMessage: null,
    resetBackoff: vi.fn(),
  }),
}));

vi.mock('@/hooks/markdown/useFileRename', () => ({
  useFileRename: () => ({ renameFile: vi.fn() }),
}));

vi.mock('@/hooks/markdown/useFileDeletion', () => ({
  useFileDeletion: () => ({ deleteFileWithCleanup: vi.fn() }),
}));

vi.mock('@/hooks/markdown/useFileMetadata', () => ({
  useFileMetadata: () => ({ updateMetadata: vi.fn() }),
}));

function createMockFile(content: string): MarkdownFile {
  return {
    id: 'file-1',
    path: FILE_PATH,
    name: 'test.md',
    content,
    size: content.length,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function renderViewer() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MarkdownViewer filePath={FILE_PATH} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MarkdownViewer autosave edit-mode sync', () => {
  beforeEach(() => {
    mockFile = createMockFile('Initial content');
  });

  it('stays in edit mode when file content updates during editing (autosave echo)', async () => {
    const user = userEvent.setup();
    const { rerender } = renderViewer();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    mockFile = createMockFile('Autosaved content echo');
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <MarkdownViewer filePath={FILE_PATH} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('resyncs to view mode when file content changes while not editing', () => {
    const { rerender } = renderViewer();

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByText('Initial content')).toBeInTheDocument();

    mockFile = createMockFile('Updated from server');
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <MarkdownViewer filePath={FILE_PATH} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByText('Updated from server')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('resets to view mode when switching to a different file', async () => {
    const user = userEvent.setup();
    const { rerender } = renderViewer();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    mockFile = createMockFile('Other file content');
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <MarkdownViewer filePath="notes/other.md" />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});
