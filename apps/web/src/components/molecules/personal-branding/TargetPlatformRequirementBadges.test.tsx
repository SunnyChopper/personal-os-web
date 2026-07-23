import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  PlatformRequirementCountBadge,
  TargetPlatformRequirementsExpandPanel,
} from './TargetPlatformRequirementBadges';
import { useTargetPlatformRulesExpansion } from '@/hooks/useTargetPlatformRulesExpansion';
import type { EffectivePlatformRules } from '@/types/api/personal-branding.dto';

const effectiveXRules: EffectivePlatformRules = {
  platform: 'x',
  profileId: 'profile-1',
  rules: [
    {
      id: 'rule-x',
      platform: 'x',
      isUniversal: false,
      profileIds: ['profile-1'],
      rhetoricalModes: [],
      rhetoricalDevices: [],
      needsReview: false,
      userId: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  resolvedPolicy: {
    characterLimit: 280,
    readTimeLimitMinutes: null,
    wordLimit: null,
    rhetoricalModes: [],
    rhetoricalDevices: [],
    requirements: '- Avoid em-dashes\n- Do NOT use hashtags\n- Use the thread format',
    appliedRuleIds: ['rule-x'],
  },
};

const effectiveLinkedInRules: EffectivePlatformRules = {
  platform: 'linkedin',
  profileId: 'profile-1',
  rules: [
    {
      id: 'rule-li',
      platform: 'linkedin',
      isUniversal: true,
      profileIds: [],
      rhetoricalModes: [],
      rhetoricalDevices: [],
      needsReview: false,
      userId: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  resolvedPolicy: {
    characterLimit: null,
    readTimeLimitMinutes: null,
    wordLimit: null,
    rhetoricalModes: [],
    rhetoricalDevices: [],
    requirements: '',
    appliedRuleIds: [],
  },
};

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    getEffectivePlatformRules: vi.fn(),
  },
}));

import { personalBrandingService } from '@/services/personal-branding.service';

function ExpansionHarness({
  profileByPlatform,
  targetPlatforms,
  onTogglePlatform,
}: {
  profileByPlatform: Partial<Record<'x' | 'linkedin', string>>;
  targetPlatforms: Array<'x' | 'linkedin'>;
  onTogglePlatform?: (platform: 'x' | 'linkedin') => void;
}) {
  const surface = useTargetPlatformRulesExpansion({
    profileByPlatform,
    targetPlatforms,
  });

  return (
    <div>
      {targetPlatforms.map((platform) => {
        const count = surface.getRequirementCount(platform);
        const selected = targetPlatforms.includes(platform);
        return (
          <span key={platform} className="inline-flex items-center">
            <button type="button" onClick={() => onTogglePlatform?.(platform)}>
              {platform}
            </button>
            {selected && count != null && count > 0 ? (
              <PlatformRequirementCountBadge
                platform={platform}
                count={count}
                expanded={surface.expandedPlatform === platform}
                panelId={surface.panelId(platform)}
                onClick={(event) => surface.handleBadgeClick(event, platform)}
              />
            ) : null}
          </span>
        );
      })}
      <TargetPlatformRequirementsExpandPanel
        profileByPlatform={profileByPlatform}
        targetPlatforms={targetPlatforms}
        expandedPlatform={surface.expandedPlatform}
        byPlatform={surface.byPlatform}
        panelId={surface.panelId}
      />
    </div>
  );
}

function renderHarness(
  options: {
    targetPlatforms?: Array<'x' | 'linkedin'>;
    profileByPlatform?: Partial<Record<'x' | 'linkedin', string>>;
    onTogglePlatform?: (platform: 'x' | 'linkedin') => void;
  } = {}
) {
  const {
    targetPlatforms = ['x'],
    profileByPlatform = { x: 'profile-1' },
    onTogglePlatform,
  } = options;

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ExpansionHarness
        profileByPlatform={profileByPlatform}
        targetPlatforms={targetPlatforms}
        onTogglePlatform={onTogglePlatform}
      />
    </QueryClientProvider>
  );
}

describe('TargetPlatformRequirementBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockImplementation(
      async (platform) => (platform === 'x' ? effectiveXRules : effectiveLinkedInRules)
    );
  });

  it('shows requirement count badge for selected platform with rules', async () => {
    renderHarness();

    await waitFor(() => {
      const badge = screen.getByRole('button', { name: '3 platform requirements for X (Twitter)' });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3 req');
      expect(badge).toHaveAttribute('title', '3 requirements — click to view');
    });
  });

  it('does not show badge when requirements are empty', async () => {
    renderHarness({
      targetPlatforms: ['linkedin'],
      profileByPlatform: { linkedin: 'profile-1' },
    });

    await waitFor(() => {
      expect(personalBrandingService.getEffectivePlatformRules).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole('button', { name: /platform requirements/i })
    ).not.toBeInTheDocument();
  });

  it('expands inline panel with requirement lines when badge is clicked', async () => {
    const user = userEvent.setup();
    renderHarness();

    const badge = await screen.findByRole('button', {
      name: '3 platform requirements for X (Twitter)',
    });
    await user.click(badge);

    expect(
      screen.getByRole('region', { name: /Active rules for X \(Twitter\)/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Avoid em-dashes')).toBeInTheDocument();
    expect(screen.getByText('Do NOT use hashtags')).toBeInTheDocument();
    expect(screen.getByText('Use the thread format')).toBeInTheDocument();
    expect(screen.getByText('280')).toBeInTheDocument();
  });

  it('does not toggle platform selection when badge is clicked', async () => {
    const user = userEvent.setup();
    const onTogglePlatform = vi.fn();
    renderHarness({ onTogglePlatform });

    const badge = await screen.findByRole('button', {
      name: '3 platform requirements for X (Twitter)',
    });
    await user.click(badge);

    expect(onTogglePlatform).not.toHaveBeenCalled();
  });

  it('hides badges when profile is missing', async () => {
    renderHarness({ profileByPlatform: {} });

    await waitFor(() => {
      expect(personalBrandingService.getEffectivePlatformRules).not.toHaveBeenCalled();
    });

    expect(
      screen.queryByRole('button', { name: /platform requirements/i })
    ).not.toBeInTheDocument();
  });
});
