import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBrandProfilesList } from './useBrandProfilesList';

const { listProfiles, listProfileVersions } = vi.hoisted(() => ({
  listProfiles: vi.fn(),
  listProfileVersions: vi.fn(),
}));

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    listProfiles,
    listProfileVersions,
  },
}));

function wrap(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useBrandProfilesList', () => {
  beforeEach(() => {
    listProfiles.mockReset();
    listProfileVersions.mockReset();
  });

  it('loads profiles and auto-selects the first id without Brand Identity fan-out (567c68a56446)', async () => {
    listProfiles.mockResolvedValue({
      success: true,
      data: {
        data: [
          { id: 'p1', name: 'Primary' },
          { id: 'p2', name: 'Secondary' },
        ],
        total: 2,
        page: 1,
        pageSize: 50,
        hasMore: false,
      },
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useBrandProfilesList(), {
      wrapper: wrap(client),
    });

    await waitFor(() => expect(result.current.profiles.isSuccess).toBe(true));

    expect(listProfiles).toHaveBeenCalledTimes(1);
    expect(listProfiles.mock.calls[0]?.[0]).toBe(1);
    expect(listProfiles.mock.calls[0]?.[1]).toBe(50);
    expect(listProfiles.mock.calls[0]?.[2]).toBeInstanceOf(AbortSignal);
    expect(listProfileVersions).not.toHaveBeenCalled();
    expect(result.current.selectedProfileId).toBe('p1');
    expect(result.current.profileOptions).toEqual([
      { id: 'p1', name: 'Primary' },
      { id: 'p2', name: 'Secondary' },
    ]);
  });

  it('preserves ETIMEDOUT code when listProfiles fails (a98591bd8564)', async () => {
    listProfiles.mockResolvedValue({
      success: false,
      error: {
        message: 'Request timed out. The server may be slow or unavailable.',
        code: 'ETIMEDOUT',
      },
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useBrandProfilesList(), {
      wrapper: wrap(client),
    });

    await waitFor(() => expect(result.current.profiles.isError).toBe(true));

    const err = result.current.profiles.error as Error & { code?: string };
    expect(err.message).toMatch(/timed out/i);
    expect(err.code).toBe('ETIMEDOUT');
  });
});
