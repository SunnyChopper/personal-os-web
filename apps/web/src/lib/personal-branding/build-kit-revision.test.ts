import { describe, expect, it } from 'vitest';
import type { BuildKitPatchOperation } from '@/types/api/personal-branding.dto';
import {
  describeRevisionOperation,
  isProposalStale,
  revisionOperationBody,
} from './build-kit-revision';

const operations: BuildKitPatchOperation[] = [
  { op: 'updateSkill', name: 'api-style', skillMarkdown: '# tighter' },
  { op: 'removeSkill', name: 'legacy' },
  { op: 'addSkill', name: 'testing', description: 'tests', skillMarkdown: '# tests' },
  { op: 'updateModule', order: 2, goal: 'persist' },
  { op: 'removeModule', order: 1 },
  { op: 'addModule', order: 5, name: 'Ship', goal: 'release', prompt: 'ship it' },
  { op: 'setSetupPrompt', setupPrompt: 'new bootstrap' },
];

describe('describeRevisionOperation', () => {
  it('labels every patch op', () => {
    expect(operations.map(describeRevisionOperation)).toEqual([
      'Update skill api-style',
      'Remove skill legacy',
      'Add skill testing',
      'Update module 2',
      'Remove module 1',
      'Add module 5: Ship',
      'Replace setup prompt',
    ]);
  });
});

describe('revisionOperationBody', () => {
  it('returns replacement text and omits removals', () => {
    expect(revisionOperationBody(operations[0])).toBe('# tighter');
    expect(revisionOperationBody(operations[1])).toBeNull();
    expect(revisionOperationBody(operations[4])).toBeNull();
    expect(revisionOperationBody(operations[6])).toBe('new bootstrap');
  });
});

describe('isProposalStale', () => {
  it('is stale when the kit timestamp moved', () => {
    expect(isProposalStale('2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z')).toBe(false);
    expect(isProposalStale('2026-10-01T00:00:00Z', '2026-10-02T00:00:00Z')).toBe(true);
    expect(isProposalStale('2026-10-01T00:00:00Z', undefined)).toBe(true);
  });
});
