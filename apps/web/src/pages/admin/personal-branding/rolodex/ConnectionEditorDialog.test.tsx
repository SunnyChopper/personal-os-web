import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ConnectionEditorDialog from './ConnectionEditorDialog';
import type { CreatorConnection } from '@/types/api/personal-branding.dto';

const mockDistillReplyVoiceGuidance = vi.fn();
const mockOnUpdate = vi.fn();
const mockShowToast = vi.fn();

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    distillReplyVoiceGuidance: (...args: unknown[]) => mockDistillReplyVoiceGuidance(...args),
  },
}));

const baseConnection: CreatorConnection = {
  id: 'conn-1',
  name: 'Ada Lovelace',
  handles: { x: 'ada' },
  conversationAngles: [],
  tags: [],
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  replyVoiceGuidance: 'Prefer technical depth.',
};

function renderDialog(initial: CreatorConnection | null = baseConnection) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConnectionEditorDialog
        isOpen
        onClose={vi.fn()}
        initial={initial}
        showToast={mockShowToast}
        onCreate={vi.fn()}
        onUpdate={mockOnUpdate}
      />
    </QueryClientProvider>
  );
}

describe('ConnectionEditorDialog reply voice guidance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows reply voice guidance section when editing', () => {
    renderDialog();

    expect(screen.getByText('Reply voice guidance')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Prefer technical depth.')).toBeInTheDocument();
  });

  it('loads distilled guidance into the textarea without saving', async () => {
    const user = userEvent.setup();
    mockDistillReplyVoiceGuidance.mockResolvedValue({
      proposedGuidance: '**Prefer**\n- Short questions',
      sampleSize: 2,
    });

    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Draft from feedback' }));

    expect(mockDistillReplyVoiceGuidance).toHaveBeenCalledWith('conn-1');
    expect(mockOnUpdate).not.toHaveBeenCalled();
    const guidanceField = await screen.findByPlaceholderText(/Prefer:/i);
    expect(guidanceField).toHaveValue('**Prefer**\n- Short questions');
    expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }));
  });

  it('includes replyVoiceGuidance in save payload', async () => {
    const user = userEvent.setup();
    mockOnUpdate.mockResolvedValue(undefined);

    renderDialog();

    const guidanceField = screen.getByDisplayValue('Prefer technical depth.');
    await user.clear(guidanceField);
    await user.type(guidanceField, 'Prefer hooks.');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mockOnUpdate).toHaveBeenCalledWith(
      'conn-1',
      expect.objectContaining({ replyVoiceGuidance: 'Prefer hooks.' })
    );
  });

  it('includes preferredSocialCapitalAngles in save payload', async () => {
    const user = userEvent.setup();
    mockOnUpdate.mockResolvedValue(undefined);

    renderDialog({
      ...baseConnection,
      preferredSocialCapitalAngles: [],
    });

    await user.click(screen.getByRole('button', { name: 'Humor' }));
    await user.click(screen.getByRole('button', { name: 'Knowledge' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mockOnUpdate).toHaveBeenCalledWith(
      'conn-1',
      expect.objectContaining({
        preferredSocialCapitalAngles: ['humor', 'knowledge'],
      })
    );
  });
});
