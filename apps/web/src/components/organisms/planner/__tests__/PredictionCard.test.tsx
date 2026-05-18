import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PredictionCard } from '@/components/organisms/planner/PredictionCard';
import type { PlanDayPrediction } from '@/types/planner';

const basePrediction = (): PlanDayPrediction => ({
  date: '2026-05-18',
  dayOfWeek: 0,
  predictedCapacityPoints: 5,
  confidence: 'low',
  todayActualPoints: 0,
  trailingDailyAverage: 1,
  dayOfWeekHistory: [
    {
      dayOfWeek: 0,
      averagePoints: 6,
      medianPoints: 5,
      samples: 2,
    },
    ...Array.from({ length: 6 }).map((_, idx) => ({
      dayOfWeek: idx + 1,
      averagePoints: 0,
      medianPoints: 0,
      samples: 0,
    })),
  ],
});

describe('PredictionCard', () => {
  it('surfaces estimated default copy when confidence is low', () => {
    const prediction = basePrediction();
    render(<PredictionCard prediction={prediction} />);
    expect(screen.getByText(/Estimated default/)).toBeInTheDocument();
  });

  it('shows weekday average copy sourced from planner history bucket', () => {
    render(<PredictionCard prediction={basePrediction()} />);
    expect(screen.getByText(/Mon/)).toBeInTheDocument();
    expect(screen.getByText(/6\.0/)).toBeInTheDocument();
    expect(screen.getByText(/2 samples/)).toBeInTheDocument();
  });
});
