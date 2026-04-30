import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentForm from '@/components/organisms/DocumentForm';

const mockCreateDocument = vi.fn();
const mockRefreshVaultItems = vi.fn().mockResolvedValue(undefined);

vi.mock('@/contexts/KnowledgeVault', () => ({
  useKnowledgeVault: () => ({
    createDocument: mockCreateDocument,
    updateDocument: vi.fn(),
    refreshVaultItems: mockRefreshVaultItems,
  }),
}));

const mockGetPresignedUrl = vi.fn().mockResolvedValue({
  uploadUrl: 'https://s3.example/presigned',
  fileId: 'file-id-1',
  s3Key: 'vault-docs/u/1/x.pdf',
});
const mockUploadProgress = vi.fn().mockResolvedValue(undefined);
const mockCreateFromFile = vi.fn().mockResolvedValue({
  id: 'doc-1',
  type: 'document',
  title: 'Test doc',
  indexingStatus: 'pending',
});

vi.mock('@/services/knowledge-vault/document-upload.service', () => ({
  documentUploadService: {
    getPresignedUrl: (...args: unknown[]) => mockGetPresignedUrl(...args),
    uploadToS3WithProgress: (...args: unknown[]) => mockUploadProgress(...args),
    createDocumentFromFile: (...args: unknown[]) => mockCreateFromFile(...args),
  },
}));

vi.mock('@/components/molecules/FileUploadZone', () => ({
  default: ({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) => (
    <button
      type="button"
      data-testid="mock-pick-file"
      onClick={() =>
        onFilesSelected([new File(['hello'], 'report.pdf', { type: 'application/pdf' })])
      }
    >
      Pick file
    </button>
  ),
}));

describe('DocumentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs presign → PUT progress → from-file when creating with a file', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<DocumentForm onSuccess={onSuccess} onCancel={vi.fn()} />);

    await user.click(screen.getByTestId('mock-pick-file'));
    await user.click(screen.getByRole('button', { name: /create document/i }));

    expect(mockGetPresignedUrl).toHaveBeenCalledTimes(1);
    expect(mockUploadProgress).toHaveBeenCalledWith(
      'https://s3.example/presigned',
      expect.any(File),
      expect.any(Function)
    );
    expect(mockCreateFromFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'file-id-1',
        title: 'report',
        area: 'Operations',
      })
    );
    expect(mockRefreshVaultItems).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it('creates via URL path when no file is selected', async () => {
    mockCreateDocument.mockResolvedValue({
      id: 'd2',
      type: 'document',
      title: 'URL doc',
    });
    const user = userEvent.setup();
    render(<DocumentForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /paste a file url/i }));
    await user.type(screen.getByPlaceholderText(/example\.com\/document/i), 'https://x.com/a.pdf');
    await user.type(screen.getByPlaceholderText(/enter document title/i), 'URL doc');

    await user.click(screen.getByRole('button', { name: /create document/i }));

    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'URL doc',
        fileUrl: 'https://x.com/a.pdf',
      })
    );
    expect(mockGetPresignedUrl).not.toHaveBeenCalled();
  });
});
