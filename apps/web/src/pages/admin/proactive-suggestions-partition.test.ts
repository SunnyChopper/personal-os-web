import { describe, expect, it } from 'vitest';
import { partitionProactiveSuggestions } from '@/pages/admin/proactive-suggestions-partition';
import type { ProactiveSuggestion } from '@/types/api-contracts';

const base = {
  id: '1',
  proposedPayload: {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('partitionProactiveSuggestions', () => {
  it('splits pending, accepted, rejected and sorts resolved by updatedAt desc', () => {
    const all: ProactiveSuggestion[] = [
      { ...base, id: 'p', status: 'pending', updatedAt: '2026-01-03T00:00:00Z' },
      { ...base, id: 'a1', status: 'approved', updatedAt: '2026-01-02T00:00:00Z' },
      { ...base, id: 'a2', status: 'approved', updatedAt: '2026-01-04T00:00:00Z' },
      { ...base, id: 'r1', status: 'rejected', updatedAt: '2026-01-01T00:00:00Z' },
    ];
    const { pending, accepted, rejected } = partitionProactiveSuggestions(all);
    expect(pending.map((s) => s.id)).toEqual(['p']);
    expect(accepted.map((s) => s.id)).toEqual(['a2', 'a1']);
    expect(rejected.map((s) => s.id)).toEqual(['r1']);
  });

  it('treats unknown status as pending', () => {
    const all = [{ ...base, id: 'u', status: 'weird' } as unknown as ProactiveSuggestion];
    const { pending, accepted, rejected } = partitionProactiveSuggestions(all);
    expect(pending).toHaveLength(1);
    expect(accepted).toHaveLength(0);
    expect(rejected).toHaveLength(0);
  });
});
