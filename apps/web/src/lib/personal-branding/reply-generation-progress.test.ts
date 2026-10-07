import { describe, expect, it } from 'vitest';
import {
  replyAgentProgress,
  replyGenerationStartedAtMs,
  replyPolishingProgress,
  resolveReplyAgentSteps,
  resolveReplySkeletonCount,
} from './reply-generation-progress';

describe('resolveReplyAgentSteps', () => {
  it('includes research when enabled', () => {
    const ids = resolveReplyAgentSteps(true, false).map((step) => step.id);
    expect(ids).toEqual(['plan', 'research', 'draft', 'critique', 'polish']);
  });

  it('skips research when disabled', () => {
    const ids = resolveReplyAgentSteps(false, false).map((step) => step.id);
    expect(ids).toEqual(['plan', 'draft', 'critique', 'polish']);
  });

  it('includes vault grounding when enabled', () => {
    const ids = resolveReplyAgentSteps(false, true).map((step) => step.id);
    expect(ids).toEqual(['plan', 'vault_ground', 'draft', 'critique', 'polish']);
  });

  it('includes both research and vault grounding when enabled', () => {
    const ids = resolveReplyAgentSteps(true, true).map((step) => step.id);
    expect(ids).toEqual(['plan', 'research', 'vault_ground', 'draft', 'critique', 'polish']);
  });
});

describe('resolveReplySkeletonCount', () => {
  it('clamps to 1..5', () => {
    expect(resolveReplySkeletonCount({ suggestionCount: 0 })).toBe(1);
    expect(resolveReplySkeletonCount({ suggestionCount: 3 })).toBe(3);
    expect(resolveReplySkeletonCount({ suggestionCount: 9 })).toBe(5);
    expect(resolveReplySkeletonCount(null, 4)).toBe(4);
    expect(resolveReplySkeletonCount(null, null)).toBe(3);
  });
});

describe('replyAgentProgress', () => {
  const startedAtMs = 1_000_000;

  it('returns null for simple mode', () => {
    expect(
      replyAgentProgress({
        status: 'RUNNING',
        mode: 'SIMPLE',
        researchEnabled: false,
        vaultGroundingEnabled: false,
        startedAtMs,
        nowMs: startedAtMs + 5_000,
      })
    ).toBeNull();
  });

  it('returns queued label for pending and queued statuses', () => {
    expect(
      replyAgentProgress({
        status: 'PENDING',
        mode: 'AGENT',
        researchEnabled: true,
        vaultGroundingEnabled: false,
        startedAtMs,
        nowMs: startedAtMs,
      })
    ).toEqual({ stepId: 'queued', label: 'Queued for generation…', percent: 4 });

    expect(
      replyAgentProgress({
        status: 'QUEUED',
        mode: 'AGENT',
        researchEnabled: true,
        vaultGroundingEnabled: false,
        startedAtMs,
        nowMs: startedAtMs + 1_000,
      })?.stepId
    ).toBe('queued');
  });

  it('advances through agent steps based on elapsed time', () => {
    const early = replyAgentProgress({
      status: 'RUNNING',
      mode: 'AGENT',
      researchEnabled: true,
      vaultGroundingEnabled: false,
      startedAtMs,
      nowMs: startedAtMs + 1_000,
    });
    expect(early?.stepId).toBe('plan');

    const mid = replyAgentProgress({
      status: 'RUNNING',
      mode: 'AGENT',
      researchEnabled: true,
      vaultGroundingEnabled: false,
      startedAtMs,
      nowMs: startedAtMs + 12_000,
    });
    expect(mid?.stepId).toBe('research');

    const late = replyAgentProgress({
      status: 'RUNNING',
      mode: 'AGENT',
      researchEnabled: false,
      vaultGroundingEnabled: false,
      startedAtMs,
      nowMs: startedAtMs + 35_000,
    });
    expect(late?.stepId).toBe('critique');
  });

  it('caps in-flight percent below 95', () => {
    const progress = replyAgentProgress({
      status: 'RUNNING',
      mode: 'AGENT',
      researchEnabled: true,
      vaultGroundingEnabled: false,
      startedAtMs,
      nowMs: startedAtMs + 600_000,
    });
    expect(progress?.percent).toBeLessThanOrEqual(95);
    expect(progress?.percent).toBeGreaterThan(50);
  });
});

describe('replyPolishingProgress', () => {
  const startedAtMs = 1_000_000;

  it('maps elapsed time to critique and polish steps only', () => {
    const early = replyPolishingProgress({
      status: 'RUNNING',
      mode: 'AGENT',
      researchEnabled: true,
      vaultGroundingEnabled: false,
      startedAtMs,
      nowMs: startedAtMs + 40_000,
    });
    expect(early?.stepId).toBe('critique');

    const late = replyPolishingProgress({
      status: 'RUNNING',
      mode: 'AGENT',
      researchEnabled: false,
      vaultGroundingEnabled: false,
      startedAtMs,
      nowMs: startedAtMs + 50_000,
    });
    expect(late?.stepId).toBe('polish');
    expect(late?.percent).toBeLessThanOrEqual(95);
  });
});

describe('replyGenerationStartedAtMs', () => {
  it('prefers startedAt then createdAt', () => {
    expect(
      replyGenerationStartedAtMs({
        startedAt: '2026-01-02T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      })
    ).toBe(Date.parse('2026-01-02T00:00:00.000Z'));

    expect(
      replyGenerationStartedAtMs({
        createdAt: '2026-01-01T00:00:00.000Z',
      })
    ).toBe(Date.parse('2026-01-01T00:00:00.000Z'));
  });

  it('falls back to provided ms', () => {
    expect(replyGenerationStartedAtMs(null, 42_000)).toBe(42_000);
  });
});
