import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SuggestionsList } from '@/components/organisms/planner/SuggestionsList';
import type { PlanDaySuggestion } from '@/types/planner';

const sampleSuggestion = (partial: Partial<PlanDaySuggestion>): PlanDaySuggestion => ({
  taskId: 't1',
  title: 'Task one',
  storyPoints: 3,
  priority: 'P1',
  score: 100,
  reason: 'Test',
  ...partial,
});

function ToggleHarness({ suggestion }: { suggestion: PlanDaySuggestion }) {
  const [orderedIds, setOrderedIds] = useState([suggestion.taskId]);
  const [selectedIds, setSelectedIds] = useState(() => new Set<string>([suggestion.taskId]));

  return (
    <SuggestionsList
      suggestions={[suggestion]}
      orderedIds={orderedIds}
      capacityPoints={5}
      selectedIds={selectedIds}
      onToggleTask={(tid) => {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(tid)) next.delete(tid);
          else next.add(tid);
          return next;
        });
      }}
      onReorder={setOrderedIds}
    />
  );
}

describe('SuggestionsList', () => {
  it('subtracts unchecked tasks from totals', async () => {
    const suggestion = sampleSuggestion({});
    render(<ToggleHarness suggestion={suggestion} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText(/0\.0 \/ ~5\.0 pts/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Daily capacity/i })).toBeInTheDocument();
  });

  it('shows Fits today chip when contextMatch is true', () => {
    const suggestion = sampleSuggestion({ contextMatch: true, fitReason: 'Fits a lighter day' });
    render(<ToggleHarness suggestion={suggestion} />);
    expect(screen.getByText('Fits today')).toBeInTheDocument();
  });
});
