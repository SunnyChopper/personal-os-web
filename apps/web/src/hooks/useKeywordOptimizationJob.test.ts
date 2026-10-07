import { describe, expect, it } from 'vitest';
import { keywordOptimizationClientWaitBudgetMs } from '@/hooks/useKeywordOptimizationJob';

describe('useKeywordOptimizationJob budgets', () => {
  it('uses default budget until keyword wait is observed', () => {
    expect(keywordOptimizationClientWaitBudgetMs(null, false)).toBe(5 * 60 * 1000);
    expect(keywordOptimizationClientWaitBudgetMs({ stage: 'optimizing' }, false)).toBe(
      5 * 60 * 1000
    );
  });

  it('extends poll budget when keyword wait is observed', () => {
    expect(
      keywordOptimizationClientWaitBudgetMs({ stage: 'waiting_keyword_research' }, false)
    ).toBe(28 * 60 * 1000);
    expect(keywordOptimizationClientWaitBudgetMs({ stage: 'optimizing' }, true)).toBe(
      28 * 60 * 1000
    );
  });
});
