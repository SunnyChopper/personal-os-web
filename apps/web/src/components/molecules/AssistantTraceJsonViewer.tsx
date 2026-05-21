import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type AssistantTraceJsonViewerProps = {
  data: unknown;
  /** When true, only top-level keys are expanded; nested objects/arrays start collapsed. */
  topLevelExpanded?: boolean;
};

const isPrimitive = (value: unknown) =>
  value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value);

const getTypeLabel = (value: unknown) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') return `Object(${Object.keys(value as object).length})`;
  return typeof value;
};

const getValueClass = (value: unknown) => {
  if (value === null) return 'text-gray-400';
  switch (typeof value) {
    case 'string':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'number':
      return 'text-amber-700 dark:text-amber-300';
    case 'boolean':
      return 'text-purple-600 dark:text-purple-300';
    default:
      return 'text-gray-700 dark:text-gray-200';
  }
};

export function AssistantTraceJsonViewer({
  data,
  topLevelExpanded = true,
}: AssistantTraceJsonViewerProps) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const toggle = (path: string, next: boolean) => {
    setOverrides((prev) => ({ ...prev, [path]: next }));
  };

  const renderNode = (value: unknown, path: string, label?: string, depth = 0) => {
    if (isPrimitive(value)) {
      const displayValue =
        value === undefined ? 'undefined' : value === null ? 'null' : String(value);
      return (
        <div className="flex flex-wrap items-start gap-1.5 text-[10px] font-mono">
          {label ? <span className="shrink-0 text-sky-700 dark:text-sky-300">{label}:</span> : null}
          <span className={cn('break-all', getValueClass(value))}>
            {typeof value === 'string' ? `"${displayValue}"` : displayValue}
          </span>
        </div>
      );
    }

    const entries = Array.isArray(value)
      ? value.map((item, index) => [String(index), item] as const)
      : Object.entries(value as Record<string, unknown>);

    const defaultExpanded = depth === 0 ? topLevelExpanded : false;
    const isExpanded = overrides[path] ?? defaultExpanded;

    return (
      <div className={cn(depth > 0 && 'pl-3 border-l border-gray-200 dark:border-gray-700')}>
        <button
          type="button"
          onClick={() => toggle(path, !isExpanded)}
          className="flex w-full items-center gap-1 text-left text-[10px] font-mono text-gray-700 dark:text-gray-200"
        >
          {isExpanded ? (
            <ChevronDown size={12} className="shrink-0" />
          ) : (
            <ChevronRight size={12} className="shrink-0" />
          )}
          {label ? <span className="text-sky-700 dark:text-sky-300">{label}</span> : null}
          <span className="text-gray-500 dark:text-gray-400">{getTypeLabel(value)}</span>
        </button>
        {isExpanded ? (
          <div className="mt-1 space-y-2">
            {entries.map(([childKey, childValue]) => (
              <div key={`${path}.${childKey}`}>
                {renderNode(childValue, `${path}.${childKey}`, childKey, depth + 1)}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const root = useMemo(() => {
    if (topLevelExpanded && data !== null && typeof data === 'object' && !Array.isArray(data)) {
      const entries = Object.entries(data as Record<string, unknown>);
      return entries.map(([childKey, childValue]) => (
        <div key={childKey}>{renderNode(childValue, `root.${childKey}`, childKey, 0)}</div>
      ));
    }
    return renderNode(data, 'root');
  }, [data, overrides, topLevelExpanded]);

  return <div className="space-y-2">{root}</div>;
}
