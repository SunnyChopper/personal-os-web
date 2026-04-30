import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { detectBrowserTimeZone, getIanaTimeZoneOptions } from '@/lib/iana-time-zones';
import { useToast } from '@/hooks/use-toast';
import {
  useAcceptAiSourceSuggestion,
  useAcceptDiscoveredSourceSuggestion,
  useCreateLearningSource,
  useCreateLessonTrack,
  useDailyDigests,
  useDailyDiscards,
  useDailyLearningAction,
  useDailyLearningContext,
  useRegenerateDailyLearningAiSummary,
  useDailyLearningSettings,
  useDailyLearningSources,
  useDeleteLearningSource,
  useDismissSourceSuggestion,
  useLessonTracks,
  usePivotLessonTrack,
  usePostDigestFeedback,
  useRestoreDiscard,
  useRunDailyIngest,
  useSkipLessonNode,
  useSourceSuggestions,
  useSuggestSources,
  useUpdateDailyLearningSettings,
} from '@/hooks/useDailyLearning';
import type {
  AiSourceSuggestion,
  AssistantThreadStrategy,
  DailyDigest,
  DailyLearningSettings,
  DigestItem,
  LearningSourceKind,
  LessonTrack,
} from '@/types/daily-learning';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Filter,
  HelpCircle,
  Inbox,
  ListOrdered,
  Newspaper,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Tab = 'feed' | 'filtered' | 'roadmap' | 'settings';

function EmptyTabState({
  icon: Icon,
  title,
  description,
  action,
  steps,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  steps?: string[];
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 bg-gradient-to-b from-gray-50/90 to-gray-100/50 dark:from-gray-900/60 dark:to-gray-950/40 px-6 py-12 sm:py-14 text-center max-w-lg mx-auto shadow-sm dark:shadow-none">
      <div className="rounded-full bg-white dark:bg-gray-800 p-3 shadow-sm border border-gray-100 dark:border-gray-700 mb-3">
        <Icon className="w-10 h-10 text-blue-600 dark:text-blue-400" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-md leading-relaxed">
        {description}
      </p>
      {steps?.length ? (
        <ol className="mt-5 text-left text-sm text-gray-700 dark:text-gray-300 space-y-2 max-w-sm w-full">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-xs font-semibold text-blue-800 dark:text-blue-200">
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeHhMm(raw: string): string {
  const parts = (raw || '08:00').split(':');
  let h = Number(parts[0]);
  let mi = Number(parts[1]);
  if (!Number.isFinite(h)) h = 8;
  if (!Number.isFinite(mi)) mi = 0;
  h = Math.max(0, Math.min(23, h));
  mi = Math.max(0, Math.min(59, mi));
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

function ModernTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hhmm: string) => void;
}) {
  const v = normalizeHhMm(value);
  return (
    <label className="block text-sm">
      <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
      <input
        type="time"
        step={60}
        value={v}
        onChange={(e) => onChange(normalizeHhMm(e.target.value))}
        className="mt-1.5 w-full max-w-[11rem] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 [color-scheme:light] dark:[color-scheme:dark]"
      />
    </label>
  );
}

function trackLessonProgress(tr: LessonTrack): { done: number; total: number; pct: number } {
  const nodes = tr.nodes ?? [];
  const total = nodes.length;
  const done = nodes.filter((n) => n.status === 'completed' || n.status === 'skipped').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function DigestCard({
  digest,
  onFeedback,
  onAction,
  onAcceptDiscovery,
  busyId,
}: {
  digest: DailyDigest;
  onFeedback: (item: DigestItem, type: string) => void;
  onAction: (item: DigestItem, kind: 'extract' | 'flashcards' | 'deepDive' | 'task') => void;
  onAcceptDiscovery?: (suggestionId: string) => void;
  busyId: string | null;
}) {
  const channelStyles =
    digest.channel === 'theory'
      ? 'from-violet-500/15 to-transparent border-violet-200/80 dark:border-violet-800/60'
      : 'from-sky-500/15 to-transparent border-sky-200/80 dark:border-sky-800/60';

  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br shadow-sm overflow-hidden',
        'border-gray-200/90 dark:border-gray-700/90',
        'from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-950/80',
        channelStyles
      )}
    >
      <div className="px-5 pt-4 pb-3 border-b border-gray-100/80 dark:border-gray-800/80 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize tracking-tight">
              {digest.channel}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {digest.digestDate}
              <span className="mx-1.5 opacity-40">·</span>
              <span className="capitalize">{digest.status}</span>
              {digest.deliveredAt ? (
                <>
                  <span className="mx-1.5 opacity-40">·</span>
                  Delivered {digest.deliveredAt}
                </>
              ) : null}
            </p>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {digest.items.length} {digest.items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {digest.items.map((item) => {
          const itemBusy = busyId === `${digest.id}:${item.id}`;
          return (
            <li key={item.id} className="px-5 py-4 space-y-3">
              <div className="flex flex-wrap items-start gap-2 gap-y-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug flex-1 min-w-[12rem]">
                  {item.title}
                </h4>
                {item.provenance === 'discovered' && item.originDomain ? (
                  <span className="text-[10px] uppercase tracking-wide rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 px-2 py-0.5 shrink-0">
                    Discovered · {item.originDomain}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-[12]">
                {item.summary.slice(0, 1200)}
                {item.summary.length > 1200 ? '…' : ''}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-500 font-mono">
                Score {item.relevanceScore.toFixed(2)}
                {Object.keys(item.scoreBreakdown).length ? (
                  <>
                    {' '}
                    ·{' '}
                    {Object.entries(item.scoreBreakdown)
                      .map(([k, v]) => `${k} ${v.toFixed(2)}`)
                      .join(' · ')}
                  </>
                ) : null}
              </p>
              {item.provenance === 'discovered' && item.discoverySuggestionId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => onAcceptDiscovery?.(item.discoverySuggestionId!)}
                >
                  Add this feed
                </Button>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['moreLikeThis', 'More like this'],
                    ['tooBasic', 'Too basic'],
                    ['tooAdvanced', 'Too advanced'],
                    ['irrelevant', 'Irrelevant'],
                  ] as const
                ).map(([t, label]) => (
                  <button
                    key={t}
                    type="button"
                    className="text-xs px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => onFeedback(item, t)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 -mx-1 px-1 py-2 rounded-xl bg-gray-50/90 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/80">
                <Button type="button" size="sm" disabled={itemBusy} onClick={() => onAction(item, 'extract')}>
                  Extract
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={itemBusy}
                  onClick={() => onAction(item, 'flashcards')}
                >
                  Flashcards
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={itemBusy}
                  onClick={() => onAction(item, 'deepDive')}
                >
                  Deep dive
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={itemBusy}
                  onClick={() => onAction(item, 'task')}
                >
                  To task
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function DailyLearningPage() {
  const qc = useQueryClient();
  const { ToastContainer } = useToast();
  const [tab, setTab] = useState<Tab>('feed');
  const [busy, setBusy] = useState<string | null>(null);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: '', subject: '', lessonsPerWeek: 5 });
  const date = useMemo(() => todayIso(), []);
  const { data: settings, isLoading: ldSettings } = useDailyLearningSettings();
  const updateSettings = useUpdateDailyLearningSettings();
  const [draft, setDraft] = useState<DailyLearningSettings | null>(null);
  useEffect(() => {
    if (settings)
      setDraft({
        ...settings,
        discoveryEnabled: settings.discoveryEnabled ?? true,
        deliveryEmailEnabled: settings.deliveryEmailEnabled ?? true,
        assistantThreadStrategy: settings.assistantThreadStrategy ?? 'reuseFixedThread',
      });
  }, [settings]);
  const {
    data: sources = [],
    isLoading: ldSrc,
    isError: sourcesQueryError,
    error: sourcesQueryErr,
  } = useDailyLearningSources();
  const createSrc = useCreateLearningSource();
  const delSrc = useDeleteLearningSource();
  const {
    data: ctx,
    isLoading: ctxLoading,
    isError: ctxError,
  } = useDailyLearningContext();
  const regenerateAiSummary = useRegenerateDailyLearningAiSummary();
  const { data: digests = [], refetch: refetchDigests } = useDailyDigests({ digestDate: date });
  const { data: discards = [], refetch: refetchDisc } = useDailyDiscards({ digestDate: date });
  const ingest = useRunDailyIngest();
  const restore = useRestoreDiscard();
  const feedback = usePostDigestFeedback();
  const { data: tracks = [] } = useLessonTracks();
  const createTrack = useCreateLessonTrack();
  const pivot = usePivotLessonTrack();
  const skip = useSkipLessonNode();
  const action = useDailyLearningAction();
  const acceptDiscovered = useAcceptDiscoveredSourceSuggestion();
  const sourceSuggestions = useSourceSuggestions(false);
  const suggestSources = useSuggestSources();
  const acceptAiSuggestion = useAcceptAiSourceSuggestion();
  const dismissSuggestion = useDismissSourceSuggestion();
  const [aiSuggestOpen, setAiSuggestOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSourceSuggestion[]>([]);

  const browserTimeZone = useMemo(() => detectBrowserTimeZone(), []);
  const zoneOptions = useMemo(() => {
    const z = getIanaTimeZoneOptions();
    const tz = draft?.timeZone;
    if (tz && !z.includes(tz)) return [tz, ...z];
    return z;
  }, [draft?.timeZone]);

  const [newSrc, setNewSrc] = useState({
    name: '',
    kind: 'rss' as LearningSourceKind,
    rssUrl: '',
    scope: 'trends' as const,
  });

  const onSaveSettings = () => {
    if (!draft) return;
    void updateSettings.mutateAsync(draft);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-0 py-3 space-y-5">
      <ToastContainer />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-7 h-7" />
            Daily Learning
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Trends + theory, heuristic filtering, proactive delivery.
          </p>
        </div>
      </header>

      <nav className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {(
          [
            ['feed', 'Feed'],
            ['filtered', 'Filtered Out'],
            ['roadmap', 'Theory Roadmap'],
            ['settings', 'Settings'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              tab === k
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'feed' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Digests for <strong>{date}</strong>. Run ingest to refresh.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => void ingest.mutateAsync(undefined)}
              disabled={ingest.isPending}
            >
              <RefreshCw className={cn('w-4 h-4 mr-1', ingest.isPending && 'animate-spin')} />
              Run ingest
            </Button>
          </div>
          {digests.length === 0 ? (
            <EmptyTabState
              icon={Newspaper}
              title="No digests for this date yet"
              description="Wire up sources and ingest once — your personalized trends and theory digests will land here after scoring."
              steps={[
                'Open Settings and add at least one RSS, ArXiv, or manual URL source.',
                'Set local delivery times and time zone so proactive runs line up with your day.',
                'Run ingest for today — items that pass relevance scoring appear in this feed.',
              ]}
              action={
                <>
                  <Button type="button" size="sm" onClick={() => setTab('settings')}>
                    Open settings &amp; sources
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void ingest.mutateAsync(undefined)}
                    disabled={ingest.isPending}
                  >
                    <RefreshCw className={cn('w-4 h-4 mr-1', ingest.isPending && 'animate-spin')} />
                    Run ingest
                  </Button>
                </>
              }
            />
          ) : (
            digests.map((d) => (
              <DigestCard
                key={d.id}
                digest={d}
                busyId={busy}
                onFeedback={(item, type) =>
                  void feedback.mutateAsync({
                    digestId: d.id,
                    digestItemId: item.id,
                    feedbackType: type,
                    topicKeys: item.matchedKeywords,
                    sourceId: item.sourceId,
                  })
                }
                onAction={(item, kind) => {
                  const key = `${d.id}:${item.id}`;
                  setBusy(key);
                  void action
                    .mutateAsync({ kind, digestId: d.id, digestItemId: item.id })
                    .finally(() => {
                      setBusy(null);
                      void refetchDigests();
                    });
                }}
                onAcceptDiscovery={(sid) => void acceptDiscovered.mutateAsync(sid)}
              />
            ))
          )}
        </section>
      )}

      {tab === 'filtered' && (
        <section className="space-y-3">
          {discards.filter((x) => !x.restoredAt).length === 0 ? (
            <EmptyTabState
              icon={Filter}
              title="Nothing filtered out today"
              description="Items scored below your threshold or matching muted topics land here. If digests look empty, check the Feed tab or lower thresholds in Settings."
              action={
                <Button type="button" size="sm" variant="secondary" onClick={() => setTab('feed')}>
                  Back to Feed
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {discards
                .filter((x) => !x.restoredAt)
                .map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm"
                  >
                    <div className="font-medium">{r.title}</div>
                    <div className="text-gray-500 text-xs mt-1">
                      {r.rejectedReason} · score {r.relevanceScore.toFixed(2)} / threshold{' '}
                      {r.threshold}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        void restore.mutateAsync(r.id).then(() => {
                          void refetchDigests();
                          void refetchDisc();
                        })
                      }
                    >
                      Restore &amp; adjust
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'roadmap' && (
        <section className="space-y-4">
          <div
            className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-900 dark:text-blue-100 flex flex-wrap items-start gap-2"
            role="note"
          >
            <BookOpen className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <p>
              <strong>Theory Roadmap</strong> is your queued list of foundational concepts. Each{' '}
              <em>track</em> holds ordered lessons; the next items are dripped into your daily{' '}
              <strong>Theory</strong> digest (after ingest). Use <strong>Pivot (AI)</strong> to
              reshape a track from a natural-language request.
            </p>
            <button
              type="button"
              className="ml-auto text-blue-700 dark:text-blue-300"
              title="Theory Roadmap = queued foundational concepts; lessons feed the Theory digest after ingest."
              aria-label="Help: Theory Roadmap"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button type="button" size="sm" onClick={() => setTrackModalOpen(true)}>
              New track
            </Button>
          </div>
          {tracks.length === 0 ? (
            <EmptyTabState
              icon={BookOpen}
              title="No theory tracks yet"
              description="Create a track to queue foundational lessons. Ingest drips the next nodes into your Theory digest. Use Pivot (AI) anytime to reshape a track from a short brief."
              action={
                <Button type="button" size="sm" onClick={() => setTrackModalOpen(true)}>
                  New track
                </Button>
              }
            />
          ) : (
            tracks.map((tr) => {
              const { done, total, pct } = trackLessonProgress(tr);
              return (
                <div
                  key={tr.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 shadow-sm overflow-hidden"
                >
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight">
                          {tr.title}
                        </h3>
                        {tr.subject ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tr.subject}</p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const req = window.prompt('Describe how to pivot this track:');
                          if (req) void pivot.mutateAsync({ trackId: tr.id, userRequest: req });
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 inline" />
                        Pivot (AI)
                      </Button>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                        <span>
                          Progress · {done} / {total} lessons wrapped
                        </span>
                        <span className="font-medium tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <ol className="space-y-2 text-sm">
                      {tr.nodes
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((n) => (
                          <li
                            key={n.id}
                            className="flex flex-wrap items-start gap-2 py-1.5 border-b border-gray-50 dark:border-gray-800/80 last:border-0"
                          >
                            <span className="mt-0.5 text-gray-400" aria-hidden>
                              {n.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : n.status === 'skipped' ? (
                                <Circle className="w-4 h-4 text-gray-400 line-through" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-900 dark:text-gray-100">{n.title}</span>
                              <span className="text-gray-500 dark:text-gray-500 text-xs ml-2">
                                ({n.status})
                              </span>
                            </div>
                            {n.status !== 'skipped' && n.status !== 'completed' ? (
                              <button
                                type="button"
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                                onClick={() => void skip.mutateAsync({ trackId: tr.id, nodeId: n.id })}
                              >
                                Skip
                              </button>
                            ) : null}
                          </li>
                        ))}
                    </ol>
                  </div>
                </div>
              );
            })
          )}

          {trackModalOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-track-title"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setTrackModalOpen(false);
              }}
            >
              <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-5 sm:p-6 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h2 id="new-track-title" className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <ListOrdered className="w-5 h-5 text-violet-500" aria-hidden />
                      New theory track
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Ordered lessons feed your Theory digest after each ingest. You can refine the
                      queue later with Pivot (AI).
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    onClick={() => setTrackModalOpen(false)}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <label className="block text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Title</span>
                  <input
                    className="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                    value={newTrack.title}
                    onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                    placeholder="e.g. Distributed systems foundations"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Subject (optional)</span>
                  <input
                    className="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                    value={newTrack.subject}
                    onChange={(e) => setNewTrack({ ...newTrack, subject: e.target.value })}
                    placeholder="e.g. Backend / CS"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Lessons per week</span>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                    value={newTrack.lessonsPerWeek}
                    onChange={(e) =>
                      setNewTrack({
                        ...newTrack,
                        lessonsPerWeek: Math.min(14, Math.max(1, Number(e.target.value) || 5)),
                      })
                    }
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Between 1 and 14; controls pacing for dripped lessons.</p>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setTrackModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={!newTrack.title.trim() || createTrack.isPending}
                    onClick={() => {
                      void createTrack
                        .mutateAsync({
                          title: newTrack.title.trim(),
                          subject: newTrack.subject.trim() || undefined,
                          pacing: { lessonsPerWeek: newTrack.lessonsPerWeek },
                        })
                        .then(() => {
                          setTrackModalOpen(false);
                          setNewTrack({ title: '', subject: '', lessonsPerWeek: 5 });
                          void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.tracks() });
                        });
                    }}
                  >
                    Create track
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {tab === 'settings' && (
        <section className="space-y-6">
          {ldSettings || !draft ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              <SettingsSection
                title="Delivery & notifications"
                description="Local times use your saved IANA time zone. These sync to hidden proactive automations when you save."
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  <ModernTimeInput
                    label="Trends delivery (local)"
                    value={draft.trendDeliveryTime}
                    onChange={(v) => setDraft({ ...draft, trendDeliveryTime: v })}
                  />
                  <ModernTimeInput
                    label="Theory delivery (local)"
                    value={draft.theoryDeliveryTime}
                    onChange={(v) => setDraft({ ...draft, theoryDeliveryTime: v })}
                  />
                </div>
                <div className="block text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Time zone (IANA)</span>
                  <div className="mt-1.5 flex flex-wrap gap-2 items-center">
                    <select
                      className="flex-1 min-w-[12rem] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm"
                      value={draft.timeZone || browserTimeZone}
                      onChange={(e) => setDraft({ ...draft, timeZone: e.target.value })}
                    >
                      {zoneOptions.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setDraft({ ...draft, timeZone: browserTimeZone })}
                    >
                      Auto-detect
                    </Button>
                  </div>
                  {draft.timeZone && draft.timeZone !== browserTimeZone ? (
                    <p
                      role="status"
                      className="mt-2 text-[11px] text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5"
                    >
                      Saved time zone is <strong>{draft.timeZone}</strong>, but this browser reports{' '}
                      <strong>{browserTimeZone}</strong>. If they do not match where you live,
                      scheduled delivery may use the wrong local day.
                    </p>
                  ) : null}
                </div>
                <label className="flex items-start gap-3 text-sm cursor-pointer rounded-lg border border-gray-100 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-800/30">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 mt-0.5"
                    checked={draft.deliveryEmailEnabled ?? true}
                    onChange={(e) =>
                      setDraft({ ...draft, deliveryEmailEnabled: e.target.checked })
                    }
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">Email digests</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      When proactive delivery runs, send using the same email channel as your other
                      proactive automations.
                    </span>
                  </span>
                </label>
                <div className="block text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Assistant thread</span>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 mb-1.5">
                    Reuse one thread per stream for continuity, or start fresh each run.
                  </p>
                  <select
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm max-w-md shadow-sm"
                    value={draft.assistantThreadStrategy ?? 'reuseFixedThread'}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        assistantThreadStrategy: e.target.value as AssistantThreadStrategy,
                      })
                    }
                  >
                    <option value="reuseFixedThread">Reuse one dedicated thread per stream</option>
                    <option value="newThreadEachRun">New thread each run</option>
                  </select>
                </div>
                <Button type="button" onClick={onSaveSettings} disabled={updateSettings.isPending}>
                  <Settings2 className="w-4 h-4 mr-1" />
                  Save settings &amp; sync delivery
                </Button>
              </SettingsSection>

              <SettingsSection
                title="Content & discovery"
                description="Optional discovery feeds broaden ingest beyond your subscribed sources."
              >
                <label className="flex items-start gap-3 text-sm cursor-pointer rounded-lg border border-gray-100 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-800/30">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 mt-0.5"
                    checked={draft.discoveryEnabled ?? true}
                    onChange={(e) =>
                      setDraft({ ...draft, discoveryEnabled: e.target.checked })
                    }
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">Discovery feeds</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Hacker News, Lobsters, Google News RSS, optional ArXiv — surfaces fresh items
                      outside your sources; repeated domains can be added as RSS.
                    </span>
                  </span>
                </label>
              </SettingsSection>

              <SettingsSection
                title="Context & sources"
                description="How Daily Learning ranks items against your Growth System, vault, and memory."
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Context preview
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                  Keyword graph plus an optional AI narrative. Refresh signals rebuilds weights from
                  your stack; Regenerate AI summary calls the model without recomputing keywords.
                </p>
                {ctxLoading ? (
                  <p className="text-sm text-gray-500">Loading context…</p>
                ) : ctxError ? (
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Could not load context. Try refresh or check your connection.
                  </p>
                ) : ctx ? (
                  <>
                    {ctx.aiInsightSummary ? (
                      <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/25 p-4 space-y-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                          AI narrative
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                          {ctx.aiInsightSummary}
                        </p>
                      </div>
                    ) : null}
                    {ctx.insightSummary ? (
                      <div className={ctx.aiInsightSummary ? 'pt-1' : ''}>
                        {ctx.aiInsightSummary ? (
                          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Signal summary
                          </div>
                        ) : null}
                        <p
                          className={
                            ctx.aiInsightSummary
                              ? 'text-xs text-gray-600 dark:text-gray-400 leading-relaxed'
                              : 'text-sm text-gray-800 dark:text-gray-200 leading-relaxed border-l-2 border-blue-400 dark:border-blue-600 pl-3'
                          }
                        >
                          {ctx.insightSummary}
                        </p>
                      </div>
                    ) : null}
                    {ctx.topAreas?.length ? (
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Task areas
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {ctx.topAreas.map((a) => (
                            <span
                              key={a}
                              className="text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-0.5"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {ctx.sourceMix && Object.keys(ctx.sourceMix).length > 0 ? (
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Weight by signal source
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                          {Object.entries(ctx.sourceMix)
                            .slice(0, 8)
                            .map(([k, v]) => (
                              <span
                                key={k}
                                className="rounded-md bg-gray-50 dark:bg-gray-800/80 px-2 py-0.5"
                              >
                                {k}: {v.toFixed(2)}
                              </span>
                            ))}
                        </div>
                      </div>
                    ) : null}
                    <details className="text-sm group">
                      <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                        Top keywords ({ctx.keywords.length})
                      </summary>
                      <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 max-h-48 overflow-auto border border-gray-100 dark:border-gray-800 rounded-lg p-2">
                        {ctx.keywords.slice(0, 40).map((k) => (
                          <li key={k.keyword}>
                            {k.keyword} · {k.weight.toFixed(2)} · {k.provenance.join(', ')}
                          </li>
                        ))}
                      </ul>
                    </details>
                    <p className="text-[11px] text-gray-400">Updated {ctx.generatedAt || '—'}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No context loaded yet.</p>
                )}
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.context() })
                    }
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh signals
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void regenerateAiSummary.mutateAsync()}
                    disabled={regenerateAiSummary.isPending || ctxLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    {regenerateAiSummary.isPending ? 'Generating…' : 'Regenerate AI summary'}
                  </Button>
                </div>

                <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">Discovered source suggestions</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void qc.invalidateQueries({ queryKey: queryKeys.dailyLearning.sourceSuggestions() })}
                  >
                    Refresh
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  After several relevant hits from the same site, we suggest adding it as an RSS source.
                </p>
                {sourceSuggestions.isLoading ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : (sourceSuggestions.data ?? []).length === 0 ? (
                  <EmptyTabState
                    icon={Inbox}
                    title="No domain suggestions yet"
                    description="When discovery finds repeated strong hits from a hostname, a suggestion appears here so you can add it as an RSS source in one click."
                  />
                ) : (
                  <ul className="space-y-2 text-sm">
                    {(sourceSuggestions.data ?? []).map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 py-2"
                      >
                        <div>
                          <div className="font-medium">{s.originDomain}</div>
                          <div className="text-xs text-gray-500">
                            hits {s.hitCount}
                            {s.readyToPropose ? ' · ready' : ''}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void acceptDiscovered.mutateAsync(s.id)}
                          >
                            Add feed
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => void dismissSuggestion.mutateAsync(s.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                </div>

                <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">Sources</h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      const list = await suggestSources.mutateAsync();
                      setAiSuggestions(list);
                      setAiSuggestOpen(true);
                    }}
                    disabled={suggestSources.isPending}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Suggest sources (AI)
                  </Button>
                </div>
                {ldSrc ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : sourcesQueryError ? (
                  <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                    Could not load sources
                    {sourcesQueryErr instanceof Error ? `: ${sourcesQueryErr.message}` : '.'} Refresh the page
                    or check your connection; saved sources may still exist on the server.
                  </p>
                ) : sources.length === 0 ? (
                  <EmptyTabState
                    icon={Newspaper}
                    title="No sources configured"
                    description="Add at least one RSS feed, ArXiv query, or manual URL so ingest has something to poll. AI suggestions can help once context is populated."
                  />
                ) : (
                  <ul className="space-y-2">
                    {sources.map((s) => (
                      <li
                        key={s.id}
                        className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-800 py-2"
                      >
                        <span>
                          {s.name} · {s.kind} · {s.scope}
                        </span>
                        <button
                          type="button"
                          className="text-red-600"
                          onClick={() => void delSrc.mutateAsync(s.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 items-end">
                  <label className="text-sm">
                    Name
                    <input
                      className="block mt-1 rounded border border-gray-300 dark:border-gray-600 px-2 py-1"
                      value={newSrc.name}
                      onChange={(e) => setNewSrc({ ...newSrc, name: e.target.value })}
                    />
                  </label>
                  <label className="text-sm">
                    Kind
                    <select
                      className="block mt-1 rounded border border-gray-300 dark:border-gray-600 px-2 py-1"
                      value={newSrc.kind}
                      onChange={(e) =>
                        setNewSrc({ ...newSrc, kind: e.target.value as LearningSourceKind })
                      }
                    >
                      <option value="rss">rss</option>
                      <option value="arxiv">arxiv</option>
                      <option value="manualUrl">manualUrl</option>
                      <option value="xList">xList</option>
                    </select>
                  </label>
                  <label className="text-sm flex-1 min-w-[200px]">
                    RSS / URL / Query
                    <input
                      className="block mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1"
                      value={newSrc.rssUrl}
                      onChange={(e) => setNewSrc({ ...newSrc, rssUrl: e.target.value })}
                      placeholder="https://…"
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const body: Record<string, unknown> = {
                        name: newSrc.name,
                        kind: newSrc.kind,
                        scope: newSrc.scope,
                        enabled: true,
                      };
                      if (newSrc.kind === 'rss') body.rssUrl = newSrc.rssUrl;
                      if (newSrc.kind === 'arxiv') body.arxivQuery = newSrc.rssUrl;
                      if (newSrc.kind === 'manualUrl') body.url = newSrc.rssUrl;
                      if (newSrc.kind === 'xList') body.xListId = newSrc.rssUrl;
                      void createSrc.mutateAsync(
                        body as Parameters<typeof createSrc.mutateAsync>[0]
                      );
                    }}
                  >
                    Add source
                  </Button>
                </div>
                </div>
              </SettingsSection>
            </>
          )}
        </section>
      )}

      {aiSuggestOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-suggest-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAiSuggestOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-4 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 id="ai-suggest-title" className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Suggested sources
              </h2>
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setAiSuggestOpen(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {aiSuggestions.length === 0 ? (
              <p className="text-sm text-gray-500">No suggestions returned.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {aiSuggestions.map((s, i) => (
                  <li
                    key={`${s.name}-${i}`}
                    className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 space-y-2"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      {s.kind} · {s.scope} · {(s.confidence * 100).toFixed(0)}% confidence
                    </div>
                    {s.rationale ? <p className="text-xs text-gray-600 dark:text-gray-400">{s.rationale}</p> : null}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          void acceptAiSuggestion.mutateAsync(s).then(() => {
                            setAiSuggestions((prev) => prev.filter((_, j) => j !== i));
                          })
                        }
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setAiSuggestions((prev) => prev.filter((_, j) => j !== i))}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
