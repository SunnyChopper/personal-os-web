import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReplyRunMonitor from './ReplyRunMonitor';
import type { ReplyRun } from '@/types/api/personal-branding.dto';

const sampleRun: ReplyRun = {
  id: '11111111-1111-4111-8111-111111111111',
  connectionId: '22222222-2222-4222-8222-222222222222',
  platform: 'x',
  creatorText: 'Great post',
  mode: 'AGENT',
  researchEnabled: false,
  suggestionCount: 3,
  status: 'RUNNING',
  userId: 'user-1',
  createdAt: '2026-07-15T00:00:00Z',
  updatedAt: '2026-07-15T00:00:00Z',
  suggestions: [],
};

describe('ReplyRunMonitor', () => {
  it('calls onView when View is clicked', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const connectionNameById = new Map([[sampleRun.connectionId, 'Andrej Karpathy']]);

    render(
      <ReplyRunMonitor runs={[sampleRun]} connectionNameById={connectionNameById} onView={onView} />
    );

    expect(screen.getByText('Andrej Karpathy')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View' }));
    expect(onView).toHaveBeenCalledWith(sampleRun);
  });
});
