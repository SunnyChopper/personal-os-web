import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import KnowledgeVaultPage from '@/pages/admin/KnowledgeVaultPage';
import type { Document } from '@/types/knowledge-vault';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const mockDocument: Document = {
  id: 'doc-nav-1',
  type: 'document',
  title: 'Navigable Document',
  content: 'Body',
  tags: [],
  area: 'Operations',
  status: 'active',
  searchableText: 'Navigable Document',
  userId: 'user-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  lastAccessedAt: null,
  fileUrl: null,
  fileType: 'md',
  pageCount: 1,
  indexingStatus: 'complete',
  chunkCount: 2,
};

vi.mock('@/contexts/KnowledgeVault', () => ({
  useKnowledgeVault: () => ({
    vaultItems: [mockDocument],
    courses: [],
    flashcardDecks: [],
    loading: false,
    refreshVaultItems: vi.fn(),
    deleteItem: vi.fn(),
  }),
}));

describe('KnowledgeVaultPage document navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to document detail when a document card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <KnowledgeVaultPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Navigable Document/i }));

    expect(navigateMock).toHaveBeenCalledWith('/admin/knowledge-vault/documents/doc-nav-1');
  });
});
