import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RolodexNotificationsCard from './RolodexNotificationsCard';

vi.mock('@/hooks/useRolodexFollowUpAlerts', () => ({
  useRolodexFollowUpAlerts: () => ({
    followUpAlertsQ: { isPending: false },
    saveAlertsMut: { mutateAsync: vi.fn(), isPending: false },
    setDraftAlertsEnabled: vi.fn(),
    alertsEnabled: false,
  }),
}));

vi.mock('@/hooks/useReconFeedContentAlerts', () => ({
  useReconFeedContentAlerts: () => ({
    contentAlertsQ: { isPending: false },
    saveAlertsMut: { mutateAsync: vi.fn(), isPending: false },
    setDraftAlertsEnabled: vi.fn(),
    alertsEnabled: false,
  }),
}));

describe('RolodexNotificationsCard', () => {
  it('renders SectionIntro heading with aria-labelledby target', () => {
    render(<RolodexNotificationsCard showToast={vi.fn()} />);

    const heading = screen.getByRole('heading', { level: 2, name: 'Notifications' });
    expect(heading).toHaveAttribute('id', 'rolodex-notifications-heading');
    expect(
      screen.getByText(/Uses your saved notification webhook when enabled in proactive settings/i)
    ).toBeInTheDocument();
  });
});
