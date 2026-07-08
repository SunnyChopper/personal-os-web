import { apiClient } from '@/lib/api-client';
import { withFeatureLlm } from '@/lib/llm/feature-ai-request';
import type {
  ConvertProjectLabIdeaInput,
  ConvertProjectLabIdeaResult,
  DismissProjectLabIdeaInput,
  GenerateProjectLabIdeasInput,
  GenerateProjectLabIdeasResult,
  PaginatedProjectLabIdeas,
  ProjectLabIdea,
  ProjectLabIdeaStatus,
} from '@/types/api/project-labs.dto';

function unwrap<T>(response: { success: boolean; data?: T; error?: { message?: string } }): T {
  if (response.success && response.data !== undefined) {
    return response.data;
  }
  throw new Error(response.error?.message || 'Request failed');
}

export const projectLabsService = {
  async generateIdeas(input: GenerateProjectLabIdeasInput): Promise<GenerateProjectLabIdeasResult> {
    const body = await withFeatureLlm('projectLabIdeation', { ...input });
    const res = await apiClient.post<{ data: { result: GenerateProjectLabIdeasResult } }>(
      '/knowledge/project-labs/generate',
      body
    );
    if (res.success && res.data?.data?.result) {
      return res.data.data.result;
    }
    throw new Error(res.error?.message || 'Failed to generate project ideas');
  },

  async listIdeas(
    status: ProjectLabIdeaStatus = 'GENERATED',
    page = 1,
    pageSize = 50
  ): Promise<PaginatedProjectLabIdeas> {
    const q = new URLSearchParams({
      status,
      page: String(page),
      pageSize: String(pageSize),
    });
    return unwrap(
      await apiClient.get<PaginatedProjectLabIdeas>(`/knowledge/project-labs/ideas?${q}`)
    );
  },

  async saveIdea(ideaId: string): Promise<ProjectLabIdea> {
    return unwrap(
      await apiClient.post<ProjectLabIdea>(`/knowledge/project-labs/ideas/${ideaId}/save`, {})
    );
  },

  async dismissIdea(ideaId: string, body: DismissProjectLabIdeaInput = {}): Promise<void> {
    unwrap(await apiClient.post<null>(`/knowledge/project-labs/ideas/${ideaId}/dismiss`, body));
  },

  async convertToProject(
    ideaId: string,
    body: ConvertProjectLabIdeaInput
  ): Promise<ConvertProjectLabIdeaResult> {
    return unwrap(
      await apiClient.post<ConvertProjectLabIdeaResult>(
        `/knowledge/project-labs/ideas/${ideaId}/convert-to-project`,
        body
      )
    );
  },

  async deleteIdea(ideaId: string): Promise<void> {
    const res = await apiClient.delete<null>(`/knowledge/project-labs/ideas/${ideaId}`);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to delete idea');
    }
  },
};
