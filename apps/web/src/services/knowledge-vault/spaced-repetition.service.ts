export interface FlashcardReview {
  quality: number;
  reviewedAt: string;
}

export interface SpacedRepetitionData {
  easinessFactor: number;
  repetitionCount: number;
  intervalDays: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  reviewHistory: FlashcardReview[];
}

export interface ReviewResult {
  nextReviewDate: string;
  intervalDays: number;
  easinessFactor: number;
  repetitionCount: number;
}

const DEFAULT_EASINESS_FACTOR = 2.5;
const MIN_EASINESS_FACTOR = 1.3;

import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';

interface ReviewSessionResult {
  updated: number;
  nextReviewDates: Record<string, string>;
}

export const spacedRepetitionService = {
  async submitReviewSession(
    deckId: string,
    reviews: Array<{ flashcardId: string; quality: number }>
  ): Promise<ApiResponse<ReviewSessionResult>> {
    const response = await apiClient.post<ReviewSessionResult>(
      `/knowledge/flashcards/${deckId}/review`,
      { reviews }
    );
    return response;
  },

  initializeCard(): SpacedRepetitionData {
    return {
      easinessFactor: DEFAULT_EASINESS_FACTOR,
      repetitionCount: 0,
      intervalDays: 0,
      nextReviewDate: new Date().toISOString(),
      lastReviewDate: null,
      reviewHistory: [],
    };
  },

  calculateNextReview(currentData: SpacedRepetitionData, quality: number): ReviewResult {
    if (quality < 0 || quality > 5) {
      throw new Error('Quality must be between 0 and 5');
    }

    let { easinessFactor, repetitionCount, intervalDays } = currentData;

    easinessFactor = Math.max(
      MIN_EASINESS_FACTOR,
      easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    if (quality < 3) {
      repetitionCount = 0;
      intervalDays = 0;
    } else {
      repetitionCount += 1;

      if (repetitionCount === 1) {
        intervalDays = 1;
      } else if (repetitionCount === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easinessFactor);
      }
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    return {
      nextReviewDate: nextReviewDate.toISOString(),
      intervalDays,
      easinessFactor,
      repetitionCount,
    };
  },

  applyReview(currentData: SpacedRepetitionData, quality: number): SpacedRepetitionData {
    const result = this.calculateNextReview(currentData, quality);
    const now = new Date().toISOString();

    return {
      easinessFactor: result.easinessFactor,
      repetitionCount: result.repetitionCount,
      intervalDays: result.intervalDays,
      nextReviewDate: result.nextReviewDate,
      lastReviewDate: now,
      reviewHistory: [
        ...currentData.reviewHistory,
        {
          quality,
          reviewedAt: now,
        },
      ],
    };
  },

  isDueForReview(nextReviewDate: string): boolean {
    return new Date(nextReviewDate) <= new Date();
  },

  getDueFlashcards<T extends { spacedRepetitionData?: SpacedRepetitionData }>(
    flashcards: T[]
  ): T[] {
    return flashcards.filter((card) => {
      if (!card.spacedRepetitionData) return true;
      return this.isDueForReview(card.spacedRepetitionData.nextReviewDate);
    });
  },

  getStudyStats(flashcards: Array<{ spacedRepetitionData?: SpacedRepetitionData }>) {
    const now = new Date();
    const dueCount = flashcards.filter((card) => {
      if (!card.spacedRepetitionData) return true;
      return this.isDueForReview(card.spacedRepetitionData.nextReviewDate);
    }).length;

    const dueToday = flashcards.filter((card) => {
      if (!card.spacedRepetitionData) return true;
      const nextReview = new Date(card.spacedRepetitionData.nextReviewDate);
      return nextReview.toDateString() === now.toDateString() && nextReview <= now;
    }).length;

    const dueTomorrow = flashcards.filter((card) => {
      if (!card.spacedRepetitionData) return false;
      const nextReview = new Date(card.spacedRepetitionData.nextReviewDate);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return nextReview.toDateString() === tomorrow.toDateString();
    }).length;

    const totalReviews = flashcards.reduce((sum, card) => {
      return sum + (card.spacedRepetitionData?.reviewHistory.length || 0);
    }, 0);

    const averageEF =
      flashcards.reduce((sum, card) => {
        return sum + (card.spacedRepetitionData?.easinessFactor || DEFAULT_EASINESS_FACTOR);
      }, 0) / (flashcards.length || 1);

    return {
      totalCards: flashcards.length,
      dueCount,
      dueToday,
      dueTomorrow,
      totalReviews,
      averageEasinessFactor: Math.round(averageEF * 100) / 100,
    };
  },

  getQualityLabel(quality: number): string {
    const labels = [
      'Complete Blackout',
      'Incorrect, Familiar',
      'Incorrect, Easy Recall',
      'Correct, Difficult',
      'Correct, Hesitation',
      'Perfect Response',
    ];
    return labels[quality] || 'Unknown';
  },

  getQualityDescription(quality: number): string {
    const descriptions = [
      'Complete failure to recall the information',
      'Incorrect response, but the information feels familiar',
      'Incorrect response, but correct answer seems easy to recall now',
      'Correct response, but required significant effort',
      'Correct response, but with slight hesitation',
      'Perfect response with immediate and confident recall',
    ];
    return descriptions[quality] || 'Unknown';
  },
};
