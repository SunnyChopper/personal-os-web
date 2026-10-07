import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FollowSuggestion, ReconPost } from '@/types/api/personal-branding.dto';
import {
  reconPostActionsCompactClusterClassName,
  reconPostActionsWideClusterClassName,
  reconPostContentColumnClassName,
  reconPostRowShellClassName,
} from '@/lib/personal-branding/recon-post-row-surfaces';
import ReconFeedTab from './ReconFeedTab';
import { formatPersonalBrandingDateTime } from '../personal-branding-ui';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      'aria-hidden': ariaHidden,
      ...rest
    }: {
      children?: ReactNode;
      className?: string;
      'aria-hidden'?: boolean;
      [key: string]: unknown;
    }) =>
      ariaHidden ? (
        <div className={className} aria-hidden hidden />
      ) : (
        <div className={className} {...rest}>
          {children}
        </div>
      ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
}));

vi.mock('./ConnectionEditorDialog', () => ({
  default: () => null,
}));

vi.mock('./RolodexPrompterDrawer', () => ({
  default: () => null,
}));

const processedPost: ReconPost = {
  id: 'post-processed-1',
  connectionId: 'conn-1',
  connectionName: 'Example Creator',
  platformPostId: '1234567890',
  authorUsername: 'example',
  text: 'Processed post body for collapse test.',
  url: 'https://x.com/example/status/1234567890',
  postedAt: '2026-07-20T12:00:00.000Z',
  likeCount: 1,
  retweetCount: 0,
  replyCount: 0,
  relevanceScore: 0.82,
  relevanceRationale: 'Strong alignment',
  relevanceRationaleBullets: null,
  recommendedAction: 'reply',
  confidence: 0.9,
  status: 'DISMISSED',
  userId: 'user-1',
  createdAt: '2026-07-20T12:00:00.000Z',
  updatedAt: '2026-07-21T18:47:04.000Z',
};

const activePost: ReconPost = {
  ...processedPost,
  id: 'post-active-1',
  status: 'NEW',
  text: 'Active post body for scarcity banner test.',
};

type ReconInfiniteListQuery<T> = {
  items: T[];
  total: number;
  isError: boolean;
  error: null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: ReturnType<typeof vi.fn>;
};

const emptyQuery: ReconInfiniteListQuery<ReconPost> = {
  items: [],
  total: 0,
  isError: false,
  error: null,
  hasNextPage: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  fetchNextPage: vi.fn(),
};

const pendingMutation = { mutateAsync: vi.fn(), isPending: false };

async function openReconSecondaryMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'More actions' }));
}

async function clickReconSecondaryMenuItem(
  user: ReturnType<typeof userEvent.setup>,
  label: string | RegExp
) {
  await openReconSecondaryMenu(user);
  await user.click(screen.getByRole('menuitem', { name: label }));
}

function getReconPostCard(postText: string): HTMLElement {
  const card = screen.getByText(postText).closest('[data-relevance-tier]');
  if (!card) {
    throw new Error(`Recon post card not found for text: ${postText}`);
  }
  return card as HTMLElement;
}

const scarcityHealthy = {
  recentHighSignalCount: 8,
  threshold: 0.5,
  isScarce: false,
  isLoading: false,
  isError: false,
  isSuccess: true,
};

const scarcityLow = {
  recentHighSignalCount: 2,
  threshold: 0.5,
  isScarce: true,
  isLoading: false,
  isError: false,
  isSuccess: true,
};

function buildReconFeedMock(overrides?: {
  posts?: ReconInfiniteListQuery<ReconPost>;
  scarcity?: typeof scarcityHealthy;
  followSuggestions?: ReconInfiniteListQuery<FollowSuggestion>;
  settings?: {
    lastRunAt?: string | null;
    hasRapidApiKey?: boolean;
  };
  hasActiveNonPausedRun?: boolean;
}) {
  return {
    posts: overrides?.posts ?? { ...emptyQuery },
    processedPosts: {
      ...emptyQuery,
      items: [processedPost],
      total: 71,
    },
    scarcity: overrides?.scarcity ?? scarcityHealthy,
    settings: {
      data: {
        lastRunAt:
          overrides?.settings && 'lastRunAt' in overrides.settings
            ? overrides.settings.lastRunAt
            : '2026-01-01T00:00:00.000Z',
        hasRapidApiKey: overrides?.settings?.hasRapidApiKey ?? true,
      },
      isSuccess: true,
      isLoading: false,
    },
    hasActiveNonPausedRun: overrides?.hasActiveNonPausedRun ?? false,
    followSuggestions: overrides?.followSuggestions ?? { ...emptyQuery },
    runs: {
      data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
      isError: false,
      error: null,
      isLoading: false,
      isFetching: false,
    },
    activeRunId: null,
    activeRun: { data: undefined, isLoading: false },
    updatePost: pendingMutation,
    updatingPostId: null,
    updateFollowSuggestion: pendingMutation,
    explainFollowSuggestionConfidence: pendingMutation,
    submitFollowSuggestionConfidenceFeedback: pendingMutation,
    proposeFollowSuggestionConnection: pendingMutation,
    controlRun: pendingMutation,
    startRun: pendingMutation,
    distillSelectionGuidance: pendingMutation,
  };
}

const useReconFeedMock = vi.fn(() => buildReconFeedMock());

vi.mock('@/hooks/useReconFeed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useReconFeed')>();
  return {
    ...actual,
    useReconFeed: () => useReconFeedMock(),
    useReconRunDetail: () => ({
      detail: { data: undefined, isLoading: false },
    }),
  };
});

vi.mock('@/hooks/useRolodexReplyRuns', () => ({
  useRolodexReplyRuns: () => ({
    query: { data: undefined },
    startRun: pendingMutation,
    updateSuggestion: pendingMutation,
  }),
  useActiveReplyRuns: () => undefined,
}));

function renderTab(options?: {
  initialEntries?: string[];
  connections?: Array<{ id: string; handles?: { x?: string } }>;
}) {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <ReconFeedTab
            showToast={vi.fn()}
            rolodex={
              {
                connections: {
                  data: {
                    data: options?.connections ?? [{ id: 'conn-1', handles: { x: 'example' } }],
                  },
                },
                createConnection: pendingMutation,
                logInteraction: pendingMutation,
              } as never
            }
            profiles={[]}
            selectedProfileId={null}
          />
        ),
      },
    ],
    { initialEntries: options?.initialEntries ?? ['/?tab=recon-feed'] }
  );

  return { ...render(<RouterProvider router={router} />), router };
}

describe('ReconFeedTab processed section', () => {
  it('hides processed cards by default and reveals restore after expand', async () => {
    const user = userEvent.setup();
    renderTab();

    expect(screen.getByText('1 of 71')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore to feed' })).not.toBeInTheDocument();

    const processedToggle = screen.getByRole('button', { name: /Processed/i });
    expect(processedToggle).toHaveAttribute('aria-expanded', 'false');
    expect(processedToggle.className).toContain('focus-visible:ring-blue-500/40');
    expect(processedToggle.querySelector('.rotate-90')).not.toBeInTheDocument();

    await user.click(processedToggle);

    expect(processedToggle).toHaveAttribute('aria-expanded', 'true');
    expect(processedToggle.querySelector('.rotate-90')).toBeInTheDocument();
    expect(screen.getByText(/Posts you actioned or dismissed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore to feed' })).toBeInTheDocument();
    expect(screen.getByText('Processed post body for collapse test.')).toBeInTheDocument();
  });
});

describe('ReconFeedTab active feed width', () => {
  it('constrains list scroll panel and post cards for long rationale text', async () => {
    const user = userEvent.setup();
    const longBullet =
      'Directalignmentwithyouredge-casereadinesspillarandrecurringmotifsonover-relianceoninsulation(latency/costtrade-offsindistributedagenticsystems)';
    const longBulletPost: ReconPost = {
      ...activePost,
      relevanceRationaleBullets: [longBullet],
    };

    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [longBulletPost], total: 1 },
      })
    );

    renderTab();

    const postText = screen.getByText(longBulletPost.text);
    const card = postText.closest('.overflow-hidden');
    expect(card).toHaveClass('min-w-0', 'w-full', 'overflow-hidden');

    const scrollPanel = postText.closest('.overflow-x-hidden');
    expect(scrollPanel).toHaveClass('min-w-0', 'overflow-y-auto', 'overflow-x-hidden');

    expect(screen.getByRole('button', { name: /Why this matters/i })).toBeInTheDocument();
    expect(screen.queryByText(longBullet)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Why this matters/i }));

    const bullet = screen.getByText(longBullet);
    expect(bullet).toHaveClass('break-words');
    expect(postText.closest('.break-words')).toBeTruthy();
  });
});

describe('ReconFeedTab post body truncation', () => {
  const LONG_POST_TEXT =
    'Line one of a long recon post body.\n' +
    'Line two continues with more context.\n' +
    'Line three adds detail about the topic.\n' +
    'Line four should push past the default clamp.\n' +
    'Line five is only visible after expand.';

  function mockPostTextOverflow(overflow: boolean) {
    const scrollHeight = overflow ? 120 : 40;
    const clientHeight = 40;

    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      if (this.tagName === 'DIV' && this.textContent?.includes('Line one of a long recon post body')) {
        return scrollHeight;
      }
      return 0;
    });
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      if (this.tagName === 'DIV' && this.textContent?.includes('Line one of a long recon post body')) {
        return clientHeight;
      }
      return 0;
    });
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clamps long post bodies with Show more and expands in place', async () => {
    const user = userEvent.setup();
    mockPostTextOverflow(true);
    const longPost: ReconPost = {
      ...activePost,
      text: LONG_POST_TEXT,
    };

    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [longPost], total: 1 },
      })
    );

    renderTab();

    const postText = screen.getByText(/Line one of a long recon post body/);
    const contentWrapper = postText.closest('.line-clamp-4');
    expect(contentWrapper).toHaveClass('line-clamp-4', 'break-words');
    expect(postText).toHaveClass('whitespace-pre-wrap');
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show more' }));

    expect(postText.closest('.line-clamp-4')).toBeNull();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('does not show Show more for short post bodies', () => {
    mockPostTextOverflow(false);

    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      })
    );

    renderTab();

    const postText = screen.getByText(activePost.text);
    expect(postText).toHaveClass('whitespace-pre-wrap');
    expect(postText.closest('.break-words')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });
});

describe('ReconFeedTab age and sort chips', () => {
  it('exposes default aria-pressed and shared filter chip classes', () => {
    renderTab();

    const ageGroup = screen.getByRole('group', { name: 'Filter by post age' });
    const sortGroup = screen.getByRole('group', { name: 'Sort active feed' });

    const allChip = within(ageGroup).getByRole('button', { name: 'All' });
    const relevanceChip = within(sortGroup).getByRole('button', { name: 'Relevance' });
    const oneDayChip = within(ageGroup).getByRole('button', { name: '1d' });

    expect(allChip).toHaveAttribute('aria-pressed', 'true');
    expect(relevanceChip).toHaveAttribute('aria-pressed', 'true');
    expect(oneDayChip).toHaveAttribute('aria-pressed', 'false');

    expect(allChip.className).toContain('focus-visible:ring-2');
    expect(allChip.className).toContain('focus-visible:ring-blue-500/40');
    expect(allChip.className).toContain('rounded-lg');
    expect(allChip.className).not.toContain('rounded-full');
  });

  it('updates aria-pressed when age and sort chips are clicked', async () => {
    const user = userEvent.setup();
    renderTab();

    const ageGroup = screen.getByRole('group', { name: 'Filter by post age' });
    const sortGroup = screen.getByRole('group', { name: 'Sort active feed' });

    await user.click(within(ageGroup).getByRole('button', { name: '1d' }));
    await user.click(within(sortGroup).getByRole('button', { name: 'Posted' }));

    expect(within(ageGroup).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(within(ageGroup).getByRole('button', { name: '1d' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(sortGroup).getByRole('button', { name: 'Relevance' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(within(sortGroup).getByRole('button', { name: 'Posted' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

describe('ReconFeedTab focus rings', () => {
  const pbFocusRing = 'focus-visible:ring-blue-500/40';

  it('shares pbFocusVisibleRingClassName across card actions, filter bar, and chips', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      })
    );

    renderTab();

    const ageGroup = screen.getByRole('group', { name: 'Filter by post age' });
    expect(within(ageGroup).getByRole('button', { name: 'All' }).className).toContain(pbFocusRing);

    const pastePost = screen.getByRole('button', { name: 'Paste post' });
    expect(pastePost.className).toContain(pbFocusRing);

    const draft = screen.getByRole('button', { name: /Draft reply/ });
    expect(draft.className).toContain(pbFocusRing);

    const logReply = screen.getByRole('button', { name: 'Log reply', hidden: true });
    expect(logReply.className).toContain(pbFocusRing);

    const moreActions = screen.getByRole('button', { name: 'More actions' });
    expect(moreActions.className).toContain(pbFocusRing);
  });
});

describe('ReconFeedTab footer timestamp', () => {
  const fixedNow = new Date('2026-08-09T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
    useReconFeedMock.mockReset();
    useReconFeedMock.mockImplementation(() => buildReconFeedMock());
  });

  it('shows relative posted time with absolute datetime in title', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      })
    );

    renderTab();

    const card = getReconPostCard(activePost.text);
    const expectedTitle = formatPersonalBrandingDateTime(activePost.postedAt);
    const postedAt = within(card).getByTitle(expectedTitle);
    expect(postedAt).toHaveTextContent('Jul 20');
  });

  it('uses tighter space-y-1.5 on post body/meta content column', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      })
    );

    renderTab();

    let node: Element | null = screen.getByText(activePost.text);
    let bodyColumn: Element | null = null;
    while (node) {
      if (node.classList.contains('space-y-1.5')) {
        bodyColumn = node;
        break;
      }
      node = node.parentElement;
    }
    expect(bodyColumn).not.toBeNull();
    expect(bodyColumn).toHaveClass(reconPostContentColumnClassName);
  });
});

describe('ReconFeedTab list summary', () => {
  afterEach(() => {
    useReconFeedMock.mockReset();
    useReconFeedMock.mockImplementation(() => buildReconFeedMock());
  });

  it('shows contextual summary without Clear filters at defaults', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      })
    );

    renderTab();

    expect(
      screen.getByText('1 post · all ages · sorted by relevance')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Showing \d+ of \d+/)).not.toBeInTheDocument();
  });

  it('surfaces active filters and Clear filters when age or sort is non-default', async () => {
    const user = userEvent.setup();
    useReconFeedMock.mockReturnValue(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 43 },
      })
    );

    renderTab();

    const ageGroup = screen.getByRole('group', { name: 'Filter by post age' });
    const sortGroup = screen.getByRole('group', { name: 'Sort active feed' });

    await user.click(within(ageGroup).getByRole('button', { name: '7d' }));
    await user.click(within(sortGroup).getByRole('button', { name: 'Posted' }));

    expect(
      screen.getByText('1 of 43 posts · last 7 days · sorted by posted')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('Clear filters resets chips and hides the control', async () => {
    const user = userEvent.setup();
    useReconFeedMock.mockReturnValue(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 43 },
      })
    );

    renderTab();

    const ageGroup = screen.getByRole('group', { name: 'Filter by post age' });
    const sortGroup = screen.getByRole('group', { name: 'Sort active feed' });

    await user.click(within(ageGroup).getByRole('button', { name: '7d' }));
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(within(ageGroup).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(sortGroup).getByRole('button', { name: 'Relevance' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(
      screen.getByText('1 of 43 posts · all ages · sorted by relevance')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('keeps Showing X of Y on Follow suggestions without filter context', () => {
    useReconFeedMock.mockReturnValue(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
        followSuggestions: {
          ...emptyQuery,
          items: [
            {
              id: 'sug-1',
              xUsername: 'suggested',
              displayName: 'Suggested',
              sharedConnectionIds: ['conn-1'],
              status: 'NEW',
              userId: 'user-1',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
              entityType: 'person',
            } satisfies FollowSuggestion,
          ],
          total: 5,
        },
      })
    );

    renderTab();

    const followSection = screen.getByRole('heading', { name: 'Follow suggestions' }).closest('div');
    expect(followSection).toBeTruthy();
    expect(within(followSection!).getByText('Showing 1 of 5')).toBeInTheDocument();
    expect(within(followSection!).queryByText(/sorted by relevance/)).not.toBeInTheDocument();
  });
});

describe('ReconFeedTab scarcity hint', () => {
  it('shows the scarcity banner when high-signal volume is low', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
        scarcity: scarcityLow,
      })
    );

    renderTab();

    expect(
      screen.getAllByText(
        /Only 2 posts from the last 48 h scored at or above your relevance threshold \(0\.5\)/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Open Connection Directory' })).toBeInTheDocument();
  });

  it('hides the scarcity banner when high-signal volume is healthy', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
        scarcity: scarcityHealthy,
      })
    );

    renderTab();

    expect(
      screen.queryByText(/Only .* posts from the last 48 h scored at or above/i)
    ).not.toBeInTheDocument();
  });

  it('uses scarcity empty-state copy and navigates to Connection Directory', async () => {
    const user = userEvent.setup();
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        scarcity: scarcityLow,
      })
    );

    const { router } = renderTab();

    expect(
      screen.getByText(
        /Only 2 posts from the last 48 h scored at or above your relevance threshold \(0\.5\)/i
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open Connection Directory' }));

    expect(router.state.location.search).toContain('tab=directory');
  });

  it('strengthens the CTA when no tracked X handles exist', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        scarcity: scarcityLow,
      })
    );

    renderTab({ connections: [] });

    expect(
      screen.getByRole('button', { name: 'Add X handles in Connection Directory' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Add X handles to start recon' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Track creators in Connection Directory so ingest can pull and score/i)
    ).toBeInTheDocument();
  });

  it('shows Run now when handles exist but ingest never ran', async () => {
    const user = userEvent.setup();
    const startRun = vi.fn().mockResolvedValue({ id: 'run-1' });
    useReconFeedMock.mockReturnValueOnce({
      ...buildReconFeedMock({
        settings: { lastRunAt: null, hasRapidApiKey: true },
        scarcity: scarcityHealthy,
      }),
      startRun: { mutateAsync: startRun, isPending: false },
    });

    renderTab();

    expect(screen.getByRole('heading', { name: 'Ready for your first ingest' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Run now' }));
    expect(startRun).toHaveBeenCalled();
  });

  it('shows Show all ages when a tight age filter hides posts', async () => {
    const user = userEvent.setup();
    useReconFeedMock.mockReturnValue(
      buildReconFeedMock({
        scarcity: scarcityHealthy,
        settings: { lastRunAt: '2026-01-01T00:00:00.000Z', hasRapidApiKey: true },
      })
    );

    renderTab();

    const ageGroup = screen.getByRole('group', { name: 'Filter by post age' });
    await user.click(within(ageGroup).getByRole('button', { name: '1d' }));

    expect(
      screen.getByRole('heading', { name: 'No posts in this age window' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all ages' }));
    expect(within(ageGroup).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

describe('ReconFeedTab relevance hierarchy', () => {
  it('renders high, mid, and low relevance tiers with distinct treatments', () => {
    const highPost: ReconPost = {
      ...activePost,
      id: 'post-high',
      relevanceScore: 0.9,
      text: 'High relevance post body.',
    };
    const midPost: ReconPost = {
      ...activePost,
      id: 'post-mid',
      relevanceScore: 0.7,
      text: 'Mid relevance post body.',
    };
    const lowPost: ReconPost = {
      ...activePost,
      id: 'post-low',
      relevanceScore: 0.3,
      text: 'Low relevance post body.',
    };

    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: {
          ...emptyQuery,
          items: [highPost, midPost, lowPost],
          total: 3,
        },
      })
    );

    renderTab();

    const highCard = screen.getByText('High relevance post body.').closest('[data-relevance-tier]');
    expect(highCard).toHaveAttribute('data-relevance-tier', 'high');
    expect(within(highCard as HTMLElement).getByTestId('high-opportunity-ribbon')).toHaveTextContent(
      'High opportunity'
    );
    expect(within(highCard as HTMLElement).getByLabelText('90% relevance')).toBeInTheDocument();
    expect(within(highCard as HTMLElement).getByText('relevance')).toBeInTheDocument();

    const midCard = screen.getByText('Mid relevance post body.').closest('[data-relevance-tier]');
    expect(midCard).toHaveAttribute('data-relevance-tier', 'mid');
    expect(within(midCard as HTMLElement).queryByTestId('high-opportunity-ribbon')).toBeNull();
    expect(within(midCard as HTMLElement).getByText('70% relevance')).toBeInTheDocument();

    const lowCard = screen.getByText('Low relevance post body.').closest('[data-relevance-tier]');
    expect(lowCard).toHaveAttribute('data-relevance-tier', 'low');
    expect(within(lowCard as HTMLElement).getByText('30% relevance')).toBeInTheDocument();
  });

  it('shows socialCapitalAngle chip when present on post', () => {
    const postWithAngle: ReconPost = {
      ...activePost,
      text: 'Perspective-worthy post body.',
      socialCapitalAngle: 'perspective',
    };
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: {
          ...emptyQuery,
          items: [postWithAngle],
          total: 1,
        },
      })
    );

    renderTab();

    const card = screen.getByText('Perspective-worthy post body.').closest('[data-relevance-tier]');
    expect(within(card as HTMLElement).getByText('Perspective')).toBeInTheDocument();
  });

  it('shows learningCost badge when present on post', () => {
    const postWithLearningCost: ReconPost = {
      ...activePost,
      text: 'Technical deep-dive post body.',
      learningCost: 'high',
    };
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: {
          ...emptyQuery,
          items: [postWithLearningCost],
          total: 1,
        },
      })
    );

    renderTab();

    const card = screen.getByText('Technical deep-dive post body.').closest('[data-relevance-tier]');
    expect(within(card as HTMLElement).getByText('Hard')).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText('Hard').closest('[data-learning-cost]')).toHaveAttribute(
      'data-learning-cost',
      'high'
    );
  });
});

describe('ReconFeedTab feedback controls', () => {
  it('toggles good pick without sending status', async () => {
    const user = userEvent.setup();
    const updatePost = vi.fn().mockResolvedValue(undefined);
    useReconFeedMock.mockReturnValue({
      ...buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      }),
      updatePost: { mutateAsync: updatePost, isPending: false },
    });

    renderTab();

    await clickReconSecondaryMenuItem(user, 'Good pick');

    expect(updatePost).toHaveBeenCalledWith({
      postId: activePost.id,
      body: { feedbackVerdict: 'GOOD' },
    });
  });

  it('shows persistent good pick chip when feedbackVerdict is GOOD', () => {
    const goodPickPost: ReconPost = { ...activePost, feedbackVerdict: 'GOOD' };
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [goodPickPost], total: 1 },
      })
    );

    renderTab();

    const wideActions = screen.getByTestId('recon-post-actions-wide');
    expect(screen.getByLabelText('Good pick affirmation')).toBeInTheDocument();
    expect(within(wideActions).getByRole('button', { name: 'Remove good pick' })).toBeInTheDocument();
    expect(within(wideActions).queryByRole('button', { name: 'Mark as good pick' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Good pick' })).not.toBeInTheDocument();
  });

  it('toggles good pick from inline wide cluster', async () => {
    const user = userEvent.setup();
    const updatePost = vi.fn().mockResolvedValue(undefined);
    useReconFeedMock.mockReturnValue({
      ...buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      }),
      updatePost: { mutateAsync: updatePost, isPending: false },
    });

    renderTab();

    const wideActions = screen.getByTestId('recon-post-actions-wide');
    await user.click(within(wideActions).getByRole('button', { name: 'Mark as good pick' }));

    expect(updatePost).toHaveBeenCalledWith({
      postId: activePost.id,
      body: { feedbackVerdict: 'GOOD' },
    });
  });

  it('clears good pick from quiet Remove in wide cluster', async () => {
    const user = userEvent.setup();
    const updatePost = vi.fn().mockResolvedValue(undefined);
    const goodPickPost: ReconPost = { ...activePost, feedbackVerdict: 'GOOD' };
    useReconFeedMock.mockReturnValue({
      ...buildReconFeedMock({
        posts: { ...emptyQuery, items: [goodPickPost], total: 1 },
      }),
      updatePost: { mutateAsync: updatePost, isPending: false },
    });

    renderTab();

    const wideActions = screen.getByTestId('recon-post-actions-wide');
    await user.click(within(wideActions).getByRole('button', { name: 'Remove good pick' }));

    expect(updatePost).toHaveBeenCalledWith({
      postId: activePost.id,
      body: { feedbackVerdict: null },
    });
  });

  it('removes good pick from overflow menu', async () => {
    const user = userEvent.setup();
    const updatePost = vi.fn().mockResolvedValue(undefined);
    const goodPickPost: ReconPost = { ...activePost, feedbackVerdict: 'GOOD' };
    useReconFeedMock.mockReturnValue({
      ...buildReconFeedMock({
        posts: { ...emptyQuery, items: [goodPickPost], total: 1 },
      }),
      updatePost: { mutateAsync: updatePost, isPending: false },
    });

    renderTab();

    expect(screen.getByLabelText('Good pick affirmation')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as good pick' })).not.toBeInTheDocument();

    await clickReconSecondaryMenuItem(user, 'Remove good pick');

    expect(updatePost).toHaveBeenCalledWith({
      postId: activePost.id,
      body: { feedbackVerdict: null },
    });
  });

  it('opens dismiss modal and requires a category', async () => {
    const user = userEvent.setup();
    const updatePost = vi.fn().mockResolvedValue(undefined);
    useReconFeedMock.mockReturnValue({
      ...buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      }),
      updatePost: { mutateAsync: updatePost, isPending: false },
    });

    renderTab();

    await clickReconSecondaryMenuItem(user, 'Dismiss');
    const dialog = screen.getByRole('dialog', { name: 'Dismiss post' });
    expect(dialog).toBeInTheDocument();

    const dismissButton = within(dialog).getByRole('button', { name: 'Dismiss' });
    expect(dismissButton).toBeDisabled();

    await user.click(within(dialog).getByRole('button', { name: 'Off-topic' }));
    await user.click(dismissButton);

    expect(updatePost).toHaveBeenCalledWith({
      postId: activePost.id,
      body: {
        status: 'DISMISSED',
        feedbackVerdict: 'BAD',
        feedbackCategory: 'offTopic',
        feedbackText: null,
      },
    });
  });

  it('opens log reply dialog and marks actioned on submit', async () => {
    const user = userEvent.setup();
    const updatePost = vi.fn().mockResolvedValue(undefined);
    const logInteraction = vi.fn().mockResolvedValue(undefined);
    useReconFeedMock.mockReturnValue({
      ...buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      }),
      processedPosts: { ...emptyQuery },
      updatePost: { mutateAsync: updatePost, isPending: false },
    });

    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <ReconFeedTab
              showToast={vi.fn()}
              rolodex={
                {
                  connections: {
                    data: {
                      data: [
                        {
                          id: 'conn-1',
                          name: 'Example Creator',
                          handles: { x: 'example' },
                          followUpCadenceDays: 14,
                        },
                      ],
                    },
                  },
                  createConnection: pendingMutation,
                  logInteraction: { mutateAsync: logInteraction, isPending: false },
                } as never
              }
              profiles={[]}
              selectedProfileId={null}
            />
          ),
        },
      ],
      { initialEntries: ['/?tab=recon-feed'] }
    );
    render(<RouterProvider router={router} />);

    await clickReconSecondaryMenuItem(user, 'Log reply');
    expect(screen.getByRole('dialog', { name: /Log check-in/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('https://…'), 'https://x.com/example/status/1');
    await user.click(screen.getByRole('button', { name: 'Save interaction' }));

    expect(logInteraction).toHaveBeenCalled();
    expect(updatePost).toHaveBeenCalledWith({
      postId: activePost.id,
      body: { status: 'ACTIONED' },
    });
  });
});

describe('ReconFeedTab action CTA hierarchy', () => {
  it('uses container-query action clusters on scored post cards', () => {
    expect(reconPostRowShellClassName({ tier: 'mid' })).toContain('@container');
    expect(reconPostActionsWideClusterClassName).toContain('hidden');
    expect(reconPostActionsWideClusterClassName).toContain('@[40rem]:flex');
    expect(reconPostActionsCompactClusterClassName).toContain('@[40rem]:hidden');

    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      })
    );

    renderTab();

    const card = getReconPostCard(activePost.text);
    expect(card.className).toContain('@container');

    const wideCluster = within(card)
      .getAllByRole('generic')
      .find((el) => el.className.includes('@[40rem]:flex'));
    const compactCluster = within(card)
      .getAllByRole('generic')
      .find((el) => el.className.includes('@[40rem]:hidden'));

    expect(wideCluster?.className).toContain('hidden');
    expect(compactCluster?.className).toContain('@[40rem]:hidden');

    const contentColumn = within(card)
      .getByText(activePost.text)
      .closest(`[class*="${reconPostContentColumnClassName.split(' ').find((c) => c.startsWith('max-w-'))}"]`);
    expect(contentColumn?.className).toContain('max-w-4xl');
  });

  it('shows overflow menu for compact secondary actions under jsdom', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      })
    );

    renderTab();

    expect(screen.getByRole('button', { name: 'Draft reply for Example Creator @example' })).toBeInTheDocument();
    expect(screen.queryByText(/Next: Reply/)).not.toBeInTheDocument();
    const compactActions = screen.getByTestId('recon-post-actions-compact');
    const wideActions = screen.getByTestId('recon-post-actions-wide');
    expect(within(compactActions).getByRole('button', { name: 'More actions' })).toBeInTheDocument();
    expect(wideActions).toHaveClass('hidden');
    expect(within(wideActions).getByRole('button', { name: 'Log reply' })).toBeInTheDocument();
  });

  it('keeps Draft as the only primary-filled control when good pick is selected', () => {
    const goodPickPost: ReconPost = {
      ...activePost,
      feedbackVerdict: 'GOOD',
    };
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [goodPickPost], total: 1 },
      })
    );

    renderTab();

    const wideActions = screen.getByTestId('recon-post-actions-wide');
    expect(screen.getByLabelText('Good pick affirmation')).toBeInTheDocument();
    expect(within(wideActions).getByRole('button', { name: 'Remove good pick' })).toBeInTheDocument();
    expect(within(wideActions).queryByRole('button', { name: 'Mark as good pick' })).not.toBeInTheDocument();

    const primaryButtons = screen
      .getAllByRole('button')
      .filter((button) => button.classList.contains('bg-primary'));
    expect(primaryButtons).toHaveLength(1);
    expect(primaryButtons[0]).toHaveAccessibleName(/Draft reply/);
  });

  it('applies compact control density to ghost secondaries and Paste post', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: { ...emptyQuery, items: [activePost], total: 1 },
      })
    );

    renderTab();

    const pastePost = screen.getByRole('button', { name: 'Paste post' });
    expect(pastePost.className).toContain('min-h-8');
    expect(pastePost.className).toContain('py-1.5');
    expect(pastePost.className).toContain('text-xs');

    const logReply = screen.getByRole('button', { name: 'Log reply', hidden: true });
    const goodPick = screen.getByRole('button', { name: 'Mark as good pick', hidden: true });
    const dismiss = screen.getByRole('button', { name: 'Dismiss', hidden: true });
    for (const button of [logReply, goodPick, dismiss]) {
      expect(button.className).toContain('min-h-8');
      expect(button.className).toContain('py-1.5');
      expect(button.className).toContain('text-xs');
    }

    const draft = screen.getByRole('button', { name: /Draft reply/ });
    expect(draft.className).toContain('text-sm');
    expect(draft.className).not.toContain('min-h-8');
  });
});

type IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => void;

let intersectionObserverCallback: IntersectionObserverCallback | null = null;
const savedIntersectionObserver = global.IntersectionObserver;

function installControllableIntersectionObserver() {
  intersectionObserverCallback = null;
  class ControllableIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      intersectionObserverCallback = callback;
    }
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  }
  global.IntersectionObserver =
    ControllableIntersectionObserver as unknown as typeof IntersectionObserver;
}

function triggerIntersection(isIntersecting: boolean) {
  if (!intersectionObserverCallback) return;
  intersectionObserverCallback([
    {
      isIntersecting,
      target: document.createElement('div'),
    } as unknown as IntersectionObserverEntry,
  ]);
}

describe('ReconFeedTab paginated list auto-load', () => {
  beforeEach(() => {
    installControllableIntersectionObserver();
  });

  afterEach(() => {
    global.IntersectionObserver = savedIntersectionObserver;
    intersectionObserverCallback = null;
  });

  it('auto-loads the next page when the sentinel intersects without showing Load more', async () => {
    const fetchNextPage = vi.fn();
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: {
          ...emptyQuery,
          items: [activePost],
          total: 100,
          hasNextPage: true,
          fetchNextPage,
        },
      })
    );

    renderTab();

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();

    triggerIntersection(true);

    await waitFor(() => {
      expect(fetchNextPage).toHaveBeenCalled();
    });
  });

  it('shows a skeleton row while fetching the next page', () => {
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: {
          ...emptyQuery,
          items: [activePost],
          total: 100,
          hasNextPage: true,
          isFetchingNextPage: true,
        },
      })
    );

    renderTab();

    expect(screen.getByTestId('recon-feed-load-more-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('shows Retry when fetchNextPage fails and invokes fetch on click', async () => {
    const user = userEvent.setup();
    const fetchNextPage = vi.fn();
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: {
          ...emptyQuery,
          items: [activePost],
          total: 100,
          hasNextPage: true,
          isFetchNextPageError: true,
          fetchNextPage,
        },
      })
    );

    renderTab();

    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(retry).toBeInTheDocument();

    await user.click(retry);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not auto-load or show controls when there is no next page', () => {
    const fetchNextPage = vi.fn();
    useReconFeedMock.mockReturnValueOnce(
      buildReconFeedMock({
        posts: {
          ...emptyQuery,
          items: [activePost],
          total: 1,
          hasNextPage: false,
          fetchNextPage,
        },
      })
    );

    renderTab();

    triggerIntersection(true);
    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('recon-feed-load-more-skeleton')).not.toBeInTheDocument();
  });
});
