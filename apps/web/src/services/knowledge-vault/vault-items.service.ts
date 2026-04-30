import { apiClient } from '@/lib/api-client';
import { coursesService } from './courses.service';
import type {
  VaultItem,
  Note,
  Document,
  Flashcard,
  FlashcardDeck,
  CourseLesson,
  VaultItemType,
  VaultItemFilters,
  CreateNoteInput,
  UpdateNoteInput,
  CreateDocumentInput,
  UpdateDocumentInput,
  CreateFlashcardInput,
  CreateFlashcardDeckInput,
  UpdateFlashcardInput,
  ApiResponse,
  BackendCourse,
  EmbeddedCourseLessonInput,
} from '@/types/knowledge-vault';
import type { Area } from '@/types/growth-system';

interface CreateCourseLessonInput {
  title: string;
  courseId: string;
  moduleId: string;
  lessonIndex: number;
  estimatedMinutes: number;
  area: Area;
  tags: string[];
  content?: string;
}

interface VaultItemListPayload {
  data: VaultItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface FlashcardDeckListPayload {
  data: FlashcardDeck[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface BackendFlashcardCard {
  id: string;
  front: string;
  back: string;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: string | null;
  reviewCount: number;
}

interface FlashcardDeckWithCardsResponse extends FlashcardDeck {
  flashcards: BackendFlashcardCard[];
}

function buildCreateFlashcardDeckBody(input: CreateFlashcardDeckInput): {
  name: string;
  description?: string;
  topic?: string;
  flashcards: { front: string; back: string }[];
} {
  const topic =
    input.tags && input.tags.length > 0 ? input.tags.join(', ').slice(0, 100) : undefined;
  const metaLines: string[] = [`Area: ${input.area}`];
  if (input.tags?.length) {
    metaLines.push(`Tags: ${input.tags.join(', ')}`);
  }
  const description =
    [metaLines.join('\n'), input.description?.trim()].filter(Boolean).join('\n\n') || undefined;

  return {
    name: input.name.trim(),
    description,
    topic,
    flashcards: input.flashcards.map((c) => ({
      front: c.front.trim(),
      back: c.back.trim(),
    })),
  };
}

function mapDeckCardToFlashcard(
  deck: Pick<FlashcardDeck, 'id' | 'name' | 'userId' | 'createdAt' | 'updatedAt'>,
  card: BackendFlashcardCard,
  area: Area,
  tags: string[],
  sourceItemId?: string | null
): Flashcard {
  return {
    id: card.id,
    type: 'flashcard',
    title: card.front.substring(0, 100),
    content: null,
    tags,
    area,
    status: 'active',
    searchableText: `${card.front} ${card.back}`.toLowerCase(),
    userId: deck.userId,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    lastAccessedAt: null,
    deckId: deck.id,
    front: card.front,
    back: card.back,
    sourceItemId: sourceItemId ?? null,
    nextReviewDate: card.nextReviewAt || '',
    interval: card.intervalDays,
    easeFactor: card.easeFactor,
    repetitions: card.reviewCount,
  };
}

export const vaultItemsService = {
  async getFlashcardDecks(): Promise<ApiResponse<FlashcardDeck[]>> {
    const response = await apiClient.get<FlashcardDeckListPayload>('/knowledge/flashcards');
    if (response.success && response.data) {
      return {
        data: response.data.data,
        error: null,
        success: true,
      };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to fetch flashcard decks',
      success: false,
    };
  },

  async createFlashcardDeck(input: CreateFlashcardDeckInput): Promise<ApiResponse<FlashcardDeck>> {
    if (!input.flashcards.length) {
      return {
        data: null,
        error: 'Add at least one flashcard',
        success: false,
      };
    }
    const invalid = input.flashcards.some((c) => !c.front.trim() || !c.back.trim());
    if (invalid) {
      return {
        data: null,
        error: 'Each card needs non-empty front and back',
        success: false,
      };
    }

    const body = buildCreateFlashcardDeckBody(input);
    const deckRes = await apiClient.post<FlashcardDeck>('/knowledge/flashcards', body);
    if (!deckRes.success || !deckRes.data) {
      return {
        data: null,
        error: deckRes.error?.message || 'Failed to create flashcard deck',
        success: false,
      };
    }
    return { data: deckRes.data, error: null, success: true };
  },

  async getFlashcardsForDeck(
    deckId: string,
    options: { area: Area; tags: string[]; sourceItemId?: string | null }
  ): Promise<ApiResponse<Flashcard[]>> {
    const response = await apiClient.get<FlashcardDeckWithCardsResponse>(
      `/knowledge/flashcards/${deckId}?includeCards=true`
    );
    if (!response.success || !response.data?.flashcards?.length) {
      return {
        data: null,
        error: response.error?.message || 'Failed to load deck cards',
        success: false,
      };
    }
    const deck = response.data;
    const mapped = deck.flashcards.map((card) =>
      mapDeckCardToFlashcard(deck, card, options.area, options.tags, options.sourceItemId)
    );
    return { data: mapped, error: null, success: true };
  },

  async getAll(filters?: VaultItemFilters): Promise<ApiResponse<VaultItem[]>> {
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.area) queryParams.append('area', filters.area);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag) => queryParams.append('tags', tag));
    }
    if (filters?.page != null) queryParams.append('page', String(filters.page));
    if (filters?.pageSize != null) queryParams.append('pageSize', String(filters.pageSize));

    const endpoint = `/knowledge/notes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<VaultItemListPayload>(endpoint);

    if (response.success && response.data) {
      return {
        data: response.data.data.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
        error: null,
        success: true,
      };
    }

    return {
      data: null,
      error: response.error?.message || 'Failed to fetch items',
      success: false,
    };
  },

  async getById(id: string): Promise<ApiResponse<VaultItem>> {
    const response = await apiClient.get<VaultItem>(`/knowledge/notes/${id}`);
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Item not found',
      success: false,
    };
  },

  async getByType(type: VaultItemType): Promise<ApiResponse<VaultItem[]>> {
    return this.getAll({ type });
  },

  async search(query: string): Promise<ApiResponse<VaultItem[]>> {
    return this.getAll({ search: query });
  },

  async createNote(input: CreateNoteInput): Promise<ApiResponse<Note>> {
    const response = await apiClient.post<Note>('/knowledge/notes', input);
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to create note',
      success: false,
    };
  },

  async createDocument(input: CreateDocumentInput): Promise<ApiResponse<Document>> {
    const response = await apiClient.post<Document>('/knowledge/notes', {
      ...input,
      type: 'document',
    });
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to create document',
      success: false,
    };
  },

  async createFlashcard(input: CreateFlashcardInput): Promise<ApiResponse<Flashcard>> {
    const name = (input.title && input.title.trim()) || input.front.substring(0, 80);
    const deckRes = await apiClient.post<FlashcardDeck>('/knowledge/flashcards', {
      name,
      description: '',
      topic: input.tags?.[0] ?? undefined,
      flashcards: [{ front: input.front, back: input.back }],
    });
    if (!deckRes.success || !deckRes.data) {
      return {
        data: null,
        error: deckRes.error?.message || 'Failed to create flashcard deck',
        success: false,
      };
    }
    const deck = deckRes.data;
    const withCards = await apiClient.get<FlashcardDeckWithCardsResponse>(
      `/knowledge/flashcards/${deck.id}?includeCards=true`
    );
    if (!withCards.success || !withCards.data?.flashcards?.length) {
      return {
        data: null,
        error: withCards.error?.message || 'Failed to load created flashcard',
        success: false,
      };
    }
    const card = withCards.data.flashcards[0];
    return {
      data: mapDeckCardToFlashcard(deck, card, input.area, input.tags || [], input.sourceItemId),
      error: null,
      success: true,
    };
  },

  async update(id: string, updates: Partial<VaultItem>): Promise<ApiResponse<VaultItem>> {
    const endpoint =
      updates.type === 'flashcard' ? `/knowledge/flashcards/${id}` : `/knowledge/notes/${id}`;
    const response = await apiClient.patch<VaultItem>(endpoint, updates);
    if (response.success && response.data) {
      return { data: response.data, error: null, success: true };
    }
    return {
      data: null,
      error: response.error?.message || 'Failed to update item',
      success: false,
    };
  },

  async updateNote(id: string, input: UpdateNoteInput): Promise<ApiResponse<Note>> {
    const response = await this.update(id, input);
    return response as ApiResponse<Note>;
  },

  async updateDocument(id: string, input: UpdateDocumentInput): Promise<ApiResponse<Document>> {
    const response = await this.update(id, input);
    return response as ApiResponse<Document>;
  },

  async updateFlashcard(id: string, input: UpdateFlashcardInput): Promise<ApiResponse<Flashcard>> {
    const deckId = input.deckId;
    if (!deckId) {
      return {
        data: null,
        error: 'deckId is required to update a flashcard',
        success: false,
      };
    }
    const patch: { front?: string; back?: string } = {};
    if (input.front !== undefined) patch.front = input.front;
    if (input.back !== undefined) patch.back = input.back;
    const response = await apiClient.patch<BackendFlashcardCard>(
      `/knowledge/flashcards/${deckId}/cards/${id}`,
      patch
    );
    if (!response.success || !response.data) {
      return {
        data: null,
        error: response.error?.message || 'Failed to update flashcard',
        success: false,
      };
    }
    const list = await this.getAll({ type: 'flashcard' });
    const existing = list.data?.find((v) => v.id === id && v.type === 'flashcard') as
      | Flashcard
      | undefined;
    const deckMeta: Pick<FlashcardDeck, 'id' | 'name' | 'userId' | 'createdAt' | 'updatedAt'> = {
      id: deckId,
      name: existing?.title || response.data.front,
      userId: existing?.userId || '',
      createdAt: existing?.createdAt || '',
      updatedAt: new Date().toISOString(),
    };
    return {
      data: mapDeckCardToFlashcard(
        deckMeta,
        {
          id: response.data.id,
          front: response.data.front,
          back: response.data.back,
          intervalDays: response.data.intervalDays,
          easeFactor: response.data.easeFactor,
          nextReviewAt: response.data.nextReviewAt,
          reviewCount: response.data.reviewCount,
        },
        input.area || existing?.area || 'Operations',
        input.tags ?? existing?.tags ?? [],
        input.sourceItemId ?? existing?.sourceItemId
      ),
      error: null,
      success: true,
    };
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    const response = await apiClient.delete<void>(`/knowledge/notes/${id}`);
    return {
      data: response.success,
      error: response.error?.message || null,
      success: response.success,
    };
  },

  async markAccessed(id: string): Promise<ApiResponse<VaultItem>> {
    const response = await this.update(id, {
      lastAccessedAt: new Date().toISOString(),
    });
    return response;
  },

  async createCourseLesson(input: CreateCourseLessonInput): Promise<ApiResponse<CourseLesson>> {
    const courseRes = await apiClient.get<BackendCourse>(`/knowledge/courses/${input.courseId}`);
    if (!courseRes.success || !courseRes.data) {
      return {
        data: null,
        error: courseRes.error?.message || 'Course not found',
        success: false,
      };
    }
    const bc = courseRes.data;
    const lessons = [...(bc.lessons || [])];
    const newLesson: EmbeddedCourseLessonInput = {
      id: `lesson-${Date.now()}`,
      title: input.title,
      order: input.lessonIndex,
      estimatedMinutes: input.estimatedMinutes,
      content: input.content ?? null,
      isCompleted: false,
    };
    lessons.push({
      ...newLesson,
      description: null,
      isCompleted: false,
      completedAt: null,
    });
    const upd = await coursesService.update(input.courseId, { lessons });
    if (!upd.success || !upd.data) {
      return { data: null, error: upd.error || 'Failed to add lesson', success: false };
    }
    const created = upd.data.lessons.find(
      (l) => l.title === input.title && l.order === input.lessonIndex
    );
    if (!created) {
      return { data: null, error: 'Lesson not found after update', success: false };
    }
    const cl: CourseLesson = {
      id: created.id,
      type: 'course_lesson',
      title: created.title,
      content: created.content ?? null,
      tags: input.tags,
      area: input.area,
      status: 'draft',
      searchableText: `${created.title} ${created.content || ''}`,
      courseId: input.courseId,
      moduleId: input.moduleId,
      lessonIndex: created.order,
      estimatedMinutes: created.estimatedMinutes ?? null,
      completedAt: created.completedAt ?? null,
      aiGenerated: false,
      userId: bc.userId,
      createdAt: bc.updatedAt,
      updatedAt: upd.data.updatedAt,
      lastAccessedAt: null,
    };
    return { data: cl, error: null, success: true };
  },

  async markLessonComplete(courseId: string, lessonId: string): Promise<ApiResponse<CourseLesson>> {
    const res = await coursesService.completeLesson(courseId, lessonId);
    if (!res.success || !res.data) {
      return { data: null, error: res.error || 'Failed to complete lesson', success: false };
    }
    const lesson = res.data.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      return { data: null, error: 'Lesson missing after complete', success: false };
    }
    const cl: CourseLesson = {
      id: lesson.id,
      type: 'course_lesson',
      title: lesson.title,
      content: lesson.content ?? null,
      tags: [],
      area: 'Operations',
      status: 'active',
      searchableText: lesson.title,
      courseId,
      moduleId: `${courseId}-module-0`,
      lessonIndex: lesson.order,
      estimatedMinutes: lesson.estimatedMinutes ?? null,
      completedAt: lesson.completedAt ?? null,
      aiGenerated: false,
      userId: res.data.userId,
      createdAt: res.data.createdAt,
      updatedAt: res.data.updatedAt,
      lastAccessedAt: null,
    };
    return { data: cl, error: null, success: true };
  },
};
