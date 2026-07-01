import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2, Pencil, Plus, RefreshCw } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import { useCareerJobSources } from '@/hooks/useCareerJobSources';
import {
  useCareerJobScrapeRunDetail,
  useCareerJobScrapeRuns,
} from '@/hooks/useCareerJobScrapeRuns';
import { JobPostingEditModal } from '@/pages/admin/career/JobPostingEditModal';
import { ROUTES } from '@/routes';
import type {
  CareerJobPosting,
  CareerJobPostingExtractedStructure,
  CareerJobPostingPreview,
  CareerJobScrapeRunSummary,
} from '@/types/api/career.types';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';

type JobSourcesTab = 'saved' | 'scrapeRuns';

function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  const { loading, children, disabled, className, ...rest } = props;
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${className ?? ''}`}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

function postingLabel(p: CareerJobPosting): string {
  const title = p.title || p.roleGuess || 'Role';
  const company = p.company || p.companyGuess || 'Company';
  const prov = p.provider || p.jobBoard;
  return `${title} · ${company}${prov ? ` (${prov})` : ''}`;
}

function PreviewFields({
  structure,
  lowConfidenceFields,
}: {
  structure: CareerJobPostingExtractedStructure;
  lowConfidenceFields: string[];
}) {
  const low = new Set(lowConfidenceFields.map((f) => f.toLowerCase()));
  const warn = (field: string, value: React.ReactNode) => (
    <div className={low.has(field.toLowerCase()) ? 'text-amber-800 dark:text-amber-200' : ''}>
      {value}
    </div>
  );
  return (
    <div className="grid sm:grid-cols-2 gap-2 text-sm">
      {warn(
        'title',
        <div>
          <span className="text-gray-500">Title:</span>{' '}
          {structure.title || structure.roleGuess || '—'}
        </div>
      )}
      {warn(
        'company',
        <div>
          <span className="text-gray-500">Company:</span>{' '}
          {structure.company || structure.companyGuess || '—'}
        </div>
      )}
      <div>
        <span className="text-gray-500">Location:</span> {structure.location || '—'}
      </div>
      <div>
        <span className="text-gray-500">Seniority:</span> {structure.seniority || '—'}
      </div>
      <div className="sm:col-span-2">
        <span className="text-gray-500">Mandatory keywords:</span>{' '}
        {structure.mandatoryKeywords?.length ? structure.mandatoryKeywords.join(', ') : '—'}
      </div>
    </div>
  );
}

function ScrapeAssessedJobRow({ posting }: { posting: CareerJobPosting }) {
  const assessment = posting.relevanceAssessment;
  const hardPass = assessment?.hardPassReasons?.length
    ? assessment.hardPassReasons.join(', ')
    : null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1 text-sm">
      <div className="font-medium text-gray-900 dark:text-white">
        {posting.title || posting.roleGuess || 'Role'} ·{' '}
        {posting.company || posting.companyGuess || 'Company'}
      </div>
      <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
        <span>{posting.provider || posting.jobBoard || '—'}</span>
        <span>{posting.location || '—'}</span>
        {assessment?.score != null ? (
          <span>
            score {(assessment.score * 100).toFixed(0)}% · conf{' '}
            {((assessment.confidence ?? 0) * 100).toFixed(0)}%
          </span>
        ) : null}
      </div>
      {hardPass ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">Hard pass: {hardPass}</p>
      ) : null}
      {assessment?.rationale ? (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {assessment.rationale}
        </p>
      ) : null}
    </div>
  );
}

function ScrapeRunsPanel() {
  const [runPage, setRunPage] = useState(1);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const scrape = useCareerJobScrapeRuns({
    page: runPage,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const runs = scrape.runs.data?.items ?? [];
  const activeRunId =
    selectedRunId ??
    runs.find((r) => r.status === 'queued' || r.status === 'running')?.id ??
    runs[0]?.id ??
    null;

  const activeDetail = useCareerJobScrapeRunDetail(activeRunId);
  const runDetail = activeDetail.detail.data;
  const relevantItems = activeDetail.relevant.data?.items ?? [];
  const irrelevantItems = activeDetail.irrelevant.data?.items ?? [];

  async function handleStartScrape() {
    const res = await scrape.start.mutateAsync({});
    setSelectedRunId(res.runId);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scrape runs</h2>
        <Btn loading={scrape.start.isPending} onClick={() => void handleStartScrape()}>
          <RefreshCw className="size-4" aria-hidden />
          Start scrape
        </Btn>
      </div>

      {scrape.start.error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          {scrape.start.error instanceof Error
            ? scrape.start.error.message
            : String(scrape.start.error)}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/60 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Trigger</th>
              <th className="px-3 py-2">Sources</th>
              <th className="px-3 py-2">Discovered</th>
              <th className="px-3 py-2">Relevant</th>
              <th className="px-3 py-2">Irrelevant</th>
              <th className="px-3 py-2">Started</th>
            </tr>
          </thead>
          <tbody>
            {scrape.runs.isLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  Loading runs…
                </td>
              </tr>
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No scrape runs yet. Start one to crawl crawl-enabled sources.
                </td>
              </tr>
            ) : (
              runs.map((run: CareerJobScrapeRunSummary) => (
                <tr
                  key={run.id}
                  className={`border-t border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/30 ${
                    activeRunId === run.id ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => setSelectedRunId(run.id)}
                >
                  <td className="px-3 py-2 font-mono text-xs">{run.status}</td>
                  <td className="px-3 py-2">{run.trigger}</td>
                  <td className="px-3 py-2">
                    {run.sourcesSucceeded}/{run.sourcesTotal}
                    {run.sourcesFailed ? ` (${run.sourcesFailed} failed)` : ''}
                  </td>
                  <td className="px-3 py-2">{run.postingsDiscovered}</td>
                  <td className="px-3 py-2 text-emerald-700 dark:text-emerald-300">
                    {run.relevantCount}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{run.irrelevantCount}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Page {runPage}</span>
        <div className="flex gap-2">
          <Btn disabled={runPage <= 1} onClick={() => setRunPage((p) => Math.max(1, p - 1))}>
            Previous
          </Btn>
          <Btn
            disabled={!(scrape.runs.data?.hasMore ?? false)}
            onClick={() => setRunPage((p) => p + 1)}
          >
            Next
          </Btn>
        </div>
      </div>

      {activeRunId && runDetail ? (
        <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span>Run {runDetail.id.slice(0, 8)}…</span>
            <span>{runDetail.status}</span>
            {runDetail.errorSummary ? (
              <span className="text-amber-700 dark:text-amber-300">{runDetail.errorSummary}</span>
            ) : null}
          </div>
          {runDetail.sourceRuns?.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Source progress
              </h3>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                {runDetail.sourceRuns.map((sr) => (
                  <li key={sr.id}>
                    {sr.sourceId.slice(0, 8)}… · {sr.status} · discovered {sr.postingsDiscovered} ·
                    relevant {sr.relevantCount}
                    {sr.errorMessage ? ` · ${sr.errorMessage}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Relevant jobs ({relevantItems.length})
              </h3>
              {activeDetail.relevant.isLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : relevantItems.length === 0 ? (
                <p className="text-sm text-gray-500">None yet for this run.</p>
              ) : (
                relevantItems.map((p) => <ScrapeAssessedJobRow key={p.id} posting={p} />)
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Irrelevant jobs ({irrelevantItems.length})
              </h3>
              {activeDetail.irrelevant.isLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : irrelevantItems.length === 0 ? (
                <p className="text-sm text-gray-500">None yet for this run.</p>
              ) : (
                irrelevantItems.map((p) => <ScrapeAssessedJobRow key={p.id} posting={p} />)
              )}
            </div>
          </div>
        </div>
      ) : activeDetail.detail.isLoading && activeRunId ? (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading run detail…
        </p>
      ) : null}
    </section>
  );
}

export default function JobSourcesPage() {
  const [activeTab, setActiveTab] = useState<JobSourcesTab>('saved');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosting, setEditingPosting] = useState<CareerJobPosting | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [rawHtml, setRawHtml] = useState('');
  const [fallbackMode, setFallbackMode] = useState<'rawText' | 'rawHtml'>('rawText');
  const [preview, setPreview] = useState<CareerJobPostingPreview | null>(null);
  const [lastIngestMsg, setLastIngestMsg] = useState<string | null>(null);

  const listFilters = useMemo(
    () => ({
      page,
      pageSize: 25,
      sortBy,
      sortOrder,
      search: search.trim() || undefined,
      provider: providerFilter.trim() || undefined,
    }),
    [page, search, providerFilter, sortBy, sortOrder]
  );

  const js = useCareerJobSources(listFilters);

  const hasSourceUrl = sourceUrl.trim().length > 0;
  const isIngestBusy = js.preview.isPending || js.ingest.isPending;

  function resetIngestForm() {
    setSourceUrl('');
    setRawText('');
    setRawHtml('');
    setFallbackMode('rawText');
    setPreview(null);
    js.preview.reset();
    js.ingest.reset();
  }

  function handleCloseModal() {
    if (isIngestBusy) return;
    setIsModalOpen(false);
    resetIngestForm();
  }

  async function runPreview() {
    setLastIngestMsg(null);
    const body =
      preview?.needsUserInput || rawText.trim() || rawHtml.trim()
        ? {
            sourceUrl: sourceUrl.trim() || null,
            rawText: fallbackMode === 'rawText' ? rawText.trim() || null : null,
            rawHtml: fallbackMode === 'rawHtml' ? rawHtml.trim() || null : null,
            inputKind: fallbackMode,
          }
        : { sourceUrl: sourceUrl.trim() || null };
    const res = await js.preview.mutateAsync(body);
    setPreview(res);
  }

  async function runIngest(saveEvenIfLowConfidence: boolean) {
    setLastIngestMsg(null);
    const res = await js.ingest.mutateAsync({
      sourceUrl: sourceUrl.trim() || null,
      rawText: fallbackMode === 'rawText' ? rawText.trim() || null : null,
      rawHtml: fallbackMode === 'rawHtml' ? rawHtml.trim() || null : null,
      inputKind: preview?.needsUserInput ? fallbackMode : undefined,
      saveEvenIfLowConfidence,
    });
    const dup = res.duplicate ? ` (${res.mergeAction})` : '';
    setLastIngestMsg(
      res.duplicate
        ? `Updated existing posting${dup}.`
        : `Saved posting ${res.posting.id.slice(0, 8)}…`
    );
    setIsModalOpen(false);
    resetIngestForm();
  }

  const items = js.postings.data?.items ?? [];
  const total = js.postings.data?.total ?? 0;
  const hasMore = js.postings.data?.hasMore ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900/40">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === 'saved'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('saved')}
          >
            Saved postings
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === 'scrapeRuns'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('scrapeRuns')}
          >
            Scrape runs
          </button>
        </div>
        {activeTab === 'saved' ? (
          <Btn onClick={() => setIsModalOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add Job Source
          </Btn>
        ) : null}
      </div>

      {activeTab === 'saved' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ingest postings here, then use them in{' '}
              <Link
                to={ROUTES.admin.careerResume}
                className="text-blue-600 dark:text-blue-400 underline"
              >
                Resume Builder → Tailor & generate
              </Link>
              .
            </p>
          </div>

          {lastIngestMsg ? (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
            >
              {lastIngestMsg}
            </div>
          ) : null}

          <section className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Saved postings
              </h2>
              <div className="flex flex-wrap gap-2">
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                <Select
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm bg-white dark:bg-gray-900"
                  value={providerFilter}
                  onChange={(e) => {
                    setProviderFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All providers</option>
                  <option value="greenhouse">Greenhouse</option>
                  <option value="lever">Lever</option>
                  <option value="ashby">Ashby</option>
                  <option value="workable">Workable</option>
                  <option value="smartrecruiters">SmartRecruiters</option>
                </Select>
                <Select
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm bg-white dark:bg-gray-900"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="createdAt">Date added</option>
                  <option value="title">Title</option>
                  <option value="company">Company</option>
                  <option value="lastSeenAt">Last seen</option>
                </Select>
                <Select
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm bg-white dark:bg-gray-900"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </Select>
              </div>
            </div>

            {js.postings.isLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/60 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Company</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Provider</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Fit</th>
                      <th className="px-3 py-2">Added</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                          No postings yet.
                        </td>
                      </tr>
                    ) : (
                      items.map((p) => (
                        <tr
                          key={p.id}
                          className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30"
                        >
                          <td className="px-3 py-2">{p.company || p.companyGuess || '—'}</td>
                          <td className="px-3 py-2">{p.title || p.roleGuess || '—'}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {p.provider || p.jobBoard || '—'}
                          </td>
                          <td className="px-3 py-2">{p.location || '—'}</td>
                          <td className="px-3 py-2">{p.fitStatus || 'notEvaluated'}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => setEditingPosting(p)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
                              aria-label={`Edit ${postingLabel(p)}`}
                            >
                              <Pencil className="size-3.5" aria-hidden />
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {total} total · page {page}
              </span>
              <div className="flex gap-2">
                <Btn disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Btn>
                <Btn disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Btn>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Table labels for tailoring: {items.slice(0, 3).map(postingLabel).join(' · ') || '—'}
            </p>
          </section>

          {editingPosting ? (
            <JobPostingEditModal
              key={editingPosting.id}
              posting={editingPosting}
              onClose={() => setEditingPosting(null)}
            />
          ) : null}

          <Dialog
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title="Ingest job posting"
            size="lg"
          >
            <div className="space-y-4">
              <label className="flex flex-col text-sm gap-1">
                Source URL
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://boards.greenhouse.io/…"
                  disabled={isIngestBusy}
                  autoFocus
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Btn
                  loading={js.preview.isPending}
                  disabled={!hasSourceUrl}
                  onClick={() => void runPreview()}
                >
                  Preview
                </Btn>
                <Btn
                  loading={js.ingest.isPending}
                  disabled={!hasSourceUrl || !preview || preview.status === 'needsInput'}
                  onClick={() => void runIngest(false)}
                >
                  Ingest
                </Btn>
                {preview?.needsUserInput ? (
                  <Btn
                    loading={js.ingest.isPending}
                    disabled={!hasSourceUrl}
                    onClick={() => void runIngest(true)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Save anyway
                  </Btn>
                ) : null}
              </div>

              {js.preview.isPending ? (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Fetching and analyzing posting…
                </p>
              ) : null}

              {preview ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50/60 dark:bg-gray-900/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-xs font-medium text-blue-900 dark:text-blue-100">
                      {preview.detection.label || preview.detection.provider || 'Unknown'}
                    </span>
                    {preview.detection.confidence < 0.7 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="size-3.5" aria-hidden />
                        Low detection confidence
                      </span>
                    ) : null}
                    <span className="text-xs text-gray-500 uppercase">{preview.status}</span>
                  </div>
                  {preview.fetchError ? (
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Fetch: {preview.fetchError}
                    </p>
                  ) : null}
                  <PreviewFields
                    structure={preview.extractedStructure}
                    lowConfidenceFields={preview.lowConfidenceFields}
                  />
                  {preview.needsUserInput ? (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Paste fallback content
                      </p>
                      <div className="flex gap-2 text-sm">
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="radio"
                            checked={fallbackMode === 'rawText'}
                            onChange={() => setFallbackMode('rawText')}
                            disabled={isIngestBusy}
                          />
                          Plain text
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="radio"
                            checked={fallbackMode === 'rawHtml'}
                            onChange={() => setFallbackMode('rawHtml')}
                            disabled={isIngestBusy}
                          />
                          Raw HTML
                        </label>
                      </div>
                      {fallbackMode === 'rawText' ? (
                        <Textarea
                          className="w-full min-h-[100px] rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-sm"
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          disabled={isIngestBusy}
                        />
                      ) : (
                        <Textarea
                          className="w-full min-h-[100px] rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-sm font-mono"
                          value={rawHtml}
                          onChange={(e) => setRawHtml(e.target.value)}
                          disabled={isIngestBusy}
                        />
                      )}
                      <Btn
                        loading={js.preview.isPending}
                        disabled={!hasSourceUrl}
                        onClick={() => void runPreview()}
                      >
                        Re-run preview
                      </Btn>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {js.preview.error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300"
                >
                  {js.preview.error instanceof Error
                    ? js.preview.error.message
                    : String(js.preview.error)}
                </div>
              ) : null}

              {js.ingest.error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300"
                >
                  {js.ingest.error instanceof Error
                    ? js.ingest.error.message
                    : String(js.ingest.error)}
                </div>
              ) : null}
            </div>
          </Dialog>
        </>
      ) : (
        <ScrapeRunsPanel />
      )}
    </div>
  );
}
