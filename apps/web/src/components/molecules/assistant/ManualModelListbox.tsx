import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Brain, ChevronDown } from 'lucide-react';
import { ModelTraitMicroBars } from '@/components/molecules/assistant/AssistantModelPickerPrimitives';
import type { AssistantModelCatalogEntry } from '@/types/chatbot';
import { providerLogoSrc } from '@/lib/assistant/model-picker-utils';
import { FLOATING_MENU_Z } from '@/lib/overlay-layer';

const CAPABILITY_ABBR: Record<string, string> = {
  reasoning: 'Rsn',
  configurableEffort: 'Eff',
  caching: 'Cache',
  vision: 'Vis',
  tools: 'Tool',
  realtimeWeb: 'Web',
  openWeight: 'Open',
};

function CatalogMetaRow({ m }: { m: AssistantModelCatalogEntry }) {
  const tags = m.capabilityTags?.length
    ? m.capabilityTags
        .map((t) => CAPABILITY_ABBR[t] ?? t.slice(0, 3))
        .slice(0, 6)
        .join(' · ')
    : null;
  const bench: string[] = [];
  if (m.arenaElo != null) bench.push(`Elo ${m.arenaElo}`);
  if (m.gpqaPercent != null) bench.push(`GPQA ${m.gpqaPercent}%`);
  if (m.sweBenchPercent != null) bench.push(`SWE ${m.sweBenchPercent}%`);
  const benchStr = bench.length ? bench.join(' · ') : null;
  const ctx = m.contextTokens != null ? `${(m.contextTokens / 1000).toFixed(0)}k ctx` : null;
  if (!tags && !benchStr && !ctx) return null;
  return (
    <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 space-y-0.5">
      {tags ? <div title={m.capabilityTags?.join(', ')}>{tags}</div> : null}
      {benchStr || ctx ? (
        <div className="tabular-nums">{[benchStr, ctx].filter(Boolean).join(' · ')}</div>
      ) : null}
    </div>
  );
}

function ReasoningStreamMark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className ?? ''}`} title="Reasoning stream">
      <Brain
        size={14}
        className="shrink-0 text-violet-600 dark:text-violet-400"
        aria-hidden
        focusable="false"
      />
      <span className="sr-only">Reasoning stream</span>
    </span>
  );
}

type ManualModelListboxProps = {
  label: string;
  models: AssistantModelCatalogEntry[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  /** Settings layout: slightly more label→control spacing and trigger padding. */
  density?: 'default' | 'comfortable';
};

export function ManualModelListbox({
  label,
  models,
  value,
  onChange,
  disabled,
  density = 'default',
}: ManualModelListboxProps) {
  const isComfortable = density === 'comfortable';
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const listId = useId();
  const selected = models.find((m) => m.id === value);

  const updateMenuRect = () => {
    const el = triggerRef.current;
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    const margin = 8;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const spaceBelow = vh - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const preferBelow = spaceBelow >= 140 || spaceBelow >= spaceAbove;
    const maxH = Math.min(360, Math.max(120, preferBelow ? spaceBelow : spaceAbove));
    const top = preferBelow ? r.bottom + margin : Math.max(margin, r.top - maxH - margin);
    setMenuRect({
      top,
      left: r.left,
      width: Math.max(r.width, 200),
      maxHeight: maxH,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuRect(null);
      return;
    }
    updateMenuRect();
  }, [open, models.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onWin = () => updateMenuRect();
    window.addEventListener('resize', onWin);
    window.visualViewport?.addEventListener('resize', onWin);
    window.visualViewport?.addEventListener('scroll', onWin);
    document.addEventListener('scroll', onWin, true);
    return () => {
      window.removeEventListener('resize', onWin);
      window.visualViewport?.removeEventListener('resize', onWin);
      window.visualViewport?.removeEventListener('scroll', onWin);
      document.removeEventListener('scroll', onWin, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) {
        return;
      }
      if (menuRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const portalMenuStyle: CSSProperties | null =
    open && menuRect
      ? {
          position: 'fixed',
          top: menuRect.top,
          left: menuRect.left,
          width: menuRect.width,
          maxHeight: menuRect.maxHeight,
          zIndex: FLOATING_MENU_Z,
        }
      : null;

  return (
    <div className="relative" ref={rootRef}>
      <span
        id={`${listId}-label`}
        className={`block text-xs font-medium text-gray-700 dark:text-gray-300 ${
          isComfortable ? 'mb-1.5' : 'mb-1'
        }`}
      >
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${listId}-label`}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 text-left text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 disabled:opacity-50 ${
          isComfortable ? 'py-2' : 'py-1.5'
        }`}
      >
        {selected ? (
          <img
            src={providerLogoSrc(selected.provider)}
            alt=""
            className="w-5 h-5 shrink-0 opacity-90"
            width={20}
            height={20}
          />
        ) : (
          <span className="w-5 h-5 shrink-0" />
        )}
        <span className="flex-1 min-w-0 flex items-center gap-1.5 min-h-[1.25rem]">
          {selected ? (
            <>
              <span className="truncate">{selected.label}</span>
              {selected.supportsReasoningStream ? <ReasoningStreamMark /> : null}
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select…</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-500 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && menuRect && portalMenuStyle && typeof document !== 'undefined'
        ? createPortal(
            <ul
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-labelledby={`${listId}-label`}
              data-assistant-model-menu
              style={portalMenuStyle}
              className="overflow-y-auto overscroll-contain rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg py-1"
            >
              {models.map((m) => {
                const isSel = m.id === value;
                return (
                  <li key={m.id} role="option" aria-selected={isSel}>
                    <button
                      type="button"
                      className={`w-full text-left px-2 py-1.5 flex gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        isSel ? 'bg-blue-50 dark:bg-blue-950/40' : ''
                      }`}
                      onClick={() => {
                        onChange(m.id);
                        setOpen(false);
                      }}
                    >
                      <img
                        src={providerLogoSrc(m.provider)}
                        alt=""
                        className="w-5 h-5 shrink-0 mt-0.5 opacity-90"
                        width={20}
                        height={20}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{m.label}</span>
                          {m.supportsReasoningStream ? <ReasoningStreamMark /> : null}
                        </div>
                        <ModelTraitMicroBars
                          speedScore={m.speedScore}
                          costScore={m.costScore}
                          qualityScore={m.qualityScore}
                        />
                        <CatalogMetaRow m={m} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
