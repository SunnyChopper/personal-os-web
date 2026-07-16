import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { selectableChipClassName } from '../personal-branding-ui';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { formFieldClassName } from '@/components/atoms/FormInput';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type { BrandPlatform, ContentType } from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';

type WizardStep = 'contentType' | 'approach' | 'templateDetail' | 'aiDetail';

export interface NewDraftTemplateResult {
  contentType: ContentType;
  title: string;
  platform?: BrandPlatform | null;
}

export interface NewDraftAiRequest {
  contentType: ContentType;
  platform: BrandPlatform;
  brandProfileId: string;
  topic: string;
  templateId?: string;
}

interface NewDraftWizardModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onStartFromTemplate: (result: NewDraftTemplateResult) => void;
  onGenerateWithAi: (request: NewDraftAiRequest) => void;
}

const CONTENT_TYPES = Object.keys(CONTENT_TYPE_LABELS) as ContentType[];
const PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

export default function NewDraftWizardModal({
  isOpen,
  isGenerating,
  onClose,
  onStartFromTemplate,
  onGenerateWithAi,
}: NewDraftWizardModalProps) {
  const [step, setStep] = useState<WizardStep>('contentType');
  const [contentType, setContentType] = useState<ContentType>('DEEP_DIVE_BLOG');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<BrandPlatform | ''>('');
  const [brandProfileId, setBrandProfileId] = useState('');
  const [topic, setTopic] = useState('');
  const [templateId, setTemplateId] = useState('');

  const profilesQ = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(1, 50),
    queryFn: async () => {
      const res = await personalBrandingService.listProfiles(1, 50);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load profiles');
      }
      return res.data.data;
    },
    enabled: isOpen,
  });

  const profiles = profilesQ.data ?? [];

  const templatesQ = useQuery({
    queryKey: queryKeys.personalBranding.contentTemplates.list(1, 100),
    queryFn: () => personalBrandingService.listContentTemplates(1, 100),
    enabled: isOpen,
  });

  const templates = templatesQ.data?.data ?? [];

  useEffect(() => {
    if (!isOpen) return;
    setStep('contentType');
    setContentType('DEEP_DIVE_BLOG');
    setTitle('');
    setPlatform('');
    setBrandProfileId('');
    setTopic('');
    setTemplateId('');
  }, [isOpen]);

  useEffect(() => {
    if (!brandProfileId && profiles.length > 0) {
      setBrandProfileId(profiles[0].id);
    }
  }, [brandProfileId, profiles]);

  const stepTitle = useMemo(() => {
    switch (step) {
      case 'contentType':
        return 'New draft — content type';
      case 'approach':
        return 'New draft — how to start';
      case 'templateDetail':
        return 'New draft — template';
      case 'aiDetail':
        return 'New draft — generate with AI';
      default:
        return 'New draft';
    }
  }, [step]);

  const canGoBack = step !== 'contentType' && !isGenerating;

  const handleBack = () => {
    if (step === 'approach') setStep('contentType');
    else if (step === 'templateDetail' || step === 'aiDetail') setStep('approach');
  };

  return (
    <Dialog isOpen={isOpen} onClose={isGenerating ? () => {} : onClose} title={stepTitle} size="lg">
      {step === 'contentType' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose the format for this draft.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setContentType(type)}
                className={cn(selectableChipClassName(contentType === type), 'px-4 py-3 text-left')}
              >
                <div className="font-medium">{CONTENT_TYPE_LABELS[type]}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button type="button" size="sm" onClick={() => setStep('approach')}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'approach' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start from a layout template or let AI draft platform-aware copy.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep('templateDetail')}
              className="rounded-lg border border-gray-200 px-4 py-4 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="font-medium text-gray-900 dark:text-white">Start from template</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Seed the editor with a {CONTENT_TYPE_LABELS[contentType]} outline.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setStep('aiDetail')}
              className="rounded-lg border border-blue-300 px-4 py-4 text-left hover:bg-blue-50/50 dark:border-blue-700 dark:hover:bg-blue-950/30"
            >
              <div className="font-medium text-blue-900 dark:text-blue-100">Generate with AI</div>
              <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-300/80">
                Uses your brand profile and target platform rules.
              </p>
            </button>
          </div>
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleBack}
              disabled={!canGoBack}
            >
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'templateDetail' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Optional title — you can rename later. The editor will open with a{' '}
            {CONTENT_TYPE_LABELS[contentType]} template.
          </p>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Draft title (optional)
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Draft title"
              className={`${formFieldClassName} mt-1`}
            />
          </label>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Target platform <span className="font-normal text-gray-500">(optional)</span>
            <Select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as BrandPlatform | '')}
              className={`${formFieldClassName} mt-1`}
            >
              <option value="">No specific platform</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {BRAND_PLATFORM_LABELS[p]}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex justify-between pt-2">
            <Button type="button" size="sm" variant="secondary" onClick={handleBack}>
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onStartFromTemplate({
                  contentType,
                  title: title.trim(),
                  platform: platform || null,
                });
                onClose();
              }}
            >
              Open editor
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'aiDetail' ? (
        <fieldset disabled={isGenerating} className="space-y-4 disabled:opacity-60">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add raw thoughts to have AI draft this in your brand voice, or leave it blank to start
            from a template.
          </p>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Raw thoughts (optional)
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              placeholder="Jot down rough ideas, bullet points, or a brief — leave blank to start from a template."
              className={`${formFieldClassName} mt-1 resize-y`}
            />
          </label>
          {topic.trim().length > 0 ? (
            profilesQ.isPending ? (
              <p className="text-sm text-gray-500">Loading brand profiles…</p>
            ) : profiles.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Create a Brand Identity profile before using AI generation.
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
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                  Target platform
                  <Select
                    value={platform || 'linkedin'}
                    onChange={(e) => setPlatform(e.target.value as BrandPlatform)}
                    className={`${formFieldClassName} mt-1`}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {BRAND_PLATFORM_LABELS[p]}
                      </option>
                    ))}
                  </Select>
                </label>
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
            )
          ) : null}
          <div className="flex justify-between pt-2">
            <Button type="button" size="sm" variant="secondary" onClick={handleBack}>
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                isGenerating ||
                (topic.trim().length > 0 && (profiles.length === 0 || !brandProfileId))
              }
              onClick={() => {
                const trimmedTopic = topic.trim();
                if (trimmedTopic) {
                  onGenerateWithAi({
                    contentType,
                    platform: (platform || 'linkedin') as BrandPlatform,
                    brandProfileId,
                    topic: trimmedTopic,
                    templateId: templateId || undefined,
                  });
                  return;
                }
                onStartFromTemplate({
                  contentType,
                  title: '',
                  platform: platform || null,
                });
                onClose();
              }}
              className="inline-flex items-center gap-2"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : null}
              {isGenerating ? 'Generating…' : topic.trim() ? 'Generate draft' : 'Create draft'}
            </Button>
          </div>
        </fieldset>
      ) : null}
    </Dialog>
  );
}
