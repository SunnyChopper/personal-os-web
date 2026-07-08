import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { formFieldClassName } from '@/components/atoms/FormInput';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import type {
  BrandPlatform,
  ContentTemplate,
  ContentType,
  CreateContentTemplateInput,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';

interface ContentTemplateFormModalProps {
  isOpen: boolean;
  template?: ContentTemplate | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (body: CreateContentTemplateInput) => void;
}

const CONTENT_TYPES = Object.keys(CONTENT_TYPE_LABELS) as ContentType[];
const PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

export default function ContentTemplateFormModal({
  isOpen,
  template,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ContentTemplateFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<ContentType | ''>('');
  const [platform, setPlatform] = useState<BrandPlatform | ''>('');
  const [templateBody, setTemplateBody] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTitle(template?.title ?? '');
    setDescription(template?.description ?? '');
    setContentType(template?.contentType ?? '');
    setPlatform(template?.platform ?? '');
    setTemplateBody(template?.templateBody ?? '');
    setTags((template?.tags ?? []).join(', '));
  }, [isOpen, template]);

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    const trimmedBody = templateBody.trim();
    if (!trimmedTitle || !trimmedBody) return;
    onSubmit({
      title: trimmedTitle,
      description: description.trim() || null,
      contentType: contentType || null,
      platform: platform || null,
      templateBody: trimmedBody,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={template ? 'Edit content template' : 'New content template'}
      size="lg"
    >
      <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${formFieldClassName} mt-1`}
            placeholder="e.g. Problem → Insight → CTA blog"
          />
        </label>
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Description
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={`${formFieldClassName} mt-1 resize-y`}
            placeholder="When to use this template"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Content type
            <Select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType | '')}
              className={`${formFieldClassName} mt-1`}
            >
              <option value="">Any</option>
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CONTENT_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Platform
            <Select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as BrandPlatform | '')}
              className={`${formFieldClassName} mt-1`}
            >
              <option value="">Any</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {BRAND_PLATFORM_LABELS[p]}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Template body
          <Textarea
            value={templateBody}
            onChange={(e) => setTemplateBody(e.target.value)}
            rows={10}
            className={`${formFieldClassName} mt-1 resize-y font-mono text-xs`}
            placeholder={'# [Title]\n\n## [Hook]\n...\n\n## [CTA]'}
          />
        </label>
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          Tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={`${formFieldClassName} mt-1`}
            placeholder="comma-separated"
          />
        </label>
        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!title.trim() || !templateBody.trim() || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Saving…' : template ? 'Save changes' : 'Create template'}
          </Button>
        </DialogFooter>
      </fieldset>
    </Dialog>
  );
}
