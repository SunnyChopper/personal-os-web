import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  UpdateFollowSuggestionInput,
  UpdateReconFeedSettingsInput,
  UpdateReconPostInput,
} from '@/types/api/personal-branding.dto';

/**
 * React Query bundle for Rolodex Recon Feed (settings, posts, follow suggestions, runs).
 */
export function useReconFeed() {
  const qc = useQueryClient();

  const invalidateAll = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.personalBranding.reconFeed.all() }),
    [qc]
  );

  const settings = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.settings(),
    queryFn: async () => {
      const res = await personalBrandingService.getReconFeedSettings();
      return res;
    },
  });

  const posts = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.posts(),
    queryFn: async () => {
      const res = await personalBrandingService.listReconPosts();
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load recon posts');
      return res.data;
    },
  });

  const followSuggestions = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.followSuggestions('NEW'),
    queryFn: async () => {
      const res = await personalBrandingService.listFollowSuggestions(1, 50, 'NEW');
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load follow suggestions');
      return res.data;
    },
  });

  const runs = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.runs(),
    queryFn: async () => {
      const res = await personalBrandingService.listReconRuns();
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load recon runs');
      return res.data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: (body: UpdateReconFeedSettingsInput) =>
      personalBrandingService.updateReconFeedSettings(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.reconFeed.settings() });
    },
  });

  const updatePost = useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: UpdateReconPostInput }) =>
      personalBrandingService.updateReconPost(postId, body),
    onSuccess: () => {
      void invalidateAll();
    },
  });

  const updateFollowSuggestion = useMutation({
    mutationFn: ({
      suggestionId,
      body,
    }: {
      suggestionId: string;
      body: UpdateFollowSuggestionInput;
    }) => personalBrandingService.updateFollowSuggestion(suggestionId, body),
    onSuccess: () => {
      void invalidateAll();
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.connections.all() });
    },
  });

  const startRun = useMutation({
    mutationFn: () => personalBrandingService.startReconRun(),
    onSuccess: () => {
      void invalidateAll();
    },
  });

  return {
    settings,
    posts,
    followSuggestions,
    runs,
    updateSettings,
    updatePost,
    updateFollowSuggestion,
    startRun,
  };
}
