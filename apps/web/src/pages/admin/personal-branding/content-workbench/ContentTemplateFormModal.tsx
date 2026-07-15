import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { FormInput } from '@/components/atoms/FormInput';
import { FormField } from '@/components/molecules/FormField';
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
        <FormField label="Title" htmlFor="content-template-title" required>
          <FormInput
            id="content-template-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
            placeholder="e.g. Problem → Insight → CTA blog"
            required
          />
        </FormField>

        <FormField label="Description" htmlFor="content-template-description">
          <Textarea
            id="content-template-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-y"
            placeholder="When to use this template"
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Content type" htmlFor="content-template-content-type">
            <Select
              id="content-template-content-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType | '')}
              className="w-full"
            >
              <option value="">Any</option>
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CONTENT_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Platform" htmlFor="content-template-platform">
            <Select
              id="content-template-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as BrandPlatform | '')}
              className="w-full"
            >
              <option value="">Any</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {BRAND_PLATFORM_LABELS[p]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Template body" htmlFor="content-template-body" required>
          <Textarea
            id="content-template-body"
            value={templateBody}
            onChange={(e) => setTemplateBody(e.target.value)}
            rows={10}
            className="w-full resize-y font-mono text-xs"
            placeholder={'# [Title]\n\n## [Hook]\n...\n\n## [CTA]'}
            required
          />
        </FormField>

        <FormField label="Tags" htmlFor="content-template-tags" hint="Separated by commas">
          <FormInput
            id="content-template-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full"
            placeholder="comma-separated"
          />
        </FormField>

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
