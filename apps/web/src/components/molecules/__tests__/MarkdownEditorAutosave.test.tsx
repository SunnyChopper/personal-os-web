import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import MarkdownEditor from '@/components/molecules/MarkdownEditor';

describe('MarkdownEditor autosave footer', () => {
  it('renders pending status', () => {
    render(<MarkdownEditor value="hello" onChange={() => {}} autosaveStatus="pending" />);
    const el = screen.getByTestId('markdown-autosave-status');
    expect(el).toHaveAttribute('data-status', 'pending');
    expect(el).toHaveTextContent('Unsaved changes');
  });

  it('renders saving status with spinner label', () => {
    render(<MarkdownEditor value="hello" onChange={() => {}} autosaveStatus="saving" />);
    expect(screen.getByTestId('markdown-autosave-status')).toHaveAttribute('data-status', 'saving');
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('renders saved status with relative time', () => {
    const fiveSecondsAgo = Date.now() - 5000;
    render(
      <MarkdownEditor
        value="hello"
        onChange={() => {}}
        autosaveStatus="saved"
        autosaveLastSavedAt={fiveSecondsAgo}
      />
    );
    const el = screen.getByTestId('markdown-autosave-status');
    expect(el).toHaveAttribute('data-status', 'saved');
    expect(el.textContent).toMatch(/Saved 5s ago/);
  });

  it('renders error status', () => {
    render(
      <MarkdownEditor
        value="hello"
        onChange={() => {}}
        autosaveStatus="error"
        autosaveErrorMessage="Network error"
      />
    );
    expect(screen.getByTestId('markdown-autosave-status')).toHaveAttribute('data-status', 'error');
    expect(screen.getByText(/Couldn't save/)).toBeInTheDocument();
  });

  it('hides footer when autosaveStatus is omitted', () => {
    render(<MarkdownEditor value="hello" onChange={() => {}} />);
    expect(screen.queryByTestId('markdown-autosave-status')).toBeNull();
  });

  it('does not announce pending status in the live region', () => {
    render(<MarkdownEditor value="hello" onChange={() => {}} autosaveStatus="pending" />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('announces saving and saved transitions in the live region', async () => {
    const fiveSecondsAgo = Date.now() - 5000;
    const { rerender } = render(
      <MarkdownEditor value="hello" onChange={() => {}} autosaveStatus="saving" />
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');

    rerender(
      <MarkdownEditor
        value="hello"
        onChange={() => {}}
        autosaveStatus="saved"
        autosaveLastSavedAt={fiveSecondsAgo}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByTestId('markdown-autosave-status')).toHaveTextContent(/Saved 5s ago/);
  });
});
