import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffectivePlatformRules } from './useEffectivePlatformRules';

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    getEffectivePlatformRules: vi.fn(),
  },
}));

import { personalBrandingService } from '@/services/personal-branding.service';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useEffectivePlatformRules', () => {
  it('parses requirement lines per platform', async () => {
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockResolvedValue({
      platform: 'x',
      profileId: 'profile-1',
      rules: [],
      resolvedPolicy: {
        characterLimit: null,
        readTimeLimitMinutes: null,
        wordLimit: null,
        rhetoricalModes: [],
        rhetoricalDevices: [],
        requirements: '- Avoid em-dashes\n- Use thread format',
        appliedRuleIds: [],
      },
    });

    const { result } = renderHook(() => useEffectivePlatformRules({ x: 'profile-1' }, ['x']), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.entries[0]?.requirementLines).toEqual([
      'Avoid em-dashes',
      'Use thread format',
    ]);
  });
});
