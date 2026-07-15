import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  CreateConnectionInteractionInput,
  CreateCreatorConnectionInput,
  CreateTrackingMetricInput,
  RolodexResponseVectorInput,
  ContentOpportunitySearchInput,
  UpdateCreatorConnectionInput,
  UpdateTrackingMetricInput,
} from '@/types/api/personal-branding.dto';

/**
 * React Query bundle for Rolodex (connections, interactions, tracking metrics).
 */
export function useRolodex() {
  const qc = useQueryClient();

  const invalidateConnections = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.personalBranding.connections.all() }),
    [qc]
  );

  const invalidateInteractions = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.personalBranding.interactions.all() }),
    [qc]
  );

  const connections = useQuery({
    queryKey: queryKeys.personalBranding.connections.list(),
    queryFn: async () => {
      const res = await personalBrandingService.listCreatorConnections();
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load connections');
      return res.data;
    },
  });

  const interactionsBoard = useQuery({
    queryKey: queryKeys.personalBranding.interactions.board(),
    queryFn: async () => {
      const res = await personalBrandingService.listInteractionsBoard();
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load interactions');
      return res.data;
    },
  });

  const trackingMetrics = useQuery({
    queryKey: queryKeys.personalBranding.trackingMetrics.list(),
    queryFn: async () => {
      const res = await personalBrandingService.listTrackingMetrics();
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load metrics');
      return res.data;
    },
  });

  const createConnection = useMutation({
    mutationFn: (body: CreateCreatorConnectionInput) =>
      personalBrandingService.createCreatorConnection(body),
    onSuccess: () => {
      void invalidateConnections();
    },
  });

  const updateConnection = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCreatorConnectionInput }) =>
      personalBrandingService.updateCreatorConnection(id, body),
    onSuccess: () => {
      void invalidateConnections();
    },
  });

  const deleteConnection = useMutation({
    mutationFn: (id: string) => personalBrandingService.deleteCreatorConnection(id),
    onSuccess: () => {
      void invalidateConnections();
    },
  });

  const logInteraction = useMutation({
    mutationFn: ({
      connectionId,
      body,
    }: {
      connectionId: string;
      body: CreateConnectionInteractionInput;
    }) => personalBrandingService.createConnectionInteraction(connectionId, body),
    onSuccess: () => {
      void invalidateConnections();
      void invalidateInteractions();
    },
  });

  const createTrackingMetric = useMutation({
    mutationFn: (body: CreateTrackingMetricInput) =>
      personalBrandingService.createTrackingMetric(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.trackingMetrics.all() });
    },
  });

  const updateTrackingMetric = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTrackingMetricInput }) =>
      personalBrandingService.updateTrackingMetric(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.trackingMetrics.all() });
    },
  });

  const generateResponseVectors = useMutation({
    mutationFn: (body: RolodexResponseVectorInput) =>
      personalBrandingService.generateRolodexResponseVectors(body),
  });

  const searchContentOpportunity = useMutation({
    mutationFn: ({
      connectionId,
      body,
    }: {
      connectionId: string;
      body?: ContentOpportunitySearchInput;
    }) => personalBrandingService.searchConnectionContentOpportunity(connectionId, body),
  });

  const updateContentOpportunity = useMutation({
    mutationFn: ({
      opportunityId,
      status,
    }: {
      opportunityId: string;
      status: 'DISMISSED' | 'ACTIONED';
    }) => personalBrandingService.updateContentOpportunity(opportunityId, status),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.personalBranding.contentOpportunities.all(),
      });
    },
  });

  return {
    connections,
    interactionsBoard,
    trackingMetrics,
    createConnection,
    updateConnection,
    deleteConnection,
    logInteraction,
    createTrackingMetric,
    updateTrackingMetric,
    generateResponseVectors,
    searchContentOpportunity,
    updateContentOpportunity,
  };
}
