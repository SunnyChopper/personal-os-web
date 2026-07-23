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
const ACTIVE_REPLY_RUN_STATUS_QUERY = 'QUEUED,RUNNING';

export function useActiveReplyRuns() {
  const query = useQuery({
    queryKey: queryKeys.personalBranding.replyRuns.list({
      status: ACTIVE_REPLY_RUN_STATUS_QUERY,
    }),
    queryFn: () => personalBrandingService.listReplyRuns({ status: ACTIVE_REPLY_RUN_STATUS_QUERY }),
    refetchInterval: (q) => {
      const rows = q.state.data?.data ?? [];
      return rows.some((run) => POLL_STATUSES.includes(run.status)) ? 2000 : false;
    },
  });

  return {
    query,
    activeRuns: query.data?.data ?? [],
  };
}

export function useReplyRunTerminalNotifications(
  activeRuns: ReplyRun[],
  options: {
    isDrawerOpen: boolean;
    onReady: (run: ReplyRun) => void;
    onFailed: (run: ReplyRun) => void;
  }
) {
  const previousActiveIdsRef = useRef<Set<string>>(new Set());
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    const currentIds = new Set(activeRuns.map((run) => run.id));
    const previousIds = previousActiveIdsRef.current;

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      previousActiveIdsRef.current = currentIds;
      return;
    }

    const departedIds = [...previousIds].filter((id) => !currentIds.has(id));
    previousActiveIdsRef.current = currentIds;

    if (departedIds.length === 0 || options.isDrawerOpen) return;

    for (const runId of departedIds) {
      void personalBrandingService.getReplyRun(runId).then((run) => {
        if (run.status === 'SUCCEEDED' || run.status === 'PARTIAL') {
          options.onReady(run);
        } else if (run.status === 'FAILED') {
          options.onFailed(run);
        }
      });
    }
  }, [activeRuns, options.isDrawerOpen, options.onFailed, options.onReady]);
}

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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.replyRuns.all(),
      });
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
