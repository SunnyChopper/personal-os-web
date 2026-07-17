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

async function fillProfileName(user: ReturnType<typeof userEvent.setup>, name = 'My brand voice') {
  await user.type(screen.getByLabelText('Profile name'), name);
}

describe('ProfileExtractionDialog', () => {
  it('shows validation errors when submitting without required fields', async () => {
    const user = userEvent.setup();
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );

    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(screen.getByText('Enter a profile name.')).toBeInTheDocument();
    expect(screen.getByText('Select at least one source type.')).toBeInTheDocument();
  });

  it('shows source type error when only profile name is provided', async () => {
    const user = userEvent.setup();
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );

    await fillProfileName(user);
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(screen.queryByText('Enter a profile name.')).not.toBeInTheDocument();
    expect(screen.getByText('Select at least one source type.')).toBeInTheDocument();
  });

  it('shows field errors when a source type is selected without its input', async () => {
    const user = userEvent.setup();
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );

    await fillProfileName(user);
    await user.click(screen.getByRole('checkbox', { name: 'Import from X' }));
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(screen.getByText('Enter an X username.')).toBeInTheDocument();
  });

  it('hides source sections until their source type is selected', () => {
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );

    expect(screen.queryByLabelText('X username')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mock add PDF' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Paste a snippet' })).not.toBeInTheDocument();
  });

  it('submits pasted snippets via onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={onSubmit} isSubmitting={false} />
    );

    await fillProfileName(user);
    await user.click(screen.getByRole('checkbox', { name: 'Pasted snippets' }));
    await user.click(screen.getByRole('button', { name: '+ Paste a snippet' }));
    await user.type(screen.getByPlaceholderText('Paste text snippet'), 'My writing voice');
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'My brand voice',
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

    await fillProfileName(user);
    await user.click(screen.getByRole('checkbox', { name: 'Import from X' }));
    await user.type(screen.getByLabelText('X username'), 'naval');
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'My brand voice',
      xUsername: 'naval',
      sources: undefined,
      files: undefined,
    });
  });

  it('blocks X submit when RapidAPI key is missing', async () => {
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

    await fillProfileName(user);
    await user.click(screen.getByRole('checkbox', { name: 'Import from X' }));
    await user.type(screen.getByLabelText('X username'), 'naval');
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Platform RapidAPI integration is not configured/i)
    ).toBeInTheDocument();
  });

  it('returns to empty state when the last snippet is removed', async () => {
    const user = userEvent.setup();
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );

    await user.click(screen.getByRole('checkbox', { name: 'Pasted snippets' }));
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

    await fillProfileName(user);
    await user.click(screen.getByRole('checkbox', { name: 'PDF uploads' }));
    await user.click(screen.getByRole('button', { name: 'Mock add PDF' }));
    await user.click(screen.getByRole('button', { name: 'Start extraction' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.name).toBe('My brand voice');
    expect(payload.files).toHaveLength(1);
    expect(payload.files?.[0].name).toBe('medium-post.pdf');
  });

  it('clears PDF selection when the PDF source type is unchecked', async () => {
    const user = userEvent.setup();
    render(
      <ProfileExtractionDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />
    );

    await fillProfileName(user);
    await user.click(screen.getByRole('checkbox', { name: 'PDF uploads' }));
    await user.click(screen.getByRole('button', { name: 'Mock add PDF' }));
    expect(screen.getByText('1 PDF selected.')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'PDF uploads' }));
    await user.click(screen.getByRole('checkbox', { name: 'PDF uploads' }));

    expect(screen.queryByText('1 PDF selected.')).not.toBeInTheDocument();
  });
});
