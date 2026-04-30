import { apiClient } from '@/lib/api-client';
import { llmLogger } from '@/lib/logger';
import { vaultItemsService } from './vault-items.service';
import type { ApiResponse, CreateFlashcardDeckInput, Flashcard } from '@/types/knowledge-vault';

interface GenerateFlashcardsInput {
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
  count?: number;
}

interface FlashcardData {
  front: string;
  back: string;
}

interface AIResponse<T> {
  result: T;
  confidence: number;
  reasoning?: string;
  provider?: string;
  model?: string;
  cached?: boolean;
}

export const aiFlashcardGeneratorService = {
  async generateFromLesson(input: GenerateFlashcardsInput): Promise<ApiResponse<Flashcard[]>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<FlashcardData[]> }>(
        '/ai/flashcards/from-lesson',
        {
          lessonId: input.lessonId,
          lessonTitle: input.lessonTitle,
          lessonContent: input.lessonContent,
          count: input.count,
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to generate flashcards');
      }

      const flashcardsData = response.data.data.result || [];
      const pairs = flashcardsData
        .map((c) => ({ front: (c.front || '').trim(), back: (c.back || '').trim() }))
        .filter((c) => c.front && c.back);

      if (!pairs.length) {
        return {
          data: [],
          error: null,
          success: true,
        };
      }

      const deckInput: CreateFlashcardDeckInput = {
        name: input.lessonTitle.slice(0, 200),
        area: 'Operations',
        tags: [],
        flashcards: pairs,
      };

      const createDeck = await vaultItemsService.createFlashcardDeck(deckInput);
      if (!createDeck.success || !createDeck.data) {
        const msg =
          typeof createDeck.error === 'string'
            ? createDeck.error
            : (createDeck.error as { message?: string } | null)?.message;
        throw new Error(msg || 'Failed to save flashcard deck');
      }

      const cardsRes = await vaultItemsService.getFlashcardsForDeck(createDeck.data.id, {
        area: 'Operations',
        tags: [],
        sourceItemId: input.lessonId,
      });

      if (!cardsRes.success || !cardsRes.data) {
        const msg =
          typeof cardsRes.error === 'string'
            ? cardsRes.error
            : (cardsRes.error as { message?: string } | null)?.message;
        throw new Error(msg || 'Failed to load cards');
      }

      return {
        data: cardsRes.data,
        error: null,
        success: true,
      };
    } catch (error) {
      llmLogger.error('Error generating flashcards', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate flashcards',
        success: false,
      };
    }
  },

  async generateFromText(
    title: string,
    content: string,
    count: number = 5
  ): Promise<ApiResponse<FlashcardData[]>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<FlashcardData[]> }>(
        '/ai/flashcards/from-text',
        {
          title,
          content,
          count,
        }
      );

      if (response.success && response.data) {
        return {
          data: response.data.data.result || [],
          error: null,
          success: true,
        };
      }

      return {
        data: null,
        error: response.error?.message || 'Failed to generate flashcards',
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error generating flashcards from content', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate flashcards',
        success: false,
      };
    }
  },

  async reviewFlashcard(
    flashcardId: string,
    quality: number,
    deckId?: string
  ): Promise<ApiResponse<Flashcard>> {
    try {
      let dId = deckId;
      if (!dId) {
        const all = await vaultItemsService.getAll({ type: 'flashcard' });
        const f = all.data?.find((x) => x.id === flashcardId && x.type === 'flashcard') as
          | Flashcard
          | undefined;
        dId = f?.deckId;
      }
      if (!dId) {
        throw new Error('Could not resolve flashcard deck; open Flashcards to refresh list.');
      }

      const response = await apiClient.post<{
        id: string;
        front: string;
        back: string;
        intervalDays: number;
        easeFactor: number;
        nextReviewAt: string | null;
        reviewCount: number;
      }>(`/knowledge/flashcards/${dId}/review`, {
        flashcardId,
        quality,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Review failed');
      }

      const c = response.data;
      const list = await vaultItemsService.getAll({ type: 'flashcard' });
      const existing = list.data?.find((v) => v.id === flashcardId && v.type === 'flashcard') as
        | Flashcard
        | undefined;

      const merged: Flashcard = {
        id: c.id,
        type: 'flashcard',
        title: c.front.substring(0, 100),
        content: null,
        tags: existing?.tags ?? [],
        area: existing?.area ?? 'Operations',
        status: 'active',
        searchableText: `${c.front} ${c.back}`,
        userId: existing?.userId ?? '',
        createdAt: existing?.createdAt ?? '',
        updatedAt: new Date().toISOString(),
        lastAccessedAt: existing?.lastAccessedAt ?? null,
        deckId: dId,
        front: c.front,
        back: c.back,
        sourceItemId: existing?.sourceItemId ?? null,
        nextReviewDate: c.nextReviewAt || '',
        interval: c.intervalDays,
        easeFactor: c.easeFactor,
        repetitions: c.reviewCount,
      };

      return { data: merged, error: null, success: true };
    } catch (error) {
      llmLogger.error('Error reviewing flashcard', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to review flashcard',
        success: false,
      };
    }
  },
};
