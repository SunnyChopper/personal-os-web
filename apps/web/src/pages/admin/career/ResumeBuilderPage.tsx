import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { FormInput } from '@/components/atoms/FormInput';
import { CareerFitIntelligencePanel } from '@/components/molecules/CareerFitIntelligencePanel';
import { KeywordCoverageMatrix } from '@/components/molecules/KeywordCoverageMatrix';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import { useCareerResume } from '@/hooks/useCareerResume';
import { useCareerApplications } from '@/hooks/useCareerApplications';
import { sortJobsByRecency } from '@/lib/career-job-sort';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import ApplicationTrackingTab from '@/pages/admin/career/ApplicationTrackingTab';
import { careerService } from '@/services/career.service';
import type {
  CareerApplicationRecommendation,
  CareerEducation,
  CareerGeneratedResume,
  CareerGeneratedResumeSortBy,
  CareerJob,
  CareerJobPosting,
  CareerResumeAtsScorePreview,
  CareerResumeBulletRationale,
  CareerResumeExportFormat,
} from '@/types/api/career.types';
import { getCareerResumeMarkdownComponents } from './careerResumeMarkdown';
import { CareerResumeAtsScoreCard } from './CareerResumeAtsScoreCard';
import { CareerResumeDraftEditor } from './CareerResumeDraftEditor';
import { CareerResumeProvenancePanel } from './CareerResumeProvenancePanel';
import { previewKeywordDiffFromDraft, previewMetaFromDraft } from './careerResumeDraftSync';
import { ResumeExportButtons } from './ResumeExportButtons';
import { ResumeTemplateGallery } from './ResumeTemplateGallery';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';

const BUILDER_TABS = [
  { id: 'profile', label: 'Profile & education' },
  { id: 'experience', label: 'Experience' },
  { id: 'ai', label: 'AI suggestions' },
  { id: 'generate', label: 'Tailor & generate' },
  { id: 'applications', label: 'Application Tracking' },
] as const;

type BuilderTabId = (typeof BUILDER_TABS)[number]['id'];

const AI_PROVIDER_PRESETS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'gemini', label: 'Gemini' },
] as const;

function formatResumeHistoryWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatJobMonthYear(iso: string | null | undefined): string {
  if (!iso?.trim()) return '';
  const d = iso.trim().slice(0, 10);
  const parts = d.split('-');
  if (parts.length < 2) return '';
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return '';
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(
      new Date(y, m - 1, 1)
    );
  } catch {
    return `${y}-${String(m).padStart(2, '0')}`;
  }
}

/** Compact range for job card titles: "Jan 2020 – Present" or "Jan 2018 – Mar 2021". */
function formatJobListDateRange(job: CareerJob): string {
  const start = formatJobMonthYear(job.startDate);
  if (job.isCurrent) {
    return start ? `${start} – Present` : '';
  }
  const end = formatJobMonthYear(job.endDate);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return '';
}

function formatGeneratedDraftLabel(g: CareerGeneratedResume): string {
  const meta = [g.companyName, g.jobTitle].filter(Boolean).join(' · ');
  const tail = [g.resumeTemplate ?? 'draft', g.createdAt?.slice?.(0, 10) ?? '']
    .filter(Boolean)
    .join(' · ');
  return meta ? `${meta} · ${tail}` : tail || 'Resume draft';
}

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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 pb-8 border-b border-gray-200/80 dark:border-gray-700/80 last:border-b-0 last:pb-0">
      <div className="w-full max-w-3xl mx-auto min-w-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{subtitle}</p>
        ) : (
          <div className="mb-4" />
        )}
        {children}
      </div>
    </section>
  );
}

function CollapsibleAiBucket({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium bg-gray-50/90 dark:bg-gray-900/50 text-gray-900 dark:text-white"
      >
        <span>
          {title} <span className="text-gray-500 font-normal">({count})</span>
        </span>
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-gray-500" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-gray-500" />
        )}
      </button>
      {open ? (
        <div className="p-3 space-y-3 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default function ResumeBuilderPage() {
  const [generatedSearch, setGeneratedSearch] = useState('');
  const [generatedSortBy, setGeneratedSortBy] = useState<CareerGeneratedResumeSortBy>('createdAt');
  const [generatedSortOrder, setGeneratedSortOrder] = useState<'asc' | 'desc'>('desc');
  const [generatedPage, setGeneratedPage] = useState(1);
  const generatedPageSize = 20;
  const generatedParams = useMemo(
    () => ({
      page: generatedPage,
      pageSize: generatedPageSize,
      search: generatedSearch.trim() || null,
      sortBy: generatedSortBy,
      sortOrder: generatedSortOrder,
    }),
    [generatedPage, generatedSearch, generatedSortBy, generatedSortOrder]
  );
  const cr = useCareerResume({ generated: generatedParams });
  const appsFit = useCareerApplications({ listEnabled: false });
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<BuilderTabId>('profile');

  const [pf, setPf] = useState({
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    summary: '',
  });

  useEffect(() => {
    const p = cr.profile.data;
    if (!p) return;
    setPf({
      fullName: p.fullName ?? '',
      headline: p.headline ?? '',
      email: p.email ?? '',
      phone: p.phone ?? '',
      location: p.location ?? '',
      linkedinUrl: p.linkedinUrl ?? '',
      summary: p.summary ?? '',
    });
  }, [cr.profile.data]);

  const [eduDraft, setEduDraft] = useState({
    institution: '',
    degree: '',
    field: '',
    location: '',
    gpa: '',
    courses: '',
    startMonth: '',
    endMonth: '',
    notes: '',
  });
  const [eduAdding, setEduAdding] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [editEduDraft, setEditEduDraft] = useState<typeof eduDraft | null>(null);

  const [jobDraft, setJobDraft] = useState({
    company: '',
    title: '',
    location: '',
    startMonth: '',
    endMonth: '',
    isCurrent: false,
  });
  const [jobAdding, setJobAdding] = useState(false);
  const [achDraft, setAchDraft] = useState<Record<string, string>>({});
  const [achAddingJobId, setAchAddingJobId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const didPickInitialJob = useRef(false);

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobEditDraft, setJobEditDraft] = useState({
    company: '',
    title: '',
    location: '',
    startMonth: '',
    endMonth: '',
    isCurrent: false,
  });

  const [editingAch, setEditingAch] = useState<{ jobId: string; id: string } | null>(null);
  const [achEditText, setAchEditText] = useState('');

  const [rejectFeedback, setRejectFeedback] = useState<Record<string, string>>({});
  const [suggestionBusy, setSuggestionBusy] = useState<{
    id: string;
    op: 'accept' | 'reject' | 'patch' | 'revise';
  } | null>(null);
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);
  const [suggestionEditText, setSuggestionEditText] = useState('');
  const [suggestionEditTags, setSuggestionEditTags] = useState('');
  const [suggestionEditRationale, setSuggestionEditRationale] = useState('');
  const [reviseOpenFor, setReviseOpenFor] = useState<string | null>(null);
  const [reviseFeedback, setReviseFeedback] = useState<Record<string, string>>({});
  const [reviseAiOpts, setReviseAiOpts] = useState<{ provider: string; model: string }>({
    provider: 'openai',
    model: '',
  });
  const [aiOpts, setAiOpts] = useState<{ provider: string; model: string }>({
    provider: 'openai',
    model: '',
  });
  const [aiOpenForjob, setAiOpenForJob] = useState<string | null>(null);

  const [selectedPostingId, setSelectedPostingId] = useState('');
  const [lastPosting, setLastPosting] = useState<CareerJobPosting | null>(null);

  const savedPostingsQ = useQuery({
    queryKey: queryKeys.careerResume.jobPostingsList({
      page: 1,
      pageSize: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    queryFn: () =>
      careerService.listJobPostings({
        page: 1,
        pageSize: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  const [genRawPosting, setGenRawPosting] = useState('');
  const [tone, setTone] = useState('professional ATS-friendly');
  const [resumeTemplate, setResumeTemplate] = useState<string>('standard_professional');
  const [achievementSelection, setAchievementSelection] = useState<Set<string>>(new Set());

  const [genTargetCompany, setGenTargetCompany] = useState('');
  const [genTargetRole, setGenTargetRole] = useState('');
  const [fitRec, setFitRec] = useState<CareerApplicationRecommendation | null>(null);
  const [fitResumeSnapText, setFitResumeSnapText] = useState('');
  const [fitResumeSnapName, setFitResumeSnapName] = useState('');
  const [fitGenResumeId, setFitGenResumeId] = useState<string | null>(null);
  const [fitPdfBusy, setFitPdfBusy] = useState(false);

  const [previewGeneratedId, setPreviewGeneratedId] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<CareerGeneratedResume | null>(null);
  const [atsPreview, setAtsPreview] = useState<CareerResumeAtsScorePreview | null>(null);
  const [busySectionId, setBusySectionId] = useState<string | null>(null);
  const [templateImportWarnings, setTemplateImportWarnings] = useState<string[]>([]);
  const [exportBusyFormat, setExportBusyFormat] = useState<CareerResumeExportFormat | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState('');
  const [previewMeta, setPreviewMeta] = useState<{
    atsKeywordsUsed: string[];
    biasStrategyNotes?: string | null;
    atsScore?: number | null;
    humanScore?: number | null;
    llmAtsScore?: number | null;
    bulletRationales?: CareerResumeBulletRationale[];
  } | null>(null);
  const [previewKeywordDiff, setPreviewKeywordDiff] = useState<{
    mandatory: string[];
    matched: string[];
    missing: string[];
  } | null>(null);

  const applyActiveDraft = (draft: CareerGeneratedResume) => {
    setActiveDraft(draft);
    setPreviewGeneratedId(draft.id);
    setPreviewMarkdown(draft.resumeMarkdown);
    setPreviewMeta(previewMetaFromDraft(draft));
    setPreviewKeywordDiff(previewKeywordDiffFromDraft(draft));
    setGenTargetCompany(draft.companyName ?? '');
    setGenTargetRole(draft.jobTitle ?? '');
  };

  const openGeneratedDraft = async (resumeId: string) => {
    const full = await careerService.getGenerated(resumeId);
    applyActiveDraft(full);
    setActiveTab('generate');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'generate');
      next.set('draftId', full.id);
      if (full.jobPostingId) next.set('postingId', full.jobPostingId);
      else next.delete('postingId');
      next.delete('applicationId');
      return next;
    });
  };

  const openJobPosting = async (postingId: string) => {
    const posting = await careerService.getJobPosting(postingId);
    setLastPosting(posting);
    setSelectedPostingId(posting.id);
    setGenTargetCompany(posting.company ?? posting.companyGuess ?? '');
    setGenTargetRole(posting.title ?? posting.roleGuess ?? '');
    setGenRawPosting(posting.rawText ?? posting.fetchedText ?? '');
    setActiveTab('generate');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'generate');
      next.set('postingId', posting.id);
      return next;
    });
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as BuilderTabId | null;
    if (tab && BUILDER_TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
    if (searchParams.get('applicationId')) {
      setActiveTab('applications');
    }
    const draftId = searchParams.get('draftId');
    if (draftId && draftId !== previewGeneratedId) {
      void openGeneratedDraft(draftId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selectedAchievementIdsForTailor = useMemo(() => {
    if (achievementSelection.size > 0) return [...achievementSelection];
    return undefined;
  }, [achievementSelection]);

  const handleSaveResumeSection = async (sectionId: string, contentMarkdown: string) => {
    if (!previewGeneratedId || !activeDraft) return;
    setBusySectionId(sectionId);
    try {
      const res = await cr.editGeneratedResumeSections.mutateAsync({
        resumeId: previewGeneratedId,
        body: {
          edits: [{ sectionId, contentMarkdown }],
          revision: activeDraft.draftRevision ?? 1,
        },
      });
      applyActiveDraft(res);
    } finally {
      setBusySectionId(null);
    }
  };

  const handleRegenerateResumeSection = async (sectionId: string, instructions?: string) => {
    if (!previewGeneratedId) return;
    setBusySectionId(sectionId);
    try {
      const res = await cr.regenerateGeneratedResumeSection.mutateAsync({
        resumeId: previewGeneratedId,
        body: {
          sectionId,
          instructions: instructions ?? null,
          provider: aiOpts.provider || null,
          model: aiOpts.model.trim() || null,
          allowedAchievementIds: selectedAchievementIdsForTailor ?? null,
        },
      });
      applyActiveDraft(res);
    } finally {
      setBusySectionId(null);
    }
  };

  useEffect(() => {
    if (!selectedPostingId) {
      setLastPosting(null);
      return;
    }
    const found = savedPostingsQ.data?.items.find((p) => p.id === selectedPostingId);
    if (found) {
      setLastPosting(found);
      setGenTargetCompany(found.company ?? found.companyGuess ?? '');
      setGenTargetRole(found.title ?? found.roleGuess ?? '');
    }
  }, [selectedPostingId, savedPostingsQ.data]);

  const apiErr = useMemo(() => {
    const cands = [
      cr.profile.error,
      cr.education.error,
      cr.jobs.error,
      cr.suggestions.error,
      cr.generated.error,
    ];
    const first = cands.find(Boolean);
    return first instanceof Error ? first.message : first ? String(first) : '';
  }, [
    cr.profile.error,
    cr.education.error,
    cr.jobs.error,
    cr.suggestions.error,
    cr.generated.error,
  ]);

  const jobsList = useMemo(() => {
    const items = cr.jobs.data?.items ?? [];
    return sortJobsByRecency(items);
  }, [cr.jobs.data]);

  const suggestionGroups = useMemo(() => {
    const items = cr.suggestions.data?.items ?? [];
    return {
      pending: items.filter((i) => i.status === 'pending'),
      accepted: items.filter((i) => i.status === 'accepted'),
      rejected: items.filter((i) => i.status === 'rejected'),
    };
  }, [cr.suggestions.data]);

  useEffect(() => {
    if (didPickInitialJob.current) return;
    const first = jobsList[0]?.id;
    if (!first) return;
    setExpandedJobId(first);
    didPickInitialJob.current = true;
  }, [jobsList]);

  function monthToApiDate(month: string, end: boolean): string | null {
    const m = month.trim();
    if (!m) return null;
    if (m.length === 7 && m[4] === '-') return `${m}-01`;
    return end ? `${m}-28` : `${m}-01`;
  }

  function toggleAchievement(id: string) {
    setAchievementSelection((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function handleFitResumeFile(f: File | null) {
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (lower.endsWith('.pdf')) {
      setFitPdfBusy(true);
      try {
        const { text, truncated } = await careerService.parseResumePdf(f);
        setFitResumeSnapText(text);
        setFitResumeSnapName(f.name);
        if (truncated) {
          logger.warn('Fit resume PDF text truncated');
        }
      } catch (e) {
        logger.warn('Fit resume PDF failed', { error: e });
        alert(e instanceof Error ? e.message : 'Could not read PDF.');
      } finally {
        setFitPdfBusy(false);
      }
      return;
    }
    if (!lower.endsWith('.txt') && !lower.endsWith('.md')) {
      alert('Upload a .pdf, .txt, or .md snapshot for fit.');
      return;
    }
    try {
      const t = await f.text();
      setFitResumeSnapText(t.slice(0, 32000));
      setFitResumeSnapName(f.name);
    } catch (e) {
      logger.warn('Fit resume file read failed', { error: e });
    }
  }

  function startEditEducation(e: CareerEducation) {
    setEditingEduId(e.id);
    setEditEduDraft({
      institution: e.institution,
      degree: e.degree ?? '',
      field: e.field ?? '',
      location: e.location ?? '',
      gpa: e.gpa ?? '',
      courses: e.courses ?? '',
      startMonth: e.startDate?.slice(0, 7) ?? '',
      endMonth: e.endDate?.slice(0, 7) ?? '',
      notes: e.notes ?? '',
    });
  }

  async function addEducationSubmit() {
    if (!eduDraft.institution.trim()) return;
    setEduAdding(true);
    try {
      await cr.createEducation.mutateAsync({
        institution: eduDraft.institution,
        degree: eduDraft.degree || null,
        field: eduDraft.field || null,
        location: eduDraft.location || null,
        gpa: eduDraft.gpa || null,
        courses: eduDraft.courses || null,
        startDate: monthToApiDate(eduDraft.startMonth, false),
        endDate: monthToApiDate(eduDraft.endMonth, true),
        notes: eduDraft.notes || null,
      });
      setEduDraft({
        institution: '',
        degree: '',
        field: '',
        location: '',
        gpa: '',
        courses: '',
        startMonth: '',
        endMonth: '',
        notes: '',
      });
    } finally {
      setEduAdding(false);
    }
  }

  async function addJobSubmit() {
    if (!jobDraft.company.trim() && !jobDraft.title.trim()) return;
    setJobAdding(true);
    try {
      await cr.createJob.mutateAsync({
        company: jobDraft.company,
        title: jobDraft.title,
        location: jobDraft.location || null,
        startDate: monthToApiDate(jobDraft.startMonth, false),
        endDate: jobDraft.isCurrent ? null : monthToApiDate(jobDraft.endMonth, true),
        isCurrent: jobDraft.isCurrent,
      });
      setJobDraft({
        company: '',
        title: '',
        location: '',
        startMonth: '',
        endMonth: '',
        isCurrent: false,
      });
    } finally {
      setJobAdding(false);
    }
  }

  return (
    <div className="space-y-2">
      {apiErr ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          We couldn&apos;t load your career data right now. Please refresh the page. If it keeps
          happening, try again later.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        {BUILDER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition border',
              activeTab === t.id
                ? 'bg-blue-600/15 border-blue-500/40 text-blue-900 dark:text-blue-100'
                : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile & education */}
      {activeTab === 'profile' ? (
        <div>
          <Section
            title="Profile header"
            subtitle="Feeds into tailored resume drafts; stored for your signed-in account."
          >
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                cr.patchProfile.mutate({
                  fullName: pf.fullName,
                  headline: pf.headline,
                  email: pf.email || null,
                  phone: pf.phone || null,
                  location: pf.location || null,
                  linkedinUrl: pf.linkedinUrl || null,
                  summary: pf.summary || null,
                });
              }}
            >
              {(
                [
                  ['fullName', 'Full name'],
                  ['headline', 'Headline'],
                  ['email', 'Email'],
                  ['phone', 'Phone'],
                  ['location', 'Location'],
                  ['linkedinUrl', 'LinkedIn URL'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{label}</span>
                  <input
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                    value={pf[key]}
                    onChange={(ev) => setPf((s) => ({ ...s, [key]: ev.target.value }))}
                  />
                </label>
              ))}
              <label className="md:col-span-2 flex flex-col gap-1 text-sm">
                <span className="text-gray-700 dark:text-gray-300">Summary</span>
                <Textarea
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 min-h-[100px]"
                  value={pf.summary}
                  onChange={(ev) => setPf((s) => ({ ...s, summary: ev.target.value }))}
                />
              </label>
              <div className="md:col-span-2 flex items-center gap-3">
                <Btn type="submit" loading={cr.patchProfile.isPending}>
                  {cr.patchProfile.isPending ? 'Saving…' : 'Save profile'}
                </Btn>
                {cr.patchProfile.isSuccess ? (
                  <span className="text-sm text-green-600 dark:text-green-400">Saved.</span>
                ) : null}
              </div>
            </form>
          </Section>

          <Section
            title="Education"
            subtitle="Degrees and certifications (display order preserved)."
          >
            <div className="space-y-3 mb-6">
              {(cr.education.data?.items ?? []).map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3"
                >
                  {editingEduId === e.id && editEduDraft ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {(
                        [
                          ['institution', 'Institution'],
                          ['degree', 'Degree'],
                          ['field', 'Field'],
                          ['location', 'Location'],
                          ['gpa', 'GPA'],
                        ] as const
                      ).map(([k, lab]) => (
                        <label key={k} className="flex flex-col gap-1">
                          {lab}
                          <input
                            className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900"
                            value={editEduDraft[k]}
                            onChange={(ev) =>
                              setEditEduDraft((d) => (d ? { ...d, [k]: ev.target.value } : d))
                            }
                          />
                        </label>
                      ))}
                      <label className="md:col-span-2 flex flex-col gap-1">
                        Courses
                        <Textarea
                          className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900 min-h-[60px]"
                          value={editEduDraft.courses}
                          onChange={(ev) =>
                            setEditEduDraft((d) => (d ? { ...d, courses: ev.target.value } : d))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        Start (month)
                        <input
                          type="month"
                          className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1"
                          value={editEduDraft.startMonth}
                          onChange={(ev) =>
                            setEditEduDraft((d) => (d ? { ...d, startMonth: ev.target.value } : d))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        End (month)
                        <input
                          type="month"
                          className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1"
                          value={editEduDraft.endMonth}
                          onChange={(ev) =>
                            setEditEduDraft((d) => (d ? { ...d, endMonth: ev.target.value } : d))
                          }
                        />
                      </label>
                      <label className="md:col-span-2 flex flex-col gap-1">
                        Notes
                        <input
                          className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1"
                          value={editEduDraft.notes}
                          onChange={(ev) =>
                            setEditEduDraft((d) => (d ? { ...d, notes: ev.target.value } : d))
                          }
                        />
                      </label>
                      <div className="md:col-span-2 flex gap-2">
                        <Btn
                          type="button"
                          loading={cr.patchEducation.isPending}
                          onClick={() => {
                            if (!editEduDraft) return;
                            cr.patchEducation.mutate(
                              {
                                id: e.id,
                                body: {
                                  institution: editEduDraft.institution,
                                  degree: editEduDraft.degree || null,
                                  field: editEduDraft.field || null,
                                  location: editEduDraft.location || null,
                                  gpa: editEduDraft.gpa || null,
                                  courses: editEduDraft.courses || null,
                                  startDate: monthToApiDate(editEduDraft.startMonth, false),
                                  endDate: monthToApiDate(editEduDraft.endMonth, true),
                                  notes: editEduDraft.notes || null,
                                },
                              },
                              {
                                onSuccess: () => {
                                  setEditingEduId(null);
                                  setEditEduDraft(null);
                                },
                              }
                            );
                          }}
                        >
                          Save
                        </Btn>
                        <OutlineBtn
                          type="button"
                          onClick={() => {
                            setEditingEduId(null);
                            setEditEduDraft(null);
                          }}
                        >
                          Cancel
                        </OutlineBtn>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {e.institution}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {[e.degree, e.field].filter(Boolean).join(' · ') || '—'}
                        {e.gpa ? ` · GPA: ${e.gpa}` : ''}
                        {e.startDate || e.endDate
                          ? ` · ${e.startDate?.slice(0, 7) ?? '?'} – ${e.endDate?.slice(0, 7) ?? '?'}`
                          : ''}
                      </div>
                      {e.courses ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">
                          {e.courses}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <OutlineBtn type="button" onClick={() => startEditEducation(e)}>
                          Edit
                        </OutlineBtn>
                        <OutlineBtn
                          type="button"
                          onClick={() => cr.deleteEducation.mutate(e.id)}
                          disabled={cr.deleteEducation.isPending}
                        >
                          Remove
                        </OutlineBtn>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1 md:col-span-2">
                Institution
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={eduDraft.institution}
                  onChange={(ev) => setEduDraft((s) => ({ ...s, institution: ev.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                Degree
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={eduDraft.degree}
                  onChange={(ev) => setEduDraft((s) => ({ ...s, degree: ev.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                Field
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={eduDraft.field}
                  onChange={(ev) => setEduDraft((s) => ({ ...s, field: ev.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                School location
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={eduDraft.location}
                  onChange={(ev) => setEduDraft((s) => ({ ...s, location: ev.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                GPA
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={eduDraft.gpa}
                  onChange={(ev) => setEduDraft((s) => ({ ...s, gpa: ev.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                Start (month)
                <input
                  type="month"
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={eduDraft.startMonth}
                  onChange={(ev) => setEduDraft((s) => ({ ...s, startMonth: ev.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                End (month)
                <input
                  type="month"
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={eduDraft.endMonth}
                  onChange={(ev) => setEduDraft((s) => ({ ...s, endMonth: ev.target.value }))}
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-1">
                Notable courses
                <Textarea
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 min-h-[70px]"
                  value={eduDraft.courses}
                  onChange={(ev) => setEduDraft((s) => ({ ...s, courses: ev.target.value }))}
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-1">
                Notes
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={eduDraft.notes}
                  onChange={(ev) => setEduDraft((s) => ({ ...s, notes: ev.target.value }))}
                />
              </label>
            </div>
            <div className="mt-4">
              <Btn type="button" loading={eduAdding} onClick={() => void addEducationSubmit()}>
                Add education
              </Btn>
            </div>
          </Section>
        </div>
      ) : null}

      {activeTab === 'experience' ? (
        <Section
          title="Roles & achievements"
          subtitle="Each job nests bullet achievements — generation only cites facts from this bank."
        >
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <FormInput
                  placeholder="Company"
                  value={jobDraft.company}
                  onChange={(ev) => setJobDraft((s) => ({ ...s, company: ev.target.value }))}
                />
                <FormInput
                  placeholder="Title Role"
                  value={jobDraft.title}
                  onChange={(ev) => setJobDraft((s) => ({ ...s, title: ev.target.value }))}
                />
                <FormInput
                  placeholder="Location"
                  className="md:col-span-2"
                  value={jobDraft.location}
                  onChange={(ev) => setJobDraft((s) => ({ ...s, location: ev.target.value }))}
                />
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                  <FormCheckbox
                    checked={jobDraft.isCurrent}
                    onChange={(ev) => setJobDraft((s) => ({ ...s, isCurrent: ev.target.checked }))}
                  />
                  Current role
                </label>
                <label className="flex flex-col gap-1 text-gray-700 dark:text-gray-300">
                  Start (month)
                  <FormInput
                    type="month"
                    value={jobDraft.startMonth}
                    onChange={(ev) => setJobDraft((s) => ({ ...s, startMonth: ev.target.value }))}
                  />
                </label>
                {!jobDraft.isCurrent ? (
                  <label className="flex flex-col gap-1 text-gray-700 dark:text-gray-300">
                    End (month)
                    <FormInput
                      type="month"
                      value={jobDraft.endMonth}
                      onChange={(ev) => setJobDraft((s) => ({ ...s, endMonth: ev.target.value }))}
                    />
                  </label>
                ) : null}
              </div>
              <Btn type="button" loading={jobAdding} onClick={() => void addJobSubmit()}>
                Add job
              </Btn>
            </div>

            <div className="space-y-3">
              {jobsList.map((job) => {
                const expanded = expandedJobId === job.id;
                const achKey = job.id;
                const draftText = achDraft[achKey] ?? '';
                const aiOpen = aiOpenForjob === job.id;
                const headerDateRange = formatJobListDateRange(job);
                return (
                  <div
                    key={job.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="w-full flex items-stretch bg-gray-50/90 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        className="flex-1 text-left px-4 py-3 flex justify-between gap-4"
                        onClick={() => setExpandedJobId(expanded ? null : job.id)}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {job.title || 'Untitled'}{' '}
                          <span className="text-gray-500 font-normal">
                            · {job.company || 'Company TBD'}
                          </span>
                          {headerDateRange ? (
                            <span className="text-gray-500 font-normal text-sm">
                              {' '}
                              · {headerDateRange}
                            </span>
                          ) : null}
                          {job.location ? (
                            <span className="text-gray-500 font-normal text-sm">
                              {' '}
                              · {job.location}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0 flex items-center gap-1">
                          {expanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}{' '}
                          {expanded ? 'Hide' : 'Expand'}
                        </span>
                      </button>
                    </div>

                    {expanded ? (
                      <div className="p-4 space-y-6">
                        {editingJobId === job.id ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm w-full">
                            <FormInput
                              value={jobEditDraft.company}
                              onChange={(ev) =>
                                setJobEditDraft((d) => ({ ...d, company: ev.target.value }))
                              }
                              placeholder="Company"
                            />
                            <FormInput
                              value={jobEditDraft.title}
                              onChange={(ev) =>
                                setJobEditDraft((d) => ({ ...d, title: ev.target.value }))
                              }
                              placeholder="Title"
                            />
                            <FormInput
                              className="md:col-span-2"
                              value={jobEditDraft.location}
                              onChange={(ev) =>
                                setJobEditDraft((d) => ({ ...d, location: ev.target.value }))
                              }
                              placeholder="Location"
                            />
                            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 md:col-span-2">
                              <FormCheckbox
                                checked={jobEditDraft.isCurrent}
                                onChange={(ev) =>
                                  setJobEditDraft((d) => ({ ...d, isCurrent: ev.target.checked }))
                                }
                              />
                              Current role
                            </label>
                            <label className="flex flex-col gap-1 text-gray-700 dark:text-gray-300">
                              Start
                              <FormInput
                                type="month"
                                value={jobEditDraft.startMonth}
                                onChange={(ev) =>
                                  setJobEditDraft((d) => ({ ...d, startMonth: ev.target.value }))
                                }
                              />
                            </label>
                            {!jobEditDraft.isCurrent ? (
                              <label className="flex flex-col gap-1 text-gray-700 dark:text-gray-300">
                                End
                                <FormInput
                                  type="month"
                                  value={jobEditDraft.endMonth}
                                  onChange={(ev) =>
                                    setJobEditDraft((d) => ({ ...d, endMonth: ev.target.value }))
                                  }
                                />
                              </label>
                            ) : null}
                            <div className="md:col-span-2 flex gap-2">
                              <Btn
                                type="button"
                                loading={cr.patchJob.isPending}
                                onClick={() => {
                                  cr.patchJob.mutate(
                                    {
                                      id: job.id,
                                      body: {
                                        company: jobEditDraft.company,
                                        title: jobEditDraft.title,
                                        location: jobEditDraft.location || null,
                                        startDate: monthToApiDate(jobEditDraft.startMonth, false),
                                        endDate: jobEditDraft.isCurrent
                                          ? null
                                          : monthToApiDate(jobEditDraft.endMonth, true),
                                        isCurrent: jobEditDraft.isCurrent,
                                      },
                                    },
                                    { onSuccess: () => setEditingJobId(null) }
                                  );
                                }}
                              >
                                Save role
                              </Btn>
                              <OutlineBtn type="button" onClick={() => setEditingJobId(null)}>
                                Cancel
                              </OutlineBtn>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <OutlineBtn
                              type="button"
                              onClick={() => {
                                setEditingJobId(job.id);
                                setJobEditDraft({
                                  company: job.company,
                                  title: job.title,
                                  location: job.location ?? '',
                                  startMonth: job.startDate?.slice(0, 7) ?? '',
                                  endMonth: job.endDate?.slice(0, 7) ?? '',
                                  isCurrent: job.isCurrent,
                                });
                              }}
                            >
                              Edit role
                            </OutlineBtn>
                          </div>
                        )}

                        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between text-sm font-semibold text-gray-800 dark:text-gray-200"
                            onClick={() => setAiOpenForJob((j) => (j === job.id ? null : job.id))}
                          >
                            <span className="inline-flex items-center gap-2">
                              <Sparkles className="size-4 text-blue-600" />
                              AI assistant
                            </span>
                            {aiOpen ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </button>
                          {aiOpen ? (
                            <div className="mt-3 space-y-3 text-sm w-full">
                              <div className="grid grid-cols-2 gap-2">
                                <label className="flex flex-col gap-1">
                                  Provider
                                  <Select
                                    className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900"
                                    value={aiOpts.provider}
                                    onChange={(ev) =>
                                      setAiOpts((o) => ({ ...o, provider: ev.target.value }))
                                    }
                                  >
                                    {AI_PROVIDER_PRESETS.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.label}
                                      </option>
                                    ))}
                                  </Select>
                                </label>
                                <label className="flex flex-col gap-1">
                                  Model (optional)
                                  <input
                                    className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900"
                                    placeholder="Backend default"
                                    value={aiOpts.model}
                                    onChange={(ev) =>
                                      setAiOpts((o) => ({ ...o, model: ev.target.value }))
                                    }
                                  />
                                </label>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Btn
                                  type="button"
                                  loading={cr.aiTags.isPending}
                                  onClick={() =>
                                    cr.aiTags.mutate({
                                      jobId: job.id,
                                      provider: aiOpts.provider || null,
                                      model: aiOpts.model.trim() || null,
                                    })
                                  }
                                >
                                  Infer tags
                                </Btn>
                                <Btn
                                  type="button"
                                  loading={cr.aiBrainstorm.isPending}
                                  onClick={() =>
                                    cr.aiBrainstorm.mutate({
                                      jobId: job.id,
                                      feedback: null,
                                      provider: aiOpts.provider || null,
                                      model: aiOpts.model.trim() || null,
                                    })
                                  }
                                >
                                  Brainstorm bullets
                                </Btn>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Rejection feedback you enter when declining a suggestion is fed into
                                the next brainstorm automatically—no separate “brainstorm feedback”
                                box needed.
                              </p>
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-3">Achievements</h4>
                          <ul className="space-y-2 mb-4">
                            {job.achievements.map((a) => (
                              <li
                                key={a.id}
                                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/30 px-3 py-3"
                              >
                                {editingAch?.jobId === job.id && editingAch.id === a.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm bg-white dark:bg-gray-900 min-h-[80px]"
                                      value={achEditText}
                                      onChange={(ev) => setAchEditText(ev.target.value)}
                                    />
                                    <div className="flex gap-2">
                                      <Btn
                                        type="button"
                                        loading={cr.patchAchievement.isPending}
                                        onClick={() => {
                                          cr.patchAchievement.mutate(
                                            {
                                              jobId: job.id,
                                              achievementId: a.id,
                                              body: { text: achEditText.trim() },
                                            },
                                            { onSuccess: () => setEditingAch(null) }
                                          );
                                        }}
                                      >
                                        Save
                                      </Btn>
                                      <OutlineBtn type="button" onClick={() => setEditingAch(null)}>
                                        Cancel
                                      </OutlineBtn>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                      {a.text}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                        onClick={() => {
                                          setEditingAch({ jobId: job.id, id: a.id });
                                          setAchEditText(a.text);
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                        onClick={() =>
                                          cr.deleteAchievement.mutate({
                                            jobId: job.id,
                                            achievementId: a.id,
                                          })
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <Textarea
                              placeholder="New achievement bullet…"
                              className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 min-h-[72px]"
                              value={draftText}
                              onChange={(ev) =>
                                setAchDraft((m) => ({ ...m, [achKey]: ev.target.value }))
                              }
                            />
                            <Btn
                              type="button"
                              className="self-end shrink-0"
                              loading={achAddingJobId === job.id}
                              onClick={async () => {
                                const t = draftText.trim();
                                if (!t) return;
                                setAchAddingJobId(job.id);
                                try {
                                  await cr.createAchievement.mutateAsync({
                                    jobId: job.id,
                                    body: { text: t },
                                  });
                                  setAchDraft((m) => ({ ...m, [achKey]: '' }));
                                } finally {
                                  setAchAddingJobId(null);
                                }
                              }}
                            >
                              Add bullet
                            </Btn>
                          </div>
                        </div>

                        <OutlineBtn type="button" onClick={() => cr.deleteJob.mutate(job.id)}>
                          Delete role
                        </OutlineBtn>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      ) : null}

      {activeTab === 'ai' ? (
        <Section
          title="AI suggestions"
          subtitle="Review tag ideas and hypothetical bullets in context of each role. Pending is open by default; accepted and rejected are grouped below."
        >
          <div className="max-h-[75vh] min-w-0 overflow-y-auto pr-1 space-y-2">
            {suggestionGroups.pending.length === 0 &&
            suggestionGroups.accepted.length === 0 &&
            suggestionGroups.rejected.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No suggestions yet. Run AI from the Experience tab.
              </p>
            ) : null}

            <CollapsibleAiBucket
              title="Pending"
              count={suggestionGroups.pending.length}
              defaultOpen
            >
              {suggestionGroups.pending.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No pending rows.</p>
              ) : (
                suggestionGroups.pending.map((s) => {
                  const ctx = [s.jobCompany, s.jobTitle].filter(Boolean).join(' · ');
                  const isTags = s.kind?.toLowerCase() === 'tags';
                  const isEditing = editingSuggestionId === s.id;
                  const busy = (op: 'accept' | 'reject' | 'patch' | 'revise') =>
                    suggestionBusy?.id === s.id && suggestionBusy.op === op;
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 bg-white/50 dark:bg-gray-900/20"
                    >
                      <div className="text-xs uppercase tracking-wide text-gray-500">{s.kind}</div>
                      {ctx ? (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Role:
                          </span>{' '}
                          {ctx}
                          {s.jobLocation ? ` · ${s.jobLocation}` : ''}
                        </div>
                      ) : null}
                      {isEditing ? (
                        <div className="space-y-2">
                          {isTags ? (
                            <label className="flex flex-col gap-1 text-xs">
                              Tags (comma-separated)
                              <input
                                className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900"
                                value={suggestionEditTags}
                                onChange={(ev) => setSuggestionEditTags(ev.target.value)}
                              />
                            </label>
                          ) : (
                            <label className="flex flex-col gap-1 text-xs">
                              Bullet text
                              <Textarea
                                className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-900 min-h-[72px]"
                                value={suggestionEditText}
                                onChange={(ev) => setSuggestionEditText(ev.target.value)}
                              />
                            </label>
                          )}
                          <label className="flex flex-col gap-1 text-xs">
                            Rationale (optional)
                            <Textarea
                              className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-900 min-h-[48px]"
                              value={suggestionEditRationale}
                              onChange={(ev) => setSuggestionEditRationale(ev.target.value)}
                            />
                          </label>
                          <div className="flex gap-2">
                            <Btn
                              type="button"
                              loading={busy('patch')}
                              onClick={async () => {
                                setSuggestionBusy({ id: s.id, op: 'patch' });
                                try {
                                  const tags = suggestionEditTags
                                    .split(',')
                                    .map((t) => t.trim())
                                    .filter(Boolean);
                                  await cr.patchSuggestion.mutateAsync({
                                    id: s.id,
                                    body: {
                                      suggestedText: isTags
                                        ? null
                                        : suggestionEditText.trim() || null,
                                      suggestedTags: isTags ? tags : null,
                                      rationale: suggestionEditRationale.trim() || null,
                                    },
                                  });
                                  setEditingSuggestionId(null);
                                } finally {
                                  setSuggestionBusy(null);
                                }
                              }}
                            >
                              Save edits
                            </Btn>
                            <OutlineBtn
                              type="button"
                              onClick={() => setEditingSuggestionId(null)}
                              disabled={busy('patch')}
                            >
                              Cancel
                            </OutlineBtn>
                          </div>
                        </div>
                      ) : (
                        <>
                          {s.suggestedTags?.length ? (
                            <div className="text-sm text-gray-800 dark:text-gray-200">
                              Tags: {s.suggestedTags.join(', ')}
                            </div>
                          ) : null}
                          {s.suggestedText ? (
                            <div className="text-sm text-gray-800 dark:text-gray-200 italic">
                              {s.suggestedText}
                            </div>
                          ) : null}
                          {s.rationale ? (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {s.rationale}
                            </div>
                          ) : null}
                        </>
                      )}

                      <Textarea
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs bg-white dark:bg-gray-900 mt-2"
                        placeholder="Rejection feedback (guides next brainstorm)…"
                        value={rejectFeedback[s.id] ?? ''}
                        onChange={(ev) =>
                          setRejectFeedback((m) => ({ ...m, [s.id]: ev.target.value }))
                        }
                      />

                      {reviseOpenFor === s.id ? (
                        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3 space-y-2 text-xs">
                          <label className="flex flex-col gap-1">
                            Feedback for AI revise
                            <Textarea
                              className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900 min-h-[56px]"
                              value={reviseFeedback[s.id] ?? ''}
                              onChange={(ev) =>
                                setReviseFeedback((m) => ({ ...m, [s.id]: ev.target.value }))
                              }
                              placeholder="e.g. Sharpen metrics, shorter, more leadership…"
                            />
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="flex flex-col gap-1">
                              Provider
                              <Select
                                className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900"
                                value={reviseAiOpts.provider}
                                onChange={(ev) =>
                                  setReviseAiOpts((o) => ({ ...o, provider: ev.target.value }))
                                }
                              >
                                {AI_PROVIDER_PRESETS.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.label}
                                  </option>
                                ))}
                              </Select>
                            </label>
                            <label className="flex flex-col gap-1">
                              Model override
                              <input
                                className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900"
                                placeholder="Backend default"
                                value={reviseAiOpts.model}
                                onChange={(ev) =>
                                  setReviseAiOpts((o) => ({ ...o, model: ev.target.value }))
                                }
                              />
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <Btn
                              type="button"
                              loading={busy('revise')}
                              onClick={async () => {
                                setSuggestionBusy({ id: s.id, op: 'revise' });
                                try {
                                  await cr.reviseSuggestion.mutateAsync({
                                    id: s.id,
                                    feedback: reviseFeedback[s.id]?.trim() || null,
                                    provider: reviseAiOpts.provider || null,
                                    model: reviseAiOpts.model.trim() || null,
                                  });
                                  setReviseOpenFor(null);
                                } finally {
                                  setSuggestionBusy(null);
                                }
                              }}
                            >
                              Run revise
                            </Btn>
                            <OutlineBtn type="button" onClick={() => setReviseOpenFor(null)}>
                              Close
                            </OutlineBtn>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <Btn
                          type="button"
                          loading={busy('accept')}
                          onClick={async () => {
                            setSuggestionBusy({ id: s.id, op: 'accept' });
                            try {
                              await cr.acceptSuggestion.mutateAsync(s.id);
                            } finally {
                              setSuggestionBusy(null);
                            }
                          }}
                        >
                          Accept
                        </Btn>
                        <OutlineBtn
                          type="button"
                          disabled={busy('reject')}
                          onClick={async () => {
                            setSuggestionBusy({ id: s.id, op: 'reject' });
                            try {
                              await cr.rejectSuggestion.mutateAsync({
                                id: s.id,
                                feedback: rejectFeedback[s.id]?.trim()
                                  ? rejectFeedback[s.id].trim()
                                  : null,
                              });
                            } finally {
                              setSuggestionBusy(null);
                            }
                          }}
                        >
                          Reject
                        </OutlineBtn>
                        <OutlineBtn
                          type="button"
                          disabled={isEditing || Boolean(suggestionBusy)}
                          onClick={() => {
                            setEditingSuggestionId(s.id);
                            setSuggestionEditText(s.suggestedText ?? '');
                            setSuggestionEditTags((s.suggestedTags ?? []).join(', '));
                            setSuggestionEditRationale(s.rationale ?? '');
                          }}
                        >
                          Edit manually
                        </OutlineBtn>
                        <OutlineBtn
                          type="button"
                          disabled={Boolean(suggestionBusy)}
                          onClick={() => setReviseOpenFor((cur) => (cur === s.id ? null : s.id))}
                        >
                          Ask AI to revise
                        </OutlineBtn>
                      </div>
                    </div>
                  );
                })
              )}
            </CollapsibleAiBucket>

            <CollapsibleAiBucket
              title="Accepted"
              count={suggestionGroups.accepted.length}
              defaultOpen={false}
            >
              {suggestionGroups.accepted.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No accepted rows yet.</p>
              ) : (
                suggestionGroups.accepted.map((s) => {
                  const ctx = [s.jobCompany, s.jobTitle].filter(Boolean).join(' · ');
                  return (
                    <div
                      key={s.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm space-y-1"
                    >
                      <div className="text-xs uppercase text-gray-500">{s.kind}</div>
                      {ctx ? (
                        <div className="text-xs text-gray-600 dark:text-gray-400">{ctx}</div>
                      ) : null}
                      {s.suggestedTags?.length ? (
                        <div>Tags: {s.suggestedTags.join(', ')}</div>
                      ) : null}
                      {s.suggestedText ? <div className="italic">{s.suggestedText}</div> : null}
                    </div>
                  );
                })
              )}
            </CollapsibleAiBucket>

            <CollapsibleAiBucket
              title="Rejected"
              count={suggestionGroups.rejected.length}
              defaultOpen={false}
            >
              {suggestionGroups.rejected.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No rejected rows.</p>
              ) : (
                suggestionGroups.rejected.map((s) => {
                  const ctx = [s.jobCompany, s.jobTitle].filter(Boolean).join(' · ');
                  return (
                    <div
                      key={s.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm space-y-1"
                    >
                      <div className="text-xs uppercase text-gray-500">{s.kind}</div>
                      {ctx ? (
                        <div className="text-xs text-gray-600 dark:text-gray-400">{ctx}</div>
                      ) : null}
                      {s.suggestedTags?.length ? (
                        <div>Tags: {s.suggestedTags.join(', ')}</div>
                      ) : null}
                      {s.suggestedText ? <div className="italic">{s.suggestedText}</div> : null}
                      {s.feedback ? (
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                          Feedback: {s.feedback}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </CollapsibleAiBucket>
          </div>
        </Section>
      ) : null}

      {activeTab === 'generate' ? (
        <div className="space-y-10">
          <Section
            title="Job posting"
            subtitle="Choose a posting ingested in Job Sources. Ingest new URLs there (preview, dedupe, snapshots)."
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <Link
                  to={ROUTES.admin.careerJobSources}
                  className="text-blue-600 dark:text-blue-400 underline font-medium"
                >
                  Open Job Sources
                </Link>{' '}
                to add or refresh postings.
              </p>
              <label className="flex flex-col text-sm gap-1 max-w-xl">
                Saved posting
                <Select
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={selectedPostingId}
                  onChange={(ev) => setSelectedPostingId(ev.target.value)}
                  disabled={savedPostingsQ.isLoading}
                >
                  <option value="">Select a posting…</option>
                  {(savedPostingsQ.data?.items ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {(p.title || p.roleGuess || 'Role') +
                        ' · ' +
                        (p.company || p.companyGuess || 'Company')}
                      {p.provider || p.jobBoard ? ` (${p.provider || p.jobBoard})` : ''}
                    </option>
                  ))}
                </Select>
              </label>
              {savedPostingsQ.error ? (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {savedPostingsQ.error instanceof Error
                    ? savedPostingsQ.error.message
                    : String(savedPostingsQ.error)}
                </span>
              ) : null}

              {lastPosting ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 text-sm bg-gray-50/50 dark:bg-gray-900/40">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Selected posting</h3>
                  <div>
                    <span className="text-gray-500">Role:</span>{' '}
                    {lastPosting.title || lastPosting.roleGuess || '—'}
                  </div>
                  <div>
                    <span className="text-gray-500">Company:</span>{' '}
                    {lastPosting.company || lastPosting.companyGuess || '—'}
                  </div>
                  {(lastPosting.provider || lastPosting.jobBoard) && (
                    <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {lastPosting.provider || lastPosting.jobBoard}
                      {lastPosting.companySlug || lastPosting.jobBoardCompanyId
                        ? ` · ${lastPosting.companySlug || lastPosting.jobBoardCompanyId}`
                        : ''}
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block mb-1">Mandatory keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {lastPosting.mandatoryKeywords?.length
                        ? lastPosting.mandatoryKeywords.map((k) => (
                            <span
                              key={k}
                              className="rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 px-2 py-0.5 text-xs"
                            >
                              {k}
                            </span>
                          ))
                        : '—'}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Section>

          <Section
            title="Application fit"
            subtitle="Optional — uses the same URL / description as above (or an analyzed posting), your achievement bank, rejection themes, and an optional resume snapshot. Does not create a tracker row; use Application Tracking for that."
          >
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    Tailored draft (optional)
                  </span>
                  <Select
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                    value={fitGenResumeId ?? ''}
                    onChange={(ev) =>
                      setFitGenResumeId(ev.target.value.trim() ? ev.target.value : null)
                    }
                  >
                    <option value="">Recent generated drafts…</option>
                    {(cr.generated.data?.items ?? []).map((g: CareerGeneratedResume) => (
                      <option key={g.id} value={g.id}>
                        {formatGeneratedDraftLabel(g)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    Resume snapshot file (.pdf, .txt, .md)
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      className="text-sm"
                      disabled={fitPdfBusy}
                      onChange={(ev) => void handleFitResumeFile(ev.target.files?.[0] ?? null)}
                    />
                    {fitPdfBusy ? (
                      <Loader2 className="size-4 animate-spin text-gray-500" aria-hidden />
                    ) : null}
                  </span>
                  {fitResumeSnapName ? (
                    <span className="text-xs text-gray-500">Attached: {fitResumeSnapName}</span>
                  ) : null}
                </label>
              </div>
              {(cr.generated.data?.items ?? []).length ? (
                <OutlineBtn
                  type="button"
                  onClick={() => {
                    const g = (cr.generated.data?.items ?? [])[0];
                    if (g) setFitGenResumeId(g.id);
                  }}
                >
                  Use latest draft for fit
                </OutlineBtn>
              ) : null}
              <div className="flex flex-wrap gap-2 items-center">
                <Btn
                  type="button"
                  loading={appsFit.recommendApplications.isPending}
                  onClick={async () => {
                    if (!lastPosting?.id) {
                      alert('Select a saved job posting from Job Sources first.');
                      return;
                    }
                    try {
                      const res = await appsFit.recommendApplications.mutateAsync({
                        sourceUrl: lastPosting.sourceUrl ?? null,
                        rawText: null,
                        jobPostingId: lastPosting.id,
                        generatedResumeId: fitGenResumeId,
                        resumeSnapshotName: fitResumeSnapName.trim() || null,
                        resumeSnapshotText: fitResumeSnapText.trim() || null,
                        provider: aiOpts.provider || null,
                        model: aiOpts.model.trim() || null,
                      });
                      setFitRec(res.recommendation);
                      setLastPosting(res.jobPosting);
                    } catch {
                      /* inline error */
                    }
                  }}
                >
                  Get fit recommendation
                </Btn>
                {appsFit.recommendApplications.error ? (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {appsFit.recommendApplications.error instanceof Error
                      ? appsFit.recommendApplications.error.message
                      : String(appsFit.recommendApplications.error)}
                  </span>
                ) : null}
              </div>
              {fitRec ? (
                <CareerFitIntelligencePanel
                  fit={fitRec}
                  roleLabel={lastPosting?.roleGuess || genTargetRole || 'Role'}
                  companyLabel={lastPosting?.companyGuess || genTargetCompany || 'Company'}
                />
              ) : null}
            </div>
          </Section>

          <Section
            title="Tailored resume"
            subtitle="Achievement bank plus the analyzed posting (and any extra snippet below) → markdown on the backend."
          >
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex flex-col text-sm gap-1">
                  Target company (saved on draft)
                  <input
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                    value={genTargetCompany}
                    onChange={(ev) => setGenTargetCompany(ev.target.value)}
                    placeholder="From posting or override"
                  />
                </label>
                <label className="flex flex-col text-sm gap-1">
                  Target role (saved on draft)
                  <input
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                    value={genTargetRole}
                    onChange={(ev) => setGenTargetRole(ev.target.value)}
                    placeholder="From posting or override"
                  />
                </label>
              </div>
              <ResumeTemplateGallery
                templates={cr.resumeTemplates.data?.items ?? []}
                selectedId={resumeTemplate}
                onSelect={setResumeTemplate}
                importBusy={cr.importResumeTemplate.isPending}
                importWarnings={templateImportWarnings}
                onImport={async (file) => {
                  try {
                    const res = await cr.importResumeTemplate.mutateAsync({ file });
                    setTemplateImportWarnings(res.parseWarnings ?? []);
                    setResumeTemplate(res.template.templateId);
                  } catch {
                    setTemplateImportWarnings([]);
                  }
                }}
              />
              <label className="flex flex-col text-sm gap-1">
                Extra job text (optional — added on top of analyzed posting, or use alone without
                Analyze)
                <Textarea
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 min-h-[100px]"
                  value={genRawPosting}
                  onChange={(ev) => setGenRawPosting(ev.target.value)}
                />
              </label>
              <label className="flex flex-col text-sm gap-1">
                Tone hint
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={tone}
                  onChange={(ev) => setTone(ev.target.value)}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  AI provider (generation)
                  <Select
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                    value={aiOpts.provider}
                    onChange={(ev) => setAiOpts((o) => ({ ...o, provider: ev.target.value }))}
                  >
                    {AI_PROVIDER_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Model override
                  <input
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                    placeholder="Backend default"
                    value={aiOpts.model}
                    onChange={(ev) => setAiOpts((o) => ({ ...o, model: ev.target.value }))}
                  />
                </label>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Achievements ({achievementSelection.size} selected · empty uses all active)
                </h4>
                <div className="max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2 text-sm">
                  {cr.achievementOptions.map(({ job, achievement: a }) => (
                    <label key={a.id} className="flex gap-2 items-start cursor-pointer">
                      <FormCheckbox
                        className="mt-1"
                        checked={achievementSelection.has(a.id)}
                        onChange={() => toggleAchievement(a.id)}
                      />
                      <span>
                        <span className="text-gray-500 text-xs font-medium">{job.company} · </span>
                        <span className="line-clamp-2">{a.text}</span>
                      </span>
                    </label>
                  ))}
                  {cr.achievementOptions.length === 0 ? (
                    <span className="text-gray-500">
                      No achievements yet — add bullets under a job.
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <OutlineBtn
                  type="button"
                  disabled={
                    cr.previewAtsScore.isPending ||
                    (!lastPosting?.id &&
                      !genRawPosting.trim() &&
                      !selectedAchievementIdsForTailor?.length)
                  }
                  onClick={async () => {
                    try {
                      const res = await cr.previewAtsScore.mutateAsync({
                        jobPostingId: lastPosting?.id ?? null,
                        rawJobPostingText: genRawPosting.trim() ? genRawPosting : null,
                        selectedAchievementIds: selectedAchievementIdsForTailor,
                      });
                      setAtsPreview(res);
                      setPreviewKeywordDiff({
                        mandatory: res.mandatoryKeywords ?? [],
                        matched: res.matchedKeywords ?? [],
                        missing: res.missingKeywords ?? [],
                      });
                    } catch {
                      /* error below */
                    }
                  }}
                >
                  {cr.previewAtsScore.isPending ? (
                    <Loader2 className="size-4 animate-spin inline" aria-hidden />
                  ) : null}
                  Preview ATS score
                </OutlineBtn>
                <Btn
                  type="button"
                  loading={cr.generateResume.isPending}
                  onClick={async () => {
                    try {
                      const res = await cr.generateResume.mutateAsync({
                        jobPostingId: lastPosting?.id ?? null,
                        rawJobPostingText: genRawPosting.trim() ? genRawPosting : null,
                        selectedAchievementIds: selectedAchievementIdsForTailor,
                        tone,
                        resumeTemplate,
                        provider: aiOpts.provider || null,
                        model: aiOpts.model.trim() || null,
                        companyName: genTargetCompany.trim() || null,
                        jobTitle: genTargetRole.trim() || null,
                      });
                      applyActiveDraft(res);
                      setAtsPreview(null);
                    } catch {
                      /* error below */
                    }
                  }}
                >
                  Generate resume
                </Btn>
              </div>

              {cr.previewAtsScore.error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {cr.previewAtsScore.error instanceof Error
                    ? cr.previewAtsScore.error.message
                    : String(cr.previewAtsScore.error)}
                </p>
              ) : null}

              {atsPreview ? (
                <CareerResumeAtsScoreCard
                  mode="preview"
                  atsScore={atsPreview.atsScore}
                  breakdown={atsPreview.atsScoreBreakdown}
                />
              ) : null}

              {cr.generateResume.error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {cr.generateResume.error instanceof Error
                    ? cr.generateResume.error.message
                    : String(cr.generateResume.error)}
                </p>
              ) : null}

              {previewMarkdown ? (
                <div className="mt-8 space-y-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/60 dark:bg-gray-900/40">
                  {activeDraft ? (
                    <>
                      <CareerResumeProvenancePanel
                        exportReady={activeDraft.exportReady}
                        qualityStatus={activeDraft.qualityStatus}
                        provenance={activeDraft.provenance}
                        qualityWarnings={activeDraft.qualityWarnings}
                      />
                      <CareerResumeAtsScoreCard
                        atsScore={activeDraft.atsScore}
                        atsScoreBefore={activeDraft.atsScoreBefore}
                        atsScoreDelta={activeDraft.atsScoreDelta}
                        llmAtsScore={activeDraft.llmAtsScore}
                        breakdown={activeDraft.atsScoreBreakdown}
                      />
                    </>
                  ) : null}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="text-sm font-semibold">Download</h4>
                    <ResumeExportButtons
                      resumeId={previewGeneratedId}
                      templateId={resumeTemplate}
                      exportReady={activeDraft?.exportReady !== false}
                      busyFormat={exportBusyFormat}
                      onExport={async (format) => {
                        if (!previewGeneratedId) return;
                        setExportBusyFormat(format);
                        try {
                          const exp = await cr.exportGeneratedResume.mutateAsync({
                            resumeId: previewGeneratedId,
                            format,
                            templateId: resumeTemplate,
                          });
                          const a = document.createElement('a');
                          a.href = exp.downloadUrl;
                          a.download = exp.fileName || `resume.${format}`;
                          a.rel = 'noopener';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        } finally {
                          setExportBusyFormat(null);
                        }
                      }}
                    />
                  </div>
                  {previewKeywordDiff ? (
                    <KeywordCoverageMatrix
                      mandatory={previewKeywordDiff.mandatory}
                      matched={previewKeywordDiff.matched}
                      missing={previewKeywordDiff.missing}
                      className="lg:hidden"
                    />
                  ) : null}
                  {previewMeta ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm opacity-90">
                      <div className="rounded-lg bg-white dark:bg-gray-950 p-3 border border-gray-200 dark:border-gray-700">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                          LLM self-rated — not an export gate
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Resume scores (heuristic)
                        </div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Deterministic ATS (display): {previewMeta.atsScore ?? '—'} / 100 · Reader:{' '}
                          {previewMeta.humanScore ?? '—'} / 100
                          {previewMeta.llmAtsScore != null
                            ? ` · LLM ATS: ${previewMeta.llmAtsScore}`
                            : ''}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-gray-950 p-3 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Keywords emphasized
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {previewMeta.atsKeywordsUsed?.length
                            ? previewMeta.atsKeywordsUsed.map((k) => (
                                <span
                                  key={k}
                                  className="rounded bg-blue-100/80 dark:bg-blue-900/40 px-1.5 py-0.5 text-xs"
                                >
                                  {k}
                                </span>
                              ))
                            : '—'}
                        </div>
                      </div>
                      {previewMeta.biasStrategyNotes ? (
                        <div className="md:col-span-2 rounded-lg bg-white dark:bg-gray-950 p-3 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Why this version
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {previewMeta.biasStrategyNotes}
                          </p>
                        </div>
                      ) : null}
                      {previewMeta.bulletRationales?.length ? (
                        <div className="md:col-span-2 rounded-lg bg-white dark:bg-gray-950 p-3 border border-gray-200 dark:border-gray-700 space-y-2">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            Bullet-level rationale
                          </div>
                          {previewMeta.bulletRationales.map((b, idx) => (
                            <details
                              key={`${idx}-${b.bulletText?.slice(0, 24) ?? ''}`}
                              className="rounded-md border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 px-2 py-1"
                            >
                              <summary className="cursor-pointer text-sm font-medium text-gray-800 dark:text-gray-200">
                                Why this bullet?{' '}
                                <span className="font-normal text-gray-600 dark:text-gray-400">
                                  {(b.bulletText || '').slice(0, 72)}
                                  {(b.bulletText || '').length > 72 ? '…' : ''}
                                </span>
                              </summary>
                              {b.keywords?.length ? (
                                <p className="text-xs text-gray-500 mt-2">
                                  Keywords: {b.keywords.join(', ')}
                                </p>
                              ) : null}
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                {b.reason}
                              </p>
                            </details>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
                    <div className="min-w-0 space-y-4">
                      <h4 className="text-sm font-semibold">Preview</h4>
                      {activeDraft?.resumeSections?.length ? (
                        <CareerResumeDraftEditor
                          draft={activeDraft}
                          busySectionId={busySectionId}
                          onSaveSection={handleSaveResumeSection}
                          onRegenerateSection={handleRegenerateResumeSection}
                        />
                      ) : (
                        <MarkdownRenderer
                          content={previewMarkdown}
                          components={getCareerResumeMarkdownComponents(
                            previewMeta?.atsKeywordsUsed ?? []
                          )}
                        />
                      )}
                    </div>
                    {previewKeywordDiff ? (
                      <div className="lg:sticky lg:top-4 lg:self-start">
                        <KeywordCoverageMatrix
                          mandatory={previewKeywordDiff.mandatory}
                          matched={previewKeywordDiff.matched}
                          missing={previewKeywordDiff.missing}
                          className="hidden lg:block"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </Section>

          <Section
            title="Generated history"
            subtitle="Search and sort saved drafts by target, score, model, and outcome."
          >
            <div className="mb-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_120px]">
              <input
                type="search"
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-sm"
                placeholder="Search company, role, template, provider…"
                value={generatedSearch}
                onChange={(ev) => {
                  setGeneratedSearch(ev.target.value);
                  setGeneratedPage(1);
                }}
              />
              <Select
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-sm"
                value={generatedSortBy}
                onChange={(ev) => {
                  setGeneratedSortBy(ev.target.value as CareerGeneratedResumeSortBy);
                  setGeneratedPage(1);
                }}
              >
                <option value="createdAt">Date</option>
                <option value="companyName">Company</option>
                <option value="jobTitle">Role</option>
                <option value="atsScore">ATS score</option>
                <option value="resumeTemplate">Template</option>
                <option value="provider">Provider</option>
              </Select>
              <Select
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-sm"
                value={generatedSortOrder}
                onChange={(ev) => {
                  setGeneratedSortOrder(ev.target.value as 'asc' | 'desc');
                  setGeneratedPage(1);
                }}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </Select>
            </div>
            <ul className="space-y-3">
              {(cr.generated.data?.items ?? []).map((g: CareerGeneratedResume) => {
                const targetLine = [g.companyName, g.jobTitle].filter(Boolean).join(' — ');
                const scoreParts = [
                  g.resumeTemplate,
                  g.atsScore != null ? `ATS ${g.atsScore}` : null,
                  g.humanScore != null ? `Reader ${g.humanScore}` : null,
                ].filter(Boolean);
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      className="text-left w-full rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400/60 px-4 py-3 text-sm bg-white dark:bg-gray-900"
                      onClick={() => void openGeneratedDraft(g.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {targetLine || formatGeneratedDraftLabel(g)}
                        </div>
                        {g.application ? (
                          <span className="rounded-full bg-emerald-100/80 dark:bg-emerald-950/50 px-2 py-0.5 text-[11px] text-emerald-900 dark:text-emerald-100">
                            {g.application.status}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {scoreParts.length ? `${scoreParts.join(' · ')} · ` : ''}
                        {formatResumeHistoryWhen(g.createdAt)}
                        {g.model ? ` · ${g.provider ?? ''} ${g.model}`.trim() : ''}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-blue-700 dark:text-blue-300">
                        {g.jobPostingId ? <span>Posting {g.jobPostingId.slice(0, 8)}…</span> : null}
                        {g.application ? (
                          <span>Application {g.application.id.slice(0, 8)}…</span>
                        ) : null}
                      </div>
                      <div
                        className="mt-2"
                        onClick={(ev) => ev.stopPropagation()}
                        onKeyDown={(ev) => ev.stopPropagation()}
                        role="presentation"
                      >
                        <ResumeExportButtons
                          resumeId={g.id}
                          templateId={g.resumeTemplate ?? resumeTemplate}
                          exportReady={g.exportReady !== false}
                          busyFormat={
                            exportBusyFormat && previewGeneratedId === g.id
                              ? exportBusyFormat
                              : null
                          }
                          onExport={async (format) => {
                            setPreviewGeneratedId(g.id);
                            setExportBusyFormat(format);
                            try {
                              const exp = await cr.exportGeneratedResume.mutateAsync({
                                resumeId: g.id,
                                format,
                                templateId: g.resumeTemplate ?? resumeTemplate,
                              });
                              const a = document.createElement('a');
                              a.href = exp.downloadUrl;
                              a.download = exp.fileName || `resume.${format}`;
                              a.rel = 'noopener';
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                            } finally {
                              setExportBusyFormat(null);
                            }
                          }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
              {(cr.generated.data?.items ?? []).length === 0 ? (
                <li className="text-sm text-gray-500">No drafts yet.</li>
              ) : null}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>
                Page {cr.generated.data?.page ?? generatedPage}
                {typeof cr.generated.data?.total === 'number'
                  ? ` · ${cr.generated.data.total} drafts`
                  : ''}
              </span>
              <span className="flex gap-2">
                <OutlineBtn
                  type="button"
                  disabled={generatedPage <= 1 || cr.generated.isFetching}
                  onClick={() => setGeneratedPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </OutlineBtn>
                <OutlineBtn
                  type="button"
                  disabled={!cr.generated.data?.hasMore || cr.generated.isFetching}
                  onClick={() => setGeneratedPage((p) => p + 1)}
                >
                  Next
                </OutlineBtn>
              </span>
            </div>
          </Section>
        </div>
      ) : null}

      {activeTab === 'applications' ? (
        <ApplicationTrackingTab
          cr={cr}
          selectedApplicationId={searchParams.get('applicationId')}
          filterGeneratedResumeId={searchParams.get('draftId')}
          filterJobPostingId={searchParams.get('postingId')}
          onOpenGeneratedDraft={(resumeId) => void openGeneratedDraft(resumeId)}
          onOpenJobPosting={(postingId) => void openJobPosting(postingId)}
        />
      ) : null}
    </div>
  );
}
