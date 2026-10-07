import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReplySuggestionCardSkeleton from './ReplySuggestionCardSkeleton';

describe('ReplySuggestionCardSkeleton', () => {
  it('renders accessible generating placeholder', () => {
    render(<ReplySuggestionCardSkeleton />);
    expect(screen.getByTestId('reply-suggestion-card-skeleton')).toBeInTheDocument();
    expect(screen.getByLabelText('Generating reply suggestion')).toBeInTheDocument();
  });
});
