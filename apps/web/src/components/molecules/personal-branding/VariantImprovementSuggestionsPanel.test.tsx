import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VariantImprovementSuggestionsPanel } from './VariantImprovementSuggestionsPanel';
import type { VariantImprovementSuggestion } from '@/types/api/personal-branding.dto';

const suggestions: VariantImprovementSuggestion[] = [
  {
    id: 'sug-1',
    kind: 'sharpen_hook',
    label: 'Sharpen hook',
    rationale: 'The opening is generic.',
    tweakInstructions: 'Sharpen the hook in the first line.',
  },
  {
    id: 'sug-2',
    kind: 'tighten_opening',
    label: 'Tighten opening',
    rationale: 'The setup is wordy.',
    tweakInstructions: 'Tighten the opening by 25%.',
  },
];

describe('VariantImprovementSuggestionsPanel', () => {
  it('renders suggestions and applies one on click', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onDismiss = vi.fn();

    render(
      <VariantImprovementSuggestionsPanel
        suggestions={suggestions}
        isApplying={false}
        applyingSuggestionId={null}
        onApply={onApply}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Suggested improvements')).toBeInTheDocument();
    expect(screen.getByText('Sharpen hook')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Apply' })[0]!);
    expect(onApply).toHaveBeenCalledWith(suggestions[0]);

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
