import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import VariantRegenerateTweaksDrawer from './VariantRegenerateTweaksDrawer';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { BrandProfile, ContentVariant } from '@/types/api/personal-branding.dto';

vi.mock('@/components/molecules/SlideDrawer', () => ({
  default: ({
    open,
    children,
    title,
  }: {
    open: boolean;
    children: React.ReactNode;
    title?: string;
  }) =>
    open ? (
      <div>
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    ) : null,
}));

const catalog = {
  modes: [
    {
      id: 'narrative',
      label: 'Narrative',
      definition: 'Tell a story.',
      enabledEffect: 'Use storytelling.',
      disabledEffect: 'Avoid story arcs.',
    },
  ],
  devices: [
    {
      id: 'metaphor',
      label: 'Metaphor',
      definition: 'Direct comparison.',
      enabledEffect: 'May use metaphors.',
      disabledEffect: 'Do not use metaphors.',
    },
  ],
  strengths: ['subtle', 'light', 'moderate', 'strong', 'dominant'],
  wordsPerMinute: 200,
};

const effectivePolicy = {
  platform: 'linkedin' as const,
  profileId: 'profile-1',
  rules: [],
  resolvedPolicy: {
    characterLimit: 3000,
    readTimeLimitMinutes: 5,
    wordLimit: 1000,
    rhetoricalModes: [],
    rhetoricalDevices: [],
    requirements: '',
    appliedRuleIds: [],
  },
};

const profile: BrandProfile = {
  id: 'profile-1',
  name: 'Main voice',
  pillars: [],
  targetAudience: 'builders',
  toneMetrics: { clarity: 0.8, warmth: 0.4 },
  bannedPhrases: [],
  status: 'active',
  platforms: [],
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const variant: ContentVariant = {
  id: 'variant-1',
  sourceContentId: 'content-1',
  jobId: 'job-1',
  brandProfileId: 'profile-1',
  platform: 'linkedin',
  title: 'Test variant',
  body: 'Body text',
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

function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  queryClient.setQueryData(queryKeys.personalBranding.platformRules.catalog(), catalog);
  queryClient.setQueryData(
    queryKeys.personalBranding.platformRules.effective('linkedin', 'profile-1'),
    effectivePolicy
  );
  return queryClient;
}

function renderDrawer() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <VariantRegenerateTweaksDrawer
        open
        variant={variant}
        profile={profile}
        onClose={() => undefined}
        onSubmit={vi.fn()}
      />
    </QueryClientProvider>
  );
}

describe('VariantRegenerateTweaksDrawer', () => {
  it('shows tone expanded and modes/devices collapsed by default', async () => {
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tone metrics/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });

    expect(screen.getByRole('button', { name: /rhetorical modes/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByRole('button', { name: /rhetorical devices/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('expands rhetorical modes section', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rhetorical modes/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /rhetorical modes/i }));

    expect(screen.getByRole('checkbox', { name: /narrative/i })).toBeInTheDocument();
    expect(screen.getByText('Tell a story.')).toHaveClass('line-clamp-2');
  });

  it('renders tone editor without duplicate title', async () => {
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByLabelText(/clarity tone metric/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Tone metrics', { selector: 'label' })).not.toBeInTheDocument();
  });
});
