import { useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { useCareerResume } from '@/hooks/useCareerResume';
import { useCareerApplicationDetail, useCareerApplications } from '@/hooks/useCareerApplications';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type {
  CareerApplicationEvent,
  CareerApplicationRecommendation,
  CareerApplicationStatusApi,
  CareerApplicationSummary,
  CareerJobPosting,
  CareerGeneratedResume,
} from '@/types/api/career.types';

import { applicationStatusLabel } from './application-tracking-labels';

type Cr = ReturnType<typeof useCareerResume>;

function fitRecommendationLabel(v: string): string {
  if (v === 'apply') return 'Apply';
  if (v === 'skip') return 'Skip';
  return 'Maybe';
}

const PIPELINE_STATUSES: { value: CareerApplicationStatusApi | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'firstInterview', label: 'First Interview' },
  { value: 'nthInterview', label: 'Nth Interview' },
  { value: 'finalInterview', label: 'Final Interview' },
  { value: 'offerReceived', label: 'Offer Received' },
  { value: 'acceptedOffer', label: 'Accepted Offer' },
];

function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  const { loading, children, className, disabled, ...rest } = props;
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

function OutlineBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
      {...props}
    />
  );
}

function ChipList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'blue' | 'amber' | 'rose' | 'emerald';
}) {
  const tones = {
    blue: 'bg-blue-100/80 dark:bg-blue-900/40',
    amber: 'bg-amber-100/80 dark:bg-amber-900/40',
    rose: 'bg-rose-100/80 dark:bg-rose-900/40',
    emerald: 'bg-emerald-100/80 dark:bg-emerald-900/40',
  };
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items?.length ? (
          items.map((k, i) => (
            <span
              key={`${title}-${i}-${k}`}
              className={cn(
                'rounded-full px-2 py-0.5 text-xs text-gray-900 dark:text-gray-100',
                tones[tone]
              )}
            >
              {k}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">None</span>
        )}
      </div>
    </div>
  );
}

export default function ApplicationTrackingTab({ cr }: { cr: Cr }) {
  const [statusFilter, setStatusFilter] = useState<CareerApplicationStatusApi | ''>('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [captureUrl, setCaptureUrl] = useState('');
  const [captureRaw, setCaptureRaw] = useState('');
  const [jobPostingId, setJobPostingId] = useState<string | null>(null);
  const [lastPosting, setLastPosting] = useState<CareerJobPosting | null>(null);
  const [lastRec, setLastRec] = useState<CareerApplicationRecommendation | null>(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [sourceUrlSaved, setSourceUrlSaved] = useState('');
  const [appliedAt, setAppliedAt] = useState('');
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);
  const [resumeSnapshotText, setResumeSnapshotText] = useState('');
  const [resumeSnapshotName, setResumeSnapshotName] = useState('');
  const [notes, setNotes] = useState('');
  const [aiProvider, setAiProvider] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [newStatus, setNewStatus] = useState<CareerApplicationStatusApi>('applied');
  const [eventNotes, setEventNotes] = useState('');
  const [interviewRound, setInterviewRound] = useState(1);
  const [interviewTitle, setInterviewTitle] = useState('');
  const [rejectionText, setRejectionText] = useState('');
  const [rejectCategory, setRejectCategory] = useState('');

  const appsHook = useCareerApplications({
    status: statusFilter || undefined,
    search: search.trim() || undefined,
    pageSize: 50,
  });

  const detailQ = useCareerApplicationDetail(selectedId);

  const insightCounts = useMemo(() => {
    const items = appsHook.listApps.data?.items ?? ([] as CareerApplicationSummary[]);

    const by = (s: string) => items.filter((i: CareerApplicationSummary) => i.status === s).length;
    const active = items.filter(
      (i: CareerApplicationSummary) =>
        !i.archived && !['rejected', 'acceptedOffer'].includes(i.status)
    ).length;
    const themesSample = detailQ.data?.events
      ?.filter((e: CareerApplicationEvent) => e.rejectionThemes?.length)
      .flatMap((e: CareerApplicationEvent) => e.rejectionThemes)
      .slice(0, 5);
    return {
      active,
      rejected: by('rejected'),
      interviewing: by('firstInterview') + by('nthInterview') + by('finalInterview'),
      offers: by('offerReceived') + by('acceptedOffer'),
      themesSample: themesSample ?? [],
    };
  }, [appsHook.listApps.data?.items, detailQ.data?.events]);

  const items = appsHook.listApps.data?.items ?? [];

  const gens = cr.generated.data?.items ?? [];

  async function handleRecommend() {
    try {
      const res = await appsHook.recommendApplications.mutateAsync({
        sourceUrl: captureUrl.trim() || null,
        rawText: captureRaw.trim() || null,
        jobPostingId: jobPostingId,
        generatedResumeId: generatedResumeId,
        resumeSnapshotName: resumeSnapshotName.trim() || null,
        resumeSnapshotText: resumeSnapshotText.trim() ? resumeSnapshotText : null,
        provider: aiProvider.trim() || null,
        model: aiModel.trim() || null,
      });
      setLastPosting(res.jobPosting);
      setLastRec(res.recommendation);
      setJobPostingId(res.jobPosting.id);
      if (!company.trim()) setCompany(res.jobPosting.companyGuess ?? '');
      if (!role.trim()) setRole(res.jobPosting.roleGuess ?? '');
      if (!sourceUrlSaved.trim()) setSourceUrlSaved(captureUrl.trim());
    } catch (e) {
      logger.warn('CareerApplication recommend failed', { error: e });
    }
  }

  async function handleSaveApplication() {
    if (!company.trim() || !role.trim()) {
      alert('Company and role are required to save.');
      return;
    }
    try {
      const res = await appsHook.createApplication.mutateAsync({
        jobPostingId: jobPostingId,
        recommendationId: lastRec?.id ?? null,
        company,
        role,
        location: location.trim() || null,
        sourceUrl: sourceUrlSaved.trim() || null,
        appliedAt: appliedAt.trim() || null,
        status: newStatus,
        generatedResumeId: generatedResumeId,
        resumeSnapshotName: resumeSnapshotName.trim() || null,
        resumeSnapshotText: resumeSnapshotText.trim() || null,
        notes: notes.trim() || null,
      });
      setSelectedId(res.application.id);
    } catch (e) {
      logger.warn('CareerApplication create failed', { error: e });
    }
  }

  async function handleAddInterview() {
    if (!selectedId) return;
    try {
      await appsHook.addApplicationEvent.mutateAsync({
        id: selectedId,
        body: {
          eventType: 'interview',
          interviewRound,
          title: interviewTitle.trim() || null,
          notes: eventNotes.trim() || null,
          status: 'nthInterview',
        },
      });
      setInterviewTitle('');
      setEventNotes('');
    } catch (e) {
      logger.warn('Interview event failed', { error: e });
    }
  }

  async function handleRejectionInsights() {
    if (!selectedId || !rejectionText.trim()) return;
    try {
      await appsHook.rejectionInsights.mutateAsync({
        applicationId: selectedId,
        body: {
          rejectionEmailText: rejectionText,
          rejectionReasonCategory: rejectCategory.trim() || null,
          provider: aiProvider.trim() || null,
          model: aiModel.trim() || null,
        },
      });
      setRejectionText('');
    } catch (e) {
      logger.warn('Rejection insights failed', { error: e });
    }
  }

  async function handleResumeFile(f: File | null) {
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (!lower.endsWith('.txt') && !lower.endsWith('.md')) {
      alert('For now upload .txt or .md resume snapshots.');
      return;
    }
    try {
      const t = await f.text();
      setResumeSnapshotText(t.slice(0, 32000));
      setResumeSnapshotName(f.name);
    } catch (e) {
      logger.warn('Resume file read failed', { error: e });
    }
  }

  function selectGenerated(g: CareerGeneratedResume) {
    setGeneratedResumeId(g.id);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-amber-400/40 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
        Insights improve as you capture outcomes (interviews, rejections). Fit scores use your
        profile bank, pasted job context, rejection themes, and the resume snapshot you attach.
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 text-sm">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-gray-500 text-xs">Active pipeline</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {insightCounts.active}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-gray-500 text-xs">Rejected</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {insightCounts.rejected}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-gray-500 text-xs">In interviews</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {insightCounts.interviewing}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-gray-500 text-xs">Offers</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {insightCounts.offers}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:col-span-3 lg:col-span-1">
          <div className="text-gray-500 text-xs">Sample rejection themes</div>
          <div className="text-xs text-gray-700 dark:text-gray-200 line-clamp-2">
            {insightCounts.themesSample?.length ? insightCounts.themesSample.join(' • ') : '—'}
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="size-5 text-blue-500" aria-hidden />
            Job capture &amp; fit
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Analyze a posting, optionally attach the resume you intend to submit, then get an apply
            / maybe / skip readout before tracking.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm md:col-span-2 lg:col-span-1">
            <span className="text-gray-700 dark:text-gray-300">Posting URL</span>
            <input
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
              value={captureUrl}
              onChange={(e) => setCaptureUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="text-gray-700 dark:text-gray-300">Paste job description</span>
            <textarea
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 min-h-[96px]"
              value={captureRaw}
              onChange={(e) => setCaptureRaw(e.target.value)}
            />
          </label>

          <div className="md:col-span-2 grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">Tailored resume (optional)</span>
              <select
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                value={generatedResumeId ?? ''}
                onChange={(e) =>
                  setGeneratedResumeId(e.target.value.trim() ? e.target.value : null)
                }
              >
                <option value="">Recent generated drafts…</option>
                {gens.map((g) => (
                  <option key={g.id} value={g.id}>
                    {(g.resumeTemplate ?? 'draft') + ' · ' + (g.createdAt?.slice?.(0, 10) ?? '')}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">Or upload .txt/.md snapshot</span>
              <input
                type="file"
                accept=".txt,.md"
                className="text-sm"
                onChange={(e) => void handleResumeFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="md:col-span-2 grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">AI provider (optional)</span>
              <input
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                placeholder="openai / anthropic / gemini"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">Model override</span>
              <input
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Btn
            loading={appsHook.recommendApplications.isPending}
            onClick={() => void handleRecommend()}
          >
            Get fit recommendation
          </Btn>
          {gens.length ? (
            <OutlineBtn type="button" onClick={() => gens[0] && selectGenerated(gens[0])}>
              Use latest draft
            </OutlineBtn>
          ) : null}
          {appsHook.recommendApplications.error ? (
            <span className="text-xs text-red-600 dark:text-red-400">
              {appsHook.recommendApplications.error instanceof Error
                ? appsHook.recommendApplications.error.message
                : String(appsHook.recommendApplications.error)}
            </span>
          ) : null}
        </div>

        {(lastPosting || lastRec) && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50/70 dark:bg-gray-900/40">
            <div className="flex flex-wrap gap-2 justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {fitRecommendationLabel(lastRec?.recommendation ?? 'maybe')}
                  {typeof lastRec?.fitScore === 'number' ? ` · score ${lastRec.fitScore}` : ''}{' '}
                  {typeof lastRec?.confidence === 'number'
                    ? ` · confidence ${(lastRec.confidence * 100).toFixed(0)}%`
                    : ''}
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {(lastPosting?.roleGuess ?? role) || 'Role'} ·{' '}
                  {(lastPosting?.companyGuess ?? company) || 'Company'}
                </p>
              </div>
              {jobPostingId ? (
                <span className="text-xs font-mono text-gray-500">posting {jobPostingId}</span>
              ) : null}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-200">{lastRec?.rationale}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <ChipList title="Strengths" items={lastRec?.matchedSignals ?? []} tone="emerald" />
              <ChipList title="Gaps" items={lastRec?.gapSignals ?? []} tone="amber" />
              <ChipList
                title="Rejection-risk signals"
                items={lastRec?.rejectionRiskSignals ?? []}
                tone="rose"
              />
              <ChipList
                title="Resume tweaks"
                items={lastRec?.resumeAdjustments ?? []}
                tone="blue"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs">
                Company
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-900 text-sm"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Role
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-900 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Location
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-900 text-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Saved source URL
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-900 text-sm"
                  value={sourceUrlSaved}
                  onChange={(e) => setSourceUrlSaved(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                Applied date (ISO, optional)
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-900 text-sm"
                  value={appliedAt}
                  onChange={(e) => setAppliedAt(e.target.value)}
                  placeholder="2026-05-07T17:00:00Z"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                Status at save
                <select
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-900 text-sm"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CareerApplicationStatusApi)}
                >
                  {PIPELINE_STATUSES.filter((x) => x.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                Notes
                <textarea
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-900 text-sm min-h-[64px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>

            <Btn
              loading={appsHook.createApplication.isPending}
              onClick={() => void handleSaveApplication()}
            >
              Save to tracker
            </Btn>
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Pipeline</h3>
          <label className="flex flex-col gap-1 text-xs">
            Filter status
            <select
              className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-900 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CareerApplicationStatusApi | '')}
            >
              {PIPELINE_STATUSES.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <input
            type="search"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-900 text-sm"
            placeholder="Search company / role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="space-y-2 max-h-[480px] overflow-auto">
            {appsHook.listApps.isLoading ? (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-500">No applications tracked yet.</p>
            ) : (
              items.map((app: CareerApplicationSummary) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedId(app.id)}
                  className={cn(
                    'w-full text-left rounded-lg border px-3 py-2 text-sm transition',
                    selectedId === app.id
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {app.company} — {app.role}
                  </div>
                  <div className="text-xs text-gray-500">{applicationStatusLabel(app.status)}</div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4 min-h-[400px]">
          {!selectedId ? (
            <p className="text-sm text-gray-500">
              Select an application to view its timeline and capture outcomes.
            </p>
          ) : detailQ.isLoading ? (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Loading details…
            </p>
          ) : detailQ.data ? (
            <>
              <div className="flex flex-wrap gap-4 justify-between">
                <div>
                  <h3 className="text-xl font-light text-gray-900 dark:text-white">
                    {detailQ.data.application.company} — {detailQ.data.application.role}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {applicationStatusLabel(detailQ.data.application.status)}
                  </p>
                </div>
                <OutlineBtn type="button" onClick={() => void detailQ.refetch()}>
                  Refresh
                </OutlineBtn>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <label className="flex flex-col gap-1 text-xs">
                  Update rollup status (PATCH)
                  <select
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900"
                    value={detailQ.data.application.status}
                    onChange={async (e) => {
                      const v = e.target.value as CareerApplicationStatusApi;
                      try {
                        await appsHook.patchApplication.mutateAsync({
                          id: selectedId,
                          body: { status: v },
                        });
                      } catch {
                        /* inline */
                      }
                    }}
                  >
                    {PIPELINE_STATUSES.filter((x) => x.value).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Archive toggle
                  <OutlineBtn
                    type="button"
                    onClick={async () => {
                      await appsHook.patchApplication.mutateAsync({
                        id: selectedId,
                        body: { archived: !detailQ.data?.application.archived },
                      });
                    }}
                  >
                    {detailQ.data.application.archived ? 'Unarchive' : 'Archive'}
                  </OutlineBtn>
                </label>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Add interview (timeline)
                </h4>
                <div className="grid sm:grid-cols-3 gap-2">
                  <label className="text-xs flex flex-col gap-1">
                    Round
                    <input
                      type="number"
                      min={1}
                      className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1"
                      value={interviewRound}
                      onChange={(e) => setInterviewRound(Number(e.target.value || 1))}
                    />
                  </label>
                  <label className="text-xs flex flex-col gap-1 sm:col-span-2">
                    Title
                    <input
                      className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1"
                      value={interviewTitle}
                      onChange={(e) => setInterviewTitle(e.target.value)}
                      placeholder="Hiring manager, loop, onsite…"
                    />
                  </label>
                </div>
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-900"
                  placeholder="Notes"
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                />
                <Btn
                  loading={appsHook.addApplicationEvent.isPending}
                  onClick={() => void handleAddInterview()}
                >
                  Log interview round
                </Btn>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Rejection capture + AI themes
                </h4>
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-900 min-h-[96px]"
                  placeholder="Paste rejection email text…"
                  value={rejectionText}
                  onChange={(e) => setRejectionText(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-900"
                  placeholder="Reason category hint (optional)"
                  value={rejectCategory}
                  onChange={(e) => setRejectCategory(e.target.value)}
                />
                <Btn
                  loading={appsHook.rejectionInsights.isPending}
                  onClick={() => void handleRejectionInsights()}
                >
                  Extract themes &amp; attach
                </Btn>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                  Timeline ({detailQ.data.events.length})
                </h4>
                <ul className="space-y-2">
                  {[...detailQ.data.events].reverse().map((ev: CareerApplicationEvent) => (
                    <li
                      key={ev.id}
                      className="rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2 text-sm"
                    >
                      <div className="flex justify-between gap-2 text-xs text-gray-500">
                        <span>
                          {ev.eventType} {ev.status ? `· ${applicationStatusLabel(ev.status)}` : ''}
                        </span>
                        <span>{new Date(ev.eventAt).toLocaleString()}</span>
                      </div>
                      {ev.interviewRound ? (
                        <div className="text-xs mt-1">Round {ev.interviewRound}</div>
                      ) : null}
                      {ev.title ? <div className="font-medium">{ev.title}</div> : null}
                      {ev.notes ? (
                        <div className="text-gray-700 dark:text-gray-300">{ev.notes}</div>
                      ) : null}
                      {ev.rejectionThemes?.length ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ev.rejectionThemes.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-rose-100/70 dark:bg-rose-950/60 px-2 py-0.5 text-[11px]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {ev.actionableLesson ? (
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                          Lesson: {ev.actionableLesson}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : detailQ.error ? (
            <p className="text-sm text-red-600">{(detailQ.error as Error)?.message ?? 'Failed'}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
