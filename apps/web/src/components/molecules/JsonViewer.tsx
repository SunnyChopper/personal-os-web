import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type JsonViewerProps = {
  data: unknown;
  label?: string;
  initialExpanded?: boolean;
  searchTerm?: string;
};

const isPrimitive = (value: unknown) =>
  value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value);

const getTypeLabel = (value: unknown) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value instanceof Date) return 'Date';
  if (typeof value === 'object') return `Object(${Object.keys(value as object).length})`;
  return typeof value;
};

const getValueClass = (value: unknown) => {
  if (value === null) return 'text-gray-400';
  switch (typeof value) {
    case 'string':
      return 'text-emerald-400';
    case 'number':
      return 'text-amber-300';
    case 'boolean':
      return 'text-purple-300';
    case 'undefined':
      return 'text-gray-400';
    default:
      return 'text-gray-200';
  }
};

const highlightClass = 'bg-amber-400/20 text-amber-200';

export function JsonViewer({
  data,
  label,
  initialExpanded = false,
  searchTerm = '',
}: JsonViewerProps) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hasSearch = normalizedSearch.length > 0;

  const containsMatch = useMemo(() => {
    const matcher = (value: unknown): boolean => {
      if (!hasSearch) return false;
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value).toLowerCase().includes(normalizedSearch);
      }
      if (Array.isArray(value)) {
        return value.some((item) => matcher(item));
      }
      if (typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>).some(
          ([key, child]) => key.toLowerCase().includes(normalizedSearch) || matcher(child)
        );
      }
      return false;
    };

    return matcher;
  }, [hasSearch, normalizedSearch]);

  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const toggleOverride = (path: string, nextValue: boolean) => {
    setOverrides((prev) => ({ ...prev, [path]: nextValue }));
  };

  const handleCopy = async (value: unknown, path: string) => {
    try {
      let textToCopy: string;
      if (isPrimitive(value)) {
        // For primitives, copy the raw value (or string representation)
        if (value === null) {
          textToCopy = 'null';
        } else if (value === undefined) {
          textToCopy = 'undefined';
        } else {
          textToCopy = String(value);
        }
      } else {
        // For objects and arrays, copy as formatted JSON
        textToCopy = JSON.stringify(value, null, 2);
      }
      await navigator.clipboard.writeText(textToCopy);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const renderNode = (value: unknown, path: string, nodeLabel?: string) => {
    const isNodePrimitive = isPrimitive(value);
    const hasMatch = hasSearch && containsMatch(value);
    const isExpanded = overrides[path] ?? (initialExpanded || hasMatch);

    if (isNodePrimitive) {
      const displayValue =
        value === undefined ? 'undefined' : value === null ? 'null' : String(value);
      const isMatch =
        hasSearch &&
        (nodeLabel?.toLowerCase().includes(normalizedSearch) ||
          displayValue.toLowerCase().includes(normalizedSearch));
      const isHovered = hoveredPath === path;
      const isCopied = copiedPath === path;
      return (
        <div
          className="flex items-start gap-2 text-xs group"
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          {nodeLabel && (
            <span className={cn('text-sky-300', isMatch && highlightClass)}>{nodeLabel}:</span>
          )}
          <span className={cn(getValueClass(value), isMatch && highlightClass)}>
            {typeof value === 'string' ? `"${displayValue}"` : displayValue}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy(value, path);
            }}
            className={cn(
              'p-1 rounded transition-opacity',
              isHovered ? 'opacity-100' : 'opacity-0',
              'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50',
              'focus:outline-none focus:ring-1 focus:ring-gray-500'
            )}
            aria-label={`Copy value`}
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      );
    }

    const isHovered = hoveredPath === path;
    const isCopied = copiedPath === path;

    const entries = Array.isArray(value)
      ? value.map((item, index) => [String(index), item] as const)
      : Object.entries(value as Record<string, unknown>);

    return (
      <div
        className="text-xs group"
        onMouseEnter={() => setHoveredPath(path)}
        onMouseLeave={() => setHoveredPath(null)}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleOverride(path, !isExpanded)}
            className="flex items-center gap-1 text-left text-gray-200 flex-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            {nodeLabel && <span className="text-sky-300">{nodeLabel}:</span>}
            <span className={cn('text-gray-400', hasMatch && highlightClass)}>
              {getTypeLabel(value)}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy(value, path);
            }}
            className={cn(
              'p-1 rounded transition-opacity',
              isHovered ? 'opacity-100' : 'opacity-0',
              'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50',
              'focus:outline-none focus:ring-1 focus:ring-gray-500'
            )}
            aria-label={`Copy ${getTypeLabel(value)}`}
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
        {isExpanded && (
          <div className="mt-2 space-y-2 pl-4 border-l border-gray-700">
            {entries.map(([childKey, childValue]) => (
              <div key={`${path}.${childKey}`}>
                {renderNode(childValue, `${path}.${childKey}`, childKey)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="text-xs text-gray-200">
      {label && <div className="mb-2 text-sm font-semibold text-gray-100">{label}</div>}
      {renderNode(data, label || 'root')}
    </div>
  );
}
