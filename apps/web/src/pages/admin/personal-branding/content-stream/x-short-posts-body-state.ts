import type { ContentStreamJobStatus } from '@/types/api/personal-branding.dto';

export type XShortPostsBodyState = 'empty' | 'generating' | 'list';

export interface XShortPostsBodyStateInput {
  postCount: number;
  isJobActive: boolean;
}

/** Single body state machine for X Short Posts draft list (empty → generating → list). */
export function resolveXShortPostsBodyState(
  input: XShortPostsBodyStateInput
): XShortPostsBodyState {
  if (input.isJobActive) {
    return 'generating';
  }
  if (input.postCount === 0) {
    return 'empty';
  }
  return 'list';
}

export function resolveXShortPostsJobActive(
  generatePending: boolean,
  activeJobId: string | null,
  jobStatus?: ContentStreamJobStatus | null,
  jobLoading = false
): boolean {
  if (generatePending) return true;
  if (!activeJobId) return false;
  if (jobLoading) return true;
  return jobStatus === 'queued' || jobStatus === 'running';
}
