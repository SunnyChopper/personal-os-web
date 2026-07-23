import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ProfileLiveOutputTestPanel from './ProfileLiveOutputTestPanel';
import type { BrandProfileOutputTest } from '@/types/api/personal-branding.dto';

const effectivePolicy = {
  platform: 'linkedin' as const,
  profileId: 'profile-1',
  rules: [],
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

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    getEffectivePlatformRules: vi.fn(),
    generateTopicSuggestions: vi.fn(),
  },
}));

import { personalBrandingService } from '@/services/personal-branding.service';

const formSnapshot = {
  name: 'Voice',
  description: null,
  pillars: ['Clarity'],
  targetAudience: 'Builders',
  toneMetrics: { clarity: 0.9 },
  bannedPhrases: [],
  status: 'active' as const,
  platforms: [],
};

const savedTest: BrandProfileOutputTest = {
  id: 'test-1',
  profileId: 'profile-1',
  topic: 'Sample topic',
  contentType: 'DEEP_DIVE_BLOG',
  platform: 'linkedin',
  title: 'Preview title',
  body: 'word '.repeat(250).trim(),
  cached: false,
  userId: 'u1',
  createdAt: '2026-07-14T12:00:00Z',
};

function renderPanel(overrides?: Partial<Parameters<typeof ProfileLiveOutputTestPanel>[0]>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ProfileLiveOutputTestPanel
        open
        onClose={vi.fn()}
        profileId="profile-1"
        profileName="Voice"
        isLocalDraft={false}
        formSnapshot={formSnapshot}
        onEnsureSaved={vi.fn().mockResolvedValue('profile-1')}
        onGenerate={vi.fn().mockResolvedValue(savedTest)}
        history={[]}
        {...overrides}
      />
    </QueryClientProvider>
  );
}

describe('ProfileLiveOutputTestPanel', () => {
  beforeEach(() => {
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockResolvedValue(effectivePolicy);
  });

  it('shows applied platform policy for the selected platform', async () => {
    renderPanel();
    expect(await screen.findByText('Applied platform policy')).toBeInTheDocument();
    expect(screen.getByText(/Character limit: 3000/)).toBeInTheDocument();
    expect(screen.getByText(/Lead with a hook/)).toBeInTheDocument();
  });

  it('refreshes policy summary when platform changes', async () => {
    const user = userEvent.setup();
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockImplementation(
      async (platform) => ({
        ...effectivePolicy,
        platform: platform as typeof effectivePolicy.platform,
        resolvedPolicy: {
          ...effectivePolicy.resolvedPolicy,
          characterLimit: platform === 'x' ? 280 : 3000,
        },
      })
    );

    renderPanel();
    await screen.findByText(/Character limit: 3000/);

    await user.selectOptions(screen.getByLabelText(/target platform/i), 'x');
    await waitFor(() => {
      expect(screen.getByText(/Character limit: 280/)).toBeInTheDocument();
    });
  });

  it('shows compliance metrics on generated output', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    expect(await screen.findByText(/Preview title/)).toBeInTheDocument();
    expect(screen.getByText(/250 words/)).toBeInTheDocument();
    expect(screen.getByText(/\/3000 chars/)).toBeInTheDocument();
  });
});
