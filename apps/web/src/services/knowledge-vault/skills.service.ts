import { apiClient } from '@/lib/api-client';
import type {
  ApiResponse,
  CreateSkillInput,
  SkillTreeApiResponse,
  SkillTreeSkill,
  UpdateSkillInput,
} from '@/types/knowledge-vault';

export interface SkillVerifyResult {
  isObsolete: boolean;
  summary: string;
  confidence: number;
  suggestedActions: string[];
}

export const skillsService = {
  async getTree(): Promise<ApiResponse<SkillTreeApiResponse>> {
    const response = await apiClient.get<SkillTreeApiResponse>('/knowledge/skills');
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to load skill tree',
      success: false,
    };
  },

  async verifySkill(skillId: string): Promise<ApiResponse<SkillVerifyResult>> {
    const response = await apiClient.post<SkillVerifyResult>(
      `/knowledge/skills/${skillId}/verify`,
      {}
    );
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Verification failed',
      success: false,
    };
  },

  async createSkill(body: CreateSkillInput): Promise<ApiResponse<SkillTreeSkill>> {
    const response = await apiClient.post<SkillTreeSkill>('/knowledge/skills', body);
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to create skill',
      success: false,
    };
  },

  async updateSkill(skillId: string, body: UpdateSkillInput): Promise<ApiResponse<SkillTreeSkill>> {
    const response = await apiClient.patch<SkillTreeSkill>(`/knowledge/skills/${skillId}`, body);
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to update skill',
      success: false,
    };
  },

  async deleteSkill(skillId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/knowledge/skills/${skillId}`);
    if (response.success) {
      return { data: null, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to delete skill',
      success: false,
    };
  },
};
