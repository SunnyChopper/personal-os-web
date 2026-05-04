import { apiClient } from '@/lib/api-client';
import type {
  CareerAchievement,
  CareerAiSuggestion,
  CareerEducation,
  CareerGeneratedResume,
  CareerJob,
  CareerJobPosting,
  CareerProfile,
} from '@/types/api/career.types';

async function unwrap<T>(
  p: Promise<{ success: boolean; data?: T; error?: { message?: string } }>
): Promise<T> {
  const res = await p;
  if (!res.success || res.data == null) {
    throw new Error(res.error?.message || 'Career resume request failed');
  }
  return res.data;
}

/** Base prefix for Postgres-backed Career API (mounted at `/career`, router `/resume`). */
const BASE = '/career/resume';

export const careerService = {
  async getProfile(): Promise<CareerProfile> {
    return unwrap(apiClient.get<CareerProfile>(`${BASE}/profile`));
  },

  async patchProfile(body: Record<string, unknown>): Promise<CareerProfile> {
    return unwrap(apiClient.patch<CareerProfile>(`${BASE}/profile`, body));
  },

  async listEducation(): Promise<{ items: CareerEducation[] }> {
    return unwrap(apiClient.get<{ items: CareerEducation[] }>(`${BASE}/education`));
  },

  async createEducation(body: Record<string, unknown>): Promise<CareerEducation> {
    return unwrap(apiClient.post<CareerEducation>(`${BASE}/education`, body));
  },

  async patchEducation(educationId: string, body: Record<string, unknown>): Promise<CareerEducation> {
    return unwrap(
      apiClient.patch<CareerEducation>(`${BASE}/education/${encodeURIComponent(educationId)}`, body)
    );
  },

  async deleteEducation(educationId: string): Promise<void> {
    await unwrap(apiClient.delete<null>(`${BASE}/education/${encodeURIComponent(educationId)}`));
  },

  async listJobs(): Promise<{ items: CareerJob[] }> {
    return unwrap(apiClient.get<{ items: CareerJob[] }>(`${BASE}/jobs`));
  },

  async createJob(body: Record<string, unknown>): Promise<CareerJob> {
    return unwrap(apiClient.post<CareerJob>(`${BASE}/jobs`, body));
  },

  async patchJob(jobId: string, body: Record<string, unknown>): Promise<CareerJob> {
    return unwrap(apiClient.patch<CareerJob>(`${BASE}/jobs/${encodeURIComponent(jobId)}`, body));
  },

  async deleteJob(jobId: string): Promise<void> {
    await unwrap(apiClient.delete<null>(`${BASE}/jobs/${encodeURIComponent(jobId)}`));
  },

  async createAchievement(jobId: string, body: Record<string, unknown>): Promise<CareerAchievement> {
    return unwrap(
      apiClient.post<CareerAchievement>(
        `${BASE}/jobs/${encodeURIComponent(jobId)}/achievements`,
        body
      )
    );
  },

  async patchAchievement(
    jobId: string,
    achievementId: string,
    body: Record<string, unknown>
  ): Promise<CareerAchievement> {
    return unwrap(
      apiClient.patch<CareerAchievement>(
        `${BASE}/jobs/${encodeURIComponent(jobId)}/achievements/${encodeURIComponent(achievementId)}`,
        body
      )
    );
  },

  async deleteAchievement(jobId: string, achievementId: string): Promise<void> {
    await unwrap(
      apiClient.delete<null>(
        `${BASE}/jobs/${encodeURIComponent(jobId)}/achievements/${encodeURIComponent(achievementId)}`
      )
    );
  },

  async aiTagsForJob(
    jobId: string,
    body?: { provider?: string | null; model?: string | null }
  ): Promise<{ suggestion: CareerAiSuggestion }> {
    return unwrap(
      apiClient.post<{ suggestion: CareerAiSuggestion }>(
        `${BASE}/jobs/${encodeURIComponent(jobId)}/ai/tags`,
        body ?? {}
      )
    );
  },

  async aiBrainstormAchievements(
    jobId: string,
    body?: { feedback?: string | null; provider?: string | null; model?: string | null }
  ): Promise<{ suggestions: CareerAiSuggestion[] }> {
    return unwrap(
      apiClient.post<{ suggestions: CareerAiSuggestion[] }>(
        `${BASE}/jobs/${encodeURIComponent(jobId)}/ai/achievements/brainstorm`,
        body ?? {}
      )
    );
  },

  async listSuggestions(params?: {
    jobId?: string | null;
    status?: string | null;
  }): Promise<{ items: CareerAiSuggestion[] }> {
    const sp = new URLSearchParams();
    if (params?.jobId) sp.set('jobId', params.jobId);
    if (params?.status) sp.set('status', params.status);
    const q = sp.toString();
    const url = q ? `${BASE}/suggestions?${q}` : `${BASE}/suggestions`;
    return unwrap(apiClient.get<{ items: CareerAiSuggestion[] }>(url));
  },

  async acceptSuggestion(suggestionId: string): Promise<CareerAiSuggestion> {
    return unwrap(
      apiClient.post<CareerAiSuggestion>(
        `${BASE}/suggestions/${encodeURIComponent(suggestionId)}/accept`,
        {}
      )
    );
  },

  async rejectSuggestion(suggestionId: string, feedback?: string | null): Promise<CareerAiSuggestion> {
    return unwrap(
      apiClient.post<CareerAiSuggestion>(
        `${BASE}/suggestions/${encodeURIComponent(suggestionId)}/reject`,
        { feedback: feedback ?? null }
      )
    );
  },

  async patchSuggestion(
    suggestionId: string,
    body: {
      suggestedText?: string | null;
      suggestedTags?: string[] | null;
      rationale?: string | null;
    }
  ): Promise<CareerAiSuggestion> {
    return unwrap(
      apiClient.patch<CareerAiSuggestion>(
        `${BASE}/suggestions/${encodeURIComponent(suggestionId)}`,
        body
      )
    );
  },

  async reviseSuggestion(
    suggestionId: string,
    body?: { feedback?: string | null; provider?: string | null; model?: string | null }
  ): Promise<CareerAiSuggestion> {
    return unwrap(
      apiClient.post<CareerAiSuggestion>(
        `${BASE}/suggestions/${encodeURIComponent(suggestionId)}/revise`,
        body ?? {}
      )
    );
  },

  async analyzeJobPosting(body: { sourceUrl?: string | null; rawText?: string | null }) {
    return unwrap(apiClient.post<CareerJobPosting>(`${BASE}/job-postings/analyze`, body));
  },

  async generateResume(body: {
    jobPostingId?: string | null;
    rawJobPostingText?: string | null;
    selectedAchievementIds?: string[] | null;
    tone?: string | null;
    resumeTemplate?: string | null;
    provider?: string | null;
    model?: string | null;
  }) {
    return unwrap(apiClient.post<CareerGeneratedResume>(`${BASE}/generate`, body));
  },

  async listGenerated(limit?: number): Promise<{ items: CareerGeneratedResume[] }> {
    const q = typeof limit === 'number' ? `?limit=${encodeURIComponent(String(limit))}` : '';
    return unwrap(apiClient.get<{ items: CareerGeneratedResume[] }>(`${BASE}/generated${q}`));
  },

  async getGenerated(resumeId: string): Promise<CareerGeneratedResume> {
    return unwrap(
      apiClient.get<CareerGeneratedResume>(`${BASE}/generated/${encodeURIComponent(resumeId)}`)
    );
  },
};
