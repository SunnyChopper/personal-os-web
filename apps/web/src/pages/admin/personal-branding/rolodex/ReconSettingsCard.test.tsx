import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
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

const mockDistillGuidance = vi.fn();

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
    distillSelectionGuidance: {
      mutateAsync: mockDistillGuidance,
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render a RapidAPI key input', () => {
    renderCard();

    expect(screen.queryByLabelText(/RapidAPI key/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Paste key/i)).not.toBeInTheDocument();
    expect(screen.getByText(/platform level via Secrets Manager/i)).toBeInTheDocument();
  });

  it('renders section intro heading and RapidAPI status badge', () => {
    renderCard();

    expect(screen.getByRole('heading', { level: 2, name: 'Recon settings' })).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
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
    expect(payload.syncCadence).toBe('DAILY');
    expect(payload.syncEndTime).toBeNull();
  });

  it('hides schedule fields for MANUAL_ONLY and clears schedule on save', async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue(undefined);

    renderCard();

    await user.selectOptions(screen.getByLabelText(/Sync cadence/i), 'MANUAL_ONLY');

    expect(screen.queryByText(/^Start time$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^End time$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Interval \(hours\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Day of week/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        syncCadence: 'MANUAL_ONLY',
        syncStartTime: null,
        syncEndTime: null,
        syncTimezone: null,
        syncIntervalHours: null,
        syncDayOfWeek: null,
      })
    );
  });

  it('shows interval and end time only for EVERY_N_HOURS', async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue(undefined);

    renderCard();

    await user.selectOptions(screen.getByLabelText(/Sync cadence/i), 'EVERY_N_HOURS');

    expect(screen.getByText(/Interval \(hours\)/i)).toBeInTheDocument();
    expect(screen.getByText(/^Start time$/i)).toBeInTheDocument();
    expect(screen.getByText(/^End time$/i)).toBeInTheDocument();
    expect(screen.queryByText(/Day of week/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        syncCadence: 'EVERY_N_HOURS',
        syncIntervalHours: 6,
        syncEndTime: '20:00',
        syncStartTime: '08:00',
      })
    );
  });

  it('shows start time without end time for DAILY', async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue(undefined);

    renderCard();

    expect(screen.getByText(/^Start time$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^End time$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Interval \(hours\)/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        syncCadence: 'DAILY',
        syncStartTime: '08:00',
        syncEndTime: null,
      })
    );
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

  it('renders selection guidance textarea with compact default height', () => {
    renderCard();

    const guidanceField = screen.getByPlaceholderText(/Prefer:/i);
    expect(guidanceField).toHaveAttribute('rows', '3');
    expect(guidanceField.className).toContain('min-h-[72px]');
  });

  it('includes selection guidance in save payload', async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue(undefined);

    renderCard();

    const guidanceField = screen.getByPlaceholderText(/Prefer:/i);
    await user.clear(guidanceField);
    await user.type(guidanceField, 'Prefer technical debates.');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ selectionGuidance: 'Prefer technical debates.' })
    );
  });

  it('loads distilled guidance into the textarea without saving', async () => {
    const user = userEvent.setup();
    mockDistillGuidance.mockResolvedValue({
      proposedGuidance: '**Prefer**\n- Deep technical posts',
      sampleSize: 4,
    });

    renderCard();

    await user.click(screen.getByRole('button', { name: 'Draft from feedback' }));

    expect(mockDistillGuidance).toHaveBeenCalled();
    expect(mockUpdateSettings).not.toHaveBeenCalled();
    const guidanceField = await screen.findByPlaceholderText(/Prefer:/i);
    expect(guidanceField).toHaveValue('**Prefer**\n- Deep technical posts');
  });
});
