import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PlatformRuleEditorDialog from '../PlatformRuleEditorDialog';
import type { PlatformRuleCatalog } from '@/types/api/personal-branding.dto';
import { personalBrandingService } from '@/services/personal-branding.service';
import {
  PLATFORM_RULE_SET_SAMPLE_TEXT,
  loadCustomSample,
  saveCustomSample,
} from '@/lib/personal-branding/platform-rule-set-sample';

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    previewPlatformRuleSet: vi.fn(),
    annotatePlatformRuleSetInfluence: vi.fn(),
  },
}));

const catalog: PlatformRuleCatalog = {
  modes: [
    {
      id: 'narrative',
      label: 'Narrative',
      definition: 'Tell a story.',
      example: 'I shipped the launch at 2 a.m., broke prod, then recovered by dawn.',
      enabledEffect: 'Use storytelling.',
      disabledEffect: 'Avoid story arcs.',
    },
  ],
  devices: [
    {
      id: 'metaphor',
      label: 'Metaphor',
      definition: 'Direct comparison.',
      example: 'Your LinkedIn profile is your storefront window.',
      enabledEffect: 'May use metaphors.',
      disabledEffect: 'Do not use metaphors.',
    },
  ],
  strengths: ['subtle', 'light', 'moderate', 'strong', 'dominant'],
  wordsPerMinute: 200,
  limitDefaults: {
    x: { characterLimit: 280, readTimeLimitMinutes: 1 },
    linkedin: { characterLimit: 1300, readTimeLimitMinutes: 3 },
    medium: { characterLimit: 2500, readTimeLimitMinutes: 6 },
  },
};

describe('PlatformRuleEditorDialog', () => {
  beforeEach(() => {
    vi.mocked(personalBrandingService.previewPlatformRuleSet).mockReset();
    vi.mocked(personalBrandingService.annotatePlatformRuleSetInfluence).mockReset();
    vi.mocked(personalBrandingService.annotatePlatformRuleSetInfluence).mockResolvedValue({
      appliedInfluences: [],
    });
    localStorage.clear();
  });

  it('shows editable sample textarea with default text before testing', () => {
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/sample text for rule test/i)).toHaveValue(
      PLATFORM_RULE_SET_SAMPLE_TEXT
    );
  });

  it('requires non-blank requirements before submit', async () => {
    const onCreate = vi.fn();
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={onCreate}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /create rule/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Requirements are required');
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('shows mode definitions when selected', () => {
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /narrative/i }));
    expect(screen.getByText('Tell a story.')).toBeInTheDocument();
    expect(screen.getByText('When enabled: Use storytelling.')).toBeInTheDocument();
    expect(screen.getByLabelText(/narrative strength/i)).toBeInTheDocument();
  });

  it('collapses rhetorical modes and shows selection summary', () => {
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /narrative/i }));
    fireEvent.click(screen.getByRole('button', { name: /rhetorical modes/i }));

    expect(screen.queryByRole('checkbox', { name: /narrative/i })).not.toBeInTheDocument();
    expect(screen.getByText('Narrative')).toBeInTheDocument();
  });

  it('re-expands rhetorical modes after collapse', () => {
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    const modesToggle = screen.getByRole('button', { name: /rhetorical modes/i });
    fireEvent.click(modesToggle);
    fireEvent.click(modesToggle);

    expect(screen.getByRole('checkbox', { name: /narrative/i })).toBeInTheDocument();
  });

  it('hydrates edit state and submits update with requirements', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[
          {
            id: 'p1',
            name: 'Founder',
            userId: 'u',
            createdAt: '',
            updatedAt: '',
            status: 'active',
            pillars: [],
            platforms: [],
            toneMetrics: {},
            bannedPhrases: [],
          },
        ]}
        catalog={catalog}
        initial={{
          id: 'rule-1',
          platform: 'linkedin',
          name: 'LI default',
          characterLimit: 3000,
          readTimeLimitMinutes: 3,
          rhetoricalModes: [{ mode: 'narrative', strength: 'strong' }],
          rhetoricalDevices: ['metaphor'],
          requirements: 'Existing requirements',
          needsReview: false,
          profileIds: ['p1'],
          isUniversal: false,
          userId: 'u',
          createdAt: '',
          updatedAt: '',
        }}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    expect(screen.getByDisplayValue('Existing requirements')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(onUpdate).toHaveBeenCalledWith(
      'rule-1',
      expect.objectContaining({
        requirements: 'Existing requirements',
        profileIds: ['p1'],
      })
    );
  });

  it('keeps dialog open and does not reject when onUpdate fails (9ada7a942ca1)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onUpdate = vi.fn().mockRejectedValue(new Error('An unexpected error occurred'));
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={onClose}
        profiles={[]}
        catalog={catalog}
        initial={{
          id: 'rule-1',
          platform: 'linkedin',
          name: 'LI default',
          characterLimit: 3000,
          readTimeLimitMinutes: 3,
          rhetoricalModes: [],
          rhetoricalDevices: [],
          requirements: 'Existing requirements',
          needsReview: false,
          profileIds: [],
          isUniversal: true,
          userId: 'u',
          createdAt: '',
          updatedAt: '',
        }}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('submits universal rule when no profiles selected', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={onCreate}
        onUpdate={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/requirements/i), 'Universal baseline guidance.');
    await user.click(screen.getByRole('button', { name: /create rule/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        requirements: 'Universal baseline guidance.',
        profileIds: [],
      })
    );
  });

  it('shows Test this rule set button and renders preview on success', async () => {
    const user = userEvent.setup();
    vi.mocked(personalBrandingService.previewPlatformRuleSet).mockResolvedValue({
      sampleText: 'Sample paragraph for preview.',
      body: 'Rewritten preview body.',
      appliedPolicy: {
        rhetoricalModes: [{ mode: 'narrative', strength: 'moderate' }],
        rhetoricalDevices: [],
        requirements: 'Use short paragraphs.',
        appliedRuleIds: [],
      },
    });
    vi.mocked(personalBrandingService.annotatePlatformRuleSetInfluence).mockResolvedValue({
      appliedInfluences: [
        {
          kind: 'device',
          id: 'ruleOfThree',
          summary: 'Rule of three used in steps',
          previewExcerpt: 'Rewritten preview body.',
        },
      ],
    });

    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /narrative/i }));
    await user.click(screen.getByRole('button', { name: /test this rule set/i }));

    await waitFor(() => {
      expect(personalBrandingService.previewPlatformRuleSet).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'linkedin',
          rhetoricalModes: [{ mode: 'narrative', strength: 'moderate' }],
          sampleText: PLATFORM_RULE_SET_SAMPLE_TEXT,
        })
      );
    });

    await waitFor(() => {
      expect(personalBrandingService.annotatePlatformRuleSetInfluence).toHaveBeenCalledWith(
        expect.objectContaining({
          sampleText: 'Sample paragraph for preview.',
          body: 'Rewritten preview body.',
        })
      );
    });

    expect(await screen.findByText('Rewritten preview body.')).toBeInTheDocument();
    expect(await screen.findByText('Rule of three used in steps')).toBeInTheDocument();
  });

  it('still shows preview when rule influence annotate fails', async () => {
    const user = userEvent.setup();
    vi.mocked(personalBrandingService.previewPlatformRuleSet).mockResolvedValue({
      sampleText: 'Sample paragraph for preview.',
      body: 'Rewritten preview body.',
      appliedPolicy: {
        rhetoricalModes: [],
        rhetoricalDevices: [],
        requirements: 'Use short paragraphs.',
        appliedRuleIds: [],
      },
    });
    vi.mocked(personalBrandingService.annotatePlatformRuleSetInfluence).mockRejectedValue(
      new Error('Influence service unavailable')
    );

    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /test this rule set/i }));

    expect(await screen.findByText('Rewritten preview body.')).toBeInTheDocument();
    expect(await screen.findByText(/influence service unavailable/i)).toBeInTheDocument();
  });

  it('sends custom sample text when testing rule set', async () => {
    const user = userEvent.setup();
    const customSample = 'My draft thread about shipping faster with fewer meetings.';
    vi.mocked(personalBrandingService.previewPlatformRuleSet).mockResolvedValue({
      sampleText: customSample,
      body: 'Rewritten custom draft.',
      appliedPolicy: {
        rhetoricalModes: [],
        rhetoricalDevices: [],
        requirements: '',
        appliedRuleIds: [],
      },
    });

    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    const sampleField = screen.getByLabelText(/sample text for rule test/i);
    await user.clear(sampleField);
    await user.type(sampleField, customSample);
    await user.click(screen.getByRole('button', { name: /test this rule set/i }));

    await waitFor(() => {
      expect(personalBrandingService.previewPlatformRuleSet).toHaveBeenCalledWith(
        expect.objectContaining({
          sampleText: customSample,
        })
      );
    });
  });

  it('sends brandProfileIds for all mapped profiles when testing rule set', async () => {
    const user = userEvent.setup();
    vi.mocked(personalBrandingService.previewPlatformRuleSet).mockResolvedValue({
      sampleText: PLATFORM_RULE_SET_SAMPLE_TEXT,
      body: 'Rewritten preview body.',
      appliedPolicy: {
        rhetoricalModes: [],
        rhetoricalDevices: [],
        requirements: 'Use short paragraphs.',
        appliedRuleIds: [],
      },
      validationIssues: [],
    });

    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[
          {
            id: 'p1',
            name: 'Founder',
            userId: 'u',
            createdAt: '',
            updatedAt: '',
            status: 'active',
            pillars: [],
            platforms: [],
            toneMetrics: {},
            bannedPhrases: [],
          },
          {
            id: 'p2',
            name: 'Operator',
            userId: 'u',
            createdAt: '',
            updatedAt: '',
            status: 'active',
            pillars: [],
            platforms: [],
            toneMetrics: {},
            bannedPhrases: [],
          },
        ]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/requirements/i), 'Use short paragraphs.');
    await user.click(screen.getByRole('checkbox', { name: /founder/i }));
    await user.click(screen.getByRole('checkbox', { name: /operator/i }));
    await user.click(screen.getByRole('button', { name: /test this rule set/i }));

    await waitFor(() => {
      expect(personalBrandingService.previewPlatformRuleSet).toHaveBeenCalledWith(
        expect.objectContaining({
          brandProfileId: 'p1',
          brandProfileIds: ['p1', 'p2'],
        })
      );
    });
  });

  it('shows stale notice when sample text changes after preview', async () => {
    const user = userEvent.setup();
    vi.mocked(personalBrandingService.previewPlatformRuleSet).mockResolvedValue({
      sampleText: PLATFORM_RULE_SET_SAMPLE_TEXT,
      body: 'Rewritten preview body.',
      appliedPolicy: {
        rhetoricalModes: [],
        rhetoricalDevices: [],
        requirements: '',
        appliedRuleIds: [],
      },
    });

    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /test this rule set/i }));
    expect(await screen.findByText('Rewritten preview body.')).toBeInTheDocument();

    const sampleField = screen.getByLabelText(/sample text for rule test/i);
    await user.type(sampleField, ' extra');

    expect(await screen.findByText(/draft changed — run test again/i)).toBeInTheDocument();
  });

  it('restores last custom sample from localStorage when reopening edit dialog', async () => {
    const user = userEvent.setup();
    const customSample = 'Persisted draft excerpt for rule-1.';
    saveCustomSample('rule-1', customSample);

    const { rerender } = render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        initial={{
          id: 'rule-1',
          platform: 'linkedin',
          name: 'LI default',
          characterLimit: 1300,
          readTimeLimitMinutes: 3,
          rhetoricalModes: [],
          rhetoricalDevices: [],
          requirements: 'Existing requirements',
          needsReview: false,
          profileIds: [],
          isUniversal: true,
          userId: 'u',
          createdAt: '',
          updatedAt: '',
        }}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/sample text for rule test/i)).toHaveValue(customSample);

    rerender(
      <PlatformRuleEditorDialog
        isOpen={false}
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        initial={{
          id: 'rule-1',
          platform: 'linkedin',
          name: 'LI default',
          characterLimit: 1300,
          readTimeLimitMinutes: 3,
          rhetoricalModes: [],
          rhetoricalDevices: [],
          requirements: 'Existing requirements',
          needsReview: false,
          profileIds: [],
          isUniversal: true,
          userId: 'u',
          createdAt: '',
          updatedAt: '',
        }}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    rerender(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        initial={{
          id: 'rule-1',
          platform: 'linkedin',
          name: 'LI default',
          characterLimit: 1300,
          readTimeLimitMinutes: 3,
          rhetoricalModes: [],
          rhetoricalDevices: [],
          requirements: 'Existing requirements',
          needsReview: false,
          profileIds: [],
          isUniversal: true,
          userId: 'u',
          createdAt: '',
          updatedAt: '',
        }}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/sample text for rule test/i)).toHaveValue(customSample);
    expect(loadCustomSample('rule-1')).toBe(customSample);

    await user.type(screen.getByLabelText(/sample text for rule test/i), ' updated');
    await waitFor(() => {
      expect(loadCustomSample('rule-1')).toContain('updated');
    });
  });

  it('shows preview error when test request fails', async () => {
    const user = userEvent.setup();
    vi.mocked(personalBrandingService.previewPlatformRuleSet).mockRejectedValue(
      new Error('Preview failed')
    );

    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /test this rule set/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Preview failed');
  });

  it('seeds LinkedIn defaults on create open and shows indicator', () => {
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('1300')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /platform default applied/i })).toBeInTheDocument();
  });

  it('applies new platform defaults when platform changes from defaults', async () => {
    const user = userEvent.setup();
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Platform' }));
    await user.click(screen.getByRole('option', { name: /x \(twitter\)/i }));

    expect(screen.getByDisplayValue('280')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /platform default applied/i })).toBeInTheDocument();
  });

  it('preserves custom limits when platform changes', async () => {
    const user = userEvent.setup();
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    const characterInput = screen.getByDisplayValue('1300');
    await user.clear(characterInput);
    await user.type(characterInput, '500');

    await user.click(screen.getByRole('button', { name: 'Platform' }));
    await user.click(screen.getByRole('option', { name: /x \(twitter\)/i }));

    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: /platform default applied/i })
    ).not.toBeInTheDocument();
  });

  it('dismisses platform default indicator', async () => {
    const user = userEvent.setup();
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /dismiss platform default notice/i }));
    expect(
      screen.queryByRole('status', { name: /platform default applied/i })
    ).not.toBeInTheDocument();
  });

  it('does not auto-apply defaults when editing an existing rule', () => {
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        initial={{
          id: 'rule-1',
          platform: 'linkedin',
          name: 'LI default',
          characterLimit: null,
          readTimeLimitMinutes: null,
          rhetoricalModes: [],
          rhetoricalDevices: [],
          requirements: 'Existing requirements',
          needsReview: false,
          profileIds: [],
          isUniversal: true,
          userId: 'u',
          createdAt: '',
          updatedAt: '',
        }}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.queryByDisplayValue('1300')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: /platform default applied/i })
    ).not.toBeInTheDocument();
  });

  it('shows consistency warning for high authority vs conversational requirement', async () => {
    const user = userEvent.setup();
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[
          {
            id: 'p1',
            name: 'Founder',
            userId: 'u',
            createdAt: '',
            updatedAt: '',
            status: 'active',
            pillars: [],
            platforms: [],
            toneMetrics: { authority: 0.8 },
            bannedPhrases: [],
          },
        ]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    await user.type(
      screen.getByLabelText(/requirements/i),
      'Write in a conversational tone with casual slang.'
    );
    await user.click(screen.getByRole('checkbox', { name: /founder/i }));
    await user.click(screen.getByRole('button', { name: /check consistency/i }));

    expect(
      await screen.findByText(
        '[Founder] High Authority (0.80) may conflict with the "conversational" requirement'
      )
    ).toBeInTheDocument();
  });

  it('accepts consistency warnings and hides the panel', async () => {
    const user = userEvent.setup();
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[
          {
            id: 'p1',
            name: 'Founder',
            userId: 'u',
            createdAt: '',
            updatedAt: '',
            status: 'active',
            pillars: [],
            platforms: [],
            toneMetrics: { authority: 0.8 },
            bannedPhrases: [],
          },
        ]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/requirements/i), 'Keep it conversational.');
    await user.click(screen.getByRole('checkbox', { name: /founder/i }));
    await user.click(screen.getByRole('button', { name: /check consistency/i }));
    expect(await screen.findByText(/consistency check/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /accept warnings/i }));
    expect(screen.queryByText(/consistency check/i)).not.toBeInTheDocument();
  });

  it('focuses requirements when adjust is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[
          {
            id: 'p1',
            name: 'Founder',
            userId: 'u',
            createdAt: '',
            updatedAt: '',
            status: 'active',
            pillars: [],
            platforms: [],
            toneMetrics: { authority: 0.8 },
            bannedPhrases: [],
          },
        ]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    const requirements = screen.getByLabelText(/requirements/i);
    await user.type(requirements, 'Keep it conversational.');
    await user.click(screen.getByRole('checkbox', { name: /founder/i }));
    await user.click(screen.getByRole('button', { name: /check consistency/i }));
    await user.click(screen.getByRole('button', { name: /adjust requirements/i }));

    expect(requirements).toHaveFocus();
  });

  it('still saves when consistency warnings are present', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[
          {
            id: 'p1',
            name: 'Founder',
            userId: 'u',
            createdAt: '',
            updatedAt: '',
            status: 'active',
            pillars: [],
            platforms: [],
            toneMetrics: { authority: 0.8 },
            bannedPhrases: [],
          },
        ]}
        catalog={catalog}
        onCreate={onCreate}
        onUpdate={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/requirements/i), 'Keep it conversational.');
    await user.click(screen.getByRole('checkbox', { name: /founder/i }));
    await user.click(screen.getByRole('button', { name: /check consistency/i }));
    expect(await screen.findByText(/may conflict/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /create rule/i }));
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        requirements: 'Keep it conversational.',
      })
    );
  });

  it('shows starter templates in create mode', () => {
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Start from a template')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /x thread – educational/i })).toBeInTheDocument();
  });

  it('hides starter templates in edit mode', () => {
    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        initial={{
          id: 'rule-1',
          platform: 'linkedin',
          name: 'LI default',
          characterLimit: 1300,
          readTimeLimitMinutes: 3,
          rhetoricalModes: [],
          rhetoricalDevices: [],
          requirements: 'Existing requirements',
          needsReview: false,
          profileIds: [],
          isUniversal: true,
          userId: 'u',
          createdAt: '',
          updatedAt: '',
        }}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.queryByText('Start from a template')).not.toBeInTheDocument();
  });

  it('applies X educational template and allows submit after edits', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <PlatformRuleEditorDialog
        isOpen
        onClose={() => undefined}
        profiles={[]}
        catalog={catalog}
        onCreate={onCreate}
        onUpdate={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: /x thread – educational\./i,
      })
    );

    expect(screen.getByDisplayValue('280')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('X Thread – Educational')).toBeInTheDocument();
    expect((screen.getByLabelText(/requirements/i) as HTMLTextAreaElement).value).toContain(
      'numbered thread'
    );
    expect(screen.getByRole('status', { name: /template applied/i })).toBeInTheDocument();

    const requirements = screen.getByLabelText(/requirements/i);
    await user.clear(requirements);
    await user.type(requirements, 'Custom thread guidance after template apply.');
    await user.click(screen.getByRole('button', { name: /create rule/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: 'x',
        name: 'X Thread – Educational',
        requirements: 'Custom thread guidance after template apply.',
        rhetoricalModes: [
          { mode: 'instructional', strength: 'strong' },
          { mode: 'expository', strength: 'moderate' },
        ],
        rhetoricalDevices: ['rhetoricalQuestion', 'analogy', 'ruleOfThree', 'parallelism'],
        characterLimit: 280,
        readTimeLimitMinutes: 1,
      })
    );
  });
});
