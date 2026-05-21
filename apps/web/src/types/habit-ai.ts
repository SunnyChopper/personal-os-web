import type { UpdateHabitInput } from '@/types/growth-system';

export type EstablishedHabitActionType =
  | 'patternInsight'
  | 'routineTuneUp'
  | 'recoveryPlan'
  | 'sevenDayExperiment';

export type EstablishedHabitReadiness = 'starter' | 'established' | 'strongSignal';

export interface EstablishedHabitEvidenceItem {
  label: string;
  detail: string;
}

export interface EstablishedHabitExperiment {
  hypothesis: string;
  change: string;
  metric: string;
  successCriterion: string;
}

export interface EstablishedHabitNextCheckIn {
  whenLabel: string;
  prompt: string;
}

/** Safe subset of habit PATCH fields returned by the model. */
export type EstablishedHabitSuggestedPatch = Pick<
  UpdateHabitInput,
  | 'trigger'
  | 'action'
  | 'reward'
  | 'dailyTarget'
  | 'weeklyTarget'
  | 'frictionUp'
  | 'frictionDown'
  | 'notes'
>;

export interface EstablishedHabitActionResult {
  habitId: string;
  actionType: EstablishedHabitActionType;
  readiness: EstablishedHabitReadiness;
  title: string;
  summary: string;
  evidence: EstablishedHabitEvidenceItem[];
  recommendations: string[];
  suggestedHabitPatch?: EstablishedHabitSuggestedPatch | null;
  experiment?: EstablishedHabitExperiment | null;
  nextCheckIn?: EstablishedHabitNextCheckIn | null;
}

export interface EstablishedHabitAiEnvelope {
  result: EstablishedHabitActionResult;
  confidence: number;
  provider: string;
  model: string;
  cached: boolean;
}
