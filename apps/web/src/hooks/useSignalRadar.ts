import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  CreateRadarSourceInput,
  RadarDiscoveryCandidateFilters,
  RadarDiscoveryRun,
  RadarDiscoveryRunStatus,
  StartRadarDiscoveryRunInput,
  UpdateRadarSettingsInput,
  UpdateRadarSourceInput,
} from '@/types/api/personal-branding.dto';

export type RadarRunsListFilters = {
  page?: number;
  pageSize?: number;
};

export type RadarItemsListFilters = {
  page?: number;
  pageSize?: number;
  includeFiltered?: boolean;
};

export type RadarDiscoveryCandidatesListFilters = RadarDiscoveryCandidateFilters & {
  page?: number;
  pageSize?: number;
};

const ACTIVE_RUN_STATUSES = new Set(['queued', 'running']);
export const LIVE_RADAR_DISCOVERY_STATUSES = new Set<RadarDiscoveryRunStatus>([
  'queued',
  'running',
  'pausing',
  'cancelling',
]);

export function radarDiscoveryPollInterval(
  run?: Pick<RadarDiscoveryRun, 'status' | 'pollAfterMs'> | null
): number | false {
  if (!run || !LIVE_RADAR_DISCOVERY_STATUSES.has(run.status)) return false;
  return Math.max(1000, Math.min(run.pollAfterMs ?? 4000, 15000));
}

export function selectDefaultRadarDiscoveryRun(
  runs: RadarDiscoveryRun[]
): RadarDiscoveryRun | null {
  return runs.find((run) => LIVE_RADAR_DISCOVERY_STATUSES.has(run.status)) ?? runs[0] ?? null;
}

/**
 * React Query bundle for Signal Radar settings, sources, and discovery.
 */
export function useSignalRadar() {
  const qc = useQueryClient();

  const invalidateSources = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarSources.all() }),
    [qc]
  );

  const settings = useQuery({
    queryKey: queryKeys.personalBranding.radarSettings(),
    queryFn: () => personalBrandingService.getRadarSettings(),
  });

  const sources = useQuery({
    queryKey: queryKeys.personalBranding.radarSources.list(),
    queryFn: async () => {
      const res = await personalBrandingService.listRadarSources();
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load sources');
      return res.data;
    },
  });

  const discoveryProfiles = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(1, 100),
    queryFn: async () => {
      const res = await personalBrandingService.listProfiles(1, 100);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load brand profiles');
      }
      return res.data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: (body: UpdateRadarSettingsInput) =>
      personalBrandingService.updateRadarSettings(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarSettings() });
    },
  });

  const createSource = useMutation({
    mutationFn: (body: CreateRadarSourceInput) => personalBrandingService.createRadarSource(body),
    onSuccess: () => {
      void invalidateSources();
    },
  });

  const updateSource = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRadarSourceInput }) =>
      personalBrandingService.updateRadarSource(id, body),
    onSuccess: () => {
      void invalidateSources();
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarSuggestedCadences() });
    },
  });

  const deleteSource = useMutation({
    mutationFn: (id: string) => personalBrandingService.deleteRadarSource(id),
    onSuccess: () => {
      void invalidateSources();
    },
  });

  const startDiscovery = useMutation({
    mutationFn: (body: StartRadarDiscoveryRunInput) =>
      personalBrandingService.startRadarDiscoveryRun(body),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarDiscovery.lists() });
      qc.setQueryData(queryKeys.personalBranding.radarDiscovery.detail(data.runId), data);
    },
  });

  const controlDiscovery = useMutation({
    mutationFn: ({ runId, action }: { runId: string; action: 'pause' | 'resume' | 'cancel' }) => {
      if (action === 'pause') return personalBrandingService.pauseRadarDiscoveryRun(runId);
      if (action === 'resume') return personalBrandingService.resumeRadarDiscoveryRun(runId);
      return personalBrandingService.cancelRadarDiscoveryRun(runId);
    },
    onSuccess: (run) => {
      qc.setQueryData(queryKeys.personalBranding.radarDiscovery.detail(run.runId), run);
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarDiscovery.lists() });
      void qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.radarDiscovery.candidates(run.runId),
      });
    },
  });

  const saveDiscoveryCandidate = useMutation({
    mutationFn: ({ runId, candidateId }: { runId: string; candidateId: string }) =>
      personalBrandingService.saveRadarDiscoveryCandidate(runId, candidateId),
    onSuccess: (_source, { runId }) => {
      void invalidateSources();
      void qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.radarDiscovery.candidates(runId),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.radarDiscovery.detail(runId),
      });
    },
  });

  const addDiscoveryCandidateAsItem = useMutation({
    mutationFn: ({ runId, candidateId }: { runId: string; candidateId: string }) =>
      personalBrandingService.addRadarDiscoveryCandidateAsItem(runId, candidateId),
    onSuccess: (_item, { runId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarItems.all() });
      void qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.radarDiscovery.candidates(runId),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.radarDiscovery.detail(runId),
      });
    },
  });

  const markDiscoveryCandidateNotASource = useMutation({
    mutationFn: ({ runId, candidateId }: { runId: string; candidateId: string }) =>
      personalBrandingService.markRadarDiscoveryCandidateNotASource(runId, candidateId),
    onSuccess: (_candidate, { runId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.radarDiscovery.candidates(runId),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.radarDiscovery.detail(runId),
      });
    },
  });

  const parseDiscoveryCandidateSources = useMutation({
    mutationFn: ({ runId, candidateId }: { runId: string; candidateId: string }) =>
      personalBrandingService.startRadarDiscoveryCandidateParseSources(runId, candidateId),
    onSuccess: (_job, { runId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.radarDiscovery.candidates(runId),
      });
    },
  });

  return {
    settings,
    sources,
    discoveryProfiles,
    updateSettings,
    createSource,
    updateSource,
    deleteSource,
    startDiscovery,
    controlDiscovery,
    saveDiscoveryCandidate,
    addDiscoveryCandidateAsItem,
    markDiscoveryCandidateNotASource,
    parseDiscoveryCandidateSources,
    suggestedCadences: useQuery({
      queryKey: queryKeys.personalBranding.radarSuggestedCadences(),
      queryFn: () => personalBrandingService.getRadarSuggestedCadences(),
      enabled: false,
    }),
  };
}

export function useSignalRadarItems(filters: RadarItemsListFilters = {}) {
  const qc = useQueryClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const includeFiltered = filters.includeFiltered ?? false;

  const items = useQuery({
    queryKey: queryKeys.personalBranding.radarItems.list(page, pageSize, includeFiltered),
    queryFn: async () => {
      const res = await personalBrandingService.listRadarItems(page, pageSize, includeFiltered);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to load items');
      return res.data;
    },
  });

  const updateItemRelevance = useMutation({
    mutationFn: ({ itemId, relevant }: { itemId: string; relevant: boolean }) =>
      personalBrandingService.updateRadarItemRelevance(itemId, relevant),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarItems.all() });
    },
  });

  return { items, updateItemRelevance };
}

export function useSignalRadarRuns(filters: RadarRunsListFilters = {}) {
  const qc = useQueryClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const listKey = queryKeys.personalBranding.radarRuns.list(page, pageSize);

  const runs = useQuery({
    queryKey: listKey,
    queryFn: async () => {
      const res = await personalBrandingService.listRadarRuns(page, pageSize);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to load runs');
      return res.data;
    },
    refetchInterval: (query) => {
      const rows = query.state.data?.data ?? [];
      const hasActive = rows.some((r) => ACTIVE_RUN_STATUSES.has(r.status));
      return hasActive ? 4000 : false;
    },
  });

  const startSync = useMutation({
    mutationFn: () => personalBrandingService.startRadarRun(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarRuns.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarItems.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarSettings() });
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarSources.all() });
    },
  });

  return { runs, startSync, listKey };
}

export function useSignalRadarRunDetail(runId: string | null) {
  const detail = useQuery({
    queryKey: queryKeys.personalBranding.radarRuns.detail(runId ?? ''),
    queryFn: () => personalBrandingService.getRadarRun(runId!),
    enabled: Boolean(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ACTIVE_RUN_STATUSES.has(status) ? 4000 : false;
    },
  });

  return { detail };
}

export function useSignalRadarDiscoveryRun(runId: string | null) {
  const detail = useQuery({
    queryKey: queryKeys.personalBranding.radarDiscovery.detail(runId ?? ''),
    queryFn: () => personalBrandingService.getRadarDiscoveryRun(runId!),
    enabled: Boolean(runId),
    refetchInterval: (query) => radarDiscoveryPollInterval(query.state.data),
  });

  return { detail };
}

export function useSignalRadarDiscoveryRuns(filters: RadarRunsListFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const runs = useQuery({
    queryKey: queryKeys.personalBranding.radarDiscovery.list(page, pageSize),
    queryFn: async () => {
      const res = await personalBrandingService.listRadarDiscoveryRuns(page, pageSize);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load discovery runs');
      }
      return res.data;
    },
    refetchInterval: (query) => {
      const activeRun = (query.state.data?.data ?? []).find((run) =>
        LIVE_RADAR_DISCOVERY_STATUSES.has(run.status)
      );
      return radarDiscoveryPollInterval(activeRun);
    },
  });
  return { runs };
}

export function useSignalRadarDiscoveryCandidates(
  runId: string | null,
  filters: RadarDiscoveryCandidatesListFilters = {},
  run?: RadarDiscoveryRun | null
) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const queryFilters: RadarDiscoveryCandidateFilters = {
    status: filters.status,
    verdict: filters.verdict,
  };
  const candidates = useQuery({
    queryKey: queryKeys.personalBranding.radarDiscovery.candidateList(
      runId ?? '',
      page,
      pageSize,
      queryFilters
    ),
    queryFn: async () => {
      const res = await personalBrandingService.listRadarDiscoveryCandidates(
        runId!,
        page,
        pageSize,
        queryFilters
      );
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load discovery candidates');
      }
      return res.data;
    },
    enabled: Boolean(runId),
    refetchInterval: () => radarDiscoveryPollInterval(run),
  });
  return { candidates };
}
