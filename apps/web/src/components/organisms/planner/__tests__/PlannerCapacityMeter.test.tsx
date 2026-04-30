import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PlannerCapacityMeter } from '../PlannerCapacityMeter';

describe('PlannerCapacityMeter', () => {
  it('shows overloaded styling for high load', () => {
    render(
      <PlannerCapacityMeter
        loadRatio={1.2}
        capacityState="overloaded"
        scheduledPoints={6}
        capacityPoints={5}
      />
    );
    expect(screen.getByText('Over capacity')).toBeInTheDocument();
    expect(screen.getByText(/6\.0 \/ 5\.0 pts/)).toBeInTheDocument();
  });

  it('shows healthy state', () => {
    render(
      <PlannerCapacityMeter
        loadRatio={0.5}
        capacityState="healthy"
        scheduledPoints={2}
        capacityPoints={5}
      />
    );
    expect(screen.getByText('Healthy load')).toBeInTheDocument();
  });
});
