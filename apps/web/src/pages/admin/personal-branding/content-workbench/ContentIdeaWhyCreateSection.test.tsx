import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentIdeaWhyCreateSection } from './ContentIdeaWhyCreateSection';

describe('ContentIdeaWhyCreateSection', () => {
  it('renders rationale under Why create this label', () => {
    render(
      <ContentIdeaWhyCreateSection rationale="Pillar fit reinforces your ops-first positioning." />
    );
    expect(screen.getByText('Why create this')).toBeInTheDocument();
    expect(
      screen.getByText('Pillar fit reinforces your ops-first positioning.')
    ).toBeInTheDocument();
  });
});
