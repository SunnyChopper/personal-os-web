import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotService } from '@/services/chatbot.service';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError } from '@/lib/react-query/error-utils';
import {
  patchChatMessageCache,
  removeChatMessageCache,
  removeChatThreadCache,
  removeNodeFromTree,
  replaceMessageTreeCache,
  upsertChatMessageCache,
  upsertChatThreadCache,
  upsertMessageTreeNodeCache,
} from '@/lib/react-query/chatbot-cache';
import { reportMutationError } from '@/hooks/chatbot/chatbot-query-shared';
import type {
  ChatMessage,
  CreateMessageRequest,
  CreateThreadRequest,
  EditMessageRequest,
  MessageTreeResponse,
  UpdateThreadRequest,
} from '@/types/chatbot';

export function useChatThreadMutations() {
  const queryClient = useQueryClient();
  const { recordError } = useBackendStatus();
  const handleMutationError = (error: unknown) => reportMutationError(error, recordError);

  const createThread = useMutation({
    mutationFn: (request: CreateThreadRequest) => chatbotService.createThread(request),
    onSuccess: (thread) => {
      upsertChatThreadCache(queryClient, thread);
    },
    onError: handleMutationError,
  });

  const updateThread = useMutation({
    mutationFn: (request: UpdateThreadRequest) => chatbotService.updateThread(request),
    onSuccess: (thread) => {
      upsertChatThreadCache(queryClient, thread);
    },
    onError: handleMutationError,
  });

  const deleteThread = useMutation({
    mutationFn: (id: string) => chatbotService.deleteThread(id),
    onSuccess: (_response, threadId) => {
      removeChatThreadCache(queryClient, threadId);
    },
    onError: handleMutationError,
  });

  return {
    createThread: createThread.mutateAsync,
    updateThread: updateThread.mutateAsync,
    deleteThread: deleteThread.mutateAsync,
    isCreating: createThread.isPending,
    isUpdating: updateThread.isPending,
    isDeleting: deleteThread.isPending,
  };
}

export function useChatMessageMutations() {
  const queryClient = useQueryClient();
  const { recordError } = useBackendStatus();

  type CreateMessageInput = CreateMessageRequest & { clientMessageId?: string };
  type CreateMessageContext = {
    threadId: string;
    clientMessageId?: string;
    isOptimistic: boolean;
  };

  const handleMutationError = (error: unknown) => reportMutationError(error, recordError);

  const createMessage = useMutation({
    mutationFn: ({ clientMessageId: _clientMessageId, ...request }: CreateMessageInput) =>
      chatbotService.createMessage(request),
    onMutate: async (request: CreateMessageInput): Promise<CreateMessageContext> => {
      if (request.role !== 'user') {
        return { threadId: request.threadId, isOptimistic: false };
      }

      const optimisticId =
        request.clientMessageId || `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        threadId: request.threadId,
        role: request.role,
        content: request.content,
        thinking: request.thinking,
        metadata: request.metadata,
        createdAt: new Date().toISOString(),
        parentId: request.parentId,
        clientStatus: 'sending',
        clientMessageId: optimisticId,
      };

      upsertChatMessageCache(queryClient, optimisticMessage);
      upsertMessageTreeNodeCache(queryClient, request.threadId, optimisticMessage);

      return { threadId: request.threadId, clientMessageId: optimisticId, isOptimistic: true };
    },
    onSuccess: (message, _variables, context) => {
      if (context?.isOptimistic && context.clientMessageId) {
        removeChatMessageCache(queryClient, context.threadId, context.clientMessageId);
        const existingTree = queryClient.getQueryData<MessageTreeResponse>(
          queryKeys.chatbot.messages.tree(message.threadId)
        );
        if (existingTree) {
          const nextTree = removeNodeFromTree(existingTree, context.clientMessageId);
          replaceMessageTreeCache(queryClient, message.threadId, nextTree);
        }
      }
      upsertChatMessageCache(queryClient, message);
      upsertMessageTreeNodeCache(queryClient, message.threadId, message);
    },
    onError: (error, _variables, context) => {
      handleMutationError(error);
      if (context?.isOptimistic && context.clientMessageId) {
        const apiError = extractApiError(error);
        const errorMessage =
          apiError?.message || (error instanceof Error ? error.message : 'Message failed to send');

        patchChatMessageCache(
          queryClient,
          context.threadId,
          context.clientMessageId,
          (message) => ({
            ...message,
            clientStatus: 'failed',
            clientError: errorMessage,
          })
        );
      }
    },
  });

  return {
    createMessage: createMessage.mutateAsync,
    isCreating: createMessage.isPending,
  };
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  const { recordError } = useBackendStatus();
  const handleMutationError = (error: unknown) => reportMutationError(error, recordError);

  const editMessage = useMutation({
    mutationFn: ({
      threadId,
      messageId,
      data,
    }: {
      threadId: string;
      messageId: string;
      data: EditMessageRequest;
    }) => chatbotService.editMessage(threadId, messageId, data),
    onSuccess: (message) => {
      upsertChatMessageCache(queryClient, message);
      upsertMessageTreeNodeCache(queryClient, message.threadId, message);
    },
    onError: handleMutationError,
  });

  return {
    editMessage: editMessage.mutateAsync,
    isEditing: editMessage.isPending,
  };
}
