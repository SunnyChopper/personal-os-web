import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { FormInput } from '@/components/atoms/FormInput';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import { useCareerResume } from '@/hooks/useCareerResume';
import { sortJobsByRecency } from '@/lib/career-job-sort';
import { cn } from '@/lib/utils';
import type {
  CareerEducation,
  CareerGeneratedResume,
  CareerJob,
  CareerJobPosting,
  CareerResumeBulletRationale,
} from '@/types/api/career.types';
import { getCareerResumeMarkdownComponents } from './careerResumeMarkdown';

const BUILDER_TABS = [
  { id: 'profile', label: 'Profile & education' },
  { id: 'experience', label: 'Experience' },
  { id: 'ai', label: 'AI suggestions' },
  { id: 'generate', label: 'Tailor & generate' },
] as const;

type BuilderTabId = (typeof BUILDER_TABS)[number]['id'];

const RESUME_TEMPLATES = [
  { id: 'standard_professional', label: 'Standard professional' },
  { id: 'modern_ats', label: 'Modern ATS' },
] as const;

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

function Btn(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }
) {
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
        <div className="p-3 space-y-3 border-t border-gray-200 dark:border-gray-700">{children}</div>
      ) : null}
    </div>
  );
}

export default function ResumeBuilderPage() {
  const cr = useCareerResume();
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

  const [postUrl, setPostUrl] = useState('');
  const [postRaw, setPostRaw] = useState('');
  const [lastPosting, setLastPosting] = useState<CareerJobPosting | null>(null);
  const [postingExtractedOpen, setPostingExtractedOpen] = useState(false);

  const [genRawPosting, setGenRawPosting] = useState('');
  const [tone, setTone] = useState('professional ATS-friendly');
  const [resumeTemplate, setResumeTemplate] = useState<string>('standard_professional');
  const [achievementSelection, setAchievementSelection] = useState<Set<string>>(new Set());

  const [previewMarkdown, setPreviewMarkdown] = useState('');
  const [previewMeta, setPreviewMeta] = useState<{
    atsKeywordsUsed: string[];
    biasStrategyNotes?: string | null;
    atsScore?: number | null;
    humanScore?: number | null;
    bulletRationales?: CareerResumeBulletRationale[];
  } | null>(null);

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
          We couldn&apos;t load your career data right now. Please refresh the page. If it keeps happening, try again
          later.
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
                <textarea
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

          <Section title="Education" subtitle="Degrees and certifications (display order preserved).">
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
                        <textarea
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
                      <div className="font-medium text-gray-900 dark:text-white">{e.institution}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {[e.degree, e.field].filter(Boolean).join(' · ') || '—'}
                        {e.gpa ? ` · GPA: ${e.gpa}` : ''}
                        {e.startDate || e.endDate
                          ? ` · ${e.startDate?.slice(0, 7) ?? '?'} – ${e.endDate?.slice(0, 7) ?? '?'}`
                          : ''}
                      </div>
                      {e.courses ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{e.courses}</p>
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
                <textarea
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
                        <span className="text-gray-500 font-normal">· {job.company || 'Company TBD'}</span>
                        {headerDateRange ? (
                          <span className="text-gray-500 font-normal text-sm"> · {headerDateRange}</span>
                        ) : null}
                        {job.location ? (
                          <span className="text-gray-500 font-normal text-sm"> · {job.location}</span>
                        ) : null}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0 flex items-center gap-1">
                        {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}{' '}
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
                            onChange={(ev) => setJobEditDraft((d) => ({ ...d, title: ev.target.value }))}
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
                          {aiOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                        {aiOpen ? (
                          <div className="mt-3 space-y-3 text-sm w-full">
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex flex-col gap-1">
                                Provider
                                <select
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
                                </select>
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
                              Rejection feedback you enter when declining a suggestion is fed into the next brainstorm
                              automatically—no separate “brainstorm feedback” box needed.
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
                                  <textarea
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
                          <textarea
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
                          <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span> {ctx}
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
                              <textarea
                                className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-900 min-h-[72px]"
                                value={suggestionEditText}
                                onChange={(ev) => setSuggestionEditText(ev.target.value)}
                              />
                            </label>
                          )}
                          <label className="flex flex-col gap-1 text-xs">
                            Rationale (optional)
                            <textarea
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
                                      suggestedText: isTags ? null : suggestionEditText.trim() || null,
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
                            <div className="text-xs text-gray-600 dark:text-gray-400">{s.rationale}</div>
                          ) : null}
                        </>
                      )}

                      <textarea
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
                            <textarea
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
                              <select
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
                              </select>
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
                                feedback:
                                  rejectFeedback[s.id]?.trim() ? rejectFeedback[s.id].trim() : null,
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
                          onClick={() =>
                            setReviseOpenFor((cur) => (cur === s.id ? null : s.id))
                          }
                        >
                          Ask AI to revise
                        </OutlineBtn>
                      </div>
                    </div>
                  );
                })
              )}
            </CollapsibleAiBucket>

            <CollapsibleAiBucket title="Accepted" count={suggestionGroups.accepted.length} defaultOpen={false}>
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
                      {s.suggestedTags?.length ? <div>Tags: {s.suggestedTags.join(', ')}</div> : null}
                      {s.suggestedText ? <div className="italic">{s.suggestedText}</div> : null}
                    </div>
                  );
                })
              )}
            </CollapsibleAiBucket>

            <CollapsibleAiBucket title="Rejected" count={suggestionGroups.rejected.length} defaultOpen={false}>
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
                      {s.suggestedTags?.length ? <div>Tags: {s.suggestedTags.join(', ')}</div> : null}
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
            subtitle="Paste a description or job-board URL, analyze to extract structure and keywords, then generate a tailored resume below. Greenhouse, Lever, Ashby, Workable, and SmartRecruiters URLs record board IDs when recognized."
          >
            <div className="space-y-4">
              <label className="flex flex-col text-sm gap-1">
                Source URL (optional — fetches when raw text empty)
                <input
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={postUrl}
                  onChange={(ev) => setPostUrl(ev.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label className="flex flex-col text-sm gap-1">
                Raw job description (optional — overrides fetch)
                <textarea
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 min-h-[120px]"
                  value={postRaw}
                  onChange={(ev) => setPostRaw(ev.target.value)}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Btn
                  type="button"
                  loading={cr.analyzePosting.isPending}
                  onClick={async () => {
                    try {
                      const posting = await cr.analyzePosting.mutateAsync({
                        sourceUrl: postUrl.trim() || null,
                        rawText: postRaw.trim() || null,
                      });
                      setLastPosting(posting);
                      setPostingExtractedOpen(false);
                    } catch {
                      /* toast via inline error */
                    }
                  }}
                >
                  Analyze posting
                </Btn>
                {cr.analyzePosting.error ? (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {cr.analyzePosting.error instanceof Error
                      ? cr.analyzePosting.error.message
                      : String(cr.analyzePosting.error)}
                  </span>
                ) : null}
              </div>

              {lastPosting ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 text-sm bg-gray-50/50 dark:bg-gray-900/40">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Parsed posting</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    This context is used when you click <span className="font-medium">Generate resume</span> below.
                  </p>
                  <div>
                    <span className="text-gray-500">Role:</span> {lastPosting.roleGuess ?? '—'}
                  </div>
                  <div>
                    <span className="text-gray-500">Company:</span> {lastPosting.companyGuess ?? '—'}
                  </div>
                  {lastPosting.jobBoard ? (
                    <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      Tracked board: {lastPosting.jobBoard}
                      {lastPosting.jobBoardCompanyId ? ` · company key: ${lastPosting.jobBoardCompanyId}` : ''}
                    </div>
                  ) : null}
                  <div>
                    <span className="text-gray-500 block mb-1">ATS keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {lastPosting.atsKeywords?.length
                        ? lastPosting.atsKeywords.map((k) => (
                            <span
                              key={k}
                              className="rounded-full bg-blue-100/80 dark:bg-blue-900/40 px-2 py-0.5 text-xs"
                            >
                              {k}
                            </span>
                          ))
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Must-have skills</span>
                    <div className="flex flex-wrap gap-1">
                      {lastPosting.requirements?.mustHaveSkills?.length
                        ? lastPosting.requirements.mustHaveSkills.map((k) => (
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
                  <div>
                    <span className="text-gray-500 block mb-1">Nice-to-have skills</span>
                    <div className="flex flex-wrap gap-1">
                      {lastPosting.requirements?.niceToHaveSkills?.length
                        ? lastPosting.requirements.niceToHaveSkills.map((k) => (
                            <span
                              key={k}
                              className="rounded-full bg-slate-100/80 dark:bg-slate-800/60 px-2 py-0.5 text-xs"
                            >
                              {k}
                            </span>
                          ))
                        : '—'}
                    </div>
                  </div>
                  {lastPosting.requirements?.responsibilitiesSummary ? (
                    <div>
                      <span className="text-gray-500 block mb-1">Responsibilities (summary)</span>
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {lastPosting.requirements.responsibilitiesSummary}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <button
                      type="button"
                      onClick={() => setPostingExtractedOpen((v) => !v)}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mb-1"
                    >
                      {postingExtractedOpen ? 'Hide' : 'Show'} extracted job text
                    </button>
                    {postingExtractedOpen ? (
                      <pre className="whitespace-pre-wrap text-xs max-h-48 overflow-auto bg-white dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-700 mt-1">
                        {(lastPosting.rawText || '').slice(0, 12000)}
                        {(lastPosting.rawText || '').length > 12000 ? '…' : ''}
                      </pre>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </Section>

          <Section
            title="Tailored resume"
            subtitle="Achievement bank plus the analyzed posting (and any extra snippet below) → markdown on the backend."
          >
            <div className="space-y-4">
              <label className="flex flex-col text-sm gap-1">
                Resume template
                <select
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                  value={resumeTemplate}
                  onChange={(ev) => setResumeTemplate(ev.target.value)}
                >
                  {RESUME_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm gap-1">
                Extra job text (optional — added on top of analyzed posting, or use alone without Analyze)
                <textarea
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
                  <select
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
                    value={aiOpts.provider}
                    onChange={(ev) => setAiOpts((o) => ({ ...o, provider: ev.target.value }))}
                  >
                    {AI_PROVIDER_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
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
                    <span className="text-gray-500">No achievements yet — add bullets under a job.</span>
                  ) : null}
                </div>
              </div>

              <Btn
                type="button"
                loading={cr.generateResume.isPending}
                onClick={async () => {
                  try {
                    const sel =
                      achievementSelection.size > 0 ? [...achievementSelection] : undefined;
                    const res = await cr.generateResume.mutateAsync({
                      jobPostingId: lastPosting?.id ?? null,
                      rawJobPostingText: genRawPosting.trim() ? genRawPosting : null,
                      selectedAchievementIds: sel,
                      tone,
                      resumeTemplate,
                      provider: aiOpts.provider || null,
                      model: aiOpts.model.trim() || null,
                    });
                    setPreviewMarkdown(res.resumeMarkdown);
                    setPreviewMeta({
                      atsKeywordsUsed: res.atsKeywordsUsed ?? [],
                      biasStrategyNotes: res.biasStrategyNotes,
                      atsScore: res.atsScore,
                      humanScore: res.humanScore,
                      bulletRationales: res.bulletRationales ?? [],
                    });
                  } catch {
                    /* error below */
                  }
                }}
              >
                Generate resume
              </Btn>

              {cr.generateResume.error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {cr.generateResume.error instanceof Error
                    ? cr.generateResume.error.message
                    : String(cr.generateResume.error)}
                </p>
              ) : null}

              {previewMarkdown ? (
                <div className="mt-8 space-y-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/60 dark:bg-gray-900/40">
                  {previewMeta ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-white dark:bg-gray-950 p-3 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Resume scores (heuristic)
                        </div>
                        <div className="font-semibold">
                          ATS: {previewMeta.atsScore ?? '—'} / 100 · Reader:{' '}
                          {previewMeta.humanScore ?? '—'} / 100
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
                  <h4 className="text-sm font-semibold">Preview</h4>
                  <MarkdownRenderer
                    content={previewMarkdown}
                    components={getCareerResumeMarkdownComponents(
                      previewMeta?.atsKeywordsUsed ?? []
                    )}
                  />
                </div>
              ) : null}
            </div>
          </Section>

          <Section title="Generated history" subtitle="Recent drafts — open to load into preview.">
            <ul className="space-y-3">
              {(cr.generated.data?.items ?? []).map((g: CareerGeneratedResume) => {
                const labelParts = [
                  g.resumeTemplate,
                  g.atsScore != null ? `ATS ${g.atsScore}` : null,
                  g.humanScore != null ? `Reader ${g.humanScore}` : null,
                ].filter(Boolean);
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      className="text-left w-full rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400/60 px-4 py-3 text-sm bg-white dark:bg-gray-900"
                      onClick={() => {
                        setPreviewMarkdown(g.resumeMarkdown);
                        setPreviewMeta({
                          atsKeywordsUsed: g.atsKeywordsUsed ?? [],
                          biasStrategyNotes: g.biasStrategyNotes,
                          atsScore: g.atsScore,
                          humanScore: g.humanScore,
                          bulletRationales: g.bulletRationales ?? [],
                        });
                        setActiveTab('generate');
                      }}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {labelParts.length ? labelParts.join(' · ') : 'Resume draft'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {formatResumeHistoryWhen(g.createdAt)}
                        {g.model ? ` · ${g.provider ?? ''} ${g.model}`.trim() : ''}
                      </div>
                    </button>
                  </li>
                );
              })}
              {(cr.generated.data?.items ?? []).length === 0 ? (
                <li className="text-sm text-gray-500">No drafts yet.</li>
              ) : null}
            </ul>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
