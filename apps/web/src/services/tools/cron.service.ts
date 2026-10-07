import { apiClient } from '@/lib/api-client';

export interface CronFromEnglishResponse {
  expression: string;
}

export const cronToolsService = {
  async fromEnglish(text: string): Promise<CronFromEnglishResponse> {
    const res = await apiClient.post<CronFromEnglishResponse>('/tools/cron/from-english', { text });
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to build cron expression');
  },
};
