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
import { apiClient } from '@/lib/api-client';

export const chatbotService = {
  async getThreads(): Promise<ChatThread[]> {
    const response = await apiClient.getChatThreads();
    if (response.success && response.data) {
      return response.data.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to fetch threads');
  },

  async getThread(id: string): Promise<ChatThread | null> {
    const response = await apiClient.getChatThread(id);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error?.code === 'NOT_FOUND' || response.error?.code === 'HTTP_404') {
      return null;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to fetch thread');
  },

  async createThread(request: CreateThreadRequest): Promise<ChatThread> {
    const response = await apiClient.createChatThread(request);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to create thread');
  },

  async updateThread(request: UpdateThreadRequest): Promise<ChatThread> {
    const { id, ...body } = request;
    const response = await apiClient.updateChatThread(id, body);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to update thread');
  },

  async deleteThread(id: string): Promise<void> {
    const response = await apiClient.deleteChatThread(id);
    if (!response.success) {
      if (response.error) {
        throw response.error;
      }
      throw new Error('Failed to delete thread');
    }
  },

  async getAssistantModelCatalog(): Promise<AssistantModelCatalogData> {
    const response = await apiClient.getAssistantModelCatalog();
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to fetch assistant model catalog');
  },

  async getMessages(threadId: string): Promise<ChatMessage[]> {
    const response = await apiClient.getChatMessages(threadId);
    if (response.success && response.data) {
      return response.data.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to fetch messages');
  },

  async getMessageTree(threadId: string): Promise<MessageTreeResponse> {
    const response = await apiClient.getChatMessageTree(threadId);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to fetch message tree');
  },

  async createMessage(request: CreateMessageRequest): Promise<ChatMessage> {
    const response = await apiClient.createChatMessage(request);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to create message');
  },

  async editMessage(
    threadId: string,
    messageId: string,
    data: EditMessageRequest
  ): Promise<ChatMessage> {
    const response = await apiClient.editChatMessage(threadId, messageId, data);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to edit message');
  },

  async getThreadContextUsage(
    threadId: string,
    params?: { leafMessageId?: string; runConfig?: AssistantRunConfig }
  ): Promise<ThreadContextUsage> {
    const response = await apiClient.postAssistantThreadContextUsage(threadId, {
      leafMessageId: params?.leafMessageId,
      runConfig: params?.runConfig,
    });
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to load thread context usage');
  },

  async compactThreadContext(
    threadId: string,
    params?: { leafMessageId?: string; runConfig?: AssistantRunConfig }
  ): Promise<ThreadContextUsage> {
    const response = await apiClient.postAssistantThreadCompact(threadId, {
      leafMessageId: params?.leafMessageId,
      runConfig: params?.runConfig,
    });
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error) {
      throw response.error;
    }
    throw new Error('Failed to compact thread context');
  },
};
