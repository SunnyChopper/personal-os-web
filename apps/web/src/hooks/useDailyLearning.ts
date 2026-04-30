import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { pushToastNotification } from '@/hooks/use-toast';
import { dailyLearningService } from '@/services/daily-learning.service';
import type { ApiResponse } from '@/types/api-contracts';
import type {
  AiSourceSuggestion,
  DailyLearningSettings,
  LearningSource,
  LearningSourceSuggestion,
} from '@/types/daily-learning';

function ensureData<T>(res: ApiResponse<T>, fallbackMessage: string): T {
  if (!res.success || res.data === undefined) {
    throw new Error(res.error?.message || fallbackMessage);
  }
  return res.data;
}

export function useDailyLearningSettings() {
  return useQuery({
    queryKey: queryKeys.dailyLearning.settings(),
    queryFn: async () => {
      const res = await dailyLearningService.getSettings();
      if (!res.success || !res.data)
        throw new Error(res.error?.message || 'Failed to load settings');
      return res.data.settings;
    },
  });
}

export function useUpdateDailyLearningSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: DailyLearningSettings) => {
      const res = await dailyLearningService.putSettings(settings);
      return ensureData(res, 'Failed to save settings');
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.dailyLearning.settings(), data.settings);
      pushToastNotification({
        type: 'success',
        title: 'Settings saved',
        message: 'Delivery times synced to proactive automations.',
      });
    },
    onError: (err: Error) => {
      pushToastNotification({
        type: 'error',
        title: 'Save failed',
        message: err.message,
      });
    },
  });
}

export function useDailyLearningSources() {
  return useQuery({
    queryKey: queryKeys.dailyLearning.sources(),
    queryFn: async () => {
      const res = await dailyLearningService.listSources();
      if (!res.success || !res.data)
        throw new Error(res.error?.message || 'Failed to load sources');
      return res.data.sources;
    },
  });
}

export function useDailyLearningContext() {
  return useQuery({
    queryKey: queryKeys.dailyLearning.context(),
    queryFn: async () => {
      const res = await dailyLearningService.getContext();
      if (!res.success || !res.data)
        throw new Error(res.error?.message || 'Failed to load context');
      return res.data;
    },
  });
}

export function useRegenerateDailyLearningAiSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await dailyLearningService.getContext({ regenerateAi: true });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to regenerate AI summary');
      }
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.dailyLearning.context(), data);
      pushToastNotification({
        type: 'success',
        title: 'AI summary updated',
        message: 'Your learning-focus narrative was regenerated.',
      });
    },
    onError: (err: Error) => {
      pushToastNotification({
        type: 'error',
        title: 'Regenerate failed',
        message: err.message,
      });
    },
  });
}

export function useDailyDigests(params?: { channel?: string; digestDate?: string }) {
  return useQuery({
    queryKey: queryKeys.dailyLearning.digests(params),
    queryFn: async () => {
      const res = await dailyLearningService.listDigests(params);
      if (!res.success || !res.data)
        throw new Error(res.error?.message || 'Failed to load digests');
      return res.data.digests;
    },
  });
}

export function useDailyDiscards(params?: {
  channel?: string;
  digestDate?: string;
  restored?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.dailyLearning.discards(params),
    queryFn: async () => {
      const res = await dailyLearningService.listDiscards(params);
      if (!res.success || !res.data)
        throw new Error(res.error?.message || 'Failed to load discards');
      return res.data.discards;
    },
  });
}

export function useLessonTracks() {
  return useQuery({
    queryKey: queryKeys.dailyLearning.tracks(),
    queryFn: async () => {
      const res = await dailyLearningService.listTracks();
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to load tracks');
      return res.data.tracks;
    },
  });
}

export function useCreateLearningSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Partial<LearningSource> & { name: string; kind: LearningSource['kind'] }
    ) => {
      const res = await dailyLearningService.createSource(body);
      return ensureData(res, 'Failed to add source');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.sources() });
      pushToastNotification({ type: 'success', title: 'Source added' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Source failed', message: err.message });
    },
  });
}

export function useDeleteLearningSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await dailyLearningService.deleteSource(id);
      if (!res.success) throw new Error(res.error?.message || 'Failed to delete source');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.sources() });
      pushToastNotification({ type: 'success', title: 'Source removed' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Delete failed', message: err.message });
    },
  });
}

export function useRunDailyIngest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (digestDate?: string) => {
      const res = await dailyLearningService.runIngest(digestDate);
      return ensureData(res, 'Ingest failed');
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.digests() });
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.discards() });
      pushToastNotification({
        type: 'success',
        title: 'Ingest complete',
        message: `Trends: ${data.trendsItems}, Theory: ${data.theoryItems}, Filtered out: ${data.discarded}`,
      });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Ingest failed', message: err.message });
    },
  });
}

export function useRestoreDiscard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await dailyLearningService.restoreDiscard(id);
      return ensureData(res, 'Restore failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.discards() });
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.digests() });
      pushToastNotification({ type: 'success', title: 'Item restored to digest' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Restore failed', message: err.message });
    },
  });
}

export function usePostDigestFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof dailyLearningService.postFeedback>[0]) => {
      const res = await dailyLearningService.postFeedback(body);
      return ensureData(res, 'Feedback failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.digests() });
      pushToastNotification({ type: 'success', title: 'Feedback saved' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Feedback failed', message: err.message });
    },
  });
}

export function usePivotLessonTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ trackId, userRequest }: { trackId: string; userRequest: string }) => {
      const res = await dailyLearningService.pivotTrack(trackId, userRequest);
      return ensureData(res, 'Pivot failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.tracks() });
      pushToastNotification({ type: 'success', title: 'Track updated (AI pivot)' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Pivot failed', message: err.message });
    },
  });
}

export function useCreateLessonTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      subject?: string;
      pacing?: { lessonsPerWeek: number; preferredMinutes?: number };
    }) => {
      const res = await dailyLearningService.createTrack(body);
      return ensureData(res, 'Failed to create track');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.tracks() });
      pushToastNotification({ type: 'success', title: 'Track created' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Track failed', message: err.message });
    },
  });
}

export function useSkipLessonNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ trackId, nodeId }: { trackId: string; nodeId: string }) => {
      const res = await dailyLearningService.skipNode(trackId, nodeId);
      return ensureData(res, 'Skip failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.tracks() });
      pushToastNotification({ type: 'success', title: 'Lesson skipped' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Skip failed', message: err.message });
    },
  });
}

export function useSourceSuggestions(readyOnly = false) {
  return useQuery({
    queryKey: queryKeys.dailyLearning.sourceSuggestions({ readyOnly }),
    queryFn: async () => {
      const res = await dailyLearningService.listSourceSuggestions(readyOnly);
      if (!res.success || !res.data)
        throw new Error(res.error?.message || 'Failed to load source suggestions');
      return res.data.suggestions as LearningSourceSuggestion[];
    },
  });
}

export function useSuggestSources() {
  return useMutation({
    mutationFn: async () => {
      const res = await dailyLearningService.suggestSources();
      const data = ensureData(res, 'Suggest sources failed');
      return data.suggestions;
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Suggest failed', message: err.message });
    },
  });
}

export function useAcceptAiSourceSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (suggestion: AiSourceSuggestion) => {
      const res = await dailyLearningService.acceptAiSourceSuggestion(suggestion);
      return ensureData(res, 'Add source failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.sources() });
      pushToastNotification({ type: 'success', title: 'Source added' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Add failed', message: err.message });
    },
  });
}

export function useAcceptDiscoveredSourceSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const res = await dailyLearningService.acceptDiscoveredSourceSuggestion(suggestionId);
      return ensureData(res, 'Accept suggestion failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.sources() });
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.sourceSuggestions() });
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.digests() });
      pushToastNotification({ type: 'success', title: 'Source added from discovery' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Accept failed', message: err.message });
    },
  });
}

export function useDismissSourceSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const res = await dailyLearningService.dismissSourceSuggestion(suggestionId);
      if (!res.success) throw new Error(res.error?.message || 'Dismiss failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.sourceSuggestions() });
      pushToastNotification({ type: 'success', title: 'Suggestion dismissed' });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Dismiss failed', message: err.message });
    },
  });
}

export function useDailyLearningAction() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async (opts: {
      kind: 'extract' | 'flashcards' | 'deepDive' | 'task';
      digestId: string;
      digestItemId: string;
    }) => {
      let res;
      if (opts.kind === 'extract')
        res = await dailyLearningService.actionExtract(opts.digestId, opts.digestItemId);
      else if (opts.kind === 'flashcards')
        res = await dailyLearningService.actionFlashcards(opts.digestId, opts.digestItemId);
      else if (opts.kind === 'deepDive')
        res = await dailyLearningService.actionDeepDive(opts.digestId, opts.digestItemId);
      else res = await dailyLearningService.actionTask(opts.digestId, opts.digestItemId);
      return ensureData(res, 'Action failed');
    },
    onSuccess: (data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.digests() });
      const labels: Record<typeof vars.kind, string> = {
        extract: 'Saved to Vault',
        flashcards: 'Flashcards created',
        deepDive: 'Deep dive course started',
        task: 'Task drafted',
      };
      const artifact = data.artifactId ? ` · ${data.artifactId}` : '';
      pushToastNotification({
        type: 'success',
        title: labels[vars.kind],
        message: artifact || undefined,
      });
    },
    onError: (err: Error) => {
      pushToastNotification({ type: 'error', title: 'Action failed', message: err.message });
    },
  });
  return m;
}
