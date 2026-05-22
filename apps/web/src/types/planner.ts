/** AI Planner API types (camelCase as returned by backend). */

import type { Task } from './growth-system';

export type PlannerCapacityState = 'healthy' | 'warning' | 'overloaded' | 'blocked';

export type PlannerBlockingSource = 'manual' | 'voyager' | 'calendar' | 'standby';

export type PlannerBlockingKind = 'outOfOffice' | 'trip';

export interface PlannerBlockingContext {
  id: string;
  source: PlannerBlockingSource;
  kind: PlannerBlockingKind;
  label: string;
  startDate: string;
  endDate: string;
  sourceRefId?: string | null;
  isManual: boolean;
}

export type PlannerRolloverReason = 'missedScheduledDate' | 'overdueDueDate' | 'stalePlannerBlock';

export type PlannerRolloverBadge = 'Rolled Over' | 'Overdue';

export type PlannerRolloverAction = 'keep' | 'backlog';

export interface PlannerRolloverTask {
  rolloverId: string;
  taskId: string;
  title: string;
  priority: string;
  storyPoints: number;
  sourceDate: string;
  reason: PlannerRolloverReason;
  badge: PlannerRolloverBadge;
  dueDate?: string | null;
  rolloverCount?: number;
  velocityDragDetected?: boolean;
}

export interface PlannerRolloverDecision {
  rolloverId: string;
  taskId: string;
  targetDate: string;
  decision: string;
  action: PlannerRolloverAction;
}

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
  isBlocked?: boolean;
  blockingContexts?: PlannerBlockingContext[];
  oneThingTaskId: string | null;
  calendarBusyMinutes: number;
  calendarFreeMinutes: number;
  lastGeneratedAt: string | null;
  blocks: PlannerBlock[];
  rolloverTasks?: PlannerRolloverTask[];
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
  isBlocked?: boolean;
  blockingContexts?: PlannerBlockingContext[];
}

export interface PlanDaySuggestion {
  taskId: string;
  title: string;
  storyPoints: number;
  priority: string;
  score: number;
  reason: string;
  energyLevel?: string | null;
  executionWindow?: string | null;
  contextMatch?: boolean;
  fitReason?: string | null;
}

export interface PlanDay {
  prediction: PlanDayPrediction;
  suggestions: PlanDaySuggestion[];
  existingBlocks: PlannerBlock[];
  rolloverTasks?: PlannerRolloverTask[];
}

export interface CommitPlanDayPayload {
  date: string;
  taskIds: string[];
  useLlm: boolean;
}

export interface PlannerKillSwitchPayload {
  date: string;
}

export interface PlannerKillSwitchResult {
  week: PlannerWeek;
  targetDate: string;
  deScopedTaskIds: string[];
  protectedTaskIds: string[];
  deletedBlockIds: string[];
  movedToBacklogCount: number;
  remainingScheduledStoryPoints: number;
}

/** Non-persisted auto-schedule proposal from preview endpoint. */
export interface PlannerProposedBlock {
  tempId: string;
  date: string;
  startAt: string;
  endAt: string;
  taskId: string | null;
  taskTitleSnapshot: string | null;
  storyPointsLoad: number;
  reason: string | null;
}

export interface PlannerAutoSchedulePreview {
  weekStart: string;
  weekEnd: string;
  timeZone: string;
  proposedBlocks: PlannerProposedBlock[];
  velocity: PlannerVelocity;
  blockedDates?: string[];
}

export interface PlannerSchedulingExceptionCreatePayload {
  startDate: string;
  endDate?: string;
  kind?: PlannerBlockingKind;
  label?: string;
}

export interface PlannerAutoScheduleCommitPayload {
  weekStart: string;
  blocks: PlannerProposedBlock[];
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
