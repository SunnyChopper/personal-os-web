import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';
import { assertSuccess, personalBrandingService } from './personal-branding.service';

describe('assertSuccess', () => {
  it('throws when success is false', () => {
    expect(() => assertSuccess({ success: false, error: { message: 'delete failed' } })).toThrow(
      'delete failed'
    );
  });

  it('preserves error code on thrown Error (c6bd8a4286da)', () => {
    expect.assertions(2);
    try {
      assertSuccess({
        success: false,
        error: {
          message: 'Request timed out. The server may be slow or unavailable.',
          code: 'ETIMEDOUT',
        },
      });
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error & { code?: string }).code).toBe('ETIMEDOUT');
    }
  });

  it('does not throw when success is true', () => {
    expect(() => assertSuccess({ success: true })).not.toThrow();
  });
});

describe('personalBrandingService.getProfile unwrap', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('preserves ETIMEDOUT from apiClient on thrown Error (a897a4d7994c)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      error: {
        message: 'Request timed out. The server may be slow or unavailable.',
        code: 'ETIMEDOUT',
      },
    });

    await expect(personalBrandingService.getProfile('profile-1')).rejects.toMatchObject({
      message: 'Request timed out. The server may be slow or unavailable.',
      code: 'ETIMEDOUT',
    });
  });

  it('forwards AbortSignal to apiClient.get', async () => {
    const controller = new AbortController();
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: {
        id: 'profile-1',
        name: 'Primary',
        status: 'active',
        pillars: [],
        toneMetrics: {},
        bannedPhrases: [],
        sources: [],
        createdAt: '2026-07-01T00:00:00Z',
        updatedAt: '2026-07-01T00:00:00Z',
      },
    });

    await personalBrandingService.getProfile('profile-1', controller.signal);

    expect(apiClient.get).toHaveBeenCalledWith('/personal-branding/profiles/profile-1', undefined, {
      signal: controller.signal,
    });
  });
});
