import { useMemo, useState } from 'react';
import { Search, Loader2, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { EntityLinkChip } from '@/components/atoms/EntityLinkChip';
import { cn } from '@/lib/utils';
import { extractDateOnly, formatDateString, parseDateInput } from '@/utils/date-formatters';
import type { EntitySummary } from '@/types/growth-system';

interface RelationshipPickerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entities: EntitySummary[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSave?: () => Promise<void> | void;
  isSaving?: boolean;
  saveError?: string | null;
  entityType: 'task' | 'project' | 'goal' | 'metric' | 'habit' | 'logbook';
}

type GoalTreeNode = { entity: EntitySummary; children: GoalTreeNode[] };

/** Earliest targetDate first; goals without a date sort after dated goals; title tie-breaker. */
function compareGoalSummariesByTargetDate(a: EntitySummary, b: EntitySummary): number {
  const da = a.targetDate ? extractDateOnly(a.targetDate) : '';
  const db = b.targetDate ? extractDateOnly(b.targetDate) : '';
  if (!da && !db) {
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  }
  if (!da) return 1;
  if (!db) return -1;
  if (da !== db) return da < db ? -1 : 1;
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
}

function isGoalSummaryOverdue(entity: EntitySummary): boolean {
  if (entity.type !== 'goal') return false;
  if (!entity.targetDate) return false;
  if (entity.completedDate) return false;
  if (entity.status === 'Achieved' || entity.status === 'Abandoned') return false;
  const only = extractDateOnly(entity.targetDate);
  if (!only) return false;
  const target = parseDateInput(only);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() > target.getTime();
}

function buildGoalTree(entities: EntitySummary[]): GoalTreeNode[] {
  if (entities.length === 0) return [];
  const byId = new Map(entities.map((e) => [e.id, e]));
  const childrenByParent = new Map<string, EntitySummary[]>();
  for (const e of entities) {
    const pid = e.parentGoalId;
    if (pid && byId.has(pid)) {
      const list = childrenByParent.get(pid) ?? [];
      list.push(e);
      childrenByParent.set(pid, list);
    }
  }
  const roots = entities.filter((e) => {
    const pid = e.parentGoalId;
    return !pid || !byId.has(pid);
  });
  if (roots.length === 0) {
    return [...entities]
      .sort(compareGoalSummariesByTargetDate)
      .map((e) => ({ entity: e, children: [] }));
  }
  roots.sort(compareGoalSummariesByTargetDate);
  const toNode = (entity: EntitySummary): GoalTreeNode => {
    const rawKids = childrenByParent.get(entity.id) ?? [];
    const children = [...rawKids].sort(compareGoalSummariesByTargetDate).map(toNode);
    return { entity, children };
  };
  return roots.map(toNode);
}

function filterGoalTree(nodes: GoalTreeNode[], query: string): GoalTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  const out: GoalTreeNode[] = [];
  for (const node of nodes) {
    const filteredChildren = filterGoalTree(node.children, query);
    const selfMatch = node.entity.title.toLowerCase().includes(q);
    if (selfMatch || filteredChildren.length > 0) {
      out.push({ entity: node.entity, children: filteredChildren });
    }
  }
  return out;
}

function collectIdsWithDescendants(nodes: GoalTreeNode[]): string[] {
  const ids: string[] = [];
  const walk = (n: GoalTreeNode) => {
    if (n.children.length > 0) {
      ids.push(n.entity.id);
      n.children.forEach(walk);
    }
  };
  nodes.forEach(walk);
  return ids;
}

interface GoalAccordionRowsProps {
  nodes: GoalTreeNode[];
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  isSaving: boolean;
}

function GoalAccordionRows({
  nodes,
  depth,
  expandedIds,
  onToggleExpand,
  selectedIds,
  toggleSelection,
  isSaving,
}: GoalAccordionRowsProps) {
  const indentPx = 12 + depth * 14;

  return (
    <>
      {nodes.map((node) => {
        const { entity, children } = node;
        const hasChildren = children.length > 0;
        const isExpanded = expandedIds.has(entity.id);
        const isSelected = selectedIds.includes(entity.id);
        const isOverdue = isGoalSummaryOverdue(entity);
        const dueLabel = entity.targetDate ? formatDateString(entity.targetDate) : null;

        return (
          <div key={entity.id} className="border-b border-gray-200 dark:border-gray-700">
            <div
              className={cn(
                'flex items-stretch min-h-[3.25rem] transition-colors',
                isSelected &&
                  'bg-blue-50/90 dark:bg-blue-900/25 hover:bg-blue-100/95 dark:hover:bg-blue-900/35',
                !isSelected &&
                  isOverdue &&
                  'bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-50/80 dark:hover:bg-amber-950/40',
                !isSelected && !isOverdue && 'hover:bg-gray-50 dark:hover:bg-gray-800/80'
              )}
              style={{ paddingLeft: indentPx }}
            >
              <div className="flex w-9 shrink-0 items-center justify-center self-stretch">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand(entity.id);
                    }}
                    disabled={isSaving}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50',
                      isSelected
                        ? 'text-blue-700 dark:text-blue-300 hover:bg-blue-200/60 dark:hover:bg-blue-800/45'
                        : 'text-gray-500 hover:bg-gray-200/80 dark:text-gray-400 dark:hover:bg-gray-700/80'
                    )}
                    aria-expanded={isExpanded}
                    aria-label={
                      isExpanded
                        ? `Collapse subgoals under ${entity.title}`
                        : `Expand subgoals under ${entity.title}`
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" aria-hidden />
                    ) : (
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                ) : (
                  <span className="inline-block w-8" aria-hidden />
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleSelection(entity.id)}
                disabled={isSaving}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pr-4 text-left transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {entity.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                    <span className="capitalize">{entity.type}</span>
                    <span aria-hidden>•</span>
                    <span>{entity.area}</span>
                    <span aria-hidden>•</span>
                    <span className="capitalize">{entity.status}</span>
                    {dueLabel && (
                      <>
                        <span aria-hidden>•</span>
                        <span
                          className={cn(
                            isOverdue &&
                              'font-medium text-amber-700 dark:text-amber-400 inline-flex items-center gap-1'
                          )}
                        >
                          {isOverdue && (
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          )}
                          <span>Due {dueLabel}</span>
                          {isOverdue && (
                            <span className="text-amber-700/90 dark:text-amber-400/95">
                              (overdue)
                            </span>
                          )}
                        </span>
                      </>
                    )}
                    {depth > 0 && (
                      <>
                        <span aria-hidden>•</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">Subgoal</span>
                      </>
                    )}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  disabled={isSaving}
                  className="w-4 h-4 shrink-0 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600"
                  aria-label={`Select ${entity.title}`}
                />
              </button>
            </div>
            {hasChildren && isExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-700/90 bg-gray-50/40 dark:bg-gray-900/25">
                <GoalAccordionRows
                  nodes={children}
                  depth={depth + 1}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  selectedIds={selectedIds}
                  toggleSelection={toggleSelection}
                  isSaving={isSaving}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export function RelationshipPicker({
  isOpen,
  onClose,
  title,
  entities,
  selectedIds,
  onSelectionChange,
  onSave,
  isSaving = false,
  saveError = null,
  entityType,
}: RelationshipPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(() => new Set());

  const goalTree = useMemo(() => {
    if (entityType !== 'goal') return [];
    return buildGoalTree(entities);
  }, [entities, entityType]);

  const visibleGoalTree = useMemo(
    () => (entityType === 'goal' ? filterGoalTree(goalTree, searchQuery) : []),
    [entityType, goalTree, searchQuery]
  );

  const mergedExpandedGoalIds = useMemo(() => {
    if (entityType !== 'goal' || !searchQuery.trim()) {
      return expandedGoalIds;
    }
    const fromSearch = collectIdsWithDescendants(visibleGoalTree);
    return new Set([...expandedGoalIds, ...fromSearch]);
  }, [entityType, searchQuery, visibleGoalTree, expandedGoalIds]);

  const resetPickerUi = () => {
    setSearchQuery('');
    setExpandedGoalIds(new Set());
  };

  const filteredEntities = entities.filter((entity) =>
    entity.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleGoalExpand = (id: string) => {
    setExpandedGoalIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      await onSave?.();
      resetPickerUi();
      onClose();
    } catch (error) {
      // Error is handled by parent component via saveError prop
      // Don't close the dialog so user can see the error and retry
      console.warn('Failed to save relationship selection:', error);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    resetPickerUi();
    onClose();
  };

  const showGoalAccordion = entityType === 'goal';
  const goalListEmpty = showGoalAccordion && visibleGoalTree.length === 0;
  const flatListEmpty = !showGoalAccordion && filteredEntities.length === 0;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={title} className="max-w-2xl">
      <div className="relative space-y-4">
        {/* Saving Overlay */}
        {isSaving && (
          <div
            className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto rounded-lg"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Saving...</p>
            </div>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            disabled={isSaving}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected ({selectedIds.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map((id) => {
                const entity = entities.find((e) => e.id === id);
                if (!entity) return null;
                return (
                  <EntityLinkChip
                    key={id}
                    id={id}
                    label={entity.title}
                    type={entityType}
                    area={entity.area}
                    onRemove={() => toggleSelection(id)}
                    size="sm"
                  />
                );
              })}
            </div>
          </div>
        )}

        <div
          className={`max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md ${
            isSaving ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {showGoalAccordion ? (
            goalListEmpty ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No entities found
              </div>
            ) : (
              <div>
                <GoalAccordionRows
                  nodes={visibleGoalTree}
                  depth={0}
                  expandedIds={mergedExpandedGoalIds}
                  onToggleExpand={toggleGoalExpand}
                  selectedIds={selectedIds}
                  toggleSelection={toggleSelection}
                  isSaving={isSaving}
                />
              </div>
            )
          ) : flatListEmpty ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No entities found
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEntities.map((entity) => {
                const isSelected = selectedIds.includes(entity.id);
                return (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => toggleSelection(entity.id)}
                    disabled={isSaving}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {entity.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                          <span className="capitalize">{entity.type}</span>
                          <span>•</span>
                          <span>{entity.area}</span>
                          <span>•</span>
                          <span className="capitalize">{entity.status}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          disabled={isSaving}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {saveError && <div className="text-sm text-red-600 dark:text-red-400">{saveError}</div>}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleClose} variant="secondary" disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Selection'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
