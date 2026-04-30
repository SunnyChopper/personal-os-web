import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, GripVertical, Sparkles, Loader2 } from 'lucide-react';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import Button from '@/components/atoms/Button';
import { conceptGraphService } from '@/services/knowledge-vault/concept-graph.service';
import { useToast } from '@/hooks/use-toast';
import { useConceptColliderStore } from '@/store/concept-collider.store';

export interface SynthesisPanelProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Initial width in px */
  defaultWidth?: number;
}

export function SynthesisPanel({
  open,
  onClose,
  onSaved,
  defaultWidth = 400,
}: SynthesisPanelProps) {
  const { showToast } = useToast();
  const selectedNodeIds = useConceptColliderStore((s) => s.selectedNodeIds);
  const synthesisMarkdown = useConceptColliderStore((s) => s.synthesisMarkdown);
  const setSynthesisMarkdown = useConceptColliderStore((s) => s.setSynthesisMarkdown);
  const appendSynthesisMarkdown = useConceptColliderStore((s) => s.appendSynthesisMarkdown);
  const resetSynthesisMarkdown = useConceptColliderStore((s) => s.resetSynthesisMarkdown);
  const setLastSynthesisNodeKey = useConceptColliderStore((s) => s.setLastSynthesisNodeKey);

  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);

  const nodeKey = useMemo(() => [...selectedNodeIds].sort().join('\0'), [selectedNodeIds]);

  const canRun = selectedNodeIds.length >= 2;

  useEffect(() => {
    if (!open || !canRun) {
      setError(null);
      setStreaming(false);
      return;
    }

    const st = useConceptColliderStore.getState();
    if (st.lastSynthesisNodeKey === nodeKey && st.synthesisMarkdown.trim().length > 0) {
      setStreaming(false);
      return;
    }

    let cancelled = false;
    setError(null);
    setStreaming(true);
    resetSynthesisMarkdown();
    void (async () => {
      await conceptGraphService.streamSynthesis(
        selectedNodeIds,
        (delta) => {
          if (!cancelled) appendSynthesisMarkdown(delta);
        },
        (full) => {
          if (!cancelled) {
            setSynthesisMarkdown(full);
            setLastSynthesisNodeKey(nodeKey);
            setStreaming(false);
          }
        },
        (msg) => {
          if (!cancelled) {
            setError(msg);
            setStreaming(false);
          }
        }
      );
      if (!cancelled) setStreaming(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    nodeKey,
    canRun,
    resetSynthesisMarkdown,
    setSynthesisMarkdown,
    appendSynthesisMarkdown,
    setLastSynthesisNodeKey,
    selectedNodeIds,
  ]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const dx = dragRef.current.startX - e.clientX;
    const next = Math.min(720, Math.max(280, dragRef.current.startW + dx));
    setWidth(next);
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startW: width };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const save = async () => {
    if (!canRun || !synthesisMarkdown.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await conceptGraphService.saveSynthesis(selectedNodeIds, synthesisMarkdown);
      if (!res.success || !res.data) {
        const msg = res.error?.message || 'Failed to save synthesis';
        setError(msg);
        showToast({ type: 'error', title: 'Save failed', message: msg });
        return;
      }
      const note = res.data.note as { id?: string; title?: string };
      showToast({
        type: 'success',
        title: 'Note saved',
        message:
          note.title && note.id
            ? `“${note.title}” is in your Library (Operations). Link it from Skill Tree or Task Links as needed.`
            : 'Synthesis note and graph edges were created.',
      });
      setLastSynthesisNodeKey(null);
      resetSynthesisMarkdown();
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="flex h-full min-h-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      style={{ width }}
    >
      <button
        type="button"
        aria-label="Resize panel"
        onMouseDown={startResize}
        className="w-2 shrink-0 cursor-col-resize flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700"
      >
        <GripVertical className="w-3 h-3 text-gray-400" />
      </button>
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <span className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Synthesis
            {streaming && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Streaming…
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 prose prose-sm dark:prose-invert max-w-none">
          {error && <p className="text-red-600 text-sm not-prose">{error}</p>}
          {!canRun && (
            <p className="text-gray-500 text-sm not-prose">
              Select at least two nodes on the graph.
            </p>
          )}
          {canRun && streaming && !synthesisMarkdown && !error && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500 not-prose">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              <p className="text-sm">Generating synthesis…</p>
            </div>
          )}
          {synthesisMarkdown ? <MarkdownRenderer content={synthesisMarkdown} /> : null}
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            disabled={saving || !synthesisMarkdown.trim() || streaming || !canRun}
            onClick={() => void save()}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              'Save as note + edges'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
