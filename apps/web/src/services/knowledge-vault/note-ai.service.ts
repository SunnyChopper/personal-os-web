import type { ApiResponse } from '@/types/api-contracts';
import { apiClient } from '@/lib/api-client';
import { llmLogger } from '@/lib/logger';
import type { Area } from '@/types/growth-system';
import type {
  ExpandContentOutput,
  SummarizeContentOutput,
  ImproveClarityOutput,
  TagSuggestionsOutput,
  AreaSuggestionOutput,
  GenerateContentOutput,
  ContentAnalysisOutput,
} from '@/lib/llm/schemas/note-ai-schemas';

interface AIResponse<T> {
  result: T;
  confidence: number;
  reasoning?: string;
  provider?: string;
  model?: string;
  cached?: boolean;
}

export const noteAIService = {
  /**
   * Expand and elaborate on note content
   */
  async expandContent(
    content: string,
    context?: { title?: string; area?: Area }
  ): Promise<ApiResponse<ExpandContentOutput>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<ExpandContentOutput> }>(
        '/ai/notes/expand',
        {
          content,
          title: context?.title,
          area: context?.area,
        }
      );

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to expand content',
          code: 'EXPAND_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error expanding content', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to expand content',
          code: 'EXPAND_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Summarize note content into key points
   */
  async summarizeContent(content: string): Promise<ApiResponse<SummarizeContentOutput>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<SummarizeContentOutput> }>(
        '/ai/notes/summarize',
        { content }
      );

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to summarize content',
          code: 'SUMMARIZE_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error summarizing content', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to summarize content',
          code: 'SUMMARIZE_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Improve clarity and readability of note content
   */
  async improveClarity(content: string): Promise<ApiResponse<ImproveClarityOutput>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<ImproveClarityOutput> }>(
        '/ai/notes/improve',
        { content }
      );

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to improve content',
          code: 'IMPROVE_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error improving clarity', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to improve content',
          code: 'IMPROVE_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Suggest relevant tags based on content
   */
  async suggestTags(
    content: string,
    title: string,
    existingTags: string[] = []
  ): Promise<ApiResponse<TagSuggestionsOutput>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<TagSuggestionsOutput> }>(
        '/ai/notes/suggest-tags',
        {
          content,
          title,
          existingTags,
        }
      );

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to suggest tags',
          code: 'TAG_SUGGESTION_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error suggesting tags', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to suggest tags',
          code: 'TAG_SUGGESTION_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Suggest appropriate area for the note
   */
  async suggestArea(content: string, title: string): Promise<ApiResponse<AreaSuggestionOutput>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<AreaSuggestionOutput> }>(
        '/ai/notes/suggest-area',
        { content, title }
      );

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to suggest area',
          code: 'AREA_SUGGESTION_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error suggesting area', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to suggest area',
          code: 'AREA_SUGGESTION_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Generate content from title and area
   */
  async generateFromTitle(title: string, area: Area): Promise<ApiResponse<GenerateContentOutput>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<GenerateContentOutput> }>(
        '/ai/notes/generate',
        { title, area }
      );

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to generate content',
          code: 'CONTENT_GENERATION_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error generating content', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate content',
          code: 'CONTENT_GENERATION_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Analyze note content for key points, sentiment, and completeness
   */
  async analyzeContent(
    content: string,
    title: string
  ): Promise<ApiResponse<ContentAnalysisOutput>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<ContentAnalysisOutput> }>(
        '/ai/notes/analyze',
        { content, title }
      );

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to analyze content',
          code: 'CONTENT_ANALYSIS_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error analyzing content', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to analyze content',
          code: 'CONTENT_ANALYSIS_ERROR',
        },
        success: false,
      };
    }
  },
};
