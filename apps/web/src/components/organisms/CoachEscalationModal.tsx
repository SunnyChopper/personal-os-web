import { useQuery } from '@tanstack/react-query';
import OverlayPortal from '@/components/molecules/OverlayPortal';
import { CoachEscalationDecisionCard } from '@/components/molecules/CoachEscalationDecisionCard';
import { overlayBackdropClassName, overlaySurfaceClassName } from '@/lib/overlay-layer';
import { queryKeys } from '@/lib/react-query/query-keys';
import { cn } from '@/lib/utils';
import { chatbotService } from '@/services/chatbot.service';

export function CoachEscalationModal() {
  const pendingQ = useQuery({
    queryKey: queryKeys.chatbot.coachEscalationsPending(),
    queryFn: ({ signal }) => chatbotService.getPendingCoachEscalations(signal),
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const escalation = pendingQ.data?.[0];
  if (!escalation) {
    return null;
  }

  const decision = escalation.decisionRequest;
  if (!decision || decision.status === 'resolved') {
    return null;
  }

  return (
    <OverlayPortal>
      <div
        className={cn(
          'fixed inset-0 flex items-center justify-center bg-black/60 p-4',
          overlayBackdropClassName
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-escalation-title"
      >
        <div
          className={cn(
            'w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/60 dark:bg-gray-900',
            overlaySurfaceClassName
          )}
        >
          <h2
            id="coach-escalation-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Important work needs your decision
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            You must acknowledge the cost or choose a next action before continuing.
          </p>
          <div className="mt-4">
            <CoachEscalationDecisionCard
              threadId={escalation.threadId}
              messageId={escalation.messageId}
              decision={decision}
              blocking
              onResolved={() => {
                void pendingQ.refetch();
              }}
            />
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
