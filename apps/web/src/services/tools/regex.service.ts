import { apiClient } from '@/lib/api-client';

export interface ExplainRegexResponse {
  explanationMarkdown: string;
}

export const regexToolsService = {
  async explain(pattern: string, flags?: string): Promise<ExplainRegexResponse> {
    const res = await apiClient.post<ExplainRegexResponse>('/tools/regex/explain', {
      pattern,
      flags: flags || undefined,
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to explain regex');
  },
};
