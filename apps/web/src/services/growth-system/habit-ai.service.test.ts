import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { habitAIService, suggestedPatchToUpdateInput } from './habit-ai.service';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const validEnvelope = {
  result: {
    habitId: 'h1',
    actionType: 'patternInsight' as const,
    readiness: 'established' as const,
    title: 'What is working?',
    summary: 'y'.repeat(40),
    evidence: [{ label: 'Weekdays', detail: 'Evidence detail text ok ok ok ok ok' }],
    recommendations: ['Keep logging'],
  },
  confidence: 0.82,
  provider: 'anthropic',
  model: '',
  cached: false,
};

describe('habitAIService', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  it('POSTs camelCase body to established-actions with schema validation', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: validEnvelope,
    });

    const res = await habitAIService.runEstablishedAction({
      habitId: 'h1',
      actionType: 'patternInsight',
      useCache: false,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/ai/habits/established-actions',
      expect.objectContaining({
        habitId: 'h1',
        actionType: 'patternInsight',
        useCache: false,
      }),
      expect.anything()
    );
    expect(res.success).toBe(true);
    expect(res.data?.result.habitId).toBe('h1');
    expect(res.data?.confidence).toBe(0.82);
  });

  it('returns backend error envelope without rewriting', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: false,
      error: { message: 'Too many requests', code: 'RATE_LIMIT' },
    });

    const res = await habitAIService.runEstablishedAction({
      habitId: 'h1',
      actionType: 'recoveryPlan',
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('RATE_LIMIT');
  });
});

describe('suggestedPatchToUpdateInput', () => {
  it('maps allowed PATCH fields only', () => {
    expect(
      suggestedPatchToUpdateInput({
        trigger: 'After coffee',
        dailyTarget: 2,
        notes: 'Try smaller scope',
      })
    ).toEqual({
      trigger: 'After coffee',
      dailyTarget: 2,
      notes: 'Try smaller scope',
    });
  });
});
