import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PlatformRuleEditorDialog from '../PlatformRuleEditorDialog';
import type { PlatformRuleCatalog } from '@/types/api/personal-branding.dto';

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
    expect(screen.getByLabelText(/narrative strength/i)).toBeInTheDocument();
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
});
