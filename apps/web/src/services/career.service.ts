import { apiClient } from '@/lib/api-client';
import type {
  CareerAchievement,
  CareerAiSuggestion,
  CareerApplicationAnalytics,
  CareerApplicationDetail,
  CareerApplicationsListResult,
  CareerEducation,
  CareerGeneratedResume,
  CareerGeneratedResumeListParams,
  CareerGeneratedResumeListResult,
  CareerResumeAtsScorePreview,
  CareerJob,
  CareerJobPosting,
  CareerJobPostingIngestResult,
  CareerJobPostingListResult,
  CareerJobPostingPatchRequest,
  CareerJobPostingPreview,
  CareerJobScrapeRunDetail,
  CareerJobScrapeRunListResult,
  CareerJobScrapeRunStartResult,
  CareerProfile,
  CareerRecommendApplicationsResult,
  CareerResumeExportFormat,
  CareerResumeExportResult,
  CareerResumeTemplate,
  CareerResumeTemplateImportResult,
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

/** Application tracker sub-router */
const APPLICATIONS_BASE = `${BASE}/applications`;

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

  async patchEducation(
    educationId: string,
    body: Record<string, unknown>
  ): Promise<CareerEducation> {
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

  async createAchievement(
    jobId: string,
    body: Record<string, unknown>
  ): Promise<CareerAchievement> {
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

  async rejectSuggestion(
    suggestionId: string,
    feedback?: string | null
  ): Promise<CareerAiSuggestion> {
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

  async previewJobPosting(body: {
    sourceUrl?: string | null;
    rawText?: string | null;
    rawHtml?: string | null;
    inputKind?: string | null;
    provider?: string | null;
    companySlug?: string | null;
    boardId?: string | null;
    externalJobId?: string | null;
  }): Promise<CareerJobPostingPreview> {
    return unwrap(apiClient.post<CareerJobPostingPreview>(`${BASE}/job-postings/preview`, body));
  },

  async ingestJobPosting(body: {
    sourceUrl?: string | null;
    rawText?: string | null;
    rawHtml?: string | null;
    inputKind?: string | null;
    provider?: string | null;
    companySlug?: string | null;
    boardId?: string | null;
    externalJobId?: string | null;
    saveEvenIfLowConfidence?: boolean;
  }): Promise<CareerJobPostingIngestResult> {
    return unwrap(apiClient.post<CareerJobPostingIngestResult>(`${BASE}/job-postings`, body));
  },

  async listJobPostings(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
    provider?: string;
    company?: string;
    sourceId?: string;
    fitStatus?: string;
    search?: string;
    scrapeRunId?: string;
    origin?: string;
  }): Promise<CareerJobPostingListResult> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    if (params?.provider) q.set('provider', params.provider);
    if (params?.company) q.set('company', params.company);
    if (params?.sourceId) q.set('sourceId', params.sourceId);
    if (params?.fitStatus) q.set('fitStatus', params.fitStatus);
    if (params?.search) q.set('search', params.search);
    if (params?.scrapeRunId) q.set('scrapeRunId', params.scrapeRunId);
    if (params?.origin) q.set('origin', params.origin);
    const qs = q.toString();
    return unwrap(
      apiClient.get<CareerJobPostingListResult>(`${BASE}/job-postings${qs ? `?${qs}` : ''}`)
    );
  },

  async getJobPosting(postingId: string): Promise<CareerJobPosting> {
    return unwrap(
      apiClient.get<CareerJobPosting>(`${BASE}/job-postings/${encodeURIComponent(postingId)}`)
    );
  },

  async updateJobPosting(
    postingId: string,
    body: CareerJobPostingPatchRequest
  ): Promise<CareerJobPosting> {
    return unwrap(
      apiClient.patch<CareerJobPosting>(
        `${BASE}/job-postings/${encodeURIComponent(postingId)}`,
        body
      )
    );
  },

  async startJobScrapeRun(body?: { sourceIds?: string[] }): Promise<CareerJobScrapeRunStartResult> {
    return unwrap(
      apiClient.post<CareerJobScrapeRunStartResult>(`${BASE}/job-scrape-runs`, body ?? {})
    );
  },

  async listJobScrapeRuns(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<CareerJobScrapeRunListResult> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    const qs = q.toString();
    return unwrap(
      apiClient.get<CareerJobScrapeRunListResult>(`${BASE}/job-scrape-runs${qs ? `?${qs}` : ''}`)
    );
  },

  async getJobScrapeRun(runId: string): Promise<CareerJobScrapeRunDetail> {
    return unwrap(
      apiClient.get<CareerJobScrapeRunDetail>(
        `${BASE}/job-scrape-runs/${encodeURIComponent(runId)}`
      )
    );
  },

  async generateResume(body: {
    jobPostingId?: string | null;
    rawJobPostingText?: string | null;
    selectedAchievementIds?: string[] | null;
    tone?: string | null;
    resumeTemplate?: string | null;
    provider?: string | null;
    model?: string | null;
    companyName?: string | null;
    jobTitle?: string | null;
  }) {
    return unwrap(apiClient.post<CareerGeneratedResume>(`${BASE}/generate`, body));
  },

  async previewAtsScore(body: {
    jobPostingId?: string | null;
    rawJobPostingText?: string | null;
    selectedAchievementIds?: string[] | null;
  }): Promise<CareerResumeAtsScorePreview> {
    return unwrap(apiClient.post<CareerResumeAtsScorePreview>(`${BASE}/ats-score/preview`, body));
  },

  async editGeneratedResumeSections(
    resumeId: string,
    body: {
      edits: { sectionId: string; contentMarkdown: string }[];
      revision?: number | null;
    }
  ): Promise<CareerGeneratedResume> {
    return unwrap(
      apiClient.patch<CareerGeneratedResume>(
        `${BASE}/generated/${encodeURIComponent(resumeId)}/sections`,
        body
      )
    );
  },

  async regenerateGeneratedResumeSection(
    resumeId: string,
    body: {
      sectionId: string;
      instructions?: string | null;
      provider?: string | null;
      model?: string | null;
      allowedAchievementIds?: string[] | null;
    }
  ): Promise<CareerGeneratedResume> {
    return unwrap(
      apiClient.post<CareerGeneratedResume>(
        `${BASE}/generated/${encodeURIComponent(resumeId)}/sections/regenerate`,
        body
      )
    );
  },

  async parseResumePdf(file: File): Promise<{ text: string; truncated: boolean }> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.postFormData<{ text: string; truncated: boolean }>(
      `${BASE}/parse-pdf`,
      form
    );
    if (!res.success || res.data == null) {
      throw new Error(res.error?.message || 'PDF parse failed');
    }
    return res.data;
  },

  async listGenerated(
    params?: CareerGeneratedResumeListParams
  ): Promise<CareerGeneratedResumeListResult> {
    const sp = new URLSearchParams();
    sp.set('page', String(Math.max(1, params?.page ?? 1)));
    sp.set('pageSize', String(Math.min(100, Math.max(1, params?.pageSize ?? 20))));
    sp.set('sortBy', params?.sortBy ?? 'createdAt');
    sp.set('sortOrder', params?.sortOrder ?? 'desc');
    if (params?.search?.trim()) sp.set('search', params.search.trim());
    return unwrap(
      apiClient.get<CareerGeneratedResumeListResult>(`${BASE}/generated?${sp.toString()}`)
    );
  },

  async getGenerated(resumeId: string): Promise<CareerGeneratedResume> {
    return unwrap(
      apiClient.get<CareerGeneratedResume>(`${BASE}/generated/${encodeURIComponent(resumeId)}`)
    );
  },

  async listResumeTemplates(): Promise<{ items: CareerResumeTemplate[] }> {
    return unwrap(apiClient.get<{ items: CareerResumeTemplate[] }>(`${BASE}/templates`));
  },

  async getResumeTemplate(templateId: string): Promise<CareerResumeTemplate> {
    return unwrap(
      apiClient.get<CareerResumeTemplate>(`${BASE}/templates/${encodeURIComponent(templateId)}`)
    );
  },

  async importResumeTemplate(
    file: File,
    opts?: { sourceFormat?: string | null; description?: string | null }
  ): Promise<CareerResumeTemplateImportResult> {
    const form = new FormData();
    form.append('file', file);
    const q = new URLSearchParams();
    if (opts?.sourceFormat) q.set('sourceFormat', opts.sourceFormat);
    if (opts?.description) q.set('description', opts.description);
    const qs = q.toString();
    return unwrap(
      apiClient.postFormData<CareerResumeTemplateImportResult>(
        `${BASE}/templates/import${qs ? `?${qs}` : ''}`,
        form
      )
    );
  },

  async patchResumeTemplate(
    templateId: string,
    body: { name?: string | null; description?: string | null; archived?: boolean | null }
  ): Promise<CareerResumeTemplate> {
    return unwrap(
      apiClient.patch<CareerResumeTemplate>(
        `${BASE}/templates/${encodeURIComponent(templateId)}`,
        body
      )
    );
  },

  async deleteResumeTemplate(templateId: string): Promise<void> {
    await unwrap(apiClient.delete(`${BASE}/templates/${encodeURIComponent(templateId)}`));
  },

  async exportGeneratedResume(
    resumeId: string,
    body: { format: CareerResumeExportFormat; templateId?: string | null }
  ): Promise<CareerResumeExportResult> {
    return unwrap(
      apiClient.post<CareerResumeExportResult>(
        `${BASE}/generated/${encodeURIComponent(resumeId)}/exports`,
        body
      )
    );
  },

  /** Application tracking (`/applications/*`) */

  async recommendApplications(body: {
    sourceUrl?: string | null;
    rawText?: string | null;
    jobPostingId?: string | null;
    generatedResumeId?: string | null;
    resumeSnapshotName?: string | null;
    resumeSnapshotText?: string | null;
    provider?: string | null;
    model?: string | null;
  }): Promise<CareerRecommendApplicationsResult> {
    return unwrap(
      apiClient.post<CareerRecommendApplicationsResult>(`${APPLICATIONS_BASE}/recommend`, body)
    );
  },

  async getApplicationAnalytics(): Promise<CareerApplicationAnalytics> {
    return unwrap(apiClient.get<CareerApplicationAnalytics>(`${APPLICATIONS_BASE}/analytics`));
  },

  async listApplications(params?: {
    page?: number;
    pageSize?: number;
    status?: string | null;
    search?: string | null;
    includeArchived?: boolean;
    jobPostingId?: string | null;
    generatedResumeId?: string | null;
  }): Promise<CareerApplicationsListResult> {
    const sp = new URLSearchParams();
    sp.set('page', String(Math.max(1, params?.page ?? 1)));
    sp.set('pageSize', String(Math.min(100, Math.max(1, params?.pageSize ?? 20))));
    if (params?.status) sp.set('status', params.status);
    if (params?.search) sp.set('search', params.search);
    if (params?.includeArchived) sp.set('includeArchived', 'true');
    if (params?.jobPostingId) sp.set('jobPostingId', params.jobPostingId);
    if (params?.generatedResumeId) sp.set('generatedResumeId', params.generatedResumeId);
    return unwrap(
      apiClient.get<CareerApplicationsListResult>(`${APPLICATIONS_BASE}?${sp.toString()}`)
    );
  },

  async createApplication(body: Record<string, unknown>): Promise<CareerApplicationDetail> {
    return unwrap(apiClient.post<CareerApplicationDetail>(APPLICATIONS_BASE, body));
  },

  async getApplication(applicationId: string): Promise<CareerApplicationDetail> {
    return unwrap(
      apiClient.get<CareerApplicationDetail>(
        `${APPLICATIONS_BASE}/${encodeURIComponent(applicationId)}`
      )
    );
  },

  async patchApplication(
    applicationId: string,
    body: Record<string, unknown>
  ): Promise<CareerApplicationDetail> {
    return unwrap(
      apiClient.patch<CareerApplicationDetail>(
        `${APPLICATIONS_BASE}/${encodeURIComponent(applicationId)}`,
        body
      )
    );
  },

  async addApplicationEvent(
    applicationId: string,
    body: Record<string, unknown>
  ): Promise<CareerApplicationDetail> {
    return unwrap(
      apiClient.post<CareerApplicationDetail>(
        `${APPLICATIONS_BASE}/${encodeURIComponent(applicationId)}/events`,
        body
      )
    );
  },

  async applicationRejectionInsights(
    applicationId: string,
    body: {
      rejectionEmailText: string;
      eventId?: string | null;
      rejectionReasonCategory?: string | null;
      provider?: string | null;
      model?: string | null;
    }
  ): Promise<CareerApplicationDetail> {
    return unwrap(
      apiClient.post<CareerApplicationDetail>(
        `${APPLICATIONS_BASE}/${encodeURIComponent(applicationId)}/rejection-insights`,
        body
      )
    );
  },
};
