/** AI Planner API types (camelCase as returned by backend). */

import type { Task } from './growth-system';

export type PlannerCapacityState = 'healthy' | 'warning' | 'overloaded';

export interface PlannerBlock {
  id: string;
  date: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  taskId: string | null;
  taskTitleSnapshot: string | null;
  source: string;
  status: string;
  storyPointsLoad: number;
  calendarEventId: string | null;
  microStepId: string | null;
  microStepText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlannerDay {
  date: string;
  capacityStoryPoints: number;
  scheduledStoryPoints: number;
  scheduledMinutes: number;
  loadRatio: number;
  capacityState: PlannerCapacityState;
  oneThingTaskId: string | null;
  calendarBusyMinutes: number;
  calendarFreeMinutes: number;
  lastGeneratedAt: string | null;
  blocks: PlannerBlock[];
}

export interface PlannerVelocity {
  dailyCapacityStoryPoints: number;
  trailingWeeklyAverageStoryPoints: number;
  dailyBurnRate: number;
  confidence: string;
}

export interface PlannerWeek {
  weekStart: string;
  weekEnd: string;
  timeZone: string;
  days: PlannerDay[];
  velocity: PlannerVelocity;
}

export type PlannerPlanConfidence = 'low' | 'medium' | 'high';

export interface DayOfWeekStat {
  dayOfWeek: number;
  averagePoints: number;
  medianPoints: number;
  samples: number;
}

export interface PlanDayPrediction {
  date: string;
  dayOfWeek: number;
  predictedCapacityPoints: number;
  confidence: PlannerPlanConfidence;
  todayActualPoints: number;
  trailingDailyAverage: number;
  dayOfWeekHistory: DayOfWeekStat[];
}

export interface PlanDaySuggestion {
  taskId: string;
  title: string;
  storyPoints: number;
  priority: string;
  score: number;
  reason: string;
}

export interface PlanDay {
  prediction: PlanDayPrediction;
  suggestions: PlanDaySuggestion[];
  existingBlocks: PlannerBlock[];
}

export interface CommitPlanDayPayload {
  date: string;
  taskIds: string[];
  useLlm: boolean;
}
export interface OneThingCandidate {
  taskId: string;
  title: string;
  plannerScore: number;
  reason: string;
}

export interface OneThingSelection {
  targetDate: string;
  selectedTaskId: string | null;
  candidateTaskIds: string[];
  selectionReason: string | null;
  lockedAt: string | null;
  source: string | null;
}

export interface CookedMicroStep {
  label: string;
  durationMinutes: number;
  reason: string;
}

export interface CookedTaskResult {
  taskId: string;
  microSteps: CookedMicroStep[];
  insertedBlocks: PlannerBlock[];
  task: Task | null;
}
