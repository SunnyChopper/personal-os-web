import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ReconSettingsCard from './ReconSettingsCard';

const mockUpdateSettings = vi.fn();
const mockStartRun = vi.fn();

const baseSettings = {
  syncCadence: 'DAILY' as const,
  syncStartTime: '08:00',
  syncEndTime: '20:00',
  syncIntervalHours: 6,
  syncDayOfWeek: 0,
  minRelevanceScore: 0.5,
  maxPostsPerConnection: 5,
  maxPostAgeDays: 7,
  hasRapidApiKey: true,
  lastRunAt: '2026-07-15T19:41:48.000Z',
  lastSuccessfulRunAt: '2026-07-14T08:00:00.000Z',
  nextDueAt: '2026-07-17T08:00:00.000Z',
};

vi.mock('@/hooks/useReconFeed', () => ({
  useReconFeed: () => ({
    settings: {
      data: baseSettings,
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

function renderCard() {
  return render(
    <MemoryRouter>
      <ReconSettingsCard showToast={vi.fn()} />
    </MemoryRouter>
  );
}

describe('ReconSettingsCard', () => {
  it('does not render a RapidAPI key input', () => {
    renderCard();

    expect(screen.queryByLabelText(/RapidAPI key/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Paste key/i)).not.toBeInTheDocument();
    expect(screen.getByText(/platform level via Secrets Manager/i)).toBeInTheDocument();
  });

  it('saves cadence settings without rapidApiKey in the payload', async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue(undefined);

    renderCard();

    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.not.objectContaining({ rapidApiKey: expect.anything() })
    );
    const payload = mockUpdateSettings.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('rapidApiKey');
    expect(payload.maxPostAgeDays).toBe(7);
  });

  it('shows max post age input', () => {
    renderCard();

    expect(screen.getByText(/Max post age \(days\)/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('7')).toBeInTheDocument();
    expect(screen.getByText(/never ingested/i)).toBeInTheDocument();
  });

  it('shows separate successful and attempted run timestamps', () => {
    renderCard();

    expect(screen.getByText(/Last successful run/i)).toBeInTheDocument();
    expect(screen.getByText(/Last attempted run/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Next due/i).length).toBeGreaterThan(0);
  });
});
