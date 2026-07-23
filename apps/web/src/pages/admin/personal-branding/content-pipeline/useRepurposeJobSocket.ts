import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth/auth.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import { getResolvedWsUrl } from '@/lib/vite-public-env';
import {
  RepurposeJobsWsClient,
  type RepurposeJobProgressPayload,
  type RepurposeVariantCreatedPayload,
  type RepurposeWsConnectionState,
} from '@/lib/websocket/repurpose-jobs-ws-client';
import type { ContentVariant, RepurposeJob } from '@/types/api/personal-branding.dto';

function upsertJob(
  jobs: RepurposeJob[] | undefined,
  patch: RepurposeJobProgressPayload
): RepurposeJob[] {
  const list = jobs ?? [];
  const idx = list.findIndex((j) => j.jobId === patch.jobId);
  const next: RepurposeJob = {
    ...(idx >= 0 ? list[idx] : ({} as RepurposeJob)),
    ...patch,
    jobId: patch.jobId,
    sourceContentId: patch.sourceContentId ?? patch.contentId ?? list[idx]?.sourceContentId ?? '',
    variantIds: patch.variantIds ?? list[idx]?.variantIds ?? [],
    targetPlatforms: patch.targetPlatforms ?? list[idx]?.targetPlatforms ?? [patch.platform],
    platform: patch.platform,
    status: patch.status,
    brandProfileId: patch.brandProfileId ?? list[idx]?.brandProfileId ?? '',
    userId: patch.userId ?? list[idx]?.userId ?? '',
    createdAt: patch.createdAt ?? list[idx]?.createdAt ?? new Date().toISOString(),
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };
  if (idx >= 0) {
    const copy = [...list];
    copy[idx] = next;
    return copy;
  }
  return [next, ...list];
}

function upsertVariant(
  variants: ContentVariant[] | undefined,
  variant: ContentVariant
): ContentVariant[] {
  const list = variants ?? [];
  const withDeactivated = variant.isActive
    ? list.map((entry) =>
        entry.platform === variant.platform && entry.id !== variant.id
          ? { ...entry, isActive: false }
          : entry
      )
    : list;
  const idx = withDeactivated.findIndex((entry) => entry.id === variant.id);
  if (idx >= 0) {
    const copy = [...withDeactivated];
    copy[idx] = variant;
    return copy;
  }
  if (variant.isActive) {
    return [variant, ...withDeactivated.filter((entry) => entry.platform !== variant.platform)];
  }
  return [variant, ...withDeactivated];
}

/**
 * Live Content Pipeline updates over WebSocket when `VITE_WS_URL` is set.
 * Returns whether the socket is healthy enough to skip REST polling.
 */
export function useRepurposeJobSocket(contentId: string | null): {
  liveUpdatesActive: boolean;
  connectionState: RepurposeWsConnectionState;
} {
  const queryClient = useQueryClient();
  const clientRef = useRef<RepurposeJobsWsClient | null>(null);
  const [connectionState, setConnectionState] =
    useState<RepurposeWsConnectionState>('disconnected');

  const wsUrl = getResolvedWsUrl();

  useEffect(() => {
    if (!contentId || !wsUrl) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setConnectionState('disconnected');
      return;
    }

    const applyJobProgress = (payload: RepurposeJobProgressPayload) => {
      const key = queryKeys.personalBranding.content.repurposeJobs(contentId);
      queryClient.setQueryData<RepurposeJob[]>(key, (prev) => upsertJob(prev, payload));
    };

    const applyVariant = (payload: RepurposeVariantCreatedPayload) => {
      if (payload.contentId !== contentId) return;
      const key = queryKeys.personalBranding.content.variants(contentId);
      queryClient.setQueryData<ContentVariant[]>(key, (prev) =>
        upsertVariant(prev, payload.variant)
      );
    };

    const client = new RepurposeJobsWsClient({
      wsBaseUrl: wsUrl,
      getAccessToken: async () => authService.getValidAccessToken(),
      onConnectionStateChange: setConnectionState,
      onJobProgress: applyJobProgress,
      onVariantCreated: applyVariant,
    });
    clientRef.current = client;

    void client
      .connect()
      .then(() => client.subscribe(contentId))
      .catch(() => {
        setConnectionState('failed');
      });

    return () => {
      client.disconnect();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [contentId, wsUrl, queryClient]);

  const liveUpdatesActive =
    Boolean(wsUrl) &&
    (connectionState === 'connected' ||
      connectionState === 'connecting' ||
      connectionState === 'reconnecting');

  return { liveUpdatesActive, connectionState };
}
