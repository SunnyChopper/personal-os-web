import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSignalRadar } from './useSignalRadar';
import { queryKeys } from '@/lib/react-query/query-keys';

const service = vi.hoisted(() => ({
  getRadarSettings: vi.fn(),
  listRadarSources: vi.fn(),
  listProfiles: vi.fn(),
  saveRadarDiscoveryCandidate: vi.fn(),
}));

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: service,
}));

describe('useSignalRadar discovery mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getRadarSettings.mockResolvedValue({ hasTavilyKey: true });
    service.listRadarSources.mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });
    service.listProfiles.mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 100, hasMore: false },
    });
    service.saveRadarDiscoveryCandidate.mockResolvedValue({
      id: 'source-1',
      name: 'Saved source',
    });
  });

  it('refreshes candidate, detail, and source caches after saving', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useSignalRadar(), { wrapper });

    await act(async () => {
      await result.current.saveDiscoveryCandidate.mutateAsync({
        runId: 'run-1',
        candidateId: 'candidate-1',
      });
    });

    await waitFor(() => {
      expect(service.saveRadarDiscoveryCandidate).toHaveBeenCalledWith('run-1', 'candidate-1');
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.personalBranding.radarSources.all(),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.personalBranding.radarDiscovery.candidates('run-1'),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.personalBranding.radarDiscovery.detail('run-1'),
    });
  });
});
