import type { ContentNode, PaginatedPersonalBranding } from '@/types/api/personal-branding.dto';

export type SandboxContentLibraryMode = 'active' | 'archived';

/** Items for Sandbox "Your content" from an unwrapped `listContentNodes` page. */
export function selectSandboxContentNodes(
  page: PaginatedPersonalBranding<ContentNode> | undefined,
  mode: SandboxContentLibraryMode = 'active'
): ContentNode[] {
  const items = page?.data ?? [];
  if (mode === 'archived') {
    return items.filter((n) => n.status === 'SKIPPED');
  }
  return items.filter((n) => n.status !== 'SKIPPED');
}
