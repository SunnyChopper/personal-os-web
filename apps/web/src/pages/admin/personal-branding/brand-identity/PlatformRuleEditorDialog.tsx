import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import { FormInput } from '@/components/atoms/FormInput';
import StringListEditor, { FormTextarea } from './BrandIdentityFormFields';
import ProfileMultiSelect from './ProfileMultiSelect';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type BrandProfile,
  type CreatePlatformRuleInput,
  type PlatformRuleRecord,
  type UpdatePlatformRuleInput,
} from '@/types/api/personal-branding.dto';
import { BrandPlatformIcon } from '@/components/atoms/BrandPlatformIcon';
import IconSelect from '@/components/molecules/IconSelect';

const PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

const PLATFORM_OPTIONS = PLATFORMS.map((platform) => ({
  value: platform,
  label: BRAND_PLATFORM_LABELS[platform],
  icon: <BrandPlatformIcon platform={platform} className="h-4 w-4" />,
}));

interface PlatformRuleEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: BrandProfile[];
  initial?: PlatformRuleRecord | null;
  onCreate: (body: CreatePlatformRuleInput) => Promise<void>;
  onUpdate: (id: string, body: UpdatePlatformRuleInput) => Promise<void>;
  isSubmitting?: boolean;
}

export default function PlatformRuleEditorDialog({
  isOpen,
  onClose,
  profiles,
  initial,
  onCreate,
  onUpdate,
  isSubmitting = false,
}: PlatformRuleEditorDialogProps) {
  const [platform, setPlatform] = useState<BrandPlatform>('linkedin');
  const [name, setName] = useState('');
  const [characterLimit, setCharacterLimit] = useState('');
  const [formatStyle, setFormatStyle] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [profileIds, setProfileIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setPlatform(initial.platform);
      setName(initial.name ?? '');
      setCharacterLimit(initial.characterLimit != null ? String(initial.characterLimit) : '');
      setFormatStyle(initial.formatStyle ?? '');
      setTemplateBody(initial.templateBody ?? '');
      setTags(initial.tags ?? []);
      setProfileIds(initial.profileIds ?? []);
    } else {
      setPlatform('linkedin');
      setName('');
      setCharacterLimit('');
      setFormatStyle('');
      setTemplateBody('');
      setTags([]);
      setProfileIds([]);
    }
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = characterLimit.trim() ? Number(characterLimit) : null;
    const body = {
      platform,
      name: name.trim() || null,
      characterLimit: limit,
      formatStyle: formatStyle.trim() || null,
      templateBody: templateBody.trim() || null,
      tags,
      profileIds,
    };
    if (initial) {
      await onUpdate(initial.id, body);
    } else {
      await onCreate(body);
    }
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Edit platform rule' : 'New platform rule'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Platform</label>
            <IconSelect
              value={platform}
              onChange={(next) => setPlatform(next as BrandPlatform)}
              options={PLATFORM_OPTIONS}
              aria-label="Platform"
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Rule name (optional)</label>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Character limit</label>
              <FormInput
                type="number"
                min={0}
                value={characterLimit}
                onChange={(e) => setCharacterLimit(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Format style</label>
              <FormInput value={formatStyle} onChange={(e) => setFormatStyle(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Template body</label>
            <FormTextarea value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} />
          </div>

          <StringListEditor label="Tags" values={tags} onChange={setTags} placeholder="Add tag" />

          <ProfileMultiSelect
            profiles={profiles}
            selectedIds={profileIds}
            onChange={setProfileIds}
          />

          <DialogFooter>
            <Button type="button" size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {initial ? 'Save changes' : 'Create rule'}
            </Button>
          </DialogFooter>
        </fieldset>
      </form>
    </Dialog>
  );
}
