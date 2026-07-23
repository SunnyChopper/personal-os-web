import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RadarLearningSignalBanner from '@/components/molecules/personal-branding/RadarLearningSignalBanner';

describe('RadarLearningSignalBanner', () => {
  it('renders nothing when week count is zero', () => {
    const { container } = render(
      <RadarLearningSignalBanner
        stats={{
          irrelevantSignalsLast7Days: 0,
          trainingExampleCount: 0,
          trainingExampleLimit: 15,
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders week count and training note when feedback exists', () => {
    render(
      <RadarLearningSignalBanner
        stats={{
          irrelevantSignalsLast7Days: 12,
          trainingExampleCount: 12,
          trainingExampleLimit: 15,
        }}
      />
    );
    expect(screen.getByText('12 irrelevant signals this week')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your reasons are training the ranking filter \(up to 15 recent examples\)\./
      )
    ).toBeInTheDocument();
  });
});
