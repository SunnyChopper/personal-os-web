import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type {
  AiSourceSuggestion,
  DailyDigest,
  DailyLearningContextPayload,
  DailyLearningSettings,
  DiscardLogEntry,
  IngestRunResult,
  LearningSource,
  LearningSourceSuggestion,
  LessonTrack,
} from '@/types/daily-learning';

export const dailyLearningService = {
  async getSettings(): Promise<ApiResponse<{ settings: DailyLearningSettings }>> {
    return apiClient.get('/daily-learning/settings');
  },

  async putSettings(
    settings: DailyLearningSettings
  ): Promise<ApiResponse<{ settings: DailyLearningSettings }>> {
    return apiClient.put('/daily-learning/settings', { settings });
  },

  async listSources(): Promise<ApiResponse<{ sources: LearningSource[] }>> {
    return apiClient.get('/daily-learning/sources');
  },

  async createSource(
    body: Partial<LearningSource> & { name: string; kind: LearningSource['kind'] }
  ) {
    return apiClient.post<LearningSource>('/daily-learning/sources', body);
  },

  async patchSource(id: string, body: Partial<LearningSource>) {
    return apiClient.patch<LearningSource>(`/daily-learning/sources/${id}`, body);
  },

  async deleteSource(id: string) {
    return apiClient.delete(`/daily-learning/sources/${id}`);
  },

  async suggestSources(): Promise<ApiResponse<{ suggestions: AiSourceSuggestion[] }>> {
    return apiClient.post('/daily-learning/sources/suggest', {});
  },

  async acceptAiSourceSuggestion(suggestion: AiSourceSuggestion) {
    return apiClient.post<LearningSource>('/daily-learning/sources/suggest/accept', {
      suggestion,
    });
  },

  async listSourceSuggestions(
    readyOnly = false
  ): Promise<ApiResponse<{ suggestions: LearningSourceSuggestion[] }>> {
    const q = readyOnly ? '?readyOnly=true' : '';
    return apiClient.get(`/daily-learning/source-suggestions${q}`);
  },

  async acceptDiscoveredSourceSuggestion(suggestionId: string) {
    return apiClient.post<LearningSource>(
      `/daily-learning/source-suggestions/${encodeURIComponent(suggestionId)}/accept`,
      {}
    );
  },

  async dismissSourceSuggestion(suggestionId: string) {
    return apiClient.post(
      `/daily-learning/source-suggestions/${encodeURIComponent(suggestionId)}/dismiss`,
      {}
    );
  },

  async getContext(opts?: {
    regenerateAi?: boolean;
  }): Promise<ApiResponse<DailyLearningContextPayload>> {
    const q = opts?.regenerateAi === true ? '?regenerateAi=true' : '';
    return apiClient.get(`/daily-learning/context${q}`);
  },

  async runIngest(digestDate?: string): Promise<ApiResponse<IngestRunResult>> {
    const q = digestDate ? `?digestDate=${encodeURIComponent(digestDate)}` : '';
    return apiClient.post(`/daily-learning/ingest/run${q}`, {});
  },

  async listDigests(params?: {
    channel?: string;
    digestDate?: string;
  }): Promise<ApiResponse<{ digests: DailyDigest[] }>> {
    const sp = new URLSearchParams();
    if (params?.channel) sp.set('channel', params.channel);
    if (params?.digestDate) sp.set('digestDate', params.digestDate);
    const q = sp.toString() ? `?${sp}` : '';
    return apiClient.get(`/daily-learning/digests${q}`);
  },

  async listDiscards(params?: {
    channel?: string;
    digestDate?: string;
    restored?: boolean;
  }): Promise<ApiResponse<{ discards: DiscardLogEntry[] }>> {
    const sp = new URLSearchParams();
    if (params?.channel) sp.set('channel', params.channel);
    if (params?.digestDate) sp.set('digestDate', params.digestDate);
    if (params?.restored !== undefined) sp.set('restored', String(params.restored));
    const q = sp.toString() ? `?${sp}` : '';
    return apiClient.get(`/daily-learning/discards${q}`);
  },

  async restoreDiscard(id: string) {
    return apiClient.post<{ digest: DailyDigest; discard: DiscardLogEntry }>(
      `/daily-learning/discards/${id}/restore`,
      {}
    );
  },

  async postFeedback(body: {
    digestId: string;
    digestItemId: string;
    feedbackType: string;
    topicKeys?: string[];
    sourceId?: string | null;
  }) {
    return apiClient.post<DailyDigest>('/daily-learning/feedback', body);
  },

  async listTracks(): Promise<ApiResponse<{ tracks: LessonTrack[] }>> {
    return apiClient.get('/daily-learning/lesson-tracks');
  },

  async createTrack(body: {
    title: string;
    subject?: string;
    pacing?: { lessonsPerWeek: number; preferredMinutes?: number };
  }) {
    return apiClient.post<LessonTrack>('/daily-learning/lesson-tracks', body);
  },

  async patchTrack(id: string, body: Partial<LessonTrack>) {
    return apiClient.patch<LessonTrack>(`/daily-learning/lesson-tracks/${id}`, body);
  },

  async reorderTrack(id: string, nodeOrder: string[]) {
    return apiClient.post<LessonTrack>(`/daily-learning/lesson-tracks/${id}/reorder`, {
      nodeOrder,
    });
  },

  async skipNode(trackId: string, nodeId: string) {
    return apiClient.post<LessonTrack>(`/daily-learning/lesson-tracks/${trackId}/skip`, { nodeId });
  },

  async pivotTrack(trackId: string, userRequest: string) {
    return apiClient.post<LessonTrack>(`/daily-learning/lesson-tracks/${trackId}/pivot`, {
      userRequest,
    });
  },

  async actionExtract(digestId: string, digestItemId: string) {
    return apiClient.post<{ artifactId?: string | null }>(`/daily-learning/actions/extract-vault`, {
      digestId,
      digestItemId,
    });
  },

  async actionFlashcards(digestId: string, digestItemId: string, count = 5) {
    return apiClient.post<{ artifactId?: string | null }>(`/daily-learning/actions/flashcards`, {
      digestId,
      digestItemId,
      count,
    });
  },

  async actionDeepDive(digestId: string, digestItemId: string, targetDifficulty = 'intermediate') {
    return apiClient.post<{ artifactId?: string | null }>(`/daily-learning/actions/deep-dive`, {
      digestId,
      digestItemId,
      targetDifficulty,
    });
  },

  async actionTask(digestId: string, digestItemId: string) {
    return apiClient.post<{ artifactId?: string | null }>(`/daily-learning/actions/task`, {
      digestId,
      digestItemId,
    });
  },
};
