import { useCallback, useState } from 'react';
import { AlertTriangle, Calendar, Hammer, Loader2, Play } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { upsertMessageTreeNodeCache } from '@/lib/react-query/chatbot-cache';
import { queryKeys } from '@/lib/react-query/query-keys';
import { chatbotService } from '@/services/chatbot.service';
import type { AssistantDecisionRequest, CoachEscalationAction } from '@/types/chatbot';

type CoachEscalationDecisionCardProps = {
  threadId: string;
  messageId: string;
  decision: AssistantDecisionRequest;
  /** When true, emphasize blocking accountability styling (modal shell). */
  blocking?: boolean;
  onResolved?: () => void;
};

const ACTION_LABELS: Record<CoachEscalationAction, string> = {
  acknowledgeCost: 'I acknowledge the cost',
  startNow: 'Start now',
  scheduleToday: 'Schedule for today',
  breakDown: 'Break it down',
};

const ACTION_ICONS: Record<CoachEscalationAction, typeof Play> = {
  acknowledgeCost: AlertTriangle,
  startNow: Play,
  scheduleToday: Calendar,
  breakDown: Hammer,
};

export function CoachEscalationDecisionCard({
  threadId,
  messageId,
  decision,
  blocking = false,
  onResolved,
}: CoachEscalationDecisionCardProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const resolved = decision.status === 'resolved';
  const resolutionAction = decision.resolution?.action as CoachEscalationAction | undefined;

  const resolveMutation = useMutation({
    mutationFn: (action: CoachEscalationAction) =>
      chatbotService.resolveAssistantDecision(threadId, messageId, decision.id, action),
    onSuccess: (updatedMessage) => {
      setError(null);
      upsertMessageTreeNodeCache(queryClient, threadId, updatedMessage);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chatbot.messages.tree(threadId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chatbot.coachEscalationsPending(),
      });
      const updatedDecision = updatedMessage.decisionRequests?.find((d) => d.id === decision.id);
      const deepLink = updatedDecision?.resolution?.clientHints?.deepLink;
      onResolved?.();
      const action = updatedDecision?.resolution?.action;
      if (deepLink && action && action !== 'acknowledgeCost') {
        navigate(deepLink);
      }
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to apply action');
    },
  });

  const handleAction = useCallback(
    (action: CoachEscalationAction) => {
      if (resolved || resolveMutation.isPending) return;
      resolveMutation.mutate(action);
    },
    [resolveMutation, resolved]
  );

  const pendingAction = resolveMutation.isPending ? resolveMutation.variables : undefined;

  const coachOptions = (decision.options ?? []).filter((o): o is CoachEscalationAction =>
    ['acknowledgeCost', 'startNow', 'scheduleToday', 'breakDown'].includes(o)
  );

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        blocking
          ? 'border-red-500/80 bg-red-50/95 dark:border-red-600/70 dark:bg-red-950/40'
          : resolved
            ? 'border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/40'
            : 'border-red-400/70 bg-red-50/90 dark:border-red-700/50 dark:bg-red-950/25'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-800 dark:text-red-200">
            Accountability required
          </p>
          <p className="mt-1 font-medium text-gray-900 dark:text-slate-100">{decision.title}</p>
          {decision.costStatement ? (
            <p className="mt-2 text-sm text-red-900/90 dark:text-red-100/90">
              {decision.costStatement}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{decision.rationale}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">
            Suggested: {decision.suggestedNextAction}
          </p>
        </div>
      </div>

      {resolved ? (
        <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">
          Resolved:{' '}
          {resolutionAction ? ACTION_LABELS[resolutionAction] : decision.resolution?.action}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {coachOptions.map((action) => {
            const Icon = ACTION_ICONS[action];
            const isActionPending = pendingAction === action;
            return (
              <button
                key={action}
                type="button"
                disabled={resolveMutation.isPending}
                aria-busy={isActionPending}
                onClick={() => handleAction(action)}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60',
                  action === 'acknowledgeCost'
                    ? 'border border-red-300 bg-white text-red-900 hover:bg-red-50 dark:border-red-700 dark:bg-red-950/50 dark:text-red-100 dark:hover:bg-red-950'
                    : 'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500'
                )}
              >
                {isActionPending ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {ACTION_LABELS[action]}
              </button>
            );
          })}
        </div>
      )}

      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
