import { useMemo, useState } from 'react';
import { BookmarkPlus, Trash2, X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { useCollapsibleList } from '@/hooks/useCollapsibleList';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import type {
  RadarSavedView,
  RadarSavedViewFilters,
  RadarSource,
} from '@/types/api/personal-branding.dto';
import type { RadarItemsListFilters } from '@/hooks/useSignalRadar';

export type TrendStreamFilterState = RadarItemsListFilters;

interface TrendStreamFilterBarProps {
  filters: TrendStreamFilterState;
  onChange: (next: TrendStreamFilterState) => void;
  sources: RadarSource[];
  savedViews: RadarSavedView[];
  availableTags: string[];
  onSaveView: (name: string, filters: RadarSavedViewFilters) => Promise<void>;
  onDeleteView: (viewId: string) => Promise<void>;
  isSavingView?: boolean;
}

const SOURCE_CHIP_SELECTED =
  'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/60 ring-offset-2 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-offset-gray-900';
const TAG_CHIP_SELECTED =
  'border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-500/60 ring-offset-2 dark:bg-violet-950/40 dark:text-violet-100 dark:ring-offset-gray-900';
const VIEW_CHIP_SELECTED =
  'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/60 ring-offset-2 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-offset-gray-900';

const TOPIC_TAG_PREVIEW_COUNT = 12;

const STARTER_PRESETS = [
  {
    label: 'High relevance',
    apply: (filters: TrendStreamFilterState): TrendStreamFilterState => ({
      ...filters,
      viewId: undefined,
      minAiRelevanceScore: 0.7,
    }),
  },
  {
    label: 'Last 7 days',
    apply: (filters: TrendStreamFilterState): TrendStreamFilterState => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - 7);
      date.setUTCHours(0, 0, 0, 0);
      return {
        ...filters,
        viewId: undefined,
        dateFrom: date.toISOString(),
      };
    },
  },
  {
    label: 'Show noise',
    apply: (filters: TrendStreamFilterState): TrendStreamFilterState => ({
      ...filters,
      viewId: undefined,
      includeFiltered: true,
    }),
  },
] as const;

function toSavedViewFilters(filters: TrendStreamFilterState): RadarSavedViewFilters {
  return {
    q: filters.q || undefined,
    sourceIds: filters.sourceIds?.length ? filters.sourceIds : undefined,
    minAiRelevanceScore: filters.minAiRelevanceScore,
    tags: filters.tags?.length ? filters.tags : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    includeFiltered: filters.includeFiltered || undefined,
  };
}

export default function TrendStreamFilterBar({
  filters,
  onChange,
  sources,
  savedViews,
  availableTags,
  onSaveView,
  onDeleteView,
  isSavingView,
}: TrendStreamFilterBarProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagQuery, setTagQuery] = useState('');

  const selectedSourceIds = useMemo(() => new Set(filters.sourceIds ?? []), [filters.sourceIds]);
  const selectedTags = useMemo(() => new Set(filters.tags ?? []), [filters.tags]);
  const showFilteredNoise = filters.includeFiltered ?? false;

  const filteredTags = useMemo(() => {
    const query = tagQuery.trim().toLowerCase();
    if (!query) return availableTags;
    return availableTags.filter((tag) => tag.toLowerCase().includes(query));
  }, [availableTags, tagQuery]);

  const orderedTags = useMemo(() => {
    const selected: string[] = [];
    const unselected: string[] = [];
    for (const tag of filteredTags) {
      if (selectedTags.has(tag)) selected.push(tag);
      else unselected.push(tag);
    }
    return [...selected, ...unselected];
  }, [filteredTags, selectedTags]);

  const selectedInFilteredCount = useMemo(
    () => orderedTags.filter((tag) => selectedTags.has(tag)).length,
    [orderedTags, selectedTags]
  );

  const topicTagPreviewCount = Math.max(TOPIC_TAG_PREVIEW_COUNT, selectedInFilteredCount);
  const {
    visibleItems: collapsedVisibleTags,
    hiddenCount: hiddenTagCount,
    hasCollapsibleList: hasCollapsibleTagList,
    isExpanded: isTagListExpanded,
    toggle: toggleTagList,
  } = useCollapsibleList(orderedTags, topicTagPreviewCount);

  const isTagSearchActive = tagQuery.trim().length > 0;
  const tagsToRender = isTagSearchActive ? orderedTags : collapsedVisibleTags;
  const showTagCollapseControl = hasCollapsibleTagList && !isTagSearchActive;

  const toggleSource = (sourceId: string) => {
    const current = new Set(filters.sourceIds ?? []);
    if (current.has(sourceId)) current.delete(sourceId);
    else current.add(sourceId);
    onChange({ ...filters, sourceIds: [...current], viewId: undefined });
  };

  const toggleTag = (tag: string) => {
    const current = new Set(filters.tags ?? []);
    if (current.has(tag)) current.delete(tag);
    else current.add(tag);
    onChange({ ...filters, tags: [...current], viewId: undefined });
  };

  const addTagFromInput = () => {
    const normalized = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!normalized) return;
    const current = new Set(filters.tags ?? []);
    current.add(normalized);
    onChange({ ...filters, tags: [...current], viewId: undefined });
    setTagInput('');
  };

  const applyView = (view: RadarSavedView) => {
    onChange({
      page: filters.page,
      pageSize: filters.pageSize,
      viewId: view.id,
      q: view.filters.q ?? undefined,
      sourceIds: view.filters.sourceIds ?? undefined,
      minAiRelevanceScore: view.filters.minAiRelevanceScore ?? undefined,
      tags: view.filters.tags ?? undefined,
      dateFrom: view.filters.dateFrom ?? undefined,
      dateTo: view.filters.dateTo ?? undefined,
      includeFiltered: view.filters.includeFiltered ?? false,
    });
  };

  const clearFilters = () => {
    onChange({ page: filters.page, pageSize: filters.pageSize, includeFiltered: false });
  };

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name) return;
    await onSaveView(name, toSavedViewFilters(filters));
    setSaveName('');
    setSaveOpen(false);
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Search</span>
          <input
            type="search"
            value={filters.q ?? ''}
            onChange={(e) =>
              onChange({ ...filters, q: e.target.value || undefined, viewId: undefined })
            }
            placeholder="Title, summary, or URL"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600 dark:text-gray-400">From</span>
          <input
            type="date"
            value={filters.dateFrom?.slice(0, 10) ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                dateFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
                viewId: undefined,
              })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600 dark:text-gray-400">To</span>
          <input
            type="date"
            value={filters.dateTo?.slice(0, 10) ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                dateTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
                viewId: undefined,
              })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
          />
        </label>
        <div className="flex min-w-[14rem] flex-1 flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-950/40">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Min AI relevance{' '}
              {filters.minAiRelevanceScore != null
                ? `(${Math.round(filters.minAiRelevanceScore * 100)}%)`
                : ''}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((filters.minAiRelevanceScore ?? 0) * 100)}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minAiRelevanceScore: Number(e.target.value) / 100,
                  viewId: undefined,
                })
              }
              className="h-2 w-full cursor-pointer accent-blue-600"
            />
          </label>
          <label
            className={`flex items-center gap-2 rounded-md px-1 py-1 text-sm transition ${
              showFilteredNoise
                ? 'bg-amber-50/80 font-medium text-gray-900 dark:bg-amber-950/30 dark:text-gray-100'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <FormCheckbox
              checked={showFilteredNoise}
              onChange={(e) =>
                onChange({ ...filters, includeFiltered: e.target.checked, viewId: undefined })
              }
            />
            Show filtered noise
          </label>
        </div>
      </div>

      {sources.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sources</p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => {
              const isSelected = selectedSourceIds.has(source.id);
              return (
                <button
                  key={source.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleSource(source.id)}
                  className={selectableChipClassName(
                    isSelected,
                    isSelected ? SOURCE_CHIP_SELECTED : undefined
                  )}
                >
                  {source.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Topic tags</p>
          {showTagCollapseControl ? (
            <button
              type="button"
              onClick={toggleTagList}
              className="text-xs font-medium normal-case text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isTagListExpanded ? 'Show fewer' : `Show ${hiddenTagCount} more`}
            </button>
          ) : null}
        </div>
        <input
          type="search"
          value={tagQuery}
          onChange={(e) => setTagQuery(e.target.value)}
          placeholder="Filter tags…"
          aria-label="Filter topic tags"
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-950"
        />
        {isTagSearchActive && orderedTags.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No tags match</p>
        ) : null}
        {tagsToRender.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tagsToRender.map((tag) => {
              const isSelected = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleTag(tag)}
                  className={selectableChipClassName(
                    isSelected,
                    isSelected ? TAG_CHIP_SELECTED : undefined
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTagFromInput();
              }
            }}
            placeholder="Add tag filter"
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-950"
          />
          <Button type="button" size="sm" variant="secondary" onClick={addTagFromInput}>
            Add tag
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Saved views</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSaveOpen((v) => !v)}
            >
              <BookmarkPlus className="mr-1 size-4" aria-hidden />
              Save view
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={clearFilters}>
              <X className="mr-1 size-4" aria-hidden />
              Clear
            </Button>
          </div>
        </div>
        {saveOpen ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="View name (e.g. Agentic AI only)"
              className="min-w-[14rem] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSave()}
              disabled={isSavingView}
            >
              Save
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {savedViews.map((view) => {
            const isSelected = filters.viewId === view.id;
            return (
              <div key={view.id} className="inline-flex items-center gap-1">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => applyView(view)}
                  className={selectableChipClassName(
                    isSelected,
                    isSelected ? VIEW_CHIP_SELECTED : undefined
                  )}
                >
                  {view.name}
                </button>
                <button
                  type="button"
                  aria-label={`Delete view ${view.name}`}
                  onClick={() => void onDeleteView(view.id)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            );
          })}
        </div>
        {savedViews.length === 0 ? (
          <div className="space-y-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/60 px-3 py-3 dark:border-gray-600 dark:bg-gray-950/30">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No saved views yet — try a starter, then Save view.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PRESETS.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => onChange(starter.apply(filters))}
                  className={selectableChipClassName(false)}
                >
                  {starter.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
