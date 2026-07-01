import { apiClient } from '@/lib/api-client';
import { llmLogger } from '@/lib/logger';
import type { PracticeQuestion, PracticeSourceScope } from '@/types/knowledge-vault';
import type { ApiResponse } from '@/types/api-contracts';
import { withNoteAIModel } from './note-ai-options';

interface AIResponse<T> {
  result: T;
  confidence: number;
  provider?: string;
  model?: string;
  cached?: boolean;
}

export interface GeneratedPracticePayload {
  title: string;
  questions: PracticeQuestion[];
  difficulty: string;
  sourceScope: PracticeSourceScope;
}

export interface GeneratedQuizPayload extends GeneratedPracticePayload {
  adaptiveContextSummary?: string;
  timeLimitMinutes?: number;
}

export interface GeneratedHomeworkPayload {
  title: string;
  prompt: string;
  deliverables: string[];
  rubric?: string | null;
  suggestedDueDate?: string | null;
  estimatedMinutes?: number;
  sourceScope: PracticeSourceScope;
}

async function unwrap<T>(
  response: ApiResponse<{ data: AIResponse<T> } | null>
): Promise<{ success: boolean; data: T | null; error: string | null }> {
  const nested = response.data?.data?.result;
  if (response.success && nested) {
    return { success: true, data: nested, error: null };
  }
  const err = response.error;
  return {
    success: false,
    data: null,
    error:
      typeof err === 'string'
        ? err
        : err && 'message' in err
          ? String(err.message)
          : 'AI generation failed',
  };
}

export const aiCoursePracticeService = {
  async generatePracticeQuestions(input: {
    context: string;
    sourceScope: PracticeSourceScope;
    difficulty?: string;
    count?: number;
    title?: string;
    model?: string;
  }) {
    try {
      const response = await apiClient.post<{ data: AIResponse<GeneratedPracticePayload> }>(
        '/ai/courses/practice-questions',
        withNoteAIModel(
          {
            context: input.context,
            sourceScope: input.sourceScope,
            difficulty: input.difficulty ?? 'medium',
            count: input.count ?? 5,
            title: input.title,
          },
          { model: input.model }
        )
      );
      return unwrap(response);
    } catch (err) {
      llmLogger.error('practice questions generation failed', err);
      return {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : 'Failed to generate practice questions',
      };
    }
  },

  async generateQuiz(input: {
    context: string;
    sourceScope: PracticeSourceScope;
    difficulty?: string;
    count?: number;
    title?: string;
    adaptiveContext?: string;
    timeLimitMinutes?: number;
    model?: string;
  }) {
    try {
      const response = await apiClient.post<{ data: AIResponse<GeneratedQuizPayload> }>(
        '/ai/courses/quiz',
        withNoteAIModel(
          {
            context: input.context,
            sourceScope: input.sourceScope,
            difficulty: input.difficulty,
            count: input.count ?? 10,
            title: input.title,
            adaptiveContext: input.adaptiveContext,
            timeLimitMinutes: input.timeLimitMinutes ?? 30,
          },
          { model: input.model }
        )
      );
      return unwrap(response);
    } catch (err) {
      llmLogger.error('quiz generation failed', err);
      return {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : 'Failed to generate quiz',
      };
    }
  },

  async generateHomework(input: {
    context: string;
    sourceScope: PracticeSourceScope;
    courseProgress?: number;
    dueDays?: number;
    model?: string;
  }) {
    try {
      const response = await apiClient.post<{ data: AIResponse<GeneratedHomeworkPayload> }>(
        '/ai/courses/homework',
        withNoteAIModel(
          {
            context: input.context,
            sourceScope: input.sourceScope,
            courseProgress: input.courseProgress,
            dueDays: input.dueDays ?? 3,
          },
          { model: input.model }
        )
      );
      return unwrap(response);
    } catch (err) {
      llmLogger.error('homework generation failed', err);
      return {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : 'Failed to generate homework',
      };
    }
  },
};
