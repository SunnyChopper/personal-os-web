import { apiClient } from '@/lib/api-client';
import {
  EstablishedHabitAiEnvelopeSchema,
  type EstablishedHabitActionType,
  type EstablishedHabitAiEnvelope,
  type EstablishedHabitSuggestedPatch,
} from '@/lib/llm/schemas/habit-established-ai-schemas';
import type { ApiResponse } from '@/types/api-contracts';
import type { UpdateHabitInput } from '@/types/growth-system';

export function suggestedPatchToUpdateInput(
  patch: EstablishedHabitSuggestedPatch
): UpdateHabitInput {
  const out: UpdateHabitInput = {};
  if (patch.trigger !== undefined) out.trigger = patch.trigger;
  if (patch.action !== undefined) out.action = patch.action;
  if (patch.reward !== undefined) out.reward = patch.reward;
  if (patch.dailyTarget !== undefined) out.dailyTarget = patch.dailyTarget;
  if (patch.weeklyTarget !== undefined) out.weeklyTarget = patch.weeklyTarget;
  if (patch.frictionUp !== undefined) out.frictionUp = patch.frictionUp;
  if (patch.frictionDown !== undefined) out.frictionDown = patch.frictionDown;
  if (patch.notes !== undefined) out.notes = patch.notes;
  return out;
}

export const habitAIService = {
  async runEstablishedAction(params: {
    habitId: string;
    actionType: EstablishedHabitActionType;
    provider?: string;
    useCache?: boolean;
  }): Promise<ApiResponse<EstablishedHabitAiEnvelope>> {
    const body: Record<string, unknown> = {
      habitId: params.habitId,
      actionType: params.actionType,
      useCache: params.useCache ?? true,
    };
    if (params.provider !== undefined) {
      body.provider = params.provider;
    }

    return apiClient.post('/ai/habits/established-actions', body, EstablishedHabitAiEnvelopeSchema);
  },
};
