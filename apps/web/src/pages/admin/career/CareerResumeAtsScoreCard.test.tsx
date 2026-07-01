import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CareerResumeAtsScoreCard } from './CareerResumeAtsScoreCard';

describe('CareerResumeAtsScoreCard', () => {
  it('shows deterministic score, delta, and suggestions', () => {
    render(
      <CareerResumeAtsScoreCard
        atsScore={72}
        atsScoreBefore={58}
        atsScoreDelta={14}
        llmAtsScore={80}
        breakdown={{
          totalScore: 72,
          components: [
            {
              componentId: 'mandatory_keywords',
              label: 'Mandatory keywords',
              weight: 30,
              maxPoints: 30,
              earnedPoints: 24,
              matched: ['Python'],
              missing: ['Go'],
              detail: '',
            },
          ],
          suggestions: ['Add Go with achievement evidence'],
        }}
      />
    );

    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText(/Before generate/i)).toBeInTheDocument();
    expect(screen.getByText(/\+14/)).toBeInTheDocument();
    expect(screen.getByText(/Add Go with achievement evidence/)).toBeInTheDocument();
    expect(screen.getByText(/Mandatory keywords/)).toBeInTheDocument();
  });
});
