import { apiClient } from '@/lib/api-client';
import type {
  Course,
  CourseModule,
  CourseLesson,
  CreateCourseInput,
  UpdateCourseInput,
  ApiResponse,
  BackendCourse,
  EmbeddedCourseLessonInput,
  PreAssessmentStored,
  DifficultyLevel,
} from '@/types/knowledge-vault';
import type { Area } from '@/types/growth-system';

interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CourseWithDetails {
  course: Course;
  /** Persisted pre-course quiz when present (AI-generated courses). */
  preAssessment?: PreAssessmentStored | null;
  modules: Array<{
    module: CourseModule;
    lessons: CourseLesson[];
  }>;
}

const DIFFICULTIES: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export function backendCourseToCourse(bc: BackendCourse): Course {
  const difficulty: DifficultyLevel =
    bc.difficulty && DIFFICULTIES.includes(bc.difficulty) ? bc.difficulty : 'intermediate';
  return {
    id: bc.id,
    title: bc.title,
    description: bc.description,
    topic: bc.topic || '',
    difficulty,
    estimatedHours: bc.estimatedHours,
    userId: bc.userId,
    createdAt: bc.createdAt,
    updatedAt: bc.updatedAt,
    isAiGenerated: bc.isAiGenerated ?? false,
    knowledgeSource: bc.knowledgeSource ?? null,
  };
}

function backendLessonsToCourseLessons(
  bc: BackendCourse,
  area: Area = 'Operations'
): CourseLesson[] {
  const sorted = [...(bc.lessons || [])].sort((a, b) => a.order - b.order);
  return sorted.map((l) => ({
    id: l.id,
    type: 'course_lesson' as const,
    title: l.title,
    content: l.content ?? null,
    tags: [],
    area,
    status: l.isCompleted ? 'active' : 'draft',
    searchableText: `${l.title} ${l.content || ''}`,
    courseId: bc.id,
    moduleId: `${bc.id}-module-0`,
    lessonIndex: l.order,
    estimatedMinutes: l.estimatedMinutes ?? null,
    completedAt: l.completedAt ?? null,
    aiGenerated: false,
    userId: bc.userId,
    createdAt: bc.createdAt,
    updatedAt: bc.updatedAt,
    lastAccessedAt: null,
  }));
}

export const coursesService = {
  async getAll(): Promise<ApiResponse<Course[]>> {
    const response =
      await apiClient.get<BackendPaginatedResponse<BackendCourse>>('/knowledge/courses');
    if (response.success && response.data) {
      return {
        data: response.data.data
          .map(backendCourseToCourse)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        error: null,
        success: true,
      };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to fetch courses',
      success: false,
    };
  },

  async getById(id: string): Promise<ApiResponse<BackendCourse>> {
    const response = await apiClient.get<BackendCourse>(`/knowledge/courses/${id}`);
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Course not found',
      success: false,
    };
  },

  async getCourseWithModulesAndLessons(courseId: string): Promise<ApiResponse<CourseWithDetails>> {
    const response = await this.getById(courseId);
    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error || 'Course not found',
        success: false,
      };
    }
    const bc = response.data;
    const course = backendCourseToCourse(bc);
    const preAssessment = bc.preAssessment ?? null;
    const area: Area = 'Operations';

    if (bc.modules && bc.modules.length > 0) {
      const sortedMods = [...bc.modules].sort((a, b) => a.moduleIndex - b.moduleIndex);
      const modules = sortedMods.map((mod) => ({
        module: {
          id: mod.id,
          courseId: bc.id,
          title: mod.title,
          description: mod.description ?? null,
          moduleIndex: mod.moduleIndex,
          userId: bc.userId,
          createdAt: bc.createdAt,
        } satisfies CourseModule,
        lessons: [...mod.lessons]
          .sort((a, b) => a.order - b.order)
          .map(
            (l) =>
              ({
                id: l.id,
                type: 'course_lesson' as const,
                title: l.title,
                content: l.content ?? null,
                tags: [],
                area,
                status: l.isCompleted ? 'active' : 'draft',
                searchableText: `${l.title} ${l.content || ''}`,
                courseId: bc.id,
                moduleId: mod.id,
                lessonIndex: l.order,
                estimatedMinutes: l.estimatedMinutes ?? null,
                completedAt: l.completedAt ?? null,
                aiGenerated: bc.isAiGenerated ?? false,
                userId: bc.userId,
                createdAt: bc.createdAt,
                updatedAt: bc.updatedAt,
                lastAccessedAt: null,
              }) satisfies CourseLesson
          ),
      }));
      return {
        data: { course, preAssessment, modules },
        error: null,
        success: true,
      };
    }

    const lessons = backendLessonsToCourseLessons(bc, area);
    const module: CourseModule = {
      id: `${bc.id}-module-0`,
      courseId: bc.id,
      title: 'Lessons',
      description: null,
      moduleIndex: 0,
      userId: bc.userId,
      createdAt: bc.createdAt,
    };
    return {
      data: { course, preAssessment, modules: [{ module, lessons }] },
      error: null,
      success: true,
    };
  },

  async create(input: CreateCourseInput): Promise<ApiResponse<BackendCourse>> {
    const body: Record<string, unknown> = {
      title: input.title,
      description: input.description,
      topic: input.topic,
    };
    if (input.estimatedHours != null) body.estimatedHours = input.estimatedHours;
    if (input.difficulty != null) body.difficulty = input.difficulty;
    if (input.isAiGenerated != null) body.isAiGenerated = input.isAiGenerated;
    if (input.knowledgeSource != null) body.knowledgeSource = input.knowledgeSource;
    if (input.aiGenerationContext != null) body.aiGenerationContext = input.aiGenerationContext;
    if (input.preAssessment != null) body.preAssessment = input.preAssessment;
    if (input.modules?.length) body.modules = input.modules;
    else if (input.lessons?.length) body.lessons = input.lessons;
    const response = await apiClient.post<BackendCourse>('/knowledge/courses', body);
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to create course',
      success: false,
    };
  },

  async update(id: string, input: UpdateCourseInput): Promise<ApiResponse<BackendCourse>> {
    const response = await apiClient.patch<BackendCourse>(`/knowledge/courses/${id}`, input);
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to update course',
      success: false,
    };
  },

  async updateEmbeddedLessons(
    courseId: string,
    lessons: EmbeddedCourseLessonInput[]
  ): Promise<ApiResponse<BackendCourse>> {
    return this.update(courseId, { lessons });
  },

  async completeLesson(courseId: string, lessonId: string): Promise<ApiResponse<BackendCourse>> {
    const response = await apiClient.post<BackendCourse>(
      `/knowledge/courses/${courseId}/lessons/${lessonId}/complete`,
      {}
    );
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to complete lesson',
      success: false,
    };
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    const response = await apiClient.delete<void>(`/knowledge/courses/${id}`);
    return {
      data: response.success,
      error: response.error?.message || null,
      success: response.success,
    };
  },
};
