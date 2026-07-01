import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';

describe('useSignalRadar query keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('start sync invalidates radar runs prefix', async () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    await qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarRuns.all() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.personalBranding.radarRuns.all() });
  });

  it('settings key is stable for radar settings query', () => {
    expect(queryKeys.personalBranding.radarSettings()).toEqual([
      'personal-branding',
      'radar-settings',
    ]);
  });

  it('discovery detail key includes run id', () => {
    expect(queryKeys.personalBranding.radarDiscovery.detail('run-abc')).toEqual([
      'personal-branding',
      'radar-discovery',
      'detail',
      'run-abc',
    ]);
  });
});
