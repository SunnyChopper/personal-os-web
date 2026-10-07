import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ProfileLiveOutputTestPanel from './ProfileLiveOutputTestPanel';
import {
  FORMAT_TAG_PREFIX,
  LIVE_OUTPUT_TEST_TAG,
  RULE_ID_TAG_PREFIX,
  TOPIC_TAG_PREFIX,
} from './live-output-workbench-draft';
import type {
  BrandProfileOutputTest,
  EffectivePlatformRules,
  PlatformRuleRecord,
} from '@/types/api/personal-branding.dto';

function mockRule(overrides: Partial<PlatformRuleRecord> = {}): PlatformRuleRecord {
  return {
    id: 'rule-1',
    platform: 'linkedin',
    name: 'LinkedIn voice',
    characterLimit: 3000,
    readTimeLimitMinutes: 5,
    rhetoricalModes: [{ mode: 'narrative', strength: 'moderate' }],
    rhetoricalDevices: ['metaphor'],
    requirements: 'Lead with a hook.',
    needsReview: false,
    profileIds: ['profile-1'],
    isUniversal: false,
    userId: 'u1',
    createdAt: '2026-07-14T12:00:00Z',
    updatedAt: '2026-07-14T12:00:00Z',
    ...overrides,
  };
}

const emptyResolvedPolicy: EffectivePlatformRules['resolvedPolicy'] = {
  characterLimit: null,
  readTimeLimitMinutes: null,
  wordLimit: null,
  rhetoricalModes: [],
  rhetoricalDevices: [],
  requirements: '',
  appliedRuleIds: [],
};

const effectivePolicy: EffectivePlatformRules = {
  platform: 'linkedin',
  profileId: 'profile-1',
  rules: [mockRule()],
  resolvedPolicy: {
    characterLimit: 3000,
    readTimeLimitMinutes: 5,
    wordLimit: 1000,
    rhetoricalModes: [{ mode: 'narrative', strength: 'moderate' }],
    rhetoricalDevices: ['metaphor'],
    requirements: 'Lead with a hook.',
    appliedRuleIds: ['rule-1'],
  },
};

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    getEffectivePlatformRules: vi.fn(),
    getPlatformRuleCatalog: vi.fn(),
    generateTopicSuggestions: vi.fn(),
    createContentNode: vi.fn(),
  },
}));

import { personalBrandingService } from '@/services/personal-branding.service';

const formSnapshot = {
  name: 'Voice',
  description: null,
  pillars: ['Clarity'],
  targetAudience: 'Builders',
  toneMetrics: { clarity: 0.9 },
  bannedPhrases: [] as string[],
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
  body: '### Key insight\n\nBody paragraph with details.',
  cached: false,
  userId: 'u1',
  createdAt: '2026-07-14T12:00:00Z',
};

const linkedinGeneratePayload = {
  topic: 'How I approach building in public',
  contentType: 'SOCIAL_THREAD' as const,
  platform: 'linkedin' as const,
  platformFormat: 'single_post' as const,
};

const navigate = vi.fn();
const showToast = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ showToast }),
}));

function renderPanel(overrides?: Partial<Parameters<typeof ProfileLiveOutputTestPanel>[0]>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
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
    </MemoryRouter>
  );
}

describe('ProfileLiveOutputTestPanel', () => {
  beforeEach(() => {
    navigate.mockReset();
    showToast.mockReset();
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockResolvedValue(effectivePolicy);
    vi.mocked(personalBrandingService.getPlatformRuleCatalog).mockResolvedValue({
      modes: [],
      devices: [],
      strengths: ['subtle', 'light', 'moderate', 'strong', 'dominant'],
      wordsPerMinute: 200,
      limitDefaults: {},
    });
  });

  it('shows applied platform policy for the selected platform', async () => {
    renderPanel();
    expect(await screen.findByText('Applied platform policy')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn voice')).toBeInTheDocument();
    expect(screen.getByText(/3,000/)).toBeInTheDocument();
    expect(screen.getByText(/Lead with a hook/)).toBeInTheDocument();
    expect(screen.queryByText('Universal fallback')).not.toBeInTheDocument();
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
    await screen.findByText(/3,000/);

    await user.selectOptions(screen.getByLabelText(/target platform/i), 'x');
    await waitFor(() => {
      expect(screen.getByText(/280/)).toBeInTheDocument();
    });
  });

  it('shows universal fallback and empty copy when no rules contribute', async () => {
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockResolvedValue({
      platform: 'linkedin',
      profileId: 'profile-1',
      rules: [],
      resolvedPolicy: emptyResolvedPolicy,
    });

    renderPanel();
    await screen.findByText('Universal fallback');
    expect(screen.getByText(/No saved platform rules for LinkedIn/i)).toBeInTheDocument();
    expect(screen.getByText(/profile voice only/i)).toBeInTheDocument();
  });

  it('shows universal fallback badge and rule name for universal-only rules', async () => {
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockResolvedValue({
      platform: 'instagram',
      profileId: 'profile-1',
      rules: [
        mockRule({
          id: 'rule-universal',
          platform: 'instagram',
          name: 'Instagram baseline',
          isUniversal: true,
          profileIds: [],
        }),
      ],
      resolvedPolicy: {
        ...effectivePolicy.resolvedPolicy,
        characterLimit: 2200,
      },
    });

    renderPanel();
    await screen.findByText('Universal fallback');
    expect(screen.getByText('Instagram baseline')).toBeInTheDocument();
    expect(screen.getByText(/module-wide universal rules/i)).toBeInTheDocument();
  });

  it('shows profile-linked rule without universal fallback notice', async () => {
    vi.mocked(personalBrandingService.getEffectivePlatformRules).mockResolvedValue({
      ...effectivePolicy,
      rules: [mockRule({ name: 'X thread cadence', platform: 'x' })],
    });

    renderPanel();
    await screen.findByText('X thread cadence');
    expect(screen.queryByText('Universal fallback')).not.toBeInTheDocument();
  });

  it('shows banned phrases from the profile form snapshot', async () => {
    renderPanel({
      formSnapshot: {
        ...formSnapshot,
        bannedPhrases: ['synergy', 'leverage'],
      },
    });

    await screen.findByText('Banned phrases');
    expect(screen.getByText('synergy')).toBeInTheDocument();
    expect(screen.getByText('leverage')).toBeInTheDocument();
  });

  it('shows compliance metrics on generated output', async () => {
    const user = userEvent.setup();
    const longBody = 'word '.repeat(250).trim();
    renderPanel({
      onGenerate: vi.fn().mockResolvedValue({ ...savedTest, body: longBody }),
    });

    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    expect(await screen.findByText(/Preview title/)).toBeInTheDocument();
    expect(screen.getByText(/250 words/)).toBeInTheDocument();
    expect(screen.getByText(/\/3000 chars/)).toBeInTheDocument();
  });

  it('shows preview skeleton while generating', async () => {
    const user = userEvent.setup();
    let resolveGenerate: (value: BrandProfileOutputTest) => void;
    const generatePromise = new Promise<BrandProfileOutputTest>((resolve) => {
      resolveGenerate = resolve;
    });

    renderPanel({
      onGenerate: vi.fn().mockReturnValue(generatePromise),
    });

    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    expect(screen.getByRole('status', { name: 'Generating preview' })).toBeInTheDocument();

    resolveGenerate!(savedTest);
    expect(await screen.findByText(/Preview title/)).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Generating preview' })).not.toBeInTheDocument();
  });

  it('shows history loading skeletons', () => {
    renderPanel({ historyLoading: true });

    expect(screen.getByRole('status', { name: 'Loading saved tests' })).toBeInTheDocument();
    expect(screen.queryByText('Loading saved tests…')).not.toBeInTheDocument();
  });

  it('empty history CTA triggers onGenerate', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockResolvedValue(savedTest);

    renderPanel({ history: [], onGenerate });

    await user.click(screen.getByRole('button', { name: /generate your first preview/i }));

    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalledWith('profile-1', linkedinGeneratePayload);
    });
  });

  it('shows tone scorecard after generate and bias click passes toneBiasKey', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockResolvedValue({
      ...savedTest,
      toneScores: { clarity: 0.82 },
      overallToneMatch: 0.82,
    });

    renderPanel({ onGenerate });

    await user.click(screen.getByRole('button', { name: /generate preview/i }));
    expect(await screen.findByText(/tone alignment/i)).toBeInTheDocument();
    expect(screen.getByText(/overall 82%/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /regenerate with more Clarity/i }));
    await waitFor(() => {
      expect(onGenerate).toHaveBeenLastCalledWith('profile-1', {
        ...linkedinGeneratePayload,
        toneBiasKey: 'clarity',
      });
    });
  });

  it('renders preview action toolbar and markdown headings after generate', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    expect(await screen.findByRole('toolbar', { name: /preview actions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse sections' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Use as draft in Content Workbench' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Key insight' })).toBeInTheDocument();
    expect(screen.queryByText('### Key insight')).not.toBeInTheDocument();
  });

  it('copies preview text to clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    renderPanel();

    await user.click(screen.getByRole('button', { name: /generate preview/i }));
    await screen.findByRole('button', { name: 'Copy' });
    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith(
      'Preview title\n\n### Key insight\n\nBody paragraph with details.'
    );
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', title: 'Copied' })
    );
  });

  it('regenerates preview when Regenerate is clicked', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockResolvedValue(savedTest);
    renderPanel({ onGenerate });

    await user.click(screen.getByRole('button', { name: /generate preview/i }));
    await user.click(await screen.findByRole('button', { name: 'Regenerate' }));

    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalledTimes(2);
    });
  });

  it('opens workbench with created draft', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(personalBrandingService.createContentNode).mockResolvedValue({
      id: 'node-1',
      title: savedTest.title,
      body: savedTest.body,
      status: 'DRAFT',
      sourceType: 'ON_DEMAND_AI',
      sourceRefId: savedTest.id,
      contentType: savedTest.contentType,
      platform: savedTest.platform,
      tags: [
        LIVE_OUTPUT_TEST_TAG,
        `${TOPIC_TAG_PREFIX}${savedTest.topic}`,
        'LinkedIn voice',
        `${RULE_ID_TAG_PREFIX}rule-1`,
      ],
      pillars: ['Clarity'],
      userId: 'u1',
      createdAt: '2026-07-14T12:00:00Z',
      updatedAt: '2026-07-14T12:00:00Z',
    });

    renderPanel({ onClose });

    await user.click(screen.getByRole('button', { name: /generate preview/i }));
    await user.click(
      await screen.findByRole('button', { name: 'Use as draft in Content Workbench' })
    );

    await waitFor(() => {
      expect(personalBrandingService.createContentNode).toHaveBeenCalledWith(
        expect.objectContaining({
          title: savedTest.title,
          body: savedTest.body,
          sourceType: 'ON_DEMAND_AI',
          sourceRefId: savedTest.id,
          contentType: savedTest.contentType,
          platform: savedTest.platform,
          pillars: ['Clarity'],
          tags: [
            LIVE_OUTPUT_TEST_TAG,
            `${TOPIC_TAG_PREFIX}${savedTest.topic}`,
            `${FORMAT_TAG_PREFIX}single_post`,
            'LinkedIn voice',
            `${RULE_ID_TAG_PREFIX}rule-1`,
          ],
        })
      );
    });
    expect(navigate).toHaveBeenCalledWith(
      '/admin/personal-branding/workbench?tab=sandbox&contentId=node-1'
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('brainstorms structured topics with why control and multi-select queue generate', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockResolvedValue(savedTest);
    vi.mocked(personalBrandingService.generateTopicSuggestions).mockResolvedValue({
      topics: [
        {
          topic: 'Why your RAG pipeline wastes tokens',
          why: 'Connects to the Clarity pillar for cost-conscious builders.',
          matchedPillars: ['Clarity'],
        },
        {
          topic: 'Building reliable agents in production',
          why: 'Practical angle for builders validating agent workflows.',
          matchedPillars: ['Clarity'],
        },
      ],
    });

    renderPanel({ onGenerate });

    await user.click(screen.getByRole('button', { name: /brainstorm topics/i }));

    expect(
      await screen.findByRole('listbox', { name: /brainstormed topic suggestions/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /Why your RAG pipeline wastes tokens/i })
    ).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getAllByRole('button', { name: 'Why this topic?' })[0]!);
    expect(screen.getByText(/Connects to the Clarity pillar/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole('option', { name: /Building reliable agents in production/i })
    );
    await user.click(screen.getByRole('button', { name: /generate 2 previews/i }));

    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalledTimes(2);
    });
    expect(onGenerate).toHaveBeenNthCalledWith(1, 'profile-1', {
      topic: 'Why your RAG pipeline wastes tokens',
      contentType: 'SOCIAL_THREAD',
      platform: 'linkedin',
      platformFormat: 'single_post',
    });
    expect(onGenerate).toHaveBeenNthCalledWith(2, 'profile-1', {
      topic: 'Building reliable agents in production',
      contentType: 'SOCIAL_THREAD',
      platform: 'linkedin',
      platformFormat: 'single_post',
    });
  });

  it('shows content format select for instagram and sends platformFormat on generate', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockResolvedValue(savedTest);

    renderPanel({ onGenerate });

    await user.selectOptions(screen.getByLabelText(/target platform/i), 'instagram');
    expect(screen.getByLabelText(/content format/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/content format/i), 'reel');
    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalledWith('profile-1', {
        topic: 'How I approach building in public',
        contentType: 'VIDEO_SCRIPT',
        platform: 'instagram',
        platformFormat: 'reel',
      });
    });
  });

  it('enables compare mode with platform chips and widens the drawer', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('checkbox', { name: /compare platforms/i }));

    expect(screen.getByRole('group', { name: /platforms to compare/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/target platform/i)).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /live output test/i })).toHaveClass('max-w-5xl');
    expect(screen.getByRole('button', { name: /generate comparison/i })).toBeInTheDocument();
  });

  it('reuses saved output tests in compare mode without calling onGenerate', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockResolvedValue(savedTest);
    const history = [
      {
        ...savedTest,
        id: 'x-test',
        platform: 'x' as const,
        topic: 'How I approach building in public',
        title: 'X title',
        body: 'Why do agents fail at scale?',
      },
      {
        ...savedTest,
        id: 'linkedin-test',
        platform: 'linkedin' as const,
        topic: 'How I approach building in public',
        title: 'LinkedIn title',
        body: 'LangGraph gives you explicit state management.',
      },
      {
        ...savedTest,
        id: 'instagram-test',
        platform: 'instagram' as const,
        topic: 'How I approach building in public',
        title: 'Instagram title',
        body: 'Stop chaining prompts blindly.',
      },
    ];

    renderPanel({ history, onGenerate });

    await user.click(screen.getByRole('checkbox', { name: /compare platforms/i }));
    await user.click(screen.getByRole('button', { name: /generate comparison/i }));

    await waitFor(() => {
      expect(screen.getByText('X title')).toBeInTheDocument();
      expect(screen.getByText('LinkedIn title')).toBeInTheDocument();
      expect(screen.getByText('Instagram title')).toBeInTheDocument();
    });
    expect(onGenerate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Structural differences')).toBeInTheDocument();
  });

  it('shows per-column errors when one platform generation fails in compare mode', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockImplementation(async (_profileId, body) => {
      if (body.platform === 'instagram') {
        throw new Error('Instagram generation failed');
      }
      return {
        ...savedTest,
        id: `${body.platform}-generated`,
        platform: body.platform,
        title: `${body.platform} title`,
        body:
          body.platform === 'x'
            ? 'Why orchestration beats prompt chains?'
            : 'LangGraph gives you explicit state management.',
      };
    });

    renderPanel({ onGenerate });

    await user.click(screen.getByRole('checkbox', { name: /compare platforms/i }));
    await user.click(screen.getByRole('button', { name: /generate comparison/i }));

    expect(await screen.findByText('x title')).toBeInTheDocument();
    expect(screen.getByText('linkedin title')).toBeInTheDocument();
    expect(screen.getByText('Instagram generation failed')).toBeInTheDocument();
    expect(onGenerate).toHaveBeenCalledTimes(3);
  });
});
