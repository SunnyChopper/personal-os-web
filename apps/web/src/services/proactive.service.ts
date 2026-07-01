import { apiClient } from '@/lib/api-client';
import type {
  ApiResponse,
  NotificationWebhookConfig,
  ProactiveAutomation,
  ProactiveAutomationRunsList,
  ProactiveBrainstormResult,
  ProactiveDispatchRunResult,
  ProactiveEmailTestResult,
  ProactiveSuggestion,
  ProactiveWebhookTestResult,
  RecoveryNotificationsConfig,
} from '@/types/api-contracts';

export const proactiveService = {
  getAutomations(): Promise<ApiResponse<ProactiveAutomation[]>> {
    return apiClient.getProactiveAutomations();
  },

  getAutomationRuns(automationId: string): Promise<ApiResponse<ProactiveAutomationRunsList>> {
    return apiClient.getProactiveAutomationRuns(automationId);
  },

  createAutomation(
    body: Parameters<typeof apiClient.createProactiveAutomation>[0]
  ): Promise<ApiResponse<ProactiveAutomation>> {
    return apiClient.createProactiveAutomation(body);
  },

  updateAutomation(
    id: string,
    body: Parameters<typeof apiClient.updateProactiveAutomation>[1]
  ): Promise<ApiResponse<ProactiveAutomation>> {
    return apiClient.updateProactiveAutomation(id, body);
  },

  deleteAutomation(id: string): Promise<ApiResponse<void>> {
    return apiClient.deleteProactiveAutomation(id);
  },

  getSuggestions(): Promise<ApiResponse<ProactiveSuggestion[]>> {
    return apiClient.getProactiveSuggestions();
  },

  resolveSuggestion(
    id: string,
    body: Parameters<typeof apiClient.resolveProactiveSuggestion>[1]
  ): Promise<ApiResponse<ProactiveSuggestion>> {
    return apiClient.resolveProactiveSuggestion(id, body);
  },

  patchSuggestion(
    id: string,
    body: Parameters<typeof apiClient.patchProactiveSuggestion>[1]
  ): Promise<ApiResponse<ProactiveSuggestion>> {
    return apiClient.patchProactiveSuggestion(id, body);
  },

  brainstormSuggestions(
    body?: Parameters<typeof apiClient.brainstormProactiveSuggestions>[0]
  ): Promise<ApiResponse<ProactiveBrainstormResult>> {
    return apiClient.brainstormProactiveSuggestions(body);
  },

  sendTestEmail(): Promise<ApiResponse<ProactiveEmailTestResult>> {
    return apiClient.sendProactiveTestEmail();
  },

  sendTestWebhook(): Promise<ApiResponse<ProactiveWebhookTestResult>> {
    return apiClient.sendProactiveTestWebhook();
  },

  runAutomationDispatchTest(
    automationId: string
  ): Promise<ApiResponse<ProactiveDispatchRunResult>> {
    return apiClient.runProactiveAutomationDispatchTest(automationId);
  },

  getTimeZone(): Promise<ApiResponse<{ timeZone: string }>> {
    return apiClient.getPreferencesTimeZone();
  },

  setTimeZone(body: { timeZone: string }): Promise<ApiResponse<{ timeZone: string }>> {
    return apiClient.setPreferencesTimeZone(body);
  },

  getNotificationWebhook(): Promise<ApiResponse<NotificationWebhookConfig>> {
    return apiClient.getNotificationWebhook();
  },

  setNotificationWebhook(
    body: NotificationWebhookConfig
  ): Promise<ApiResponse<NotificationWebhookConfig>> {
    return apiClient.setNotificationWebhook(body);
  },

  getRecoveryNotifications(): Promise<ApiResponse<RecoveryNotificationsConfig>> {
    return apiClient.getRecoveryNotifications();
  },

  setRecoveryNotifications(
    body: RecoveryNotificationsConfig
  ): Promise<ApiResponse<RecoveryNotificationsConfig>> {
    return apiClient.setRecoveryNotifications(body);
  },
};
