import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type {
  CommitPlanDayPayload,
  CookedTaskResult,
  OneThingSelection,
  OneThingCandidate,
  PlanDay,
  PlannerRolloverAction,
  PlannerRolloverDecision,
  PlannerAutoScheduleCommitPayload,
  PlannerAutoSchedulePreview,
  PlannerBlock,
  PlannerBlockingContext,
  PlannerSchedulingExceptionCreatePayload,
  PlannerKillSwitchPayload,
  PlannerKillSwitchResult,
  PlannerWeek,
} from '@/types/planner';

export const plannerService = {
  getWeek: (weekStart: string): Promise<ApiResponse<PlannerWeek>> =>
    apiClient.get<PlannerWeek>(
      `/growth-system/planner/week?weekStart=${encodeURIComponent(weekStart)}`
    ),

  getPlanDay: (date: string): Promise<ApiResponse<PlanDay>> =>
    apiClient.get<PlanDay>(`/growth-system/planner/plan-day?date=${encodeURIComponent(date)}`),

  commitPlanDay: (body: CommitPlanDayPayload): Promise<ApiResponse<PlannerWeek>> =>
    apiClient.post<PlannerWeek>('/growth-system/planner/plan-day', body),

  applyKillSwitch: (
    body: PlannerKillSwitchPayload
  ): Promise<ApiResponse<PlannerKillSwitchResult>> =>
    apiClient.post<PlannerKillSwitchResult>('/growth-system/planner/kill-switch', body),

  generateWeek: (weekStart: string, includeLlmSchedule = true): Promise<ApiResponse<PlannerWeek>> =>
    apiClient.post<PlannerWeek>('/growth-system/planner/generate', {
      weekStart,
      includeLlmSchedule,
    }),

  autoSchedule: (weekStart: string): Promise<ApiResponse<PlannerWeek>> =>
    apiClient.post<PlannerWeek>('/growth-system/planner/auto-schedule', { weekStart }),

  autoSchedulePreview: (weekStart: string): Promise<ApiResponse<PlannerAutoSchedulePreview>> =>
    apiClient.post<PlannerAutoSchedulePreview>('/growth-system/planner/auto-schedule/preview', {
      weekStart,
    }),

  listSchedulingExceptions: (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{ items: PlannerBlockingContext[] }>> =>
    apiClient.get<{ items: PlannerBlockingContext[] }>(
      `/growth-system/planner/scheduling-exceptions?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    ),

  createSchedulingException: (
    body: PlannerSchedulingExceptionCreatePayload
  ): Promise<ApiResponse<PlannerBlockingContext>> =>
    apiClient.post<PlannerBlockingContext>('/growth-system/planner/scheduling-exceptions', body),

  deleteSchedulingException: (exceptionId: string): Promise<ApiResponse<{ deleted: boolean }>> =>
    apiClient.delete(
      `/growth-system/planner/scheduling-exceptions/${encodeURIComponent(exceptionId)}`
    ),

  autoScheduleCommit: (
    payload: PlannerAutoScheduleCommitPayload
  ): Promise<ApiResponse<PlannerWeek>> =>
    apiClient.post<PlannerWeek>('/growth-system/planner/auto-schedule/commit', payload),

  applyRolloverDecision: (
    rolloverId: string,
    action: PlannerRolloverAction
  ): Promise<ApiResponse<PlannerRolloverDecision>> =>
    apiClient.patch<PlannerRolloverDecision>(
      `/growth-system/planner/rollovers/${encodeURIComponent(rolloverId)}`,
      { action }
    ),

  moveBlock: (
    blockId: string,
    body: { date?: string; startAt: string; endAt: string }
  ): Promise<ApiResponse<PlannerBlock>> =>
    apiClient.patch<PlannerBlock>(
      `/growth-system/planner/blocks/${encodeURIComponent(blockId)}`,
      body
    ),

  deleteBlock: (blockId: string): Promise<ApiResponse<{ deleted: boolean }>> =>
    apiClient.delete(`/growth-system/planner/blocks/${encodeURIComponent(blockId)}`),

  getOneThing: (date: string): Promise<ApiResponse<OneThingSelection>> =>
    apiClient.get<OneThingSelection>(
      `/growth-system/planner/one-thing?date=${encodeURIComponent(date)}`
    ),

  suggestOneThing: (
    targetDate: string
  ): Promise<ApiResponse<{ candidates: OneThingCandidate[]; targetDate: string }>> =>
    apiClient.post(
      `/growth-system/planner/one-thing/suggestions?targetDate=${encodeURIComponent(targetDate)}`,
      {}
    ),

  setOneThing: (body: {
    targetDate: string;
    taskId: string;
    selectionReason?: string;
  }): Promise<ApiResponse<OneThingSelection>> =>
    apiClient.put<OneThingSelection>('/growth-system/planner/one-thing', body),

  rescueTask: (
    taskId: string,
    body?: { targetDate?: string }
  ): Promise<ApiResponse<CookedTaskResult>> =>
    apiClient.post<CookedTaskResult>(
      `/growth-system/planner/tasks/${encodeURIComponent(taskId)}/rescue`,
      body ?? {}
    ),
};
