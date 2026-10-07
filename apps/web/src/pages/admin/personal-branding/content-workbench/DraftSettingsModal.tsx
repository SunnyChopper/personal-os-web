import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import Dialog from '@/components/molecules/Dialog';
import type { BrandPlatform, ContentType } from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import { pbFormLabelClassName, selectableChipClassName } from '../personal-branding-ui';
import { DialogFooter } from '../PersonalBrandingPageTemplate';

const CONTENT_TYPES = Object.keys(CONTENT_TYPE_LABELS) as ContentType[];

interface DraftSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ContentType;
  onContentTypeChange: (value: ContentType) => void;
  draftPlatform: BrandPlatform | null;
  onDraftPlatformChange: (value: BrandPlatform | null) => void;
  draftCanonicalUrl: string;
  onDraftCanonicalUrlChange: (value: string) => void;
  isSaving: boolean;
}

export default function DraftSettingsModal({
  isOpen,
  onClose,
  contentType,
  onContentTypeChange,
  draftPlatform,
  onDraftPlatformChange,
  draftCanonicalUrl,
  onDraftCanonicalUrlChange,
  isSaving,
}: DraftSettingsModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Draft settings"
      size="md"
      trapFocus
      footer={
        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <p className={pbFormLabelClassName}>Content type</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onContentTypeChange(type)}
                disabled={isSaving}
                aria-pressed={contentType === type}
                className={cn(
                  selectableChipClassName(contentType === type, 'px-3 py-3 text-left'),
                  isSaving && 'cursor-not-allowed opacity-50'
                )}
              >
                {CONTENT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-2">
          <span className={pbFormLabelClassName}>Target platform</span>
          <Select
            value={draftPlatform ?? ''}
            onChange={(event) =>
              onDraftPlatformChange((event.target.value as BrandPlatform) || null)
            }
            aria-label="Draft target platform"
            disabled={isSaving}
          >
            <option value="">No platform</option>
            {(Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[]).map((platform) => (
              <option key={platform} value={platform}>
                {BRAND_PLATFORM_LABELS[platform]}
              </option>
            ))}
          </Select>
        </label>

        <label className="block space-y-2">
          <span className={pbFormLabelClassName}>Canonical URL</span>
          <FormInput
            type="url"
            value={draftCanonicalUrl}
            onChange={(event) => onDraftCanonicalUrlChange(event.target.value)}
            placeholder="https://example.com/your-piece"
            aria-label="Canonical URL"
            disabled={isSaving}
          />
        </label>
      </div>
    </Dialog>
  );
}
