import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ApproveIdeaGenerateModal from './ApproveIdeaGenerateModal';
import type { ContentIdea } from '@/types/api/personal-branding.dto';

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    listContentTemplates: vi
      .fn()
      .mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 100, hasMore: false }),
  },
}));

const idea: ContentIdea = {
  id: 'idea-1',
  title: 'Test idea',
  summary: 'Summary',
  angle: null,
  rationale: 'Because',
  contentType: 'DEEP_DIVE_BLOG',
  sourceType: 'ON_DEMAND_AI',
  sourceRefId: null,
  linkedGoalIds: [],
  linkedTaskIds: [],
  vaultItemIds: [],
  vaultItemSnapshots: [],
  radarItemIds: [],
  radarItemSnapshots: [],
  tags: [],
  matchedPillars: ['Leadership', 'Growth'],
  targetPlatform: 'linkedin',
  enableImageSearch: false,
  status: 'GENERATED',
  draftNodeId: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const profile = {
  id: 'profile-1',
  name: 'Brand',
  status: 'active' as const,
  pillars: ['Growth'],
  targetAudience: 'Builders',
  toneMetrics: {},
  bannedPhrases: [],
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('ApproveIdeaGenerateModal cancel', () => {
  it('calls onCancelJob while submitting instead of closing', async () => {
    const onCancelJob = vi.fn();
    const onClose = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <ApproveIdeaGenerateModal
          idea={idea}
          defaultBrandProfileId="profile-1"
          profiles={[profile]}
          profilesLoading={false}
          isSubmitting
          onClose={onClose}
          onCancelJob={onCancelJob}
          onSubmit={vi.fn()}
          errorMessage={null}
        />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancelJob).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('ApproveIdeaGenerateModal matched pillars', () => {
  it('prefills draft pillars from idea.matchedPillars on submit', async () => {
    const onSubmit = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <ApproveIdeaGenerateModal
          idea={idea}
          defaultBrandProfileId="profile-1"
          profiles={[profile]}
          profilesLoading={false}
          isSubmitting={false}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          errorMessage={null}
        />
      </QueryClientProvider>
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Generate draft and open in Sandbox' })
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        ideaId: 'idea-1',
        brandProfileId: 'profile-1',
        pillars: ['Leadership', 'Growth'],
      })
    );
  });
});
