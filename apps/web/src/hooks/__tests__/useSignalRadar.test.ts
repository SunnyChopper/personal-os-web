import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { radarDiscoveryPollInterval, selectDefaultRadarDiscoveryRun } from '@/hooks/useSignalRadar';
import type { RadarDiscoveryRun } from '@/types/api/personal-branding.dto';

function makeDiscoveryRun(
  runId: string,
  status: RadarDiscoveryRun['status'],
  pollAfterMs?: number
): RadarDiscoveryRun {
  return {
    runId,
    status,
    phase: status,
    pollAfterMs,
    profileSnapshots: [],
    profileNames: ['Builder'],
    customTopics: [],
    effectiveTopics: ['AI systems'],
    generatedQueries: [],
    progress: {
      queriesTotal: 1,
      queriesCompleted: 0,
      candidatesDiscovered: 0,
      candidatesEvaluated: 0,
      candidatesRelevant: 0,
      candidatesNotRelevant: 0,
      candidatesFailed: 0,
    },
    createdAt: '2026-07-14T12:00:00Z',
    updatedAt: '2026-07-14T12:00:00Z',
  };
}

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

  it('discovery list and candidate keys keep pagination and filters distinct', () => {
    expect(queryKeys.personalBranding.radarDiscovery.list(2, 10)).toEqual([
      'personal-branding',
      'radar-discovery',
      'list',
      2,
      10,
    ]);
    expect(
      queryKeys.personalBranding.radarDiscovery.candidateList('run-abc', 3, 20, {
        status: 'failed',
        verdict: 'relevant',
      })
    ).toEqual([
      'personal-branding',
      'radar-discovery',
      'candidates',
      'run-abc',
      'list',
      3,
      20,
      'failed',
      'relevant',
    ]);
  });

  it('radar items list key includes includeFiltered', () => {
    expect(queryKeys.personalBranding.radarItems.list(1, 50, true)).toEqual([
      'personal-branding',
      'radar-items',
      'list',
      1,
      50,
      true,
    ]);
  });

  it('reload selection prefers an active or transitional run, otherwise newest', () => {
    const newestTerminal = makeDiscoveryRun('newest', 'completed');
    const active = makeDiscoveryRun('active', 'pausing');
    expect(selectDefaultRadarDiscoveryRun([newestTerminal, active])?.runId).toBe('active');
    expect(selectDefaultRadarDiscoveryRun([newestTerminal])?.runId).toBe('newest');
  });

  it('polls adaptively only while a discovery run is live', () => {
    expect(radarDiscoveryPollInterval(makeDiscoveryRun('run-1', 'running', 2500))).toBe(2500);
    expect(radarDiscoveryPollInterval(makeDiscoveryRun('run-1', 'queued', 100))).toBe(1000);
    expect(radarDiscoveryPollInterval(makeDiscoveryRun('run-1', 'paused', 2500))).toBe(false);
    expect(radarDiscoveryPollInterval(makeDiscoveryRun('run-1', 'completed', 2500))).toBe(false);
  });
});
