import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  CreateRadarSourceInput,
  SaveRadarDiscoverySuggestionInput,
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

const ACTIVE_RUN_STATUSES = new Set(['queued', 'running']);

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
    },
  });

  const deleteSource = useMutation({
    mutationFn: (id: string) => personalBrandingService.deleteRadarSource(id),
    onSuccess: () => {
      void invalidateSources();
    },
  });

  const startDiscovery = useMutation({
    mutationFn: () => personalBrandingService.startRadarDiscoveryRun(),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.radarDiscovery.all() });
      qc.setQueryData(queryKeys.personalBranding.radarDiscovery.detail(data.runId), data);
    },
  });

  const saveDiscoverySuggestion = useMutation({
    mutationFn: (body: SaveRadarDiscoverySuggestionInput) =>
      personalBrandingService.saveRadarDiscoverySuggestion(body),
    onSuccess: () => {
      void invalidateSources();
    },
  });

  return {
    settings,
    sources,
    updateSettings,
    createSource,
    updateSource,
    deleteSource,
    startDiscovery,
    saveDiscoverySuggestion,
  };
}

export function useSignalRadarItems(filters: RadarItemsListFilters = {}) {
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

  return { items };
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
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ACTIVE_RUN_STATUSES.has(status) ? 4000 : false;
    },
  });

  return { detail };
}
