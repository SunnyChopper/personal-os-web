import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RECON_INTERACTION_INTENT_MAX } from '@/lib/personal-branding/recon-prompter-seed';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';
import { personalBrandingService } from './personal-branding.service';

const baseRun = {
  id: 'run-1',
  connectionId: 'conn-1',
  platform: 'x',
  creatorText: 'Hello world',
  mode: 'SIMPLE' as const,
  researchEnabled: false,
  vaultGroundingEnabled: false,
  suggestionCount: 3,
  status: 'SUCCEEDED' as const,
  userId: 'user-1',
  createdAt: '2026-08-07T00:00:00.000Z',
  updatedAt: '2026-08-07T00:00:00.000Z',
  suggestions: [],
};

describe('personalBrandingService.startReplyRun', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  it('truncates interactionIntent to reply-run max before POST (4fdae7012c52)', async () => {
    const longIntent = 'x'.repeat(RECON_INTERACTION_INTENT_MAX + 120);
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { result: baseRun },
    });

    await personalBrandingService.startReplyRun({
      connectionId: 'conn-1',
      platform: 'x',
      creatorText: 'Post body',
      mode: 'SIMPLE',
      interactionIntent: longIntent,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/personal-branding/rolodex/reply-runs',
      expect.objectContaining({
        interactionIntent: longIntent.slice(0, RECON_INTERACTION_INTENT_MAX),
      })
    );
    expect(
      (vi.mocked(apiClient.post).mock.calls[0]?.[1] as { interactionIntent: string })
        .interactionIntent.length
    ).toBe(RECON_INTERACTION_INTENT_MAX);
  });

  it('strips whitespace-only interactionIntent before POST', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { result: baseRun },
    });

    await personalBrandingService.startReplyRun({
      connectionId: 'conn-1',
      platform: 'x',
      creatorText: 'Post body',
      mode: 'SIMPLE',
      interactionIntent: '   ',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/personal-branding/rolodex/reply-runs',
      expect.objectContaining({
        interactionIntent: undefined,
      })
    );
  });

  it('surfaces validation field details in thrown Error', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            type: 'string_too_long',
            loc: ['body', 'interactionIntent'],
            msg: 'String should have at most 500 characters',
          },
        ],
      },
    });

    await expect(
      personalBrandingService.startReplyRun({
        connectionId: 'conn-1',
        platform: 'x',
        creatorText: 'Post body',
        mode: 'SIMPLE',
      })
    ).rejects.toThrow(/InteractionIntent: String should have at most 500 characters/);
  });
});
