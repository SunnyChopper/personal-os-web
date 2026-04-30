import type { Goal, TimeHorizon } from '@/types/growth-system';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** ISO week number for a local calendar date */
function getISOWeek(date: Date): number {
  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function formatGoalMindmapTimeframe(goal: Goal): string {
  const { timeHorizon, targetDate } = goal;
  if (!targetDate) {
    return timeHorizon;
  }
  const d = new Date(targetDate);
  if (Number.isNaN(d.getTime())) {
    return timeHorizon;
  }
  const y = d.getFullYear();
  const m = d.getMonth();
  const q = Math.floor(m / 3) + 1;

  switch (timeHorizon as TimeHorizon) {
    case 'Yearly':
      return `Yearly - ${y}`;
    case 'Quarterly':
      return `Quarterly - Q${q}`;
    case 'Monthly':
      return `Monthly - ${MONTHS_SHORT[m]}`;
    case 'Weekly':
      return `Weekly - W${getISOWeek(d).toString().padStart(2, '0')}`;
    case 'Daily':
      return `Daily - ${MONTHS_SHORT[m]} ${d.getDate()}`;
    default:
      return timeHorizon;
  }
}

/** Total node width for mindmap layout (card + gap + add control). Keep in sync with GoalMindmapView dagre. */
export const GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH = 260 + 8 + 40;
