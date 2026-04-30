import type { QueryClient } from '@tanstack/react-query';
import { sanitizeForSnapshot } from './redact';

type QuerySnapshot = {
  queryKey: unknown;
  queryHash: string;
  status: string;
  fetchStatus: string;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  isStale: boolean;
  observers: number;
  data?: unknown;
  error?: unknown;
};

type MutationSnapshot = {
  mutationKey?: unknown;
  status: string;
  submittedAt: number;
  data?: unknown;
  error?: unknown;
};

type DebugSnapshotOptions = {
  includeQueryData?: boolean;
  includeMutationData?: boolean;
};

export type DebugSnapshotInput = {
  queryClient: QueryClient;
  zustandStores: Array<{ name: string; state: unknown }>;
  appState: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  options?: DebugSnapshotOptions;
};

function buildQuerySnapshots(
  queryClient: QueryClient,
  options: DebugSnapshotOptions
): QuerySnapshot[] {
  return queryClient
    .getQueryCache()
    .getAll()
    .map((query) => {
      const state = query.state;
      return {
        queryKey: query.queryKey,
        queryHash: query.queryHash,
        status: state.status,
        fetchStatus: state.fetchStatus,
        dataUpdatedAt: state.dataUpdatedAt,
        errorUpdatedAt: state.errorUpdatedAt,
        isStale: query.isStale(),
        observers: query.getObserversCount(),
        data: options.includeQueryData ? state.data : undefined,
        error: options.includeQueryData ? state.error : undefined,
      };
    });
}

function buildMutationSnapshots(
  queryClient: QueryClient,
  options: DebugSnapshotOptions
): MutationSnapshot[] {
  return queryClient
    .getMutationCache()
    .getAll()
    .map((mutation) => ({
      mutationKey: mutation.options.mutationKey,
      status: mutation.state.status,
      submittedAt: mutation.state.submittedAt ?? 0,
      data: options.includeMutationData ? mutation.state.data : undefined,
      error: options.includeMutationData ? mutation.state.error : undefined,
    }));
}

export function buildDebugSnapshot(input: DebugSnapshotInput): Record<string, unknown> {
  const options = input.options ?? {};

  const snapshot = {
    generatedAt: new Date().toISOString(),
    appState: input.appState,
    diagnostics: input.diagnostics ?? {},
    queryCache: buildQuerySnapshots(input.queryClient, options),
    mutationCache: buildMutationSnapshots(input.queryClient, options),
    zustand: input.zustandStores,
  };

  return sanitizeForSnapshot(snapshot) as Record<string, unknown>;
}
