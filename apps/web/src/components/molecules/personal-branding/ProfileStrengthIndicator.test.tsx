import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ProfileStrengthIndicator from './ProfileStrengthIndicator';
import type { BrandProfile, PlatformRuleRecord } from '@/types/api/personal-branding.dto';

const profile: BrandProfile = {
  id: 'profile-1',
  name: 'Main voice',
  pillars: ['systems thinking'],
  targetAudience: 'builders',
  toneMetrics: { clarity: 0.8, warmth: 0.4 },
  bannedPhrases: ['synergy', 'leverage'],
  status: 'active',
  platforms: [],
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function mockRule(isUniversal: boolean): PlatformRuleRecord {
  return {
    id: isUniversal ? 'rule-universal' : 'rule-profile',
    platform: 'linkedin',
    rhetoricalModes: [],
    rhetoricalDevices: [],
    needsReview: false,
    profileIds: isUniversal ? [] : ['profile-1'],
    isUniversal,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const profileOverlayPolicy = {
  platform: 'linkedin' as const,
  profileId: 'profile-1',
  rules: [mockRule(false)],
  resolvedPolicy: {
    characterLimit: 3000,
    readTimeLimitMinutes: 5,
    wordLimit: 1000,
    rhetoricalModes: [{ mode: 'narrative' as const, strength: 'moderate' as const }],
    rhetoricalDevices: ['metaphor' as const],
    requirements: 'Lead with a hook.',
    appliedRuleIds: ['rule-1'],
  },
};

const universalOnlyPolicy = {
  platform: 'linkedin' as const,
  profileId: 'profile-1',
  rules: [mockRule(true)],
  resolvedPolicy: {
    characterLimit: 3000,
    readTimeLimitMinutes: 5,
    wordLimit: 1000,
    rhetoricalModes: [{ mode: 'narrative' as const, strength: 'moderate' as const }],
    rhetoricalDevices: ['metaphor' as const],
    requirements: 'Lead with a hook.',
    appliedRuleIds: ['rule-universal'],
  },
};

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    getPlatformRuleCatalog: vi.fn(),
    getEffectivePlatformRules: vi.fn(),
  },
}));

import { personalBrandingService } from '@/services/personal-branding.service';

function renderIndicator(targetPlatforms: Array<'linkedin' | 'x'> = ['linkedin']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const profilesByPlatform = Object.fromEntries(
    targetPlatforms.map((platform) => [platform, profile])
  );

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProfileStrengthIndicator
          profilesByPlatform={profilesByPlatform}
          targetPlatforms={targetPlatforms}
        />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('ProfileStrengthIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(personalBrandingService.getPlatformRuleCatalog).mockResolvedValue({
      modes: [],
      devices: [],
      strengths: ['subtle', 'light', 'moderate', 'strong', 'dominant'],
      wordsPerMinute: 200,
    });
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockResolvedValue(
      profileOverlayPolicy
    );
  });

  it('returns null when no profiles are mapped', () => {
    const { container } = render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <ProfileStrengthIndicator profilesByPlatform={{}} targetPlatforms={['linkedin']} />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows compact summary badge in collapsed state', async () => {
    renderIndicator();

    expect(screen.getByText('Profile strength')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText('2 tone metrics · 2 banned phrases · rules active')
      ).toBeInTheDocument();
    });
  });

  it('aggregates duplicate profile summaries across multiple target platforms', async () => {
    renderIndicator(['linkedin', 'x']);

    await waitFor(() => {
      expect(
        screen.getByText('2 tone metrics · 2 banned phrases · rules active')
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText('2 tone metrics · 2 tone metrics · rules active')
    ).not.toBeInTheDocument();
  });

  it('expands to show tone, banned phrases, and platform policy', async () => {
    const user = userEvent.setup();
    renderIndicator();

    await user.click(screen.getByText('Profile strength'));

    await waitFor(() => {
      expect(screen.getByText('clarity 0.80')).toBeInTheDocument();
    });

    expect(screen.getByText('synergy')).toBeInTheDocument();
    expect(screen.getByText('Lead with a hook.')).toBeInTheDocument();
    expect(screen.getByText('3,000')).toBeInTheDocument();
    expect(screen.queryByText('Universal fallback')).not.toBeInTheDocument();
  });

  it('shows universal fallback notice and summary when only universal rules apply', async () => {
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockResolvedValue(
      universalOnlyPolicy
    );
    const user = userEvent.setup();
    renderIndicator();

    await waitFor(() => {
      expect(
        screen.getByText('2 tone metrics · 2 banned phrases · universal fallback')
      ).toBeInTheDocument();
    });

    await user.click(screen.getByText('Profile strength'));

    await waitFor(() => {
      expect(screen.getByText('Universal fallback')).toBeInTheDocument();
    });

    expect(screen.getByText(/This profile has no mapped rules for LinkedIn/i)).toBeInTheDocument();
  });
});
