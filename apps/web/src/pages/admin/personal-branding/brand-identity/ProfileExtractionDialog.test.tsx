import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProfileExtractionDialog from './ProfileExtractionDialog';

vi.mock('@/components/molecules/FileUploadZone', () => ({
  default: ({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) => (
    <button
      type="button"
      onClick={() =>
        onFilesSelected([new File(['%PDF'], 'medium-post.pdf', { type: 'application/pdf' })])
      }
    >
      Mock add PDF
    </button>
  ),
}));

describe('ProfileExtractionDialog', () => {
  it('disables submit until a PDF or snippet is provided', () => {
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );
    expect(screen.getByRole('button', { name: 'Start extraction' })).toBeDisabled();
  });

  it('submits pasted snippets via onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={onSubmit} isSubmitting={false} />
    );

    await user.type(
      screen.getByPlaceholderText('Paste text snippet (optional when PDFs are attached)'),
      'My writing voice'
    );
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: null,
      sources: [{ title: null, url: null, text: 'My writing voice' }],
      files: undefined,
    });
  });

  it('submits PDF files via onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={onSubmit} isSubmitting={false} />
    );

    await user.click(screen.getByRole('button', { name: 'Mock add PDF' }));
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.files).toHaveLength(1);
    expect(payload.files?.[0].name).toBe('medium-post.pdf');
  });
});
