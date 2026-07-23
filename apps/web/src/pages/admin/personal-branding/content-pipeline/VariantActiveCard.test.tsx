import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VariantActiveCard } from './VariantActiveCard';
import type { ContentVariant } from '@/types/api/personal-branding.dto';
import type { useContentPipeline } from './useContentPipeline';

type ContentPipelineState = ReturnType<typeof useContentPipeline>;

const baseVariant: ContentVariant = {
  id: 'variant-1',
  sourceContentId: 'content-1',
  jobId: 'job-1',
  brandProfileId: 'profile-1',
  platform: 'linkedin',
  title: 'Test title',
  body: '## Hello\n\nWorld',
  status: 'generated',
  distributionStatus: 'DRAFT',
  generationAttempt: 1,
  characterCount: 100,
  critiqueHistory: [],
  referencedContentIds: [],
  cached: false,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createPipelineMock(): ContentPipelineState {
  return {
    saveVariantVersionMutation: { isPending: false, mutateAsync: vi.fn() },
    activateVariantVersionMutation: { isPending: false, mutateAsync: vi.fn() },
    updateDistributionStatusMutation: { isPending: false, variables: undefined },
    sendToSandboxMutation: { isPending: false, mutate: vi.fn() },
    regenerateWithTweaksMutation: { isPending: false, mutateAsync: vi.fn() },
    regeneratePlatformMutation: { isPending: false },
    rejectVariantMutation: { isPending: false },
    inFlightJobs: [],
    rejectingVariantId: null,
    setRejectingVariantId: vi.fn(),
    rejectCritique: '',
    setRejectCritique: vi.fn(),
    setTweakingVariantId: vi.fn(),
  } as unknown as ContentPipelineState;
}

function renderCard(
  variant: ContentVariant,
  pipeline = createPipelineMock(),
  options: { selected?: boolean; onSelectedChange?: (selected: boolean) => void } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <VariantActiveCard
          variant={variant}
          pipeline={pipeline}
          onSchedulePublish={vi.fn()}
          onAddToQueue={vi.fn()}
          onDistributionStatusChange={vi.fn()}
          onDistributionTrackingSave={vi.fn()}
          onError={vi.fn()}
          onSuccess={vi.fn()}
          selected={options.selected}
          onSelectedChange={options.onSelectedChange}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('VariantActiveCard markdown body editor', () => {
  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1100);
  });

  it('renders summary action hierarchy with Push to Workbench as primary', () => {
    renderCard(baseVariant);

    const pushButton = screen.getByRole('button', { name: 'Push to Workbench' });
    const editButton = screen.getByRole('button', { name: 'Edit' });
    const rejectButton = screen.getByRole('button', { name: 'Reject' });

    expect(pushButton.className).toMatch(/bg-primary/);
    expect(editButton.className).toMatch(/border-primary/);
    expect(rejectButton.className).toMatch(/border-red-300/);
    expect(rejectButton.className).not.toMatch(/bg-primary/);
  });

  it('renders MarkdownEditor toolbar when Edit is opened', async () => {
    const user = userEvent.setup();
    renderCard(baseVariant);

    expect(screen.queryByRole('button', { name: 'Edit Mode' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('button', { name: 'Edit Mode' })).toBeInTheDocument();
    expect(screen.queryByTestId('variant-body-readonly')).toBeNull();
  });

  it('renders read-only Markdown preview for rejected variants in edit mode', async () => {
    const user = userEvent.setup();
    renderCard({ ...baseVariant, status: 'rejected' });

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByTestId('variant-body-readonly')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Hello' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Mode' })).toBeNull();
  });

  it('renders the platform chip and elevated shell classes in summary mode', () => {
    const { container } = renderCard(baseVariant, createPipelineMock(), {
      selected: true,
      onSelectedChange: vi.fn(),
    });

    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(container.querySelector('article')?.className).toContain('ring-sky-500/70');
    expect(container.querySelector('article')?.className).toContain('hover:shadow-md');
  });

  it('applies rejected border styling in summary mode', () => {
    const { container } = renderCard({ ...baseVariant, status: 'rejected' });

    expect(container.querySelector('article')?.className).toContain('border-red-200');
  });

  it('shows a performance strip on the collapsed card when engagement exists', () => {
    renderCard({
      ...baseVariant,
      engagement: { views: 100, likes: 5, comments: 2 },
    });

    expect(screen.getByTestId('variant-performance-strip')).toBeInTheDocument();
    expect(screen.getByTestId('variant-performance-strip')).toHaveTextContent('100');
    expect(screen.getByTestId('variant-performance-strip')).toHaveTextContent('views');
  });

  it('hides the performance strip when engagement is absent', () => {
    renderCard(baseVariant);
    expect(screen.queryByTestId('variant-performance-strip')).toBeNull();
  });

  it('hides the performance strip for rejected variants even with engagement', () => {
    renderCard({
      ...baseVariant,
      status: 'rejected',
      engagement: { views: 100, likes: 5, comments: 2 },
    });
    expect(screen.queryByTestId('variant-performance-strip')).toBeNull();
  });

  it('shows Suggest improvements on non-rejected variants', () => {
    renderCard(baseVariant);
    expect(screen.getByRole('button', { name: 'Suggest improvements' })).toBeInTheDocument();
  });

  it('hides Suggest improvements for rejected variants', () => {
    renderCard({ ...baseVariant, status: 'rejected' });
    expect(screen.queryByRole('button', { name: 'Suggest improvements' })).toBeNull();
  });
});
