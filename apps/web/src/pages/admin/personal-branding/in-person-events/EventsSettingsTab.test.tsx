import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EventsSettingsTab from './EventsSettingsTab';
import type { useInPersonEvents } from '@/hooks/useInPersonEvents';
import type { EventLocationStint } from '@/types/api/personal-branding.dto';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

type InPersonEventsHook = ReturnType<typeof useInPersonEvents>;

const baseSettings = {
  syncCadence: 'WEEKLY' as const,
  syncStartTime: '08:00',
  syncTimezone: 'America/Chicago',
  hasTavilyKey: true,
  interests: [],
  eventTypes: [],
  excludeKeywords: [],
  lookaheadDays: 60,
  minFitScore: 40,
  createGrowthTaskEnabled: false,
  createTaskMinFitScore: 80,
  brandProfileIds: [],
  digestEmailEnabled: false,
};

const sampleStint: EventLocationStint = {
  id: 'stint-1',
  label: 'SF Trip',
  city: 'San Francisco',
  timezone: 'UTC',
  startDate: '2026-09-01',
  endDate: '2026-09-15',
  radiusMiles: 25,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function createEventsMock(
  overrides: Partial<InPersonEventsHook> = {}
): InPersonEventsHook {
  return {
    settings: { data: baseSettings, isPending: false, isError: false },
    locations: {
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
      isPending: false,
      isError: false,
    },
    createLocation: { mutateAsync: vi.fn(), isPending: false },
    updateLocation: { mutateAsync: vi.fn(), isPending: false },
    deleteLocation: { mutateAsync: vi.fn(), isPending: false },
    updateSettings: { mutateAsync: vi.fn(), isPending: false },
    ...overrides,
  } as unknown as InPersonEventsHook;
}

describe('EventsSettingsTab section chrome', () => {
  it('cards only the interactive location stint block', () => {
    render(<EventsSettingsTab events={createEventsMock()} />);

    const whereHeading = screen.getByRole('heading', { name: "Where I'll be" });
    const lookHeading = screen.getByRole('heading', { name: 'What to look for' });
    const cadenceHeading = screen.getByRole('heading', { name: 'Discovery cadence' });

    expect(whereHeading.closest('[class*="shadow-sm"]')).toBeInTheDocument();

    const lookSection = lookHeading.closest('section');
    const cadenceSection = cadenceHeading.closest('section');
    expect(lookSection).toHaveAttribute('aria-labelledby', 'events-settings-look-for-heading');
    expect(cadenceSection).toHaveAttribute('aria-labelledby', 'events-settings-cadence-heading');
    expect(lookSection?.className).not.toMatch(/shadow-sm/);
    expect(cadenceSection?.className).not.toMatch(/shadow-sm/);
  });
});

describe('EventsSettingsTab form labels', () => {
  it('renders visible FormField labels and hints for dates and discovery knobs', () => {
    render(<EventsSettingsTab events={createEventsMock()} />);

    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toBeInTheDocument();
    expect(screen.getByLabelText('Lookahead days')).toBeInTheDocument();
    expect(screen.getByLabelText('Min fit score')).toBeInTheDocument();

    expect(screen.getByText(/hard persist gate/i)).toBeInTheDocument();
    expect(screen.getByText(/events below this threshold are dropped/i)).toBeInTheDocument();
  });

  it('renders stint and comma-separated field labels with example placeholders', () => {
    render(<EventsSettingsTab events={createEventsMock()} />);

    expect(screen.getByLabelText('Label')).toHaveAttribute('placeholder', 'Conference week');
    expect(screen.getByLabelText('City')).toHaveAttribute('placeholder', 'Austin');
    expect(screen.getByLabelText('Interests')).toHaveAttribute('placeholder', 'comma-separated');
    expect(screen.getByLabelText('Exclude keywords')).toHaveAttribute('placeholder', 'comma-separated');
    expect(screen.getAllByText('Separated by commas', { exact: false })).toHaveLength(2);
    expect(
      screen.getByText('Separated by commas. Applied as a hard filter after AI scoring.')
    ).toBeInTheDocument();
  });
});

describe('EventsSettingsTab location stints', () => {
  it('does not show saved list when there are no stints', () => {
    render(<EventsSettingsTab events={createEventsMock()} />);

    expect(screen.queryByText('Saved location stints')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add location stint' })).toBeInTheDocument();
  });

  it('shows saved stints above the form with edit and remove affordances', () => {
    const events = createEventsMock({
      locations: {
        data: { data: [sampleStint], total: 1, page: 1, pageSize: 50, hasMore: false },
        isPending: false,
        isError: false,
      },
    } as unknown as Partial<InPersonEventsHook>);

    render(<EventsSettingsTab events={events} />);

    expect(screen.getByText('Saved location stints')).toBeInTheDocument();
    expect(screen.getByText('SF Trip')).toBeInTheDocument();
    expect(screen.getByText(/San Francisco/)).toBeInTheDocument();
    expect(screen.getByText('2026-09-01 → 2026-09-15')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit SF Trip' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove SF Trip' })).toBeInTheDocument();
  });

  it('loads a stint into the form when Edit is clicked', async () => {
    const user = userEvent.setup();
    const events = createEventsMock({
      locations: {
        data: { data: [sampleStint], total: 1, page: 1, pageSize: 50, hasMore: false },
        isPending: false,
        isError: false,
      },
    } as unknown as Partial<InPersonEventsHook>);

    render(<EventsSettingsTab events={events} />);

    await user.click(screen.getByRole('button', { name: 'Edit SF Trip' }));

    expect(screen.getByDisplayValue('SF Trip')).toBeInTheDocument();
    expect(screen.getByDisplayValue('San Francisco')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows error line when locations query failed', () => {
    const events = createEventsMock({
      locations: {
        data: undefined,
        isPending: false,
        isError: true,
      },
    } as unknown as Partial<InPersonEventsHook>);

    render(<EventsSettingsTab events={events} />);

    expect(
      screen.getByText(/Could not load saved location stints/i)
    ).toBeInTheDocument();
  });
});

describe('EventsSettingsTab growth task settings', () => {
  it('includes createGrowthTaskEnabled and createTaskMinFitScore in save payload', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockResolvedValue({});
    const events = createEventsMock({
      updateSettings: { mutateAsync: updateSettings, isPending: false },
    } as unknown as Partial<InPersonEventsHook>);

    render(<EventsSettingsTab events={events} />);

    await user.click(screen.getByRole('checkbox', { name: /Create Growth tasks/i }));
    fireEvent.change(screen.getByLabelText('Task min fit score'), { target: { value: '85' } });
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        createGrowthTaskEnabled: true,
        createTaskMinFitScore: 85,
      })
    );
  });
});
