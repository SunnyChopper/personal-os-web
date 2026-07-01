import { apiClient } from '@/lib/api-client';
import type {
  HomeworkAssignment,
  PracticeArtifact,
  PracticeArtifactStatus,
  PracticeQuestionSet,
  PracticeSourceScope,
  QuizArtifact,
  QuizAttempt,
} from '@/types/knowledge-vault';
import type { Area } from '@/types/growth-system';

interface PaginatedPractice<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListPracticeArtifactsParams {
  type?: 'practice_question_set' | 'quiz' | 'homework_assignment';
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  status?: PracticeArtifactStatus;
  page?: number;
  pageSize?: number;
}

export const practiceArtifactsService = {
  async list(params: ListPracticeArtifactsParams = {}) {
    const search = new URLSearchParams();
    if (params.type) search.set('type', params.type);
    if (params.courseId) search.set('courseId', params.courseId);
    if (params.moduleId) search.set('moduleId', params.moduleId);
    if (params.lessonId) search.set('lessonId', params.lessonId);
    if (params.status) search.set('status', params.status);
    if (params.page) search.set('page', String(params.page));
    if (params.pageSize) search.set('pageSize', String(params.pageSize));
    const qs = search.toString();
    return apiClient.get<PaginatedPractice<PracticeArtifact>>(
      `/knowledge/practice-artifacts${qs ? `?${qs}` : ''}`
    );
  },

  async getById(id: string) {
    return apiClient.get<PracticeArtifact>(`/knowledge/practice-artifacts/${id}`);
  },

  async createPracticeSet(input: {
    title: string;
    questions: PracticeQuestionSet['questions'];
    sourceScope: PracticeSourceScope;
    difficulty?: string;
    area?: Area;
    tags?: string[];
  }) {
    return apiClient.post<PracticeQuestionSet>('/knowledge/practice-question-sets', input);
  },

  async createQuiz(input: {
    title: string;
    questions: QuizArtifact['questions'];
    sourceScope: PracticeSourceScope;
    difficulty?: string;
    adaptiveContextSummary?: string;
    timeLimitMinutes?: number;
    area?: Area;
    tags?: string[];
  }) {
    return apiClient.post<QuizArtifact>('/knowledge/quizzes', input);
  },

  async submitQuizAttempt(quizId: string, responses: Record<string, string>) {
    return apiClient.post<QuizAttempt>(`/knowledge/quizzes/${quizId}/attempts`, { responses });
  },

  async createHomework(input: {
    title: string;
    prompt: string;
    deliverables?: string[];
    rubric?: string | null;
    dueDate?: string | null;
    sourceScope: PracticeSourceScope;
    estimatedMinutes?: number;
    area?: Area;
    tags?: string[];
  }) {
    return apiClient.post<HomeworkAssignment>('/knowledge/homework', input);
  },

  async updateHomework(
    homeworkId: string,
    patch: {
      title?: string;
      prompt?: string;
      deliverables?: string[];
      rubric?: string | null;
      dueDate?: string | null;
      status?: PracticeArtifactStatus;
      estimatedMinutes?: number;
      completedAt?: string | null;
    }
  ) {
    return apiClient.patch<HomeworkAssignment>(`/knowledge/homework/${homeworkId}`, patch);
  },

  async convertHomeworkToTask(
    homeworkId: string,
    input: {
      createProjectForCourse?: boolean;
      projectId?: string;
      goalIds?: string[];
      priority?: string;
      area?: Area;
    } = {}
  ) {
    return apiClient.post(`/knowledge/homework/${homeworkId}/convert-to-task`, input);
  },
};
