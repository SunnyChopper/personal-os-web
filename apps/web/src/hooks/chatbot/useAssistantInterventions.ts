import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { assistantInterventionsService } from '@/services/assistant-interventions.service';

export function useAssistantInterventionUnreadCount() {
  return useQuery({
    queryKey: queryKeys.chatbot.interventionsUnreadCount(),
    queryFn: () => assistantInterventionsService.unreadCount(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useAssistantInterventions(params?: {
  status?: string;
  kind?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: queryKeys.chatbot.interventionsList(params),
    queryFn: () => assistantInterventionsService.list(params),
    staleTime: 15_000,
  });
}

export function useAssistantInterventionActions() {
  const qc = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.chatbot.interventionsUnreadCount() }),
      qc.invalidateQueries({ queryKey: queryKeys.chatbot.interventionsAll() }),
    ]);
  };

  const markRead = useMutation({
    mutationFn: (id: string) => assistantInterventionsService.markRead(id),
    onSuccess: () => void invalidate(),
  });

  const dismiss = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      assistantInterventionsService.dismiss(id, reason),
    onSuccess: () => void invalidate(),
  });

  const reply = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      assistantInterventionsService.reply(id, message),
    onSuccess: () => void invalidate(),
  });

  const convertToChat = useMutation({
    mutationFn: (id: string) => assistantInterventionsService.convertToChat(id),
    onSuccess: () => void invalidate(),
  });

  return { markRead, dismiss, reply, convertToChat, invalidate };
}
