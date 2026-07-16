import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReconSettingsCard from './ReconSettingsCard';

const mockUpdateSettings = vi.fn();
const mockStartRun = vi.fn();

vi.mock('@/hooks/useReconFeed', () => ({
  useReconFeed: () => ({
    settings: {
      data: {
        syncCadence: 'DAILY',
        syncStartTime: '08:00',
        syncEndTime: '20:00',
        syncIntervalHours: 6,
        syncDayOfWeek: 0,
        minRelevanceScore: 0.5,
        maxPostsPerConnection: 5,
        hasRapidApiKey: true,
      },
    },
    updateSettings: {
      mutateAsync: mockUpdateSettings,
      isPending: false,
    },
    startRun: {
      mutateAsync: mockStartRun,
      isPending: false,
    },
    hasActiveNonPausedRun: false,
  }),
}));

describe('ReconSettingsCard', () => {
  it('does not render a RapidAPI key input', () => {
    render(<ReconSettingsCard showToast={vi.fn()} />);

    expect(screen.queryByLabelText(/RapidAPI key/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Paste key/i)).not.toBeInTheDocument();
    expect(screen.getByText(/platform level via Secrets Manager/i)).toBeInTheDocument();
  });

  it('saves cadence settings without rapidApiKey in the payload', async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue(undefined);

    render(<ReconSettingsCard showToast={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.not.objectContaining({ rapidApiKey: expect.anything() })
    );
    const payload = mockUpdateSettings.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('rapidApiKey');
  });
});
