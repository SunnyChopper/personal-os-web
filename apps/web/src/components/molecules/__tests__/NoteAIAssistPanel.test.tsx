import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NoteAIAssistPanel from '@/components/molecules/NoteAIAssistPanel';
import { noteAIService } from '@/services/knowledge-vault/note-ai.service';
import type { Area } from '@/types/growth-system';

const showToastMock = vi.fn();
let expandResolve: ((value: unknown) => void) | null = null;
let generateResolve: ((value: unknown) => void) | null = null;
let suggestTagsResolve: ((value: unknown) => void) | null = null;

vi.mock('@/services/knowledge-vault/note-ai.service', () => ({
  noteAIService: {
    expandContent: vi.fn(
      () =>
        new Promise((resolve) => {
          expandResolve = resolve;
        })
    ),
    summarizeContent: vi.fn(),
    improveClarity: vi.fn(),
    generateFromTitle: vi.fn(
      () =>
        new Promise((resolve) => {
          generateResolve = resolve;
        })
    ),
    suggestTags: vi.fn(
      () =>
        new Promise((resolve) => {
          suggestTagsResolve = resolve;
        })
    ),
    suggestArea: vi.fn(),
    analyzeContent: vi.fn(),
  },
}));

vi.mock('@/hooks/knowledge-vault/useVaultNoteAIModelPicker', () => ({
  useVaultNoteAIModelPicker: () => ({
    catalog: undefined,
    isCatalogLoading: false,
    picker: { mode: 'auto' as const },
    setPicker: vi.fn(),
    resolveApiModel: () => undefined,
  }),
}));

vi.mock('@/components/molecules/assistant/BrainstormModelPicker', () => ({
  BrainstormModelPicker: () => <div data-testid="model-picker" />,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    showToast: showToastMock,
  }),
}));

const defaultProps = {
  content: 'Original note body',
  title: 'Test Note',
  area: 'Health' as Area,
  tags: ['math'],
  onContentChange: vi.fn(),
  onTagsChange: vi.fn(),
  onAreaChange: vi.fn(),
  onClose: vi.fn(),
};

describe('NoteAIAssistPanel', () => {
  beforeEach(() => {
    expandResolve = null;
    generateResolve = null;
    suggestTagsResolve = null;
    showToastMock.mockReset();
    defaultProps.onContentChange.mockReset();
    defaultProps.onTagsChange.mockReset();
    vi.mocked(noteAIService.expandContent).mockClear();
    vi.mocked(noteAIService.generateFromTitle).mockClear();
    vi.mocked(noteAIService.suggestTags).mockClear();
  });

  it('shows Working… on the active action while loading', async () => {
    const user = userEvent.setup();
    render(<NoteAIAssistPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Expand Content/i }));

    expect(screen.getByText('Working…')).toBeInTheDocument();
    expect(screen.queryByText('Expand Content')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Summarize/i })).toBeDisabled();
  });

  it('ignores concurrent action clicks while loading', async () => {
    const user = userEvent.setup();
    render(<NoteAIAssistPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Expand Content/i }));
    await user.click(screen.getByRole('button', { name: /Summarize/i }));

    expect(noteAIService.expandContent).toHaveBeenCalledTimes(1);
    expect(noteAIService.summarizeContent).not.toHaveBeenCalled();
  });

  it('opens preview for non-empty content without applying immediately', async () => {
    const user = userEvent.setup();
    render(<NoteAIAssistPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Expand Content/i }));

    expandResolve?.({
      success: true,
      data: { expandedContent: 'Expanded note body' },
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Review expanded content/i })).toBeInTheDocument();
    });

    expect(defaultProps.onContentChange).not.toHaveBeenCalled();
    expect(screen.getByText('Original note body')).toBeInTheDocument();
    expect(screen.getByText('Expanded note body')).toBeInTheDocument();
  });

  it('applies content and shows undo toast only after Accept', async () => {
    const user = userEvent.setup();
    render(<NoteAIAssistPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Expand Content/i }));

    expandResolve?.({
      success: true,
      data: { expandedContent: 'Expanded note body' },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Accept' }));

    expect(defaultProps.onContentChange).toHaveBeenCalledTimes(1);
    expect(defaultProps.onContentChange).toHaveBeenCalledWith('Expanded note body');

    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Content expanded successfully',
        duration: 15_000,
        action: expect.objectContaining({ label: 'Undo' }),
      })
    );

    const undoOnClick = showToastMock.mock.calls[0][0].action.onClick;
    undoOnClick();

    expect(defaultProps.onContentChange).toHaveBeenCalledWith('Original note body');
  });

  it('applies generate immediately when editor is empty', async () => {
    const user = userEvent.setup();
    render(<NoteAIAssistPanel {...defaultProps} content="" />);

    await user.click(screen.getByRole('button', { name: /Generate from Title/i }));

    generateResolve?.({
      success: true,
      data: { generatedContent: 'Fresh generated body' },
    });

    await waitFor(() => {
      expect(defaultProps.onContentChange).toHaveBeenCalledWith('Fresh generated body');
    });

    expect(
      screen.queryByRole('dialog', { name: /Review generated content/i })
    ).not.toBeInTheDocument();
  });

  it('does not apply content when preview is discarded', async () => {
    const user = userEvent.setup();
    render(<NoteAIAssistPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Expand Content/i }));

    expandResolve?.({
      success: true,
      data: { expandedContent: 'Expanded note body' },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(defaultProps.onContentChange).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('dialog', { name: /Review expanded content/i })
    ).not.toBeInTheDocument();
  });

  it('shows tag preview with confidence before applying tags', async () => {
    const user = userEvent.setup();
    render(<NoteAIAssistPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Suggest Tags/i }));

    suggestTagsResolve?.({
      success: true,
      data: {
        suggestedTags: [
          { tag: 'ai', relevance: 0.9, reasoning: 'Core topic' },
          { tag: 'agents', relevance: 0.65, reasoning: 'Related' },
        ],
        confidence: 0.8,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Suggested tags')).toBeInTheDocument();
    });

    expect(screen.getByText('ai')).toBeInTheDocument();
    expect(screen.getByText('agents')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(defaultProps.onTagsChange).not.toHaveBeenCalled();
    expect(showToastMock).not.toHaveBeenCalled();
  });

  it('applies only high-confidence tags on bulk apply', async () => {
    const user = userEvent.setup();
    render(<NoteAIAssistPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Suggest Tags/i }));

    suggestTagsResolve?.({
      success: true,
      data: {
        suggestedTags: [
          { tag: 'ai', relevance: 0.9, reasoning: 'Core topic' },
          { tag: 'agents', relevance: 0.65, reasoning: 'Related' },
        ],
        confidence: 0.8,
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Apply all high-confidence/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Apply all high-confidence/i }));

    expect(defaultProps.onTagsChange).toHaveBeenCalledWith(['math', 'ai']);
    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Added 1 suggested tag',
      })
    );
  });

  it('toggles an individual suggested tag on chip click', async () => {
    const user = userEvent.setup();
    render(<NoteAIAssistPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Suggest Tags/i }));

    suggestTagsResolve?.({
      success: true,
      data: {
        suggestedTags: [{ tag: 'agents', relevance: 0.65, reasoning: 'Related' }],
        confidence: 0.8,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('agents')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /agents/i }));

    expect(defaultProps.onTagsChange).toHaveBeenCalledWith(['math', 'agents']);
    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Added 1 suggested tag',
      })
    );
  });
});
