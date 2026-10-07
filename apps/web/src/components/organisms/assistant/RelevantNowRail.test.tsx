import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RelevantNowRail } from './RelevantNowRail';
import { useRelevantNow } from '@/hooks/chatbot/useRelevantNow';
import type { AmbientCoachData } from '@/types/chatbot';

vi.mock('@/hooks/chatbot/useRelevantNow', () => ({
  useRelevantNow: vi.fn(),
}));

function makeData(): AmbientCoachData {
  return {
    generatedAt: '2026-07-23T12:00:00.000Z',
    chooser: { strategy: 'deterministic', cached: false, model: '' },
    slots: [
      {
        kind: 'blocker',
        entityId: 'task-blocked',
        title: 'Unblock API',
        subtitle: 'Blocked',
        href: '/admin/tasks?taskId=task-blocked',
        askPrompt: 'Help me unblock this task.',
        slotLabel: 'Signal',
        reason: 'Blocked work may need a decision.',
      },
      {
        kind: 'healthConstraint',
        entityId: 'health-1',
        title: 'Rest today',
        subtitle: 'Recovery score is low',
        href: '/admin/health-fitness',
        askPrompt: 'Help me address this health constraint.',
        slotLabel: 'Health',
        reason: 'An active health constraint may affect today.',
      },
    ],
  };
}

describe('RelevantNowRail', () => {
  it('renders server-selected slots in server order', () => {
    vi.mocked(useRelevantNow).mockReturnValue({
      data: makeData(),
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useRelevantNow>);

    render(
      <RelevantNowRail
        collapsed={false}
        onToggleCollapsed={vi.fn()}
        onAsk={vi.fn()}
        onOpen={vi.fn()}
      />
    );

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByRole('heading', { name: 'Unblock API' })).toBeInTheDocument();
    expect(within(cards[1]).getByRole('heading', { name: 'Rest today' })).toBeInTheDocument();
    expect(screen.getByText('Blocked work may need a decision.')).toBeInTheDocument();
  });
});
