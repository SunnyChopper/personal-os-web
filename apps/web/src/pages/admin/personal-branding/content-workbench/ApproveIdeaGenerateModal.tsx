import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { formFieldClassName } from '@/components/atoms/FormInput';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import BrandPillarMultiSelect from '@/components/molecules/personal-branding/BrandPillarMultiSelect';
import type { BrandPlatform, BrandProfile, ContentIdea } from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import {
  collectActiveBrandPillars,
  isBrandProfileReadyForIdeation,
} from './content-workbench-helpers';

export interface ApproveIdeaGenerateRequest {
  ideaId: string;
  brandProfileId: string;
  templateId?: string;
  platform?: BrandPlatform;
  pillars?: string[];
}

interface ApproveIdeaGenerateModalProps {
  idea: ContentIdea | null;
  defaultBrandProfileId: string | null;
  profiles: BrandProfile[];
  profilesLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (request: ApproveIdeaGenerateRequest) => void;
}

function composeIdeaBriefPreview(idea: ContentIdea): string {
  const parts: string[] = [];
  if (idea.title.trim()) parts.push(`Title: ${idea.title.trim()}`);
  if (idea.summary?.trim()) parts.push(`Brief: ${idea.summary.trim()}`);
  if (idea.angle?.trim()) parts.push(`Angle / hook: ${idea.angle.trim()}`);
  return parts.join('\n\n');
}

export default function ApproveIdeaGenerateModal({
  idea,
  defaultBrandProfileId,
  profiles,
  profilesLoading,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: ApproveIdeaGenerateModalProps) {
  const [brandProfileId, setBrandProfileId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [platform, setPlatform] = useState<BrandPlatform>('linkedin');
  const [pillars, setPillars] = useState<string[]>([]);

  const readyProfiles = useMemo(() => profiles.filter(isBrandProfileReadyForIdeation), [profiles]);
  const brandPillarOptions = useMemo(() => collectActiveBrandPillars(profiles), [profiles]);

  const templatesQ = useQuery({
    queryKey: queryKeys.personalBranding.contentTemplates.list(1, 100),
    queryFn: () => personalBrandingService.listContentTemplates(1, 100),
    enabled: Boolean(idea),
  });

  const templates = useMemo(() => {
    const all = templatesQ.data?.data ?? [];
    if (!idea) return all;
    return all.filter(
      (template) => !template.contentType || template.contentType === idea.contentType
    );
  }, [templatesQ.data?.data, idea]);

  useEffect(() => {
    if (!idea) return;
    setTemplateId('');
    setPillars([]);
    setPlatform(idea.targetPlatform ?? 'linkedin');
    const fallback =
      (defaultBrandProfileId &&
        readyProfiles.some((profile) => profile.id === defaultBrandProfileId) &&
        defaultBrandProfileId) ||
      readyProfiles[0]?.id ||
      '';
    setBrandProfileId(fallback);
  }, [idea, defaultBrandProfileId, readyProfiles]);

  const briefPreview = idea ? composeIdeaBriefPreview(idea) : '';

  const canSubmit =
    Boolean(idea) && Boolean(brandProfileId) && readyProfiles.length > 0 && !isSubmitting;

  return (
    <Dialog
      isOpen={Boolean(idea)}
      onClose={isSubmitting ? () => {} : onClose}
      title="Generate draft from idea"
      size="lg"
    >
      {idea ? (
        <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {CONTENT_TYPE_LABELS[idea.contentType]}
            </p>
            <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{idea.title}</h3>
            {idea.summary ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{idea.summary}</p>
            ) : null}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            The idea brief below is sent to the AI as a writing assignment — the generated draft
            will be ready-to-edit copy, not the brief itself.
          </p>

          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Writing brief (read-only)
            <Textarea
              readOnly
              value={briefPreview}
              rows={5}
              className={`${formFieldClassName} mt-1 resize-y bg-gray-50 dark:bg-gray-900/50`}
            />
          </label>

          {profilesLoading ? (
            <p className="text-sm text-gray-500">Loading brand profiles…</p>
          ) : readyProfiles.length === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Add pillars and a target audience to a Brand Identity profile before generating
              drafts.
            </p>
          ) : (
            <>
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Brand profile
                <Select
                  value={brandProfileId}
                  onChange={(e) => setBrandProfileId(e.target.value)}
                  className={`${formFieldClassName} mt-1`}
                >
                  {readyProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Target platform
                <Select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as BrandPlatform)}
                  className={`${formFieldClassName} mt-1`}
                >
                  {(Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[]).map((p) => (
                    <option key={p} value={p}>
                      {BRAND_PLATFORM_LABELS[p]}
                    </option>
                  ))}
                </Select>
              </label>

              {brandPillarOptions.length > 0 ? (
                <div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Brand pillars <span className="font-normal text-gray-500">(optional)</span>
                  </div>
                  <BrandPillarMultiSelect
                    options={brandPillarOptions}
                    value={pillars}
                    onChange={setPillars}
                    className="mt-1"
                  />
                </div>
              ) : null}

              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Content template <span className="font-normal text-gray-500">(optional)</span>
                <Select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={`${formFieldClassName} mt-1`}
                >
                  <option value="">None</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </Select>
              </label>
            </>
          )}

          {errorMessage ? (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
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
            <Button
              type="button"
              size="sm"
              disabled={!canSubmit}
              onClick={() => {
                if (!idea || !brandProfileId) return;
                onSubmit({
                  ideaId: idea.id,
                  brandProfileId,
                  templateId: templateId || undefined,
                  platform,
                  pillars: pillars.length > 0 ? pillars : undefined,
                });
              }}
              className="inline-flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Generating…' : 'Generate draft & open in Sandbox'}
            </Button>
          </div>
        </fieldset>
      ) : null}
    </Dialog>
  );
}
