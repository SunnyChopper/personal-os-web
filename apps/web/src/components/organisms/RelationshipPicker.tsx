import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Loader2, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import {
  compareByRelevance,
  DEFAULT_SUGGESTION_LIMIT,
  partitionRelationshipPickerEntities,
} from '@/lib/growth-system/relationship-picker-relevance';
import { extractDateOnly, formatDateString, parseDateInput } from '@/utils/date-formatters';
import type { Area, EntitySummary } from '@/types/growth-system';

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
  /** When set, enables Suggested section ranked by area match + recency. */
  contextArea?: Area;
  suggestionSectionLabel?: string;
}

type GoalTreeNode = { entity: EntitySummary; children: GoalTreeNode[] };

const SECTION_HEADER_CLASS =
  'px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700';

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

function partitionGoalTreeNodes(
  nodes: GoalTreeNode[],
  baselineLinkedIds: string[],
  contextArea: Area | undefined,
  suggestionLimit = DEFAULT_SUGGESTION_LIMIT
): { currentlyLinked: GoalTreeNode[]; suggested: GoalTreeNode[]; other: GoalTreeNode[] } {
  const baselineSet = new Set(baselineLinkedIds);

  const currentlyLinked = nodes
    .filter((node) => baselineSet.has(node.entity.id))
    .sort((a, b) =>
      a.entity.title.localeCompare(b.entity.title, undefined, { sensitivity: 'base' })
    );

  const candidates = nodes.filter((node) => !baselineSet.has(node.entity.id));

  if (!contextArea) {
    const other = [...candidates].sort((a, b) =>
      compareByRelevance(a.entity, b.entity, contextArea)
    );
    return { currentlyLinked, suggested: [], other };
  }

  const ranked = [...candidates].sort((a, b) =>
    compareByRelevance(a.entity, b.entity, contextArea)
  );
  const suggested = ranked.slice(0, suggestionLimit);
  const suggestedIds = new Set(suggested.map((node) => node.entity.id));
  const other = ranked.filter((node) => !suggestedIds.has(node.entity.id));

  return { currentlyLinked, suggested, other };
}

interface PickerSectionHeaderProps {
  label: string;
}

function PickerSectionHeader({ label }: PickerSectionHeaderProps) {
  return <div className={SECTION_HEADER_CLASS}>{label}</div>;
}

interface FlatEntityRowProps {
  entity: EntitySummary;
  isSelected: boolean;
  isSaving: boolean;
  onToggle: () => void;
}

function FlatEntityRow({ entity, isSelected, isSaving, onToggle }: FlatEntityRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isSaving}
      className={cn(
        'w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-gray-900 dark:text-white">{entity.title}</div>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="capitalize">{entity.type}</span>
            <span aria-hidden>•</span>
            <span>{entity.area}</span>
            <span aria-hidden>•</span>
            <span className="capitalize">{entity.status}</span>
          </div>
        </div>
        <div className="ml-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            disabled={isSaving}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
            aria-label={`Select ${entity.title}`}
          />
        </div>
      </div>
    </button>
  );
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
                'flex min-h-[3.25rem] items-stretch transition-colors',
                isSelected &&
                  'bg-blue-50/90 hover:bg-blue-100/95 dark:bg-blue-900/25 dark:hover:bg-blue-900/35',
                !isSelected &&
                  isOverdue &&
                  'bg-amber-50/50 hover:bg-amber-50/80 dark:bg-amber-950/30 dark:hover:bg-amber-950/40',
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
                        ? 'text-blue-700 hover:bg-blue-200/60 dark:text-blue-300 dark:hover:bg-blue-800/45'
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
                  <div className="truncate font-medium text-gray-900 dark:text-white">
                    {entity.title}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400">
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
                              'inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400'
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
                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                  aria-label={`Select ${entity.title}`}
                />
              </button>
            </div>
            {hasChildren && isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/40 dark:border-gray-700/90 dark:bg-gray-900/25">
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

interface PickerListSectionsProps {
  showGoalAccordion: boolean;
  currentlyLinked: EntitySummary[];
  suggested: EntitySummary[];
  other: EntitySummary[];
  currentlyLinkedGoals: GoalTreeNode[];
  suggestedGoals: GoalTreeNode[];
  otherGoals: GoalTreeNode[];
  suggestionSectionLabel: string;
  mergedExpandedGoalIds: Set<string>;
  onToggleGoalExpand: (id: string) => void;
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  isSaving: boolean;
}

function PickerListSections({
  showGoalAccordion,
  currentlyLinked,
  suggested,
  other,
  currentlyLinkedGoals,
  suggestedGoals,
  otherGoals,
  suggestionSectionLabel,
  mergedExpandedGoalIds,
  onToggleGoalExpand,
  selectedIds,
  toggleSelection,
  isSaving,
}: PickerListSectionsProps) {
  const sections: Array<{ key: string; label: string; count: number }> = [];

  if (showGoalAccordion) {
    if (currentlyLinkedGoals.length > 0) {
      sections.push({
        key: 'linked',
        label: `Currently linked (${currentlyLinkedGoals.length})`,
        count: currentlyLinkedGoals.length,
      });
    }
    if (suggestedGoals.length > 0) {
      sections.push({
        key: 'suggested',
        label: suggestionSectionLabel,
        count: suggestedGoals.length,
      });
    }
    if (otherGoals.length > 0) {
      sections.push({ key: 'other', label: 'Other', count: otherGoals.length });
    }
  } else {
    if (currentlyLinked.length > 0) {
      sections.push({
        key: 'linked',
        label: `Currently linked (${currentlyLinked.length})`,
        count: currentlyLinked.length,
      });
    }
    if (suggested.length > 0) {
      sections.push({
        key: 'suggested',
        label: suggestionSectionLabel,
        count: suggested.length,
      });
    }
    if (other.length > 0) {
      sections.push({ key: 'other', label: 'Other', count: other.length });
    }
  }

  if (sections.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">No entities found</div>
    );
  }

  const goalAccordionProps = {
    depth: 0 as const,
    expandedIds: mergedExpandedGoalIds,
    onToggleExpand: onToggleGoalExpand,
    selectedIds,
    toggleSelection,
    isSaving,
  };

  return (
    <div>
      {sections.map((section) => (
        <div key={section.key}>
          <PickerSectionHeader label={section.label} />
          {showGoalAccordion ? (
            <GoalAccordionRows
              nodes={
                section.key === 'linked'
                  ? currentlyLinkedGoals
                  : section.key === 'suggested'
                    ? suggestedGoals
                    : otherGoals
              }
              {...goalAccordionProps}
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {(section.key === 'linked'
                ? currentlyLinked
                : section.key === 'suggested'
                  ? suggested
                  : other
              ).map((entity) => (
                <FlatEntityRow
                  key={entity.id}
                  entity={entity}
                  isSelected={selectedIds.includes(entity.id)}
                  isSaving={isSaving}
                  onToggle={() => toggleSelection(entity.id)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
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
  contextArea,
  suggestionSectionLabel = 'Suggested for this project',
}: RelationshipPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(() => new Set());
  const [baselineLinkedIds, setBaselineLinkedIds] = useState<string[]>([]);
  const selectedIdsRef = useRef(selectedIds);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    if (!isOpen) return;
    setBaselineLinkedIds([...selectedIdsRef.current]);
    setSearchQuery('');
    setExpandedGoalIds(new Set());
  }, [isOpen]);

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

  const flatPartitions = useMemo(
    () =>
      partitionRelationshipPickerEntities({
        entities,
        searchQuery,
        baselineLinkedIds,
        contextArea,
      }),
    [entities, searchQuery, baselineLinkedIds, contextArea]
  );

  const goalPartitions = useMemo(
    () => partitionGoalTreeNodes(visibleGoalTree, baselineLinkedIds, contextArea),
    [visibleGoalTree, baselineLinkedIds, contextArea]
  );

  const resetPickerUi = () => {
    setSearchQuery('');
    setExpandedGoalIds(new Set());
  };

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
      console.warn('Failed to save relationship selection:', error);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    resetPickerUi();
    onClose();
  };

  const showGoalAccordion = entityType === 'goal';

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={title} className="max-w-2xl">
      <div className="relative space-y-4">
        {isSaving && (
          <div
            className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm dark:bg-gray-800/80"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Saving...</p>
            </div>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            disabled={isSaving}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        <p className="text-sm font-medium text-gray-700 dark:text-gray-300" aria-live="polite">
          Selected ({selectedIds.length})
        </p>

        <div
          className={cn(
            'max-h-96 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700',
            isSaving && 'pointer-events-none opacity-60'
          )}
        >
          <PickerListSections
            showGoalAccordion={showGoalAccordion}
            currentlyLinked={flatPartitions.currentlyLinked}
            suggested={flatPartitions.suggested}
            other={flatPartitions.other}
            currentlyLinkedGoals={goalPartitions.currentlyLinked}
            suggestedGoals={goalPartitions.suggested}
            otherGoals={goalPartitions.other}
            suggestionSectionLabel={suggestionSectionLabel}
            mergedExpandedGoalIds={mergedExpandedGoalIds}
            onToggleGoalExpand={toggleGoalExpand}
            selectedIds={selectedIds}
            toggleSelection={toggleSelection}
            isSaving={isSaving}
          />
        </div>

        {saveError && <div className="text-sm text-red-600 dark:text-red-400">{saveError}</div>}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
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
