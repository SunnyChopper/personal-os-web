import { describe, it, expect } from 'vitest';
import { formatInterventionStackLabel, interventionOccurrenceCount } from './intervention-stack-ui';
import type { AssistantIntervention } from '@/types/api-contracts';

const base: AssistantIntervention = {
  id: '1',
  kind: 'coachIntervention',
  severity: 'attention',
  status: 'unread',
  title: 'T',
  body: 'B',
  createdAt: '2026-07-21T08:00:00Z',
  updatedAt: '2026-07-21T08:00:00Z',
};

describe('intervention-stack-ui', () => {
  it('shows stack label when occurrenceCount > 1', () => {
    expect(formatInterventionStackLabel({ ...base, occurrenceCount: 12 })).toBe('12×');
    expect(formatInterventionStackLabel(base)).toBeNull();
    expect(interventionOccurrenceCount(base)).toBe(1);
  });
});
