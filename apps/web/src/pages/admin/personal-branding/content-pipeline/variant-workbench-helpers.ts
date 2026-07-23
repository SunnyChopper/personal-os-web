import type { ContentVariant } from '@/types/api/personal-branding.dto';

export function variantWorkbenchDraftId(variant: ContentVariant): string | null {
  return variant.sandboxContent?.id ?? variant.createdDraftContentId ?? null;
}

export function variantInWorkbench(variant: ContentVariant): boolean {
  return variant.status === 'sent_to_sandbox' || variantWorkbenchDraftId(variant) != null;
}
