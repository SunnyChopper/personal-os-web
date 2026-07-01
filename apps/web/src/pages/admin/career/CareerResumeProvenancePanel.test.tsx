import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CareerResumeProvenancePanel } from './CareerResumeProvenancePanel';

describe('CareerResumeProvenancePanel', () => {
  it('shows export blocked banner when exportReady is false', () => {
    render(
      <CareerResumeProvenancePanel
        exportReady={false}
        qualityStatus="blocked"
        provenance={[
          {
            sectionId: 'bullet-1',
            bulletText: 'Increased revenue 200% overnight',
            sourceAchievementIds: [],
            supported: false,
            message: 'No linked achievement for this bullet',
          },
        ]}
      />
    );

    expect(screen.getByText(/export blocked/i)).toBeInTheDocument();
    expect(screen.getByText(/Increased revenue/i)).toBeInTheDocument();
  });
});
