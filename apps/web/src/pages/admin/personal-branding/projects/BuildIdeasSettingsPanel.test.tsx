import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { BrandProjectSettings } from '@/types/api/personal-branding.dto';
import BuildIdeasSettingsPanel from './BuildIdeasSettingsPanel';
import { DIRECTION_MAX_LENGTH, START_TIME_RANGE_ERROR } from './project-settings-validation';
import { DIRECTION_DEBOUNCE_MS } from './project-settings-save';

const baseSettings: BrandProjectSettings = {
  autoEnabled: true,
  dailyCount: 5,
  startTime: '09:00',
  brandProfileId: null,
  direction: 'Focus on AI tooling',
  nextDueAt: '2026-10-04T09:00:00.000Z',
  lastRunAt: '2026-10-03T09:00:00.000Z',
  lastJobId: 'job-secret-123',
};

const mutate = vi.fn();

vi.mock('@/hooks/usePersonalBrandingProjects', () => ({
  useBrandProjectSettings: vi.fn(),
  usePersonalBrandingProjectsMutations: vi.fn(),
}));

vi.mock('@/hooks/useBrandProfilesList', () => ({
  useBrandProfilesList: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: () => ({
      data: { timeZone: 'America/Chicago' },
      isPending: false,
      isError: false,
    }),
  };
});

import { useBrandProjectSettings, usePersonalBrandingProjectsMutations } from '@/hooks/usePersonalBrandingProjects';
import { useBrandProfilesList } from '@/hooks/useBrandProfilesList';

function mockSettingsQuery(overrides: Partial<ReturnType<typeof useBrandProjectSettings>> = {}) {
  vi.mocked(useBrandProjectSettings).mockReturnValue({
    data: baseSettings,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useBrandProjectSettings>);
}

function mockUpdateSettings(
  overrides: Partial<ReturnType<typeof usePersonalBrandingProjectsMutations>['updateSettings']> = {}
): ReturnType<typeof usePersonalBrandingProjectsMutations>['updateSettings'] {
  return {
    mutate,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    submittedAt: 0,
    ...overrides,
  } as ReturnType<typeof usePersonalBrandingProjectsMutations>['updateSettings'];
}

function mockMutations(
  overrides: Partial<ReturnType<typeof usePersonalBrandingProjectsMutations>> = {}
) {
  vi.mocked(usePersonalBrandingProjectsMutations).mockReturnValue({
    updateSettings: mockUpdateSettings(),
    generate: { mutate: vi.fn(), isPending: false },
    reject: { mutate: vi.fn(), isPending: false },
    complete: { mutate: vi.fn(), isPending: false },
    buildKit: { mutate: vi.fn(), isPending: false },
    activeJobId: null,
    setActiveJobId: vi.fn(),
    jobQuery: { data: undefined, isFetching: false },
    ...overrides,
  } as ReturnType<typeof usePersonalBrandingProjectsMutations>);
}

describe('BuildIdeasSettingsPanel', () => {
  beforeEach(() => {
    mutate.mockClear();
    mockSettingsQuery();
    mockMutations();
    vi.mocked(useBrandProfilesList).mockReturnValue({
      profiles: { data: undefined, isPending: false, isError: false } as unknown as ReturnType<
        typeof useBrandProfilesList
      >['profiles'],
      selectedProfileId: null,
      setSelectedProfileId: vi.fn(),
      profileOptions: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders two sections without Daily generation heading or dashed empty-state surface', () => {
    const { container } = render(<BuildIdeasSettingsPanel />);
    expect(screen.getByRole('heading', { name: /^Automation$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^What gets generated$/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /daily generation/i })).toBeNull();
    expect(screen.getByText(/Next run/i)).toBeInTheDocument();
    expect(screen.getByText(/Last automatic run/i)).toBeInTheDocument();
    expect(screen.queryByText(/job-secret-123/i)).toBeNull();
    expect(container.innerHTML).not.toMatch(/border-dashed/);

    const automationSection = screen.getByRole('region', { name: /automation/i });
    const generationSection = screen.getByRole('region', { name: /what gets generated/i });
    expect(within(automationSection).getByLabelText(/^start time$/i)).toBeInTheDocument();
    expect(within(generationSection).getByRole('spinbutton')).toBeInTheDocument();
  });

  it('increments ideas per day via stepper and shows range in control', () => {
    render(<BuildIdeasSettingsPanel />);
    expect(screen.getByText('3–10')).toBeInTheDocument();
    expect(screen.queryByText(/Whole number from 3 to 10/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /increase ideas per day/i }));
    expect(mutate).toHaveBeenCalledWith({ dailyCount: 6 });
  });

  it('does not mutate when stepper is at min or max', () => {
    mockSettingsQuery({ data: { ...baseSettings, dailyCount: 10 } });
    const { rerender } = render(<BuildIdeasSettingsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /increase ideas per day/i }));
    expect(mutate).not.toHaveBeenCalled();

    mockSettingsQuery({ data: { ...baseSettings, dailyCount: 3 } });
    rerender(<BuildIdeasSettingsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /decrease ideas per day/i }));
    expect(mutate).not.toHaveBeenCalled();
  });

  it('rejects invalid start time on blur', () => {
    mockSettingsQuery({
      data: { ...baseSettings, startTime: '99:99' },
    });
    render(<BuildIdeasSettingsPanel />);
    expect(screen.getByText(START_TIME_RANGE_ERROR)).toBeInTheDocument();
    expect(screen.getByLabelText(/^start time$/i)).toBeInTheDocument();

    const timeInput = screen.getByLabelText(/^start time$/i);
    fireEvent.change(timeInput, { target: { value: '99:99' } });
    fireEvent.blur(timeInput);
    expect(mutate).not.toHaveBeenCalled();
  });

  it('shows query error without default field values', () => {
    mockSettingsQuery({
      data: undefined,
      isError: true,
      error: new Error('Network down'),
    });
    render(<BuildIdeasSettingsPanel />);
    expect(screen.getByText('Network down')).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(screen.queryByDisplayValue('09:00')).toBeNull();
  });

  it('shows loading skeleton without default field values', () => {
    mockSettingsQuery({
      data: undefined,
      isPending: true,
    });
    render(<BuildIdeasSettingsPanel />);
    expect(screen.getByLabelText('Loading settings')).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(screen.queryByDisplayValue('09:00')).toBeNull();
  });

  it('shows saving, error with retry, and saved mutation status', () => {
    mockMutations({
      updateSettings: mockUpdateSettings({ isPending: true }),
    });
    const { rerender } = render(<BuildIdeasSettingsPanel />);
    expect(screen.getByText('Saving…')).toBeInTheDocument();

    mockMutations({
      updateSettings: mockUpdateSettings(),
    });
    rerender(<BuildIdeasSettingsPanel />);

    fireEvent.click(screen.getByRole('button', { name: /increase ideas per day/i }));

    mockMutations({
      updateSettings: mockUpdateSettings({
        isError: true,
        error: new Error('boom'),
        submittedAt: 1,
      }),
    });
    rerender(<BuildIdeasSettingsPanel />);
    expect(screen.getByText("Couldn't save")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(screen.queryByText('Saved')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mutate).toHaveBeenLastCalledWith({ dailyCount: 6 });

    mockMutations({
      updateSettings: mockUpdateSettings({ isSuccess: true, submittedAt: 2 }),
    });
    rerender(<BuildIdeasSettingsPanel />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('debounces direction save and does not mutate on change alone', () => {
    vi.useFakeTimers();
    render(<BuildIdeasSettingsPanel />);
    const direction = screen.getByLabelText(/^direction$/i);
    expect(direction).toHaveAttribute(
      'placeholder',
      'A weekend CLI that turns one paper into a demo.'
    );
    expect(direction).toHaveAttribute('rows', '2');
    expect(screen.getByText(/Sent with Generate now and automatic runs/i)).toBeInTheDocument();
    fireEvent.change(direction, { target: { value: 'New angle' } });
    expect(mutate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(DIRECTION_DEBOUNCE_MS);
    });
    expect(mutate).toHaveBeenCalledWith({ direction: 'New angle' });
  });

  it('rejects over-length direction without PUT', () => {
    vi.useFakeTimers();
    render(<BuildIdeasSettingsPanel />);
    const direction = screen.getByLabelText(/^direction$/i);
    const tooLong = 'x'.repeat(DIRECTION_MAX_LENGTH + 1);
    fireEvent.change(direction, { target: { value: tooLong } });
    act(() => {
      vi.advanceTimersByTime(DIRECTION_DEBOUNCE_MS);
    });
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText(/must be at most 2000 characters/i)).toBeInTheDocument();
  });

  it('keeps steering controls enabled when automatic runs are off', () => {
    mockSettingsQuery({ data: { ...baseSettings, autoEnabled: false } });
    vi.mocked(useBrandProfilesList).mockReturnValue({
      profiles: { data: undefined, isPending: false, isError: false } as unknown as ReturnType<
        typeof useBrandProfilesList
      >['profiles'],
      selectedProfileId: null,
      setSelectedProfileId: vi.fn(),
      profileOptions: [{ id: 'p1', name: 'Main' }],
    });
    render(<BuildIdeasSettingsPanel />);
    expect(screen.getByText('Automatic generation is off')).toBeInTheDocument();
    expect(screen.getByLabelText(/^start time$/i)).toBeDisabled();
    expect(screen.getByText(/Turn on automatic generation to change the start time/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /increase ideas per day/i })).not.toBeDisabled();
    expect(screen.getByLabelText(/^direction$/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/brand profile/i)).not.toBeDisabled();
  });

  it('renders brand profile select with None hint when no profile selected', () => {
    vi.mocked(useBrandProfilesList).mockReturnValue({
      profiles: { data: undefined, isPending: false, isError: false } as unknown as ReturnType<
        typeof useBrandProfilesList
      >['profiles'],
      selectedProfileId: null,
      setSelectedProfileId: vi.fn(),
      profileOptions: [{ id: 'p1', name: 'Main' }],
    });
    render(<BuildIdeasSettingsPanel />);
    expect(screen.getByLabelText(/brand profile/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ideas will not use pillars or audience from a brand profile/i)
    ).toBeInTheDocument();
  });

  it('hides None hint when a brand profile is selected', () => {
    vi.mocked(useBrandProfilesList).mockReturnValue({
      profiles: { data: undefined, isPending: false, isError: false } as unknown as ReturnType<
        typeof useBrandProfilesList
      >['profiles'],
      selectedProfileId: null,
      setSelectedProfileId: vi.fn(),
      profileOptions: [{ id: 'p1', name: 'Main' }],
    });
    mockSettingsQuery({ data: { ...baseSettings, brandProfileId: 'p1' } });
    render(<BuildIdeasSettingsPanel />);
    expect(
      screen.queryByText(/Ideas will not use pillars or audience from a brand profile/i)
    ).toBeNull();
  });

  it('omits brand profile select when profile list is empty', () => {
    render(<BuildIdeasSettingsPanel />);
    expect(screen.queryByLabelText(/brand profile/i)).toBeNull();
  });
});
