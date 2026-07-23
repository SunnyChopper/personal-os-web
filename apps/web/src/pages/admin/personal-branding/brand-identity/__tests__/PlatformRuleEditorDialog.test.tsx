import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PlatformRuleEditorDialog from '../PlatformRuleEditorDialog';
import type { PlatformRuleCatalog } from '@/types/api/personal-branding.dto';
import { personalBrandingService } from '@/services/personal-branding.service';

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    previewPlatformRuleSet: vi.fn(),
  },
}));

const catalog: PlatformRuleCatalog = {
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

describe('PlatformRuleEditorDialog', () => {
  beforeEach(() => {
    vi.mocked(personalBrandingService.previewPlatformRuleSet).mockReset();
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
        })
      );
    });

    expect(await screen.findByText('Sample paragraph for preview.')).toBeInTheDocument();
    expect(screen.getByText('Rewritten preview body.')).toBeInTheDocument();
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
});
