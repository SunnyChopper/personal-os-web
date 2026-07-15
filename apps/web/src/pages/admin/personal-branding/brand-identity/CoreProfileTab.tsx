import { useEffect, useState, type ReactNode } from 'react';
import { Plus, Sparkles, FlaskConical } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import Dialog from '@/components/molecules/Dialog';
import { useToast } from '@/hooks/use-toast';
import { useReconFeed } from '@/hooks/useReconFeed';
import type { usePersonalBrandingBrandIdentity } from '@/hooks/usePersonalBrandingBrandIdentity';
import StringListEditor, { FormTextarea, ToneMetricsEditor } from './BrandIdentityFormFields';
import ProfileExtractionDialog from './ProfileExtractionDialog';
import ProfileExtractionProgressModal from './ProfileExtractionProgressModal';
import { extractionProgressPercent } from './profile-extraction-progress';
import ProfileLiveOutputTestPanel, { type ProfileFormSnapshot } from './ProfileLiveOutputTestPanel';
import ProfileVersionHistory from './ProfileVersionHistory';
import { LOCAL_DRAFT_PROFILE_ID } from './brand-identity.constants';
import type {
  BrandProfile,
  BrandProfileOutputTest,
  BrandProfileStatus,
  BrandProfileVersion,
  GenerateProfileOutputTestInput,
  ProfileExtractionJob,
  ProfileExtractionSource,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import { Select } from '@/components/atoms/Select';
import {
  DialogFooter,
  PageCard,
  SidebarCard,
  TwoColumnLayout,
} from '../PersonalBrandingPageTemplate';

type BrandIdentityHook = ReturnType<typeof usePersonalBrandingBrandIdentity>;

interface CoreProfileTabProps {
  brandIdentity: BrandIdentityHook;
}

function createEmptyDraftProfile(): BrandProfile {
  const now = new Date().toISOString();
  return {
    id: LOCAL_DRAFT_PROFILE_ID,
    name: 'New profile',
    description: null,
    pillars: [],
    targetAudience: null,
    toneMetrics: {},
    bannedPhrases: [],
    status: 'draft',
    userId: '',
    createdAt: now,
    updatedAt: now,
  };
}

function extractionStatusLabel(job: ProfileExtractionJob | undefined): string {
  if (!job) return '';
  if (job.message?.trim()) return job.message;
  switch (job.stage) {
    case 'queued':
      return 'Queued';
    case 'reading_sources':
      return 'Reading PDFs';
    case 'analyzing':
      return 'Analyzing with LLM';
    case 'saving':
      return 'Saving profile';
    case 'failed':
      return 'Failed';
    case 'succeeded':
      return 'Completed';
    default:
      return job.status === 'running' ? 'Running extraction' : job.status;
  }
}

function formatBytes(size?: number | null): string {
  if (size == null) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function ExtractionSourcesSection({ sources }: { sources: ProfileExtractionSource[] }) {
  if (!sources.length) return null;
  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/40">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Extraction sources
      </h3>
      <ul className="space-y-3">
        {sources.map((source) => (
          <li
            key={source.id}
            className="rounded-md border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-950/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {source.title || source.fileName || 'Untitled source'}
                </p>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {source.sourceType}
                  {source.fileSizeBytes != null ? ` · ${formatBytes(source.fileSizeBytes)}` : ''}
                  {source.textTruncated ? ' · excerpt truncated' : ''}
                </p>
                {source.url && (
                  <p className="mt-1 truncate text-xs text-blue-700 dark:text-blue-300">
                    {source.url}
                  </p>
                )}
              </div>
              {source.downloadUrl && (
                <a
                  href={source.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
                >
                  Download PDF
                </a>
              )}
            </div>
            {source.textExcerpt && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                  View extracted excerpt
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
                  {source.textExcerpt}
                </p>
              </details>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileFormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border-2 border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ExtractionProgressBanner({
  job,
  label,
}: {
  job: ProfileExtractionJob | undefined;
  label: string;
}) {
  const percent = extractionProgressPercent(job);

  return (
    <div className="mb-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          Extraction: <strong>{label}</strong>
        </p>
        <span className="text-xs font-semibold tabular-nums">{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-900/40"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Extraction progress"
      >
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {job?.sourceCount != null ? (
        <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
          Sources processed: {job.processedSourceCount ?? 0}/{job.sourceCount}
        </p>
      ) : null}
    </div>
  );
}

function statusBadge(status: BrandProfileStatus) {
  const styles: Record<BrandProfileStatus, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    extracting: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', styles[status])}>
      {status}
    </span>
  );
}

function ProfileEditor({
  profile,
  onSave,
  onDelete,
  onEnsureSaved,
  isSaving,
  isDeleting,
  isLocalDraft,
  extractionSourcesCount,
  onRerunExtraction,
  isRerunning,
  versions,
  versionsLoading,
  isActivatingVersion,
  onActivateVersion,
  outputTests,
  outputTestsLoading,
  onGenerateOutputTest,
}: {
  profile: BrandProfile;
  onSave: (body: ProfileFormSnapshot) => Promise<void>;
  onDelete: () => void;
  onEnsureSaved: (body: ProfileFormSnapshot) => Promise<string>;
  isSaving: boolean;
  isDeleting: boolean;
  isLocalDraft: boolean;
  extractionSourcesCount: number;
  onRerunExtraction: () => void;
  isRerunning: boolean;
  versions: BrandProfileVersion[];
  versionsLoading: boolean;
  isActivatingVersion: boolean;
  onActivateVersion: (versionId: string) => void;
  outputTests: BrandProfileOutputTest[];
  outputTestsLoading: boolean;
  onGenerateOutputTest: (
    profileId: string,
    body: GenerateProfileOutputTestInput
  ) => Promise<BrandProfileOutputTest>;
}) {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description ?? '');
  const [pillars, setPillars] = useState(profile.pillars);
  const [targetAudience, setTargetAudience] = useState(profile.targetAudience ?? '');
  const [toneMetrics, setToneMetrics] = useState<Record<string, number>>(
    Object.fromEntries(
      Object.entries(profile.toneMetrics).filter(([, v]) => typeof v === 'number') as [
        string,
        number,
      ][]
    )
  );
  const [bannedPhrases, setBannedPhrases] = useState(profile.bannedPhrases);
  const [status, setStatus] = useState<BrandProfileStatus>(profile.status);
  const [liveTestOpen, setLiveTestOpen] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setDescription(profile.description ?? '');
    setPillars(profile.pillars);
    setTargetAudience(profile.targetAudience ?? '');
    setToneMetrics(
      Object.fromEntries(
        Object.entries(profile.toneMetrics).filter(([, v]) => typeof v === 'number') as [
          string,
          number,
        ][]
      )
    );
    setBannedPhrases(profile.bannedPhrases);
    setStatus(profile.status);
  }, [profile]);

  const busy = isSaving || isDeleting || profile.status === 'extracting';

  const formSnapshot: ProfileFormSnapshot = {
    name: name.trim(),
    description: description.trim() || null,
    pillars,
    targetAudience: targetAudience.trim() || null,
    toneMetrics,
    bannedPhrases,
    status,
  };

  return (
    <>
      <form
        className="min-w-0 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave(formSnapshot);
        }}
      >
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {name || profile.name}
              </h2>
              {statusBadge(profile.status)}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setLiveTestOpen(true)}
              disabled={busy}
              className="inline-flex items-center gap-2"
            >
              <FlaskConical className="size-4" aria-hidden />
              Live Output Test
            </Button>
          </div>

          {!isLocalDraft ? (
            <ProfileVersionHistory
              versions={versions}
              isLoading={versionsLoading}
              isActivating={isActivatingVersion}
              isRerunning={isRerunning}
              canRerun={extractionSourcesCount > 0}
              onRerun={onRerunExtraction}
              onActivate={onActivateVersion}
            />
          ) : null}

          <ProfileFormSection title="Basic information">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </ProfileFormSection>

          <ProfileFormSection title="Brand pillars & audience">
            <StringListEditor
              label="Pillars"
              values={pillars}
              onChange={setPillars}
              placeholder="Add pillar"
              disabled={busy}
            />
            <div>
              <label className="mb-1 block text-sm font-medium">Target audience</label>
              <FormInput
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
          </ProfileFormSection>

          <ProfileFormSection title="Tone & voice">
            <ToneMetricsEditor values={toneMetrics} onChange={setToneMetrics} disabled={busy} />
            <StringListEditor
              label="Banned phrases"
              values={bannedPhrases}
              onChange={setBannedPhrases}
              placeholder="Add phrase"
              disabled={busy}
            />
          </ProfileFormSection>

          <ProfileFormSection title="Status & settings">
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as BrandProfileStatus)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </Select>
            </div>
          </ProfileFormSection>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-gray-200 pt-4 dark:border-gray-700">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onDelete}
              disabled={busy}
              className="border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30 dark:hover:text-red-200"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              {isSaving ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </fieldset>
      </form>

      <ProfileLiveOutputTestPanel
        open={liveTestOpen}
        onClose={() => setLiveTestOpen(false)}
        profileId={profile.id}
        profileName={name || profile.name}
        isLocalDraft={isLocalDraft}
        formSnapshot={formSnapshot}
        onEnsureSaved={onEnsureSaved}
        onGenerate={onGenerateOutputTest}
        history={outputTests}
        historyLoading={outputTestsLoading}
        disabled={busy}
      />
    </>
  );
}

export default function CoreProfileTab({ brandIdentity }: CoreProfileTabProps) {
  const { showToast, ToastContainer } = useToast();
  const { settings: reconSettings } = useReconFeed();
  const [extractionOpen, setExtractionOpen] = useState(false);
  const [extractionProgressOpen, setExtractionProgressOpen] = useState(false);
  const [localDraft, setLocalDraft] = useState<BrandProfile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    profiles,
    profileDetail,
    profileVersions,
    profileOutputTests,
    extractionJob,
    clearExtractionJob,
    selectedProfileId,
    setSelectedProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    startExtraction,
    rerunExtraction,
    activateVersion,
    generateOutputTest,
  } = brandIdentity;

  const serverProfiles = profiles.data?.data ?? [];
  const profileList = localDraft ? [localDraft, ...serverProfiles] : serverProfiles;
  const isLocalDraftSelected = selectedProfileId === LOCAL_DRAFT_PROFILE_ID;

  const selected =
    isLocalDraftSelected && localDraft
      ? localDraft
      : (profileDetail.data ?? serverProfiles.find((p) => p.id === selectedProfileId) ?? null);

  const extractionSources =
    !isLocalDraftSelected && profileDetail.data?.sources?.length ? profileDetail.data.sources : [];

  const extractionStatus = extractionJob.data?.status;
  const extractionError = extractionJob.data?.error;
  const extractionLabel = extractionStatusLabel(extractionJob.data);
  const hasLocalDraft = localDraft !== null;
  const isSaving = isLocalDraftSelected ? createProfile.isPending : updateProfile.isPending;

  const handleNewProfile = () => {
    const draft = createEmptyDraftProfile();
    setLocalDraft(draft);
    setSelectedProfileId(LOCAL_DRAFT_PROFILE_ID);
  };

  const handleDiscardLocalDraft = () => {
    setLocalDraft(null);
    setSelectedProfileId(serverProfiles[0]?.id ?? null);
  };

  const handleDeleteRequest = () => {
    if (isLocalDraftSelected) {
      handleDiscardLocalDraft();
      return;
    }
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selected || isLocalDraftSelected) return;
    setDeleteError(null);
    try {
      await deleteProfile.mutateAsync(selected.id);
      setIsDeleteModalOpen(false);
      showToast({ type: 'success', title: 'Profile deleted' });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleEnsureSaved = async (body: ProfileFormSnapshot): Promise<string> => {
    if (isLocalDraftSelected) {
      const created = await createProfile.mutateAsync(body);
      setLocalDraft(null);
      setSelectedProfileId(created.id);
      return created.id;
    }
    if (!selected) {
      throw new Error('Select a profile before generating a preview.');
    }
    await updateProfile.mutateAsync({ id: selected.id, body });
    return selected.id;
  };

  const extractionInProgress =
    Boolean(extractionStatus) &&
    extractionStatus !== 'succeeded' &&
    extractionStatus !== 'succeeded_with_warnings' &&
    extractionStatus !== 'failed';

  useEffect(() => {
    if (extractionInProgress) {
      setExtractionProgressOpen(true);
    }
  }, [extractionInProgress]);

  return (
    <TwoColumnLayout>
      <SidebarCard className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Profiles</h2>

        <div className="space-y-2">
          <Button
            type="button"
            size="sm"
            disabled={hasLocalDraft}
            onClick={handleNewProfile}
            className="flex w-full items-center justify-center gap-2"
          >
            <Plus className="size-4" aria-hidden />
            New Profile
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="flex w-full items-center justify-center gap-2 border-dashed"
            onClick={() => setExtractionOpen(true)}
          >
            <Sparkles className="size-4" aria-hidden />
            Extract from sources
          </Button>
        </div>

        <ul className="space-y-1">
          {profileList.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedProfileId(p.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm',
                  selectedProfileId === p.id
                    ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                )}
              >
                <span className="truncate">{p.name}</span>
                {statusBadge(p.status)}
              </button>
            </li>
          ))}
        </ul>
        {!profileList.length && (
          <p className="text-sm text-gray-500">No profiles yet. Create one or run extraction.</p>
        )}
      </SidebarCard>

      <PageCard>
        {extractionInProgress ? (
          <ExtractionProgressBanner job={extractionJob.data} label={extractionLabel} />
        ) : null}
        {extractionStatus === 'failed' && extractionError && (
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40">
            <p>Extraction failed: {extractionError}</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => clearExtractionJob()}
              className="shrink-0"
            >
              Dismiss
            </Button>
          </div>
        )}

        {selected ? (
          <>
            <ProfileEditor
              profile={selected}
              isLocalDraft={isLocalDraftSelected}
              isSaving={isSaving}
              isDeleting={deleteProfile.isPending}
              extractionSourcesCount={extractionSources.length}
              versions={profileVersions.data?.data ?? []}
              versionsLoading={profileVersions.isLoading}
              outputTests={profileOutputTests.data?.data ?? []}
              outputTestsLoading={profileOutputTests.isLoading}
              isRerunning={rerunExtraction.isPending}
              isActivatingVersion={activateVersion.isPending}
              onRerunExtraction={() => {
                if (!selected || isLocalDraftSelected) return;
                void rerunExtraction
                  .mutateAsync({ profileId: selected.id })
                  .then(() => {
                    setExtractionProgressOpen(true);
                    showToast({ type: 'success', title: 'Extraction rerun started' });
                  })
                  .catch((err) => {
                    showToast({
                      type: 'error',
                      title: err instanceof Error ? err.message : 'Rerun failed',
                    });
                  });
              }}
              onActivateVersion={(versionId) => {
                if (!selected || isLocalDraftSelected) return;
                void activateVersion
                  .mutateAsync({ profileId: selected.id, versionId })
                  .then(() => {
                    showToast({ type: 'success', title: 'Version activated' });
                  })
                  .catch((err) => {
                    showToast({
                      type: 'error',
                      title: err instanceof Error ? err.message : 'Activate failed',
                    });
                  });
              }}
              onEnsureSaved={handleEnsureSaved}
              onGenerateOutputTest={(profileId, body) =>
                generateOutputTest.mutateAsync({ profileId, body })
              }
              onSave={async (body) => {
                try {
                  if (isLocalDraftSelected) {
                    const created = await createProfile.mutateAsync(body);
                    setLocalDraft(null);
                    setSelectedProfileId(created.id);
                    showToast({ type: 'success', title: 'Profile created' });
                  } else {
                    await updateProfile.mutateAsync({ id: selected.id, body });
                    showToast({ type: 'success', title: 'Profile saved' });
                  }
                } catch (err) {
                  showToast({
                    type: 'error',
                    title: err instanceof Error ? err.message : 'Save failed',
                  });
                }
              }}
              onDelete={handleDeleteRequest}
            />
            <ExtractionSourcesSection sources={extractionSources} />
          </>
        ) : (
          <p className="text-sm text-gray-500">Select a profile to edit.</p>
        )}
      </PageCard>

      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleteProfile.isPending) {
            setIsDeleteModalOpen(false);
            setDeleteError(null);
          }
        }}
        title="Delete profile?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete{' '}
            <span className="font-medium text-gray-900 dark:text-white">{selected?.name}</span>?
            This action cannot be undone.
          </p>
          {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteError(null);
              }}
              disabled={deleteProfile.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleConfirmDelete()}
              disabled={deleteProfile.isPending}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              {deleteProfile.isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <ProfileExtractionDialog
        isOpen={extractionOpen}
        onClose={() => setExtractionOpen(false)}
        isSubmitting={startExtraction.isPending}
        hasRapidApiKey={reconSettings.data?.hasRapidApiKey ?? false}
        onSubmit={async (body) => {
          await startExtraction.mutateAsync(body);
          setExtractionOpen(false);
          setExtractionProgressOpen(true);
          showToast({ type: 'success', title: 'Extraction started' });
        }}
      />

      <ProfileExtractionProgressModal
        isOpen={
          extractionProgressOpen &&
          (extractionInProgress ||
            extractionStatus === 'succeeded' ||
            extractionStatus === 'succeeded_with_warnings' ||
            extractionStatus === 'failed')
        }
        job={extractionJob.data}
        onClose={() => {
          setExtractionProgressOpen(false);
          clearExtractionJob();
        }}
      />
      <ToastContainer />
    </TwoColumnLayout>
  );
}
