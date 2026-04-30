import { apiClient } from '@/lib/api-client';
import { llmLogger } from '@/lib/logger';
import { authService } from '@/lib/auth/auth.service';
import { getResolvedWsUrl } from '@/lib/vite-public-env';
import {
  cancelInFlightCourseSkeleton,
  runCourseSkeletonOverWebSocket,
  type CourseSkeletonResult as WsCourseSkeletonResult,
} from '@/lib/websocket/course-skeleton-ws-client';
import { coursesService } from './courses.service';
import { generateId } from '@/mocks/storage';
import type {
  Course,
  PreAssessmentQuestion,
  DifficultyLevel,
  ApiResponse,
  PreAssessmentStored,
} from '@/types/knowledge-vault';
import type { CourseGenerationProgress, LessonGenerationProgress } from './course-generation/types';

interface AIResponse<T> {
  result: T;
  confidence: number;
  reasoning?: string;
  provider?: string;
  model?: string;
  cached?: boolean;
}

interface GeneratePreAssessmentInput {
  topic: string;
  targetDifficulty: DifficultyLevel;
  /** When `vault`, backend / client should treat `topic` as already including vault RAG text. */
  knowledgeSource?: 'global' | 'vault';
}

interface PreAssessmentResult {
  questions: PreAssessmentQuestion[];
}

export interface GenerateCourseSkeletonInput {
  topic: string;
  preAssessment: PreAssessmentStored;
  targetDifficulty: DifficultyLevel;
  knowledgeSource?: 'global' | 'vault';
  onProgress?: (progress: CourseGenerationProgress) => void;
  /**
   * When true, skip WebSocket and use `POST /ai/courses/skeleton` only.
   * Default: use WebSocket when `VITE_WS_URL` (or dev default) is set.
   */
  preferRestOnly?: boolean;
}

interface GenerateLessonContentInput {
  courseId: string;
  lessonId: string;
  onProgress?: (progress: LessonGenerationProgress) => void;
}

export interface CreateCourseFromSkeletonMeta {
  cleanTopic: string;
  knowledgeSource: 'global' | 'vault';
  /** Vault-augmented prompt text; omitted for global courses. */
  aiGenerationContext?: string;
  preAssessment: PreAssessmentStored;
}

async function generateCourseSkeletonRest(
  input: GenerateCourseSkeletonInput
): Promise<ApiResponse<WsCourseSkeletonResult>> {
  if (input.onProgress) {
    input.onProgress({
      phase: 'preparing',
      phaseName: 'Requesting course outline',
      summary: 'Using REST (WebSocket unavailable or disabled)...',
      progress: 5,
    });
  }

  const response = await apiClient.post<{ data: AIResponse<WsCourseSkeletonResult> }>(
    '/ai/courses/skeleton',
    {
      topic: input.topic,
      preAssessment: input.preAssessment,
      targetDifficulty: input.targetDifficulty,
      knowledgeSource: input.knowledgeSource ?? 'global',
    }
  );

  if (response.success && response.data) {
    if (input.onProgress) {
      input.onProgress({
        phase: 'done',
        phaseName: 'Complete',
        summary: 'Course outline generated.',
        progress: 100,
      });
    }
    return {
      data: response.data.data.result,
      error: null,
      success: true,
    };
  }

  return {
    data: null,
    error: response.error?.message || 'Failed to generate course',
    success: false,
  };
}

export const aiCourseGeneratorService = {
  async generatePreAssessment(
    input: GeneratePreAssessmentInput
  ): Promise<ApiResponse<PreAssessmentResult>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<PreAssessmentResult> }>(
        '/ai/courses/pre-assessment',
        {
          topic: input.topic,
          targetDifficulty: input.targetDifficulty,
          knowledgeSource: input.knowledgeSource ?? 'global',
        }
      );

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          error: null,
          success: true,
        };
      }

      return {
        data: null,
        error: response.error?.message || 'Failed to generate assessment',
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error generating pre-assessment', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate assessment',
        success: false,
      };
    }
  },

  /**
   * Preferred path: WebSocket `courseSkeletonStart` with phase events.
   * Falls back to `POST /ai/courses/skeleton` on failure or when `preferRestOnly` or no WS URL.
   */
  async generateCourseSkeleton(
    input: GenerateCourseSkeletonInput
  ): Promise<ApiResponse<WsCourseSkeletonResult>> {
    const wsUrl = getResolvedWsUrl();
    if (!input.preferRestOnly && wsUrl) {
      try {
        const data = await runCourseSkeletonOverWebSocket({
          wsBaseUrl: wsUrl,
          getAccessToken: async () => authService.getAccessToken(),
          topic: input.topic,
          preAssessment: input.preAssessment,
          targetDifficulty: input.targetDifficulty,
          knowledgeSource: input.knowledgeSource ?? 'global',
          onProgress: input.onProgress,
        });
        return { data, error: null, success: true };
      } catch (e) {
        llmLogger.warn('Course skeleton WebSocket failed, falling back to REST', e);
        try {
          return await generateCourseSkeletonRest(input);
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Failed to generate course. Please check your LLM configuration and try again.';
          return { data: null, error: errorMessage, success: false };
        }
      }
    }

    try {
      return await generateCourseSkeletonRest(input);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to generate course. Please check your LLM configuration and try again.';

      return {
        data: null,
        error: errorMessage,
        success: false,
      };
    }
  },

  /**
   * Cancel an in-flight WebSocket course skeleton (uses `cancelRun` on the same connection).
   */
  cancelInFlightCourseSkeleton,

  async generateLessonContent(input: GenerateLessonContentInput): Promise<ApiResponse<string>> {
    try {
      if (input.onProgress) {
        input.onProgress({
          phase: 'writing',
          phaseName: 'Generating Lesson',
          summary: 'Requesting lesson content from backend...',
          progress: 10,
        });
      }

      const response = await apiClient.post<{ data: AIResponse<string> }>('/ai/courses/lesson', {
        courseId: input.courseId,
        lessonId: input.lessonId,
      });

      if (response.success && response.data) {
        if (input.onProgress) {
          input.onProgress({
            phase: 'polishing',
            phaseName: 'Complete',
            summary: 'Lesson generation complete.',
            progress: 100,
          });
        }
        return {
          data: response.data.data.result,
          error: null,
          success: true,
        };
      }

      return {
        data: null,
        error: response.error?.message || 'Failed to generate lesson content',
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error generating lesson content', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate lesson',
        success: false,
      };
    }
  },

  async createCourseFromSkeleton(
    skeleton: WsCourseSkeletonResult,
    meta: CreateCourseFromSkeletonMeta
  ): Promise<ApiResponse<Course>> {
    try {
      let order = 0;
      const modulesPayload = skeleton.modules.map((bundle) => ({
        id: bundle.module.id,
        title: bundle.module.title,
        description: bundle.module.description ?? null,
        moduleIndex: bundle.module.moduleIndex,
        lessons: bundle.lessons.map((lessonData) => ({
          id: generateId(),
          title: lessonData.title,
          order: order++,
          estimatedMinutes: lessonData.estimatedMinutes,
          isCompleted: false,
        })),
      }));

      const courseResponse = await coursesService.create({
        title: skeleton.course.title,
        description: skeleton.course.description || undefined,
        topic: meta.cleanTopic,
        estimatedHours: skeleton.course.estimatedHours ?? null,
        difficulty: skeleton.course.difficulty,
        isAiGenerated: true,
        knowledgeSource: meta.knowledgeSource,
        aiGenerationContext: meta.aiGenerationContext,
        preAssessment: meta.preAssessment,
        modules: modulesPayload,
      });

      if (!courseResponse.success || !courseResponse.data) {
        throw new Error('Failed to create course');
      }

      const bc = courseResponse.data;
      const course: Course = {
        id: bc.id,
        title: bc.title,
        description: bc.description,
        topic: bc.topic || meta.cleanTopic,
        difficulty: skeleton.course.difficulty,
        estimatedHours: bc.estimatedHours ?? null,
        userId: bc.userId,
        createdAt: bc.createdAt,
        updatedAt: bc.updatedAt,
        isAiGenerated: true,
        knowledgeSource: meta.knowledgeSource,
      };

      return {
        data: course,
        error: null,
        success: true,
      };
    } catch (error) {
      llmLogger.error('Error creating course from skeleton', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create course',
        success: false,
      };
    }
  },
};
