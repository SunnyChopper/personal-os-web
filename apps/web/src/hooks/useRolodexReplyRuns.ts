import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  CreateReplyRunInput,
  ReplyRun,
  ReplyRunStatus,
  UpdateReplySuggestionInput,
} from '@/types/api/personal-branding.dto';

const POLL_STATUSES: ReplyRunStatus[] = ['QUEUED', 'RUNNING'];

export function useRolodexReplyRuns(runId: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.personalBranding.replyRuns.detail(runId ?? ''),
    queryFn: () => personalBrandingService.getReplyRun(runId!),
    enabled: Boolean(runId),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status && POLL_STATUSES.includes(status)) return 2000;
      return false;
    },
  });

  const startRun = useMutation({
    mutationFn: (body: CreateReplyRunInput) => personalBrandingService.startReplyRun(body),
    onSuccess: (run: ReplyRun) => {
      queryClient.setQueryData(queryKeys.personalBranding.replyRuns.detail(run.id), run);
    },
  });

  const updateSuggestion = useMutation({
    mutationFn: ({
      suggestionId,
      body,
    }: {
      suggestionId: string;
      body: UpdateReplySuggestionInput;
    }) => personalBrandingService.updateReplySuggestion(suggestionId, body),
    onSuccess: () => {
      if (runId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.personalBranding.replyRuns.detail(runId),
        });
      }
    },
  });

  return { query, startRun, updateSuggestion };
}

export function useReplyRunPolling(runId: string | null, onTerminal?: (run: ReplyRun) => void) {
  const { query } = useRolodexReplyRuns(runId);
  const notified = useRef<string | null>(null);

  useEffect(() => {
    const run = query.data;
    if (!run || !runId) return;
    if (POLL_STATUSES.includes(run.status)) return;
    if (notified.current === `${runId}:${run.status}`) return;
    notified.current = `${runId}:${run.status}`;
    onTerminal?.(run);
  }, [query.data, runId, onTerminal]);

  return query;
}
