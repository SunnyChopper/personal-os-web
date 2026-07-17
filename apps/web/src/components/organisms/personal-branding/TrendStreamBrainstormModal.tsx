import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { Select } from '@/components/atoms/Select';
import { formFieldClassName } from '@/components/atoms/FormInput';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type { BrandPlatform, BrandProfile, RadarItem } from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';
import { isBrandProfileReadyForIdeation } from '@/pages/admin/personal-branding/content-workbench/content-workbench-helpers';

export interface TrendStreamBrainstormRequest {
  brandProfileId: string;
  targetPlatform: BrandPlatform;
  templateIds?: string[];
  count?: number;
}

interface TrendStreamBrainstormModalProps {
  open: boolean;
  selectedItems: RadarItem[];
  profiles: BrandProfile[];
  profilesLoading: boolean;
  defaultBrandProfileId: string | null;
  isSubmitting: boolean;
  progressMessage?: string | null;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (request: TrendStreamBrainstormRequest) => void;
}

const ALL_PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

export default function TrendStreamBrainstormModal({
  open,
  selectedItems,
  profiles,
  profilesLoading,
  defaultBrandProfileId,
  isSubmitting,
  progressMessage,
  errorMessage,
  onClose,
  onSubmit,
}: TrendStreamBrainstormModalProps) {
  const [brandProfileId, setBrandProfileId] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<BrandPlatform>('linkedin');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [ideaCount, setIdeaCount] = useState(6);

  const isOpen = open && selectedItems.length > 0;

  const readyProfiles = useMemo(() => profiles.filter(isBrandProfileReadyForIdeation), [profiles]);

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
    setTargetPlatform('linkedin');
    const fallback =
      (defaultBrandProfileId &&
        readyProfiles.some((profile) => profile.id === defaultBrandProfileId) &&
        defaultBrandProfileId) ||
      readyProfiles[0]?.id ||
      '';
    setBrandProfileId(fallback);
  }, [isOpen, defaultBrandProfileId, readyProfiles]);

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplateIds((current) => {
      if (current.includes(templateId)) {
        return current.filter((id) => id !== templateId);
      }
      if (current.length >= 5) return current;
      return [...current, templateId];
    });
  };

  const canSubmit = isOpen && Boolean(brandProfileId) && readyProfiles.length > 0 && !isSubmitting;

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
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value as BrandPlatform)}
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
                  onChange={(e) => setIdeaCount(Number(e.target.value))}
                  className={`${formFieldClassName} mt-1`}
                >
                  {[3, 4, 5, 6, 8, 10, 12].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </Select>
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

          {isSubmitting && progressMessage ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">{progressMessage}</p>
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
                if (!brandProfileId) return;
                onSubmit({
                  brandProfileId,
                  targetPlatform,
                  templateIds: selectedTemplateIds.length > 0 ? selectedTemplateIds : undefined,
                  count: ideaCount,
                });
              }}
              className="inline-flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Brainstorming…' : 'Generate ideas'}
            </Button>
          </div>
        </fieldset>
      ) : null}
    </Dialog>
  );
}
