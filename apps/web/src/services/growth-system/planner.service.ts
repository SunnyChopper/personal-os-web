import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type {
  CookedTaskResult,
  OneThingSelection,
  OneThingCandidate,
  PlannerBlock,
  PlannerWeek,
} from '@/types/planner';

export const plannerService = {
  getWeek: (weekStart: string): Promise<ApiResponse<PlannerWeek>> =>
    apiClient.get<PlannerWeek>(
      `/growth-system/planner/week?weekStart=${encodeURIComponent(weekStart)}`
    ),

  generateWeek: (
    weekStart: string,
    includeLlmSchedule = true
  ): Promise<ApiResponse<PlannerWeek>> =>
    apiClient.post<PlannerWeek>('/growth-system/planner/generate', {
      weekStart,
      includeLlmSchedule,
    }),

  autoSchedule: (weekStart: string): Promise<ApiResponse<PlannerWeek>> =>
    apiClient.post<PlannerWeek>('/growth-system/planner/auto-schedule', { weekStart }),

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

  suggestOneThing: (targetDate: string): Promise<
    ApiResponse<{ candidates: OneThingCandidate[]; targetDate: string }>
  > =>
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
