import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlatformFitRecommendationCard } from './PlatformFitRecommendationCard';
import type { PlatformFitRecommendation } from '@/types/api/personal-branding.dto';

const baseRecommendation: PlatformFitRecommendation = {
  platform: 'x',
  score: 0.73,
  fitTier: 'medium',
  rationale: 'Thread-native structure aligns with the source length.',
  factors: {
    lengthFit: { score: 0.8, detail: 'Length is within range.' },
    structureFit: { score: 0.7, detail: 'Thread format fits.' },
    pillarFit: { score: 0.75, detail: 'Pillar overlap is solid.', matchedPillars: ['growth'] },
    rulesFit: { score: 0.65, detail: 'Rules are mostly satisfied.', appliedRuleIds: ['rule-1'] },
  },
};

describe('PlatformFitRecommendationCard', () => {
  it('renders Add when not selected and calls onToggle on click', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <PlatformFitRecommendationCard
        recommendation={baseRecommendation}
        rank={1}
        selected={false}
        onToggle={onToggle}
      />
    );

    const addButton = screen.getByRole('button', { name: 'Add' });
    expect(addButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(addButton);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders Remove when selected and calls onToggle on click', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <PlatformFitRecommendationCard
        recommendation={baseRecommendation}
        rank={2}
        selected
        onToggle={onToggle}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove' });
    expect(removeButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(removeButton);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
