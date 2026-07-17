import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RadarDiscoverySetupDialog from './RadarDiscoverySetupDialog';
import type { BrandProfile } from '@/types/api/personal-branding.dto';

vi.mock('@/components/molecules/Dialog', () => ({
  default: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title?: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

const profile: BrandProfile = {
  id: 'profile-1',
  name: 'Builder',
  description: 'Builds durable systems',
  pillars: ['AI Systems', 'Product Craft'],
  targetAudience: 'Technical founders',
  toneMetrics: {},
  bannedPhrases: [],
  status: 'active',
  userId: 'user-1',
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
};

describe('RadarDiscoverySetupDialog', () => {
  it('requires a selected profile before queueing', async () => {
    const user = userEvent.setup();
    render(
      <RadarDiscoverySetupDialog isOpen profiles={[profile]} onClose={vi.fn()} onStart={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'Queue discovery' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Select at least one brand profile.');
  });

  it('submits selected profile pillars and deduplicated custom topics', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn().mockResolvedValue(undefined);
    render(
      <RadarDiscoverySetupDialog isOpen profiles={[profile]} onClose={vi.fn()} onStart={onStart} />
    );

    await user.click(screen.getByPlaceholderText('Search profiles…'));
    await user.click(screen.getByRole('option', { name: 'Builder' }));
    await user.type(screen.getByLabelText('Custom topic'), 'Durable Agents');
    await user.click(screen.getByRole('button', { name: 'Add topic' }));
    await user.type(screen.getByLabelText('Custom topic'), ' durable agents ');
    await user.click(screen.getByRole('button', { name: 'Add topic' }));
    await user.click(screen.getByRole('button', { name: 'Queue discovery' }));

    expect(onStart).toHaveBeenCalledWith({
      profileSelections: [{ profileId: 'profile-1', pillars: ['AI Systems', 'Product Craft'] }],
      customTopics: ['Durable Agents'],
    });
  });
});
