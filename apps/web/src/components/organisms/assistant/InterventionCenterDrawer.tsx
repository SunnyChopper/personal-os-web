import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import OverlayPortal from '@/components/molecules/OverlayPortal';
import Button from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';
import { InterventionDismissDialog } from '@/components/molecules/assistant/InterventionDismissDialog';
import {
  useAssistantInterventionActions,
  useAssistantInterventions,
} from '@/hooks/chatbot/useAssistantInterventions';
import { overlayBackdropClassName, overlaySurfaceClassName } from '@/lib/overlay-layer';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';
import type { AssistantIntervention, AssistantInterventionKind } from '@/types/api-contracts';
import {
  formatInterventionLastSeen,
  formatInterventionStackLabel,
  interventionOccurrenceCount,
  interventionStackChipClassName,
} from '@/lib/assistant/intervention-stack-ui';

const KIND_LABELS: Record<AssistantInterventionKind, string> = {
  coachIntervention: 'Coach',
  escalation: 'Escalation',
  opportunity: 'Opportunity',
  emailThreadSummary: 'Email',
};

function severityClass(severity: AssistantIntervention['severity']): string {
  if (severity === 'critical') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
  }
  if (severity === 'attention') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

type InterventionCenterDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function InterventionRow({
  item,
  selected,
  onSelect,
}: {
  item: AssistantIntervention;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg border px-3 py-2.5 transition',
        selected
          ? 'border-blue-400 bg-blue-50/80 dark:bg-blue-950/30'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60',
        item.status === 'unread' && 'font-medium'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={cn(
            'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded',
            severityClass(item.severity)
          )}
        >
          {KIND_LABELS[item.kind]}
        </span>
        {item.status === 'unread' ? (
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-label="Unread" />
        ) : null}
        {formatInterventionStackLabel(item) ? (
          <span className={interventionStackChipClassName()}>
            {formatInterventionStackLabel(item)}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-gray-900 dark:text-white line-clamp-2">{item.title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
        {item.summary || item.body}
      </p>
    </button>
  );
}

export function InterventionCenterDrawer({ open, onClose }: InterventionCenterDrawerProps) {
  const navigate = useNavigate();
  const listQ = useAssistantInterventions({ page: 1, pageSize: 30 });
  const { markRead, dismiss, reply, convertToChat } = useAssistantInterventionActions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [dismissOpen, setDismissOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  const items = listQ.data?.items ?? [];
  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    if (!open) return;
    if (!selectedId && items[0]) {
      setSelectedId(items[0].id);
    }
  }, [open, items, selectedId]);

  const handleSelect = (item: AssistantIntervention) => {
    setSelectedId(item.id);
    if (item.status === 'unread') {
      markRead.mutate(item.id);
    }
  };

  if (!open) return null;

  const handleConvert = async () => {
    if (!selected) return;
    const { threadId } = await convertToChat.mutateAsync(selected.id);
    onClose();
    navigate(`${ROUTES.admin.assistant}/${threadId}`);
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    const { threadId } = await reply.mutateAsync({
      id: selected.id,
      message: replyText.trim(),
    });
    setReplyText('');
    onClose();
    navigate(`${ROUTES.admin.assistant}/${threadId}`);
  };

  const handleDismiss = async () => {
    if (!selected) return;
    await dismiss.mutateAsync({ id: selected.id, reason: dismissReason.trim() });
    setDismissOpen(false);
    setDismissReason('');
    setSelectedId(null);
  };

  return (
    <OverlayPortal>
      <div
        className={cn('fixed inset-0 z-[80] flex justify-end', overlayBackdropClassName)}
        role="presentation"
        onClick={onClose}
      >
        <div
          className={cn(
            'h-full w-full max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col',
            overlaySurfaceClassName
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="intervention-center-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2
                id="intervention-center-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Assistant interventions
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Coach nudges, escalations, and proactive signals
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close interventions"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {listQ.isLoading ? (
              <p className="p-4 text-sm text-gray-500">Loading…</p>
            ) : listQ.isError ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Could not load interventions. The notification count may still be accurate.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void listQ.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                No interventions right now. The Assistant will surface high-signal items here.
              </p>
            ) : (
              <>
                <div className="p-3 space-y-2 overflow-y-auto max-h-[40%] border-b border-gray-100 dark:border-gray-800">
                  {items.map((item) => (
                    <InterventionRow
                      key={item.id}
                      item={item}
                      selected={selected?.id === item.id}
                      onSelect={() => handleSelect(item)}
                    />
                  ))}
                </div>
                {selected ? (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                        {KIND_LABELS[selected.kind]}
                      </p>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {selected.title}
                      </h3>
                      {interventionOccurrenceCount(selected) > 1 ? (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatInterventionStackLabel(selected)} similar alerts
                          {formatInterventionLastSeen(selected)
                            ? ` · last seen ${formatInterventionLastSeen(selected)}`
                            : ''}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selected.body}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => void handleConvert()}>
                        <MessageSquare size={16} className="mr-1.5" />
                        Open in chat
                      </Button>
                      {selected.href ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            onClose();
                            navigate(selected.href!);
                          }}
                        >
                          View context
                        </Button>
                      ) : null}
                      <Button type="button" variant="ghost" onClick={() => setDismissOpen(true)}>
                        Dismiss…
                      </Button>
                    </div>
                    <FormField label="Quick reply" htmlFor="intervention-reply">
                      <Textarea
                        id="intervention-reply"
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply to continue in Assistant chat…"
                      />
                    </FormField>
                    <Button
                      type="button"
                      disabled={!replyText.trim() || reply.isPending}
                      onClick={() => void handleReply()}
                    >
                      Send reply
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                onClose();
                navigate(ROUTES.admin.assistantInterventions);
              }}
            >
              View all interventions
            </Button>
          </div>
        </div>
      </div>

      <InterventionDismissDialog
        isOpen={dismissOpen}
        reason={dismissReason}
        onReasonChange={setDismissReason}
        onClose={() => setDismissOpen(false)}
        onConfirm={() => void handleDismiss()}
        isPending={dismiss.isPending}
        reasonFieldId="dismiss-reason"
        occurrenceCount={selected ? interventionOccurrenceCount(selected) : 1}
      />
    </OverlayPortal>
  );
}
