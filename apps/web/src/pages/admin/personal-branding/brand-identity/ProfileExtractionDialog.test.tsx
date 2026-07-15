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
  it('disables submit until a PDF, snippet, or X username is provided', () => {
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );
    expect(screen.getByRole('button', { name: 'Start extraction' })).toBeDisabled();
  });

  it('shows empty state for pasted snippets by default', () => {
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );
    expect(
      screen.getByText(
        'No text snippets added yet. Paste text directly from articles, posts, or transcripts.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(
        'Paste text snippet (optional when PDFs or X import are provided)'
      )
    ).not.toBeInTheDocument();
  });

  it('submits pasted snippets via onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={onSubmit} isSubmitting={false} />
    );

    await user.click(screen.getByRole('button', { name: '+ Paste a snippet' }));
    await user.type(
      screen.getByPlaceholderText(
        'Paste text snippet (optional when PDFs or X import are provided)'
      ),
      'My writing voice'
    );
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: null,
      xUsername: null,
      sources: [{ title: null, url: null, text: 'My writing voice' }],
      files: undefined,
    });
  });

  it('submits X username via onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileExtractionDialog
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isSubmitting={false}
        hasRapidApiKey
      />
    );

    await user.type(screen.getByLabelText('X username'), 'naval');
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: null,
      xUsername: 'naval',
      sources: undefined,
      files: undefined,
    });
  });

  it('blocks X-only submit when RapidAPI key is missing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileExtractionDialog
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isSubmitting={false}
        hasRapidApiKey={false}
      />
    );

    await user.type(screen.getByLabelText('X username'), 'naval');
    expect(screen.getByRole('button', { name: 'Start extraction' })).toBeDisabled();
    expect(
      screen.getByText(/Configure a RapidAPI key under Rolodex → Recon Feed/i)
    ).toBeInTheDocument();
  });

  it('returns to empty state when the last snippet is removed', async () => {
    const user = userEvent.setup();
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );

    await user.click(screen.getByRole('button', { name: '+ Paste a snippet' }));
    expect(screen.getByText('Snippet 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(
      screen.getByText(
        'No text snippets added yet. Paste text directly from articles, posts, or transcripts.'
      )
    ).toBeInTheDocument();
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
