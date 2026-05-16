import type { EstablishedHabitActionType } from '@/lib/llm/schemas/habit-established-ai-schemas';

/** Visible chip order on Habits detail AI tools strip. */
export const AI_HABIT_ASSIST_MODE_ORDER: EstablishedHabitActionType[] = [
  'patternInsight',
  'routineTuneUp',
  'recoveryPlan',
  'sevenDayExperiment',
];

const CHIP_LABELS: Record<EstablishedHabitActionType, string> = {
  patternInsight: 'What is working?',
  routineTuneUp: 'Tune the routine',
  recoveryPlan: 'Recover from misses',
  sevenDayExperiment: 'Run a 7-day experiment',
};

const PANEL_TITLES: Record<EstablishedHabitActionType, string> = {
  patternInsight: 'Pattern insight',
  routineTuneUp: 'Routine tune-up',
  recoveryPlan: 'Recovery plan',
  sevenDayExperiment: 'Seven-day experiment',
};

export function aiHabitAssistModeLabel(mode: EstablishedHabitActionType): string {
  return CHIP_LABELS[mode];
}

export function aiHabitAssistPanelTitle(mode: EstablishedHabitActionType): string {
  return PANEL_TITLES[mode];
}
