import { apiClient } from '@/lib/api-client';
import type {
  AmbientActionId,
  AmbientActionResult,
  AmbientEntityRef,
  AmbientPresenceData,
  AmbientSurface,
} from '@/types/chatbot';

function throwAmbientError(error: { message?: string; code?: string }): void {
  const err = new Error(error.message ?? 'Request failed') as Error & { code?: string };
  if (error.code) err.code = error.code;
  throw err;
}

export const ambientPresenceService = {
  async getAmbient(surface: AmbientSurface, signal?: AbortSignal): Promise<AmbientPresenceData> {
    const response = await apiClient.getAssistantAmbient(surface, { signal });
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throwAmbientError(response.error);
    }
    throw new Error('Failed to fetch ambient presence');
  },

  async executeAction(body: {
    surface: AmbientSurface;
    whisperId: string;
    actionId: AmbientActionId;
    entityRef?: AmbientEntityRef;
  }): Promise<AmbientActionResult> {
    const response = await apiClient.postAssistantAmbientAction(body);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to execute ambient action');
  },

  async dismiss(body: {
    surface: AmbientSurface;
    whisperId: string;
    ledgerEntryId?: string;
  }): Promise<void> {
    const response = await apiClient.postAssistantAmbientDismiss(body);
    if (response.success) {
      return;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to dismiss ambient whisper');
  },
};
