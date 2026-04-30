import { startTransition, useCallback, useState } from 'react';
import { ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';
import type { WsToolApprovalRequiredPayload } from '@/types/chatbot';

type ToolApprovalCardProps = {
  payload: WsToolApprovalRequiredPayload;
  runId: string;
  onRespond: (runId: string, approvalId: string, decision: 'approve' | 'reject') => void;
};

export function ToolApprovalCard({ payload, runId, onRespond }: ToolApprovalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDecision = useCallback(
    (decision: 'approve' | 'reject') => {
      if (submitting) return;
      setSubmitting(true);
      startTransition(() => {
        onRespond(runId, payload.approvalId, decision);
      });
    },
    [onRespond, payload.approvalId, runId, submitting]
  );

  return (
    <div className="mt-1 rounded-lg border-2 border-amber-400/80 bg-amber-50/90 p-3 dark:border-amber-600/60 dark:bg-amber-950/30">
      <div className="flex items-start gap-2">
        <ShieldAlert
          size={18}
          className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
            {payload.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-amber-800/80 dark:text-amber-200/80">Tool</span>
            <code className="rounded bg-amber-100/80 px-1.5 py-0.5 font-mono text-[10px] text-amber-950 dark:bg-amber-900/40 dark:text-amber-100">
              {payload.toolName}
            </code>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-[11px] text-amber-900/90 underline-offset-2 hover:underline dark:text-amber-200/90"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Arguments
          </button>
          {expanded && (
            <pre className="max-h-40 overflow-auto rounded border border-amber-200/80 bg-white/80 p-2 font-mono text-[10px] dark:border-amber-800/50 dark:bg-gray-900/80">
              {JSON.stringify(payload.arguments, null, 2)}
            </pre>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('approve')}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('reject')}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
