import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  BrandPlatform,
  ContentStreamFeedback,
  SyncCadence,
} from '@/types/api/personal-branding.dto';

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function useContentStream(platform: BrandPlatform = 'x') {
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: queryKeys.personalBranding.contentStream.settings(platform),
    queryFn: () => personalBrandingService.getContentStreamSettings(platform),
  });

  const posts = useQuery({
    queryKey: queryKeys.personalBranding.contentStream.posts(platform, 1, 50),
    queryFn: () => personalBrandingService.listContentStreamPosts(platform, 1, 50),
  });

  const profiles = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(1, 50),
    queryFn: async () => {
      const res = await personalBrandingService.listProfiles(1, 50);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load brand profiles');
      }
      return res.data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: (body: {
      enabled?: boolean;
      xUsername?: string | null;
      brandProfileId?: string | null;
      postsPerDay?: number;
      syncCadence?: SyncCadence;
      syncStartTime?: string | null;
      syncEndTime?: string | null;
      syncTimezone?: string | null;
      syncIntervalHours?: number | null;
    }) =>
      personalBrandingService.updateContentStreamSettings(
        {
          ...body,
          syncTimezone: body.syncTimezone ?? BROWSER_TIMEZONE,
        },
        platform
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.contentStream.settings(platform),
      });
    },
  });

  const feedback = useMutation({
    mutationFn: ({
      postId,
      feedback: value,
    }: {
      postId: string;
      feedback: ContentStreamFeedback;
    }) => personalBrandingService.updateContentStreamPostFeedback(postId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.contentStream.posts(platform, 1, 50),
      });
    },
  });

  const generate = useMutation({
    mutationKey: [...queryKeys.personalBranding.contentStream.all(), 'generate', platform],
    mutationFn: (body?: { count?: number; force?: boolean }) =>
      personalBrandingService.startContentStreamGenerate({ platform, ...body }),
  });

  const clearPosts = useMutation({
    mutationFn: () => personalBrandingService.clearContentStreamPosts(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.contentStream.posts(platform, 1, 50),
      });
    },
  });

  return {
    settings,
    posts,
    profiles,
    updateSettings,
    feedback,
    generate,
    clearPosts,
  };
}

export type ContentStreamHook = ReturnType<typeof useContentStream>;
