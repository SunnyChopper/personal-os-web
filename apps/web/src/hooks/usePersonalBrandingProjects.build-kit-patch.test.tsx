import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type { BrandProjectIdea } from '@/types/api/personal-branding.dto';
import { useBrandProjectBuildKitPatch } from './usePersonalBrandingProjects';

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    patchBrandProjectBuildKit: vi.fn(),
  },
}));

const idea = { id: 'idea-1', title: 'Ship' } as BrandProjectIdea;

describe('useBrandProjectBuildKitPatch', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(personalBrandingService.patchBrandProjectBuildKit).mockReset();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  it('writes the returned idea into the detail cache', async () => {
    vi.mocked(personalBrandingService.patchBrandProjectBuildKit).mockResolvedValue(idea);
    const { result } = renderHook(() => useBrandProjectBuildKitPatch('idea-1'), { wrapper });

    await result.current.mutateAsync([{ op: 'removeSkill', name: 'My Skill' }]);

    await waitFor(() => {
      expect(client.getQueryData(queryKeys.personalBranding.projects.idea('idea-1'))).toEqual(idea);
    });
  });

  it('refetches the idea on 409 and surfaces a reload message', async () => {
    const refetchQueries = vi.spyOn(client, 'refetchQueries').mockResolvedValue(undefined);
    const conflict = Object.assign(new Error('Build kit changed since it was read'), {
      code: 'CONFLICT',
    });
    vi.mocked(personalBrandingService.patchBrandProjectBuildKit).mockRejectedValue(conflict);
    const { result } = renderHook(() => useBrandProjectBuildKitPatch(' idea-1 '), { wrapper });

    await expect(
      result.current.mutateAsync([{ op: 'removeSkill', name: 'My Skill' }])
    ).rejects.toThrow(/reloaded/i);

    expect(refetchQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.personalBranding.projects.idea('idea-1'),
    });
  });
});
