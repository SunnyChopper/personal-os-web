import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  ApiError,
  NoteDraft,
  ModePreference,
  AssistantToolApprovalConfig,
  AssistantMemoryIngestionConfig,
  AssistantSettingsConfig,
  AssistantToolRegistryEntry,
  DashboardSummaryResponse,
  DashboardSummaryRequest,
  ProactiveAutomation,
  ProactiveDispatchJob,
  ProactiveDispatchRunResult,
  ProactiveEmailTestResult,
  ProactiveBrainstormResult,
  ProactiveAutomationRunsList,
  ProactiveSuggestion,
} from '@/types/api-contracts';
import { authService } from '@/lib/auth/auth.service';
import { isAdminLoginPath, ROUTES } from '@/routes';
import type { z } from 'zod';
import type { AIFeature, FeatureProviderConfig } from '@/lib/llm/config/feature-types';
import type {
  AssistantModelCatalogData,
  AssistantRunConfig,
  ChatThread,
  ChatMessage,
  CreateThreadRequest,
  CreateMessageRequest,
  EditMessageRequest,
  MessageTreeResponse,
  ThreadContextUsage,
  UpdateThreadRequest,
} from '@/types/chatbot';
import { apiLogger } from '@/lib/logger';
import { getResolvedApiBaseUrl } from '@/lib/vite-public-env';

const API_BASE_URL = getResolvedApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(baseUrl: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.initializeTokenFromStorage();
    this.setupInterceptors();
  }

  private initializeTokenFromStorage() {
    try {
      const tokens = authService.getStoredTokens();
      if (tokens?.accessToken) {
        apiLogger.log('Initializing token from storage on construction');
        this.authToken = tokens.accessToken;
      } else {
        apiLogger.log('No token found in storage on construction');
      }
    } catch (error) {
      apiLogger.warn('Error initializing token from storage:', error);
    }
  }

  private setupInterceptors() {
    // Request interceptor: automatically attaches JWT to all API requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.authToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
          apiLogger.log('Request interceptor: Token attached to request', {
            url: config.url,
            hasToken: !!this.authToken,
          });
        } else {
          apiLogger.warn('Request interceptor: No token available for request', {
            url: config.url,
            hasToken: !!this.authToken,
          });
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle 401 errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          apiLogger.log('401 error detected, attempting token refresh. URL:', originalRequest.url);
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshResponse = await authService.refreshToken();

            if (refreshResponse.success && refreshResponse.data) {
              this.authToken = refreshResponse.data.accessToken;

              // Update the original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${this.authToken}`;
              }

              // Process queued requests
              this.processQueue(null);

              // Retry the original request
              return this.client(originalRequest);
            } else {
              // Refresh failed, clear tokens and redirect to login
              apiLogger.log('Token refresh failed, clearing auth state');
              this.processQueue(new Error('Token refresh failed'));
              authService.clearTokensOnly();
              this.authToken = null;

              // Only redirect if not already on login page to prevent infinite loops
              if (typeof window !== 'undefined' && !isAdminLoginPath(window.location.pathname)) {
                apiLogger.log('Redirecting to login page');
                window.location.href = ROUTES.admin.login;
              } else {
                apiLogger.log('Already on login page, skipping redirect');
              }

              return Promise.reject(error);
            }
          } catch (refreshError) {
            apiLogger.log('Token refresh exception, clearing auth state:', refreshError);
            this.processQueue(
              refreshError instanceof Error ? refreshError : new Error(String(refreshError))
            );
            authService.clearTokensOnly();
            this.authToken = null;

            // Only redirect if not already on login page to prevent infinite loops
            if (typeof window !== 'undefined' && !isAdminLoginPath(window.location.pathname)) {
              apiLogger.log('Redirecting to login page');
              window.location.href = ROUTES.admin.login;
            } else {
              apiLogger.log('Already on login page, skipping redirect');
            }

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: Error | null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });

    this.failedQueue = [];
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    apiLogger.log('Token set:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    });
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        message?: string;
        code?: string;
        details?: Record<string, unknown>;
      }>;

      if (axiosError.response) {
        return {
          message: axiosError.response.data?.message || axiosError.message || 'Request failed',
          code: axiosError.response.data?.code || `HTTP_${axiosError.response.status}`,
          details: axiosError.response.data?.details,
        };
      }

      if (axiosError.request) {
        // Check for specific network error codes
        const errorCode = axiosError.code || axiosError.message;
        let networkErrorCode = 'NETWORK_ERROR';
        let networkErrorMessage = 'No response received from server';

        // Detect connection refused errors
        if (
          errorCode === 'ERR_CONNECTION_REFUSED' ||
          errorCode === 'ECONNREFUSED' ||
          errorCode?.includes('CONNECTION_REFUSED') ||
          axiosError.message?.includes('CONNECTION_REFUSED')
        ) {
          networkErrorCode = 'ERR_CONNECTION_REFUSED';
          networkErrorMessage =
            'Backend server is not responding. Please check if the server is running.';
        }
        // Detect timeout errors
        else if (
          errorCode === 'ETIMEDOUT' ||
          errorCode === 'ERR_NETWORK' ||
          errorCode?.includes('TIMEDOUT') ||
          axiosError.message?.includes('timeout')
        ) {
          networkErrorCode = 'ETIMEDOUT';
          networkErrorMessage = 'Request timed out. The server may be slow or unavailable.';
        }
        // Detect network errors
        else if (
          errorCode === 'ERR_NETWORK' ||
          errorCode?.includes('NETWORK') ||
          axiosError.message?.includes('Network Error')
        ) {
          networkErrorCode = 'NETWORK_ERROR';
          networkErrorMessage = 'Network error. Please check your internet connection.';
        }

        return {
          message: networkErrorMessage,
          code: networkErrorCode,
        };
      }
    }

    return {
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Validates response data against a Zod schema
   * Only runs in development mode to avoid performance impact in production
   */
  private validateResponse<T>(
    data: unknown,
    schema?: z.ZodSchema<T>
  ): { valid: boolean; data?: T; error?: string } {
    if (!schema) {
      return { valid: true, data: data as T };
    }

    // Only validate in development
    if (import.meta.env.DEV) {
      const result = schema.safeParse(data);
      if (!result.success) {
        const errorMessage = `API response validation failed: ${result.error.issues
          .map((issue) => {
            const pathStr = issue.path.map((p) => String(p)).join('.');
            return `${pathStr}: ${issue.message}`;
          })
          .join(', ')}`;
        apiLogger.error('Validation Error:', errorMessage, {
          errors: result.error.issues,
          data,
        });
        return { valid: false, error: errorMessage };
      }
      return { valid: true, data: result.data };
    }

    return { valid: true, data: data as T };
  }

  async get<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(endpoint);
      const backendResponse = response.data;

      // Check if backend wrapped the response
      if (backendResponse && typeof backendResponse === 'object' && 'success' in backendResponse) {
        // Validate data if schema provided and response is successful
        if (backendResponse.success && backendResponse.data && schema) {
          const validation = this.validateResponse(backendResponse.data, schema);
          if (!validation.valid) {
            return {
              success: false,
              error: {
                message: validation.error || 'Response validation failed',
                code: 'VALIDATION_ERROR',
              },
            };
          }
          return {
            ...backendResponse,
            data: validation.data,
          };
        }
        return backendResponse;
      }

      // Fallback for non-wrapped responses
      const data = backendResponse as T;
      if (schema) {
        const validation = this.validateResponse(data, schema);
        if (!validation.valid) {
          return {
            success: false,
            error: {
              message: validation.error || 'Response validation failed',
              code: 'VALIDATION_ERROR',
            },
          };
        }
        return {
          success: true,
          data: validation.data,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      // Handle error responses from backend
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as ApiResponse<T>;
        if (
          errorData &&
          typeof errorData === 'object' &&
          'success' in errorData &&
          !errorData.success
        ) {
          return errorData;
        }
      }

      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    schema?: z.ZodSchema<T>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(endpoint, body);
      const backendResponse = response.data;

      // Check if backend wrapped the response
      if (backendResponse && typeof backendResponse === 'object' && 'success' in backendResponse) {
        // Validate data if schema provided and response is successful
        if (backendResponse.success && backendResponse.data && schema) {
          const validation = this.validateResponse(backendResponse.data, schema);
          if (!validation.valid) {
            return {
              success: false,
              error: {
                message: validation.error || 'Response validation failed',
                code: 'VALIDATION_ERROR',
              },
            };
          }
          return {
            ...backendResponse,
            data: validation.data,
          };
        }
        return backendResponse;
      }

      // Fallback for non-wrapped responses
      const data = backendResponse as T;
      if (schema) {
        const validation = this.validateResponse(data, schema);
        if (!validation.valid) {
          return {
            success: false,
            error: {
              message: validation.error || 'Response validation failed',
              code: 'VALIDATION_ERROR',
            },
          };
        }
        return {
          success: true,
          data: validation.data,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      // Handle error responses from backend
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as ApiResponse<T>;
        if (
          errorData &&
          typeof errorData === 'object' &&
          'success' in errorData &&
          !errorData.success
        ) {
          return errorData;
        }
      }

      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    _schema?: z.ZodSchema<T>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(endpoint, body);
      const backendResponse = response.data;

      // Check if backend wrapped the response
      if (backendResponse && typeof backendResponse === 'object' && 'success' in backendResponse) {
        return backendResponse;
      }

      // Fallback for non-wrapped responses
      return {
        success: true,
        data: backendResponse as T,
      };
    } catch (error) {
      // Handle error responses from backend
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as ApiResponse<T>;
        if (
          errorData &&
          typeof errorData === 'object' &&
          'success' in errorData &&
          !errorData.success
        ) {
          return errorData;
        }
      }

      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    _schema?: z.ZodSchema<T>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(endpoint, body);
      const backendResponse = response.data;

      // Check if backend wrapped the response
      if (backendResponse && typeof backendResponse === 'object' && 'success' in backendResponse) {
        return backendResponse;
      }

      // Fallback for non-wrapped responses
      return {
        success: true,
        data: backendResponse as T,
      };
    } catch (error) {
      // Handle error responses from backend
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as ApiResponse<T>;
        if (
          errorData &&
          typeof errorData === 'object' &&
          'success' in errorData &&
          !errorData.success
        ) {
          return errorData;
        }
      }

      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async delete<T>(endpoint: string, _schema?: z.ZodSchema<T>): Promise<ApiResponse<T>> {
    try {
      apiLogger.log(`[ApiClient] Making DELETE request to: ${endpoint}`);
      const response = await this.client.delete<ApiResponse<T>>(endpoint);
      const backendResponse = response.data;

      apiLogger.log(`[ApiClient] DELETE request successful: ${endpoint}`, {
        status: response.status,
        hasData: !!backendResponse,
      });

      // Check if backend wrapped the response
      if (backendResponse && typeof backendResponse === 'object' && 'success' in backendResponse) {
        return backendResponse;
      }

      // Fallback for non-wrapped responses
      return {
        success: true,
        data: backendResponse as T,
      };
    } catch (error) {
      apiLogger.error(`[ApiClient] DELETE request failed: ${endpoint}`, error);

      // Handle error responses from backend
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as ApiResponse<T>;
        if (
          errorData &&
          typeof errorData === 'object' &&
          'success' in errorData &&
          !errorData.success
        ) {
          return errorData;
        }
      }

      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  // Chatbot
  async getChatThreads(): Promise<ApiResponse<ChatThread[]>> {
    return this.get<ChatThread[]>('/assistant/threads');
  }

  async getChatThread(id: string): Promise<ApiResponse<ChatThread>> {
    return this.get<ChatThread>(`/assistant/threads/${id}`);
  }

  async createChatThread(data: CreateThreadRequest): Promise<ApiResponse<ChatThread>> {
    return this.post<ChatThread>('/assistant/threads', data);
  }

  async updateChatThread(
    id: string,
    data: Omit<UpdateThreadRequest, 'id'>
  ): Promise<ApiResponse<ChatThread>> {
    return this.patch<ChatThread>(`/assistant/threads/${id}`, data);
  }

  async deleteChatThread(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/assistant/threads/${id}`);
  }

  async getChatMessages(threadId: string): Promise<ApiResponse<ChatMessage[]>> {
    return this.get<ChatMessage[]>(`/assistant/threads/${threadId}/messages`);
  }

  async getChatMessageTree(threadId: string): Promise<ApiResponse<MessageTreeResponse>> {
    return this.get<MessageTreeResponse>(`/assistant/threads/${threadId}/messages/tree`);
  }

  async createChatMessage(data: CreateMessageRequest): Promise<ApiResponse<ChatMessage>> {
    return this.post<ChatMessage>('/assistant/messages', data);
  }

  async editChatMessage(
    threadId: string,
    messageId: string,
    data: EditMessageRequest
  ): Promise<ApiResponse<ChatMessage>> {
    return this.patch<ChatMessage>(`/assistant/threads/${threadId}/messages/${messageId}`, data);
  }

  async postAssistantThreadContextUsage(
    threadId: string,
    body: { leafMessageId?: string; runConfig?: AssistantRunConfig }
  ): Promise<ApiResponse<ThreadContextUsage>> {
    return this.post<ThreadContextUsage>(`/assistant/threads/${threadId}/context-usage`, body);
  }

  async postAssistantThreadCompact(
    threadId: string,
    body: { leafMessageId?: string; runConfig?: AssistantRunConfig }
  ): Promise<ApiResponse<ThreadContextUsage>> {
    return this.post<ThreadContextUsage>(`/assistant/threads/${threadId}/compact`, body);
  }

  // Draft Notes
  async getDraftNote(): Promise<ApiResponse<NoteDraft | null>> {
    return this.get<NoteDraft | null>('/drafts/notes');
  }

  async saveDraftNote(draft: NoteDraft): Promise<ApiResponse<void>> {
    return this.post<void>('/drafts/notes', draft);
  }

  async deleteDraftNote(): Promise<ApiResponse<void>> {
    return this.delete<void>('/drafts/notes');
  }

  // Mode Preferences
  async getModePreference(): Promise<ApiResponse<'work' | 'leisure'>> {
    const response = await this.get<ModePreference>('/preferences/mode');
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.mode,
      };
    }
    return {
      success: false,
      error: response.error,
    };
  }

  async setModePreference(mode: 'work' | 'leisure'): Promise<ApiResponse<void>> {
    return this.post<void>('/preferences/mode', { mode });
  }

  // Dashboard Summary (aggregated endpoint)
  async getDashboardSummary(
    options?: DashboardSummaryRequest
  ): Promise<ApiResponse<DashboardSummaryResponse>> {
    const queryParams = new URLSearchParams();
    if (options?.includeCompleted !== undefined) {
      queryParams.append('includeCompleted', String(options.includeCompleted));
    }
    if (options?.taskLimit) {
      queryParams.append('taskLimit', String(options.taskLimit));
    }
    if (options?.transactionLimit) {
      queryParams.append('transactionLimit', String(options.transactionLimit));
    }

    const endpoint = `/dashboard/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.get<DashboardSummaryResponse>(endpoint);
  }

  // Feature Configs
  async getFeatureConfigs(): Promise<ApiResponse<Record<AIFeature, FeatureProviderConfig>>> {
    return this.get<Record<AIFeature, FeatureProviderConfig>>('/preferences/feature-configs');
  }

  async setFeatureConfig(
    feature: AIFeature,
    config: FeatureProviderConfig
  ): Promise<ApiResponse<void>> {
    return this.post<void>(`/preferences/feature-configs/${feature}`, config);
  }

  async resetFeatureConfig(feature: AIFeature): Promise<ApiResponse<void>> {
    return this.delete<void>(`/preferences/feature-configs/${feature}`);
  }

  async getAssistantSettings(): Promise<ApiResponse<AssistantSettingsConfig>> {
    return this.get<AssistantSettingsConfig>('/preferences/assistant-settings');
  }

  async setAssistantSettings(body: {
    toolApproval: AssistantToolApprovalConfig;
    memoryIngestion: AssistantMemoryIngestionConfig;
  }): Promise<ApiResponse<AssistantSettingsConfig>> {
    return this.put<AssistantSettingsConfig>('/preferences/assistant-settings', body);
  }

  async resetAssistantMemoryIngestion(): Promise<ApiResponse<AssistantSettingsConfig>> {
    return this.delete<AssistantSettingsConfig>('/preferences/assistant-settings/memory-ingestion');
  }

  async getAssistantToolApprovalConfig(): Promise<ApiResponse<AssistantToolApprovalConfig>> {
    return this.get<AssistantToolApprovalConfig>('/preferences/assistant-tools');
  }

  async setAssistantToolApprovalConfig(
    body: AssistantToolApprovalConfig
  ): Promise<ApiResponse<AssistantToolApprovalConfig>> {
    return this.put<AssistantToolApprovalConfig>('/preferences/assistant-tools', body);
  }

  async getAssistantToolRegistry(): Promise<ApiResponse<AssistantToolRegistryEntry[]>> {
    return this.get<AssistantToolRegistryEntry[]>('/assistant/tool-registry');
  }

  async getAssistantModelCatalog(): Promise<ApiResponse<AssistantModelCatalogData>> {
    return this.get<AssistantModelCatalogData>('/assistant/model-catalog');
  }

  async getProactiveAutomations(): Promise<ApiResponse<ProactiveAutomation[]>> {
    return this.get<ProactiveAutomation[]>('/proactive/automations');
  }

  async getProactiveAutomationRuns(
    automationId: string
  ): Promise<ApiResponse<ProactiveAutomationRunsList>> {
    return this.get<ProactiveAutomationRunsList>(`/proactive/automations/${automationId}/runs`);
  }

  async runProactiveDispatchTest(): Promise<ApiResponse<ProactiveDispatchRunResult>> {
    return this.post<ProactiveDispatchRunResult>('/proactive/dispatch/test', {});
  }

  async getProactiveDispatchJob(jobId: string): Promise<ApiResponse<ProactiveDispatchJob>> {
    return this.get<ProactiveDispatchJob>(`/proactive/dispatch/jobs/${jobId}`);
  }

  /**
   * Queue a single-automation test run and poll until it finishes (async on AWS via worker Lambda).
   */
  async runProactiveAutomationDispatchTest(
    automationId: string
  ): Promise<ApiResponse<ProactiveDispatchRunResult>> {
    const start = await this.post<ProactiveDispatchJob>(
      `/proactive/automations/${automationId}/dispatch/test`,
      {}
    );
    if (!start.success || !start.data) {
      return {
        success: false,
        error: start.error ?? { message: 'Failed to queue automation test', code: 'UNKNOWN_ERROR' },
      };
    }
    const jobId = start.data.id;
    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const st = await this.getProactiveDispatchJob(jobId);
      if (!st.success || !st.data) {
        return {
          success: false,
          error: st.error ?? { message: 'Failed to poll dispatch job', code: 'UNKNOWN_ERROR' },
        };
      }
      const { status, errorMessage } = st.data;
      if (status === 'succeeded') {
        return {
          success: true,
          data: { processedUsers: 1, ran: 1, errors: [] },
        };
      }
      if (status === 'failed') {
        return {
          success: true,
          data: {
            processedUsers: 1,
            ran: 0,
            errors: [
              {
                userId: '',
                automationId: st.data.automationId,
                error: errorMessage ?? 'Run failed',
              },
            ],
          },
        };
      }
    }
    return {
      success: false,
      error: {
        message:
          'Automation test is still running after 5 minutes. Refresh this page and check the automation row (last run / error).',
        code: 'TIMEOUT',
      },
    };
  }

  async sendProactiveTestEmail(): Promise<ApiResponse<ProactiveEmailTestResult>> {
    return this.post<ProactiveEmailTestResult>('/proactive/email/test', {});
  }

  async createProactiveAutomation(
    body: Record<string, unknown>
  ): Promise<ApiResponse<ProactiveAutomation>> {
    return this.post<ProactiveAutomation>('/proactive/automations', body);
  }

  async updateProactiveAutomation(
    id: string,
    body: Record<string, unknown>
  ): Promise<ApiResponse<ProactiveAutomation>> {
    return this.patch<ProactiveAutomation>(`/proactive/automations/${id}`, body);
  }

  async deleteProactiveAutomation(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/proactive/automations/${id}`);
  }

  async getProactiveSuggestions(): Promise<ApiResponse<ProactiveSuggestion[]>> {
    return this.get<ProactiveSuggestion[]>('/proactive/suggestions');
  }

  async resolveProactiveSuggestion(
    id: string,
    body: {
      approve: boolean;
      feedback?: string;
      resolvedPayload?: Record<string, unknown>;
    }
  ): Promise<ApiResponse<ProactiveSuggestion>> {
    return this.post<ProactiveSuggestion>(`/proactive/suggestions/${id}/resolve`, body);
  }

  /** Update feedback and/or proposed payload on a rejected suggestion only. */
  async patchProactiveSuggestion(
    id: string,
    body: { feedback?: string; proposedPayload?: Record<string, unknown> }
  ): Promise<ApiResponse<ProactiveSuggestion>> {
    return this.patch<ProactiveSuggestion>(`/proactive/suggestions/${id}`, body);
  }

  /** LLM brainstorm: dashboard + LTM context → pending suggestions. */
  async brainstormProactiveSuggestions(body?: {
    timeZone?: string;
    /** Omit for default OpenAI model. Use GET /assistant/model-catalog ``id`` (e.g. openai:gpt-5.4-mini) or legacy API model id strings. */
    model?: string;
  }): Promise<ApiResponse<ProactiveBrainstormResult>> {
    return this.post<ProactiveBrainstormResult>('/proactive/suggestions/brainstorm', body ?? {});
  }

  async getPreferencesTimeZone(): Promise<ApiResponse<{ timeZone: string }>> {
    return this.get<{ timeZone: string }>('/preferences/time-zone');
  }

  async setPreferencesTimeZone(body: {
    timeZone: string;
  }): Promise<ApiResponse<{ timeZone: string }>> {
    return this.put<{ timeZone: string }>('/preferences/time-zone', body);
  }

  async getPreferencesWeeklyReviewDay(): Promise<ApiResponse<{ weeklyReviewDay: number }>> {
    return this.get<{ weeklyReviewDay: number }>('/preferences/weekly-review-day');
  }

  async setPreferencesWeeklyReviewDay(body: {
    weeklyReviewDay: number;
  }): Promise<ApiResponse<{ weeklyReviewDay: number }>> {
    return this.put<{ weeklyReviewDay: number }>('/preferences/weekly-review-day', body);
  }
}

export const apiClient = new ApiClient();
