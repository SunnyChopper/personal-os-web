import { useEffect, useMemo, useRef, useState } from 'react';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { Select } from '@/components/atoms/Select';
import { formFieldClassName } from '@/components/atoms/FormInput';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  BrandPlatform,
  BrandProfile,
  ContentIdeationJob,
  RadarItem,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';
import ContentIdeationProgressPanel from '@/components/molecules/personal-branding/ContentIdeationProgressPanel';
import {
  contentIdeationCtaProgressOnly,
  contentIdeationProgressPanelJob,
} from '@/lib/personal-branding/content-ideation-progress';
import {
  clampIdeaCountForPlatform,
  isBrandProfileReadyForIdeation,
  trendStreamIdeaCountOptionsForPlatform,
} from '@/pages/admin/personal-branding/content-workbench/content-workbench-helpers';
import { profileSupportsPlatform } from '@/lib/personal-branding/pipeline-profile-selection';

export interface TrendStreamBrainstormRequest {
  brandProfileIds: string[];
  targetPlatform: BrandPlatform;
  templateIds?: string[];
  count?: number;
  imageIdeaCount?: number;
}

interface TrendStreamBrainstormModalProps {
  open: boolean;
  selectedItems: RadarItem[];
  profiles: BrandProfile[];
  profilesLoading: boolean;
  defaultBrandProfileId: string | null;
  targetPlatform: BrandPlatform;
  onTargetPlatformChange: (platform: BrandPlatform) => void;
  isSubmitting: boolean;
  ideationJobs?: ContentIdeationJob[];
  clientCancelState?: 'idle' | 'cancelled';
  errorMessage: string | null;
  onClose: () => void;
  onCancelJob?: () => void;
  onSubmit: (request: TrendStreamBrainstormRequest) => void;
}

const ALL_PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

export default function TrendStreamBrainstormModal({
  open,
  selectedItems,
  profiles,
  profilesLoading,
  defaultBrandProfileId,
  targetPlatform,
  onTargetPlatformChange,
  isSubmitting,
  ideationJobs = [],
  clientCancelState = 'idle',
  errorMessage,
  onClose,
  onCancelJob,
  onSubmit,
}: TrendStreamBrainstormModalProps) {
  const [brandProfileIds, setBrandProfileIds] = useState<string[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [ideaCount, setIdeaCount] = useState(6);
  const [imageIdeaCount, setImageIdeaCount] = useState(0);
  const previousTargetPlatformRef = useRef(targetPlatform);

  const isOpen = open && selectedItems.length > 0;
  const representativeJob =
    ideationJobs.find(
      (job) => job.status === 'queued' || job.status === 'running' || job.status === 'cancelling'
    ) ?? ideationJobs[ideationJobs.length - 1];
  const completedJobCount = ideationJobs.filter(
    (job) => job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled'
  ).length;

  useTerminalJobFailureAlert({
    feature: 'radarIdeation',
    jobId: representativeJob?.jobId,
    status: representativeJob?.status,
    error: representativeJob?.error,
    message: representativeJob?.message,
    stage: representativeJob?.stage,
  });

  const readyProfiles = useMemo(() => profiles.filter(isBrandProfileReadyForIdeation), [profiles]);
  const platformProfiles = useMemo(
    () => readyProfiles.filter((profile) => profileSupportsPlatform(profile, targetPlatform)),
    [readyProfiles, targetPlatform]
  );

  const templatesQ = useQuery({
    queryKey: queryKeys.personalBranding.contentTemplates.list(1, 100),
    queryFn: () => personalBrandingService.listContentTemplates(1, 100),
    enabled: isOpen,
  });

  const templates = templatesQ.data?.data ?? [];

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTemplateIds([]);
    setIdeaCount(6);
    setImageIdeaCount(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const platformChanged = previousTargetPlatformRef.current !== targetPlatform;
    if (platformChanged || brandProfileIds.length === 0) {
      const defaults =
        platformProfiles.length > 0
          ? platformProfiles.map((profile) => profile.id)
          : (defaultBrandProfileId &&
              readyProfiles.some((profile) => profile.id === defaultBrandProfileId) && [
                defaultBrandProfileId,
              ]) ||
            (readyProfiles[0]?.id ? [readyProfiles[0].id] : []);
      setBrandProfileIds(defaults);
    }
    previousTargetPlatformRef.current = targetPlatform;
  }, [
    brandProfileIds.length,
    defaultBrandProfileId,
    isOpen,
    platformProfiles,
    readyProfiles,
    targetPlatform,
  ]);

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplateIds((current) => {
      if (current.includes(templateId)) {
        return current.filter((id) => id !== templateId);
      }
      if (current.length >= 5) return current;
      return [...current, templateId];
    });
  };

  const ideaCountOptions = useMemo(
    () => trendStreamIdeaCountOptionsForPlatform(targetPlatform),
    [targetPlatform]
  );

  const handleTargetPlatformChange = (next: BrandPlatform) => {
    onTargetPlatformChange(next);
    setIdeaCount((current) => clampIdeaCountForPlatform(next, current));
    setImageIdeaCount((current) => Math.min(current, clampIdeaCountForPlatform(next, ideaCount)));
  };

  const imageIdeaCountOptions = useMemo(
    () => Array.from({ length: ideaCount + 1 }, (_, index) => index),
    [ideaCount]
  );
  const canSubmit =
    isOpen && brandProfileIds.length > 0 && readyProfiles.length > 0 && !isSubmitting;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Brainstorm content ideas"
      size="lg"
    >
      {isOpen ? (
        <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedItems.length} Trend Stream card{selectedItems.length === 1 ? '' : 's'}{' '}
              selected
            </p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm text-gray-600 dark:text-gray-400">
              {selectedItems.map((item) => (
                <li key={item.id} className="truncate">
                  {item.title}
                </li>
              ))}
            </ul>
          </div>

          {profilesLoading ? (
            <p className="text-sm text-gray-500">Loading brand profiles…</p>
          ) : readyProfiles.length === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Add pillars and a target audience to a Brand Identity profile before brainstorming.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Brand profiles
                <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
                  (matching profiles are selected)
                </span>
              </p>
              <ul className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                {readyProfiles.map((profile) => (
                  <li key={profile.id}>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <FormCheckbox
                        checked={brandProfileIds.includes(profile.id)}
                        onChange={() =>
                          setBrandProfileIds((current) =>
                            current.includes(profile.id)
                              ? current.filter((id) => id !== profile.id)
                              : [...current, profile.id]
                          )
                        }
                      />
                      <span>{profile.name}</span>
                    </label>
                  </li>
                ))}
              </ul>

              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Target platform
                <Select
                  value={targetPlatform}
                  onChange={(e) => handleTargetPlatformChange(e.target.value as BrandPlatform)}
                  className={`${formFieldClassName} mt-1`}
                >
                  {ALL_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {BRAND_PLATFORM_LABELS[platform]}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Idea count
                <Select
                  value={String(ideaCount)}
                  onChange={(e) => {
                    const nextCount = Number(e.target.value);
                    setIdeaCount(nextCount);
                    setImageIdeaCount((current) => Math.min(current, nextCount));
                  }}
                  className={`${formFieldClassName} mt-1`}
                >
                  {ideaCountOptions.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Image-compatible ideas
                <Select
                  value={String(imageIdeaCount)}
                  onChange={(e) => setImageIdeaCount(Number(e.target.value))}
                  className={`${formFieldClassName} mt-1`}
                >
                  {imageIdeaCountOptions.map((count) => (
                    <option key={count} value={count}>
                      {count === 0
                        ? 'None (text-only)'
                        : count === ideaCount
                          ? `All ${count} ideas`
                          : `${count} idea${count === 1 ? '' : 's'}`}
                    </option>
                  ))}
                </Select>
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                  A subset of ideas can trigger image injection after approval.
                </span>
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content templates{' '}
                  <span className="font-normal text-gray-500">(optional, up to 5)</span>
                </p>
                {templatesQ.isPending ? (
                  <p className="text-sm text-gray-500">Loading templates…</p>
                ) : templates.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved templates yet.</p>
                ) : (
                  <ul className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    {templates.map((template) => (
                      <li key={template.id}>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FormCheckbox
                            checked={selectedTemplateIds.includes(template.id)}
                            onChange={() => toggleTemplate(template.id)}
                            disabled={
                              !selectedTemplateIds.includes(template.id) &&
                              selectedTemplateIds.length >= 5
                            }
                          />
                          <span>{template.title}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {errorMessage ? (
            <p className="whitespace-pre-line text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {contentIdeationCtaProgressOnly(representativeJob, isSubmitting) ? (
              <div className="min-w-[min(100%,14rem)] flex-1 sm:flex-initial">
                <ContentIdeationProgressPanel
                  job={contentIdeationProgressPanelJob(representativeJob, isSubmitting)}
                  onCancel={onCancelJob}
                />
                {ideationJobs.length > 1 ? (
                  <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                    {completedJobCount} of {ideationJobs.length} profile brainstorms complete
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                {representativeJob?.status === 'failed' ? (
                  <div className="min-w-[min(100%,14rem)] flex-1 sm:flex-initial">
                    <ContentIdeationProgressPanel job={representativeJob} />
                  </div>
                ) : null}
                {clientCancelState === 'cancelled' ? (
                  <div className="min-w-[min(100%,14rem)] flex-1 sm:flex-initial">
                    <ContentIdeationProgressPanel clientCancelled />
                  </div>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={!canSubmit}
                  onClick={() => {
                    if (brandProfileIds.length === 0) return;
                    onSubmit({
                      brandProfileIds,
                      targetPlatform,
                      templateIds: selectedTemplateIds.length > 0 ? selectedTemplateIds : undefined,
                      count: ideaCount,
                      imageIdeaCount,
                    });
                  }}
                  className="inline-flex items-center gap-2"
                >
                  Generate ideas
                </Button>
              </>
            )}
          </div>
        </fieldset>
      ) : null}
    </Dialog>
  );
}
