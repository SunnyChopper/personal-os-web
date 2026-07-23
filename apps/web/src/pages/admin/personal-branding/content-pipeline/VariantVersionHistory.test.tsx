import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import VariantVersionHistory from './VariantVersionHistory';
import type { ContentVariant } from '@/types/api/personal-branding.dto';

const fixedNow = new Date('2026-07-21T12:00:00.000Z');

function makeVersion(overrides: Partial<ContentVariant> = {}): ContentVariant {
  return {
    id: 'version-1',
    sourceContentId: 'content-1',
    jobId: 'job-1',
    brandProfileId: 'profile-1',
    platform: 'linkedin',
    title: 'Title',
    body: 'Body',
    status: 'generated',
    distributionStatus: 'DRAFT',
    generationAttempt: 1,
    characterCount: 10,
    critiqueHistory: [],
    referencedContentIds: [],
    cached: false,
    userId: 'user-1',
    createdAt: '2026-07-21T11:30:00.000Z',
    updatedAt: '2026-07-21T11:30:00.000Z',
    isActive: false,
    versionOrigin: 'generation',
    ...overrides,
  };
}

function renderHistory(
  versions: ContentVariant[],
  options: {
    comparingVersionId?: string | null;
    onCompare?: (versionId: string | null) => void;
    onActivate?: (versionId: string) => void;
  } = {}
) {
  const onCompare = options.onCompare ?? vi.fn();
  const onActivate = options.onActivate ?? vi.fn();

  render(
    <VariantVersionHistory
      versions={versions}
      comparingVersionId={options.comparingVersionId ?? null}
      onCompare={onCompare}
      onActivate={onActivate}
    />
  );

  return { onCompare, onActivate };
}

describe('VariantVersionHistory', () => {
  it('renders timeline list with active label only on active version', () => {
    renderHistory([
      makeVersion({ id: 'v2', generationAttempt: 2, isActive: true }),
      makeVersion({ id: 'v1', generationAttempt: 1, isActive: false }),
    ]);

    expect(screen.getByRole('list', { name: 'Version history timeline' })).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(1);
  });

  it('shows relative timestamp with absolute tooltip', () => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    renderHistory([makeVersion({ createdAt: '2026-07-21T11:30:00.000Z' })]);

    const timeEl = screen.getByText('30m ago');
    expect(timeEl).toBeInTheDocument();
    expect(timeEl).toHaveAttribute('title');
    expect(timeEl.getAttribute('title')).toMatch(/Jul/);

    vi.useRealTimers();
  });

  it('calls onCompare when Compare is clicked for versions with a parent', async () => {
    const user = userEvent.setup();
    const { onCompare } = renderHistory([
      makeVersion({
        id: 'v2',
        generationAttempt: 2,
        parentVariantId: 'v1',
        versionOrigin: 'regenerate',
      }),
      makeVersion({ id: 'v1', generationAttempt: 1 }),
    ]);

    await user.click(screen.getByRole('button', { name: 'Compare' }));
    expect(onCompare).toHaveBeenCalledWith('v2');
  });

  it('calls onActivate for inactive non-rejected versions only', async () => {
    const user = userEvent.setup();
    const { onActivate } = renderHistory([
      makeVersion({ id: 'v2', generationAttempt: 2, isActive: true }),
      makeVersion({ id: 'v1', generationAttempt: 1, isActive: false }),
      makeVersion({
        id: 'v0',
        generationAttempt: 0,
        isActive: false,
        status: 'rejected',
      }),
    ]);

    const activateButtons = screen.getAllByRole('button', { name: 'Activate' });
    expect(activateButtons).toHaveLength(1);

    await user.click(activateButtons[0]!);
    expect(onActivate).toHaveBeenCalledWith('v1');
  });

  it('hides Activate for active version and rejected versions', () => {
    renderHistory([
      makeVersion({ id: 'v-active', generationAttempt: 2, isActive: true }),
      makeVersion({ id: 'v-rejected', generationAttempt: 1, isActive: false, status: 'rejected' }),
    ]);

    expect(screen.queryByRole('button', { name: 'Activate' })).not.toBeInTheDocument();
  });
});
