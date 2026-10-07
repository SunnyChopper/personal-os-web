import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import XShortPostsTab from '@/pages/admin/personal-branding/content-stream/XShortPostsTab';
import type { ContentStreamHook } from '@/hooks/useContentStream';
import type { ContentStreamPost, ContentStreamSettings } from '@/types/api/personal-branding.dto';

const useContentStreamJobMock = vi.fn();

vi.mock('@/hooks/useContentStreamJob', () => ({
  useContentStreamJob: (...args: unknown[]) => useContentStreamJobMock(...args),
}));

vi.mock('@/hooks/useTerminalJobFailureAlert', () => ({
  useTerminalJobFailureAlert: vi.fn(),
}));

vi.mock('@/components/molecules/personal-branding/ContentStreamProgressStrip', () => ({
  default: () => <div data-testid="content-stream-progress-strip" />,
}));

const baseSettings: ContentStreamSettings = {
  platform: 'x',
  enabled: true,
  postsPerDay: 5,
  syncCadence: 'MANUAL_ONLY',
  syncStartTime: '09:00',
  syncTimezone: 'UTC',
  dailyGeneratedCount: 0,
  remainingDailyBudget: 3,
  hasRapidApiKey: true,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const samplePost: ContentStreamPost = {
  id: 'post-1',
  platform: 'x',
  platformFormat: 'single_post',
  body: 'Draft body',
  socialCurrencyAngle: 'hotTake',
  angleRationale: 'Because',
  status: 'pending',
  pillars: [],
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function makeStream(overrides?: Partial<ContentStreamHook>): ContentStreamHook {
  return {
    settings: { data: baseSettings } as unknown as ContentStreamHook['settings'],
    posts: { data: { data: [] } } as unknown as ContentStreamHook['posts'],
    profiles: { data: undefined } as unknown as ContentStreamHook['profiles'],
    updateSettings: { mutateAsync: vi.fn() } as unknown as ContentStreamHook['updateSettings'],
    feedback: {
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ContentStreamHook['feedback'],
    generate: {
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ContentStreamHook['generate'],
    clearPosts: {
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ContentStreamHook['clearPosts'],
    ...overrides,
  };
}

describe('XShortPostsTab draft skeletons', () => {
  beforeEach(() => {
    useContentStreamJobMock.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('shows empty state when idle with no posts', () => {
    render(
      <XShortPostsTab
        stream={makeStream()}
        showToast={vi.fn()}
        activeJobId={null}
        onJobIdChange={vi.fn()}
      />
    );

    expect(screen.getByText('No posts yet')).toBeInTheDocument();
    expect(screen.queryByTestId('content-stream-draft-skeleton-list')).not.toBeInTheDocument();
  });

  it('replaces Generate button with progress strip while generate is pending', () => {
    render(
      <XShortPostsTab
        stream={makeStream({
          generate: {
            isPending: true,
            mutateAsync: vi.fn(),
          } as unknown as ContentStreamHook['generate'],
        })}
        showToast={vi.fn()}
        activeJobId={null}
        onJobIdChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('content-stream-progress-strip')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Generate now' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Generating…' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear all drafts' })).toBeDisabled();
  });

  it('shows N skeletons while generate mutation is pending', () => {
    render(
      <XShortPostsTab
        stream={makeStream({
          generate: {
            isPending: true,
            mutateAsync: vi.fn(),
          } as unknown as ContentStreamHook['generate'],
        })}
        showToast={vi.fn()}
        activeJobId={null}
        onJobIdChange={vi.fn()}
      />
    );

    const list = screen.getByTestId('content-stream-draft-skeleton-list');
    expect(list).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByTestId('content-stream-post-card-skeleton')).toHaveLength(3);
    expect(screen.queryByText('No posts yet')).not.toBeInTheDocument();
  });

  it('hides existing posts while job is queued', () => {
    useContentStreamJobMock.mockReturnValue({
      data: {
        jobId: 'job-1',
        status: 'queued',
        createdPostIds: [],
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      isLoading: false,
    });

    render(
      <XShortPostsTab
        stream={makeStream({
          posts: { data: { data: [samplePost] } } as unknown as ContentStreamHook['posts'],
        })}
        showToast={vi.fn()}
        activeJobId="job-1"
        onJobIdChange={vi.fn()}
      />
    );

    expect(screen.getAllByTestId('content-stream-post-card-skeleton')).toHaveLength(3);
    expect(screen.queryByText('Draft body')).not.toBeInTheDocument();
  });

  it('shows skeletons when activeJobId is set before first poll returns', () => {
    useContentStreamJobMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(
      <XShortPostsTab
        stream={makeStream()}
        showToast={vi.fn()}
        activeJobId="job-pending"
        onJobIdChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('content-stream-draft-skeleton-list')).toBeInTheDocument();
    expect(screen.queryByText('No posts yet')).not.toBeInTheDocument();
  });

  it('disables Generate now when daily post budget is exhausted (266fcbd78690)', () => {
    render(
      <XShortPostsTab
        stream={makeStream({
          settings: {
            data: { ...baseSettings, remainingDailyBudget: 0 },
          } as unknown as ContentStreamHook['settings'],
        })}
        showToast={vi.fn()}
        activeJobId={null}
        onJobIdChange={vi.fn()}
      />
    );

    const generateButton = screen.getByRole('button', { name: 'Generate now' });
    expect(generateButton).toBeDisabled();
    expect(generateButton).toHaveAttribute('title', 'Daily post budget exhausted');
  });
});
