import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PointBreakdownPopover } from '@/components/molecules/PointBreakdownPopover';
import type { TaskPointBreakdown } from '@/types/growth-system';

const formulaBreakdown: TaskPointBreakdown = {
  storyPoints: 5,
  basePoints: 100,
  priorityMultiplier: 1.2,
  areaMultiplier: 1.1,
  sizeBonus: 1,
  total: 132,
  reasoning: 'Wallet points = 100 base (5 story points × 20) × …',
};

describe('PointBreakdownPopover', () => {
  it('renders formula rows when breakdown is not manual', async () => {
    const user = userEvent.setup();
    render(<PointBreakdownPopover pointValue={132} breakdown={formulaBreakdown} />);

    await user.click(screen.getByText(/Why 132 points/i));
    expect(screen.getByText(/Base points:/i)).toBeInTheDocument();
    expect(screen.getByText(/Priority ×1\.2/)).toBeInTheDocument();
  });

  it('hides multiplier list for manual reasoning', async () => {
    const user = userEvent.setup();
    const manual: TaskPointBreakdown = {
      ...formulaBreakdown,
      basePoints: 0,
      priorityMultiplier: 0,
      areaMultiplier: 0,
      sizeBonus: 0,
      total: 99,
      reasoning: 'Manually set by user',
    };
    render(<PointBreakdownPopover pointValue={99} breakdown={manual} />);
    await user.click(screen.getByText(/Why 99 points/i));
    expect(screen.queryByText(/Base points:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Manually set by user/i)).toBeInTheDocument();
  });
});
