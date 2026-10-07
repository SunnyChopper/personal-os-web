import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { useInPersonEvents } from '@/hooks/useInPersonEvents';
import type { InPersonEvent } from '@/types/api/personal-branding.dto';
import EventsCalendarTab from './EventsCalendarTab';

const TODAY = '2026-08-13';

function makeEvent(
  overrides: Partial<InPersonEvent> & Pick<InPersonEvent, 'id' | 'title'>
): InPersonEvent {
  return {
    status: 'INTERESTED',
    startsAt: `${TODAY}T18:00:00.000Z`,
    url: null,
    city: 'Austin',
    dateConfidence: 'exact',
    eventType: 'meetup',
    topicTags: [],
    manuallyAdded: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function stubEvents(
  eventRows: InPersonEvent[] = [],
  options?: { filteredAllEvents?: InPersonEvent[]; minFitScore?: number }
): ReturnType<typeof useInPersonEvents> {
  const filteredAllEvents = options?.filteredAllEvents ?? eventRows;
  return {
    events: {
      data: { data: eventRows, total: eventRows.length, page: 1, pageSize: 100, hasMore: false },
    },
    locations: { data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false } },
    filteredAllEvents,
    operatorToday: TODAY,
    minFitScore: options?.minFitScore ?? 40,
  } as unknown as ReturnType<typeof useInPersonEvents>;
}

describe('EventsCalendarTab', () => {
  it('marks today with aria-current=date', () => {
    render(<EventsCalendarTab events={stubEvents()} />);
    expect(screen.getByRole('button', { current: 'date' })).toHaveAttribute('aria-label', TODAY);
  });

  it('does not show the detail strip or empty copy on initial load', () => {
    render(<EventsCalendarTab events={stubEvents()} />);
    expect(screen.queryByLabelText('Selected day details')).not.toBeInTheDocument();
    expect(screen.queryByText('No events on this day.')).not.toBeInTheDocument();
  });

  it('does not show the detail strip when an empty day is selected', async () => {
    const user = userEvent.setup();
    render(<EventsCalendarTab events={stubEvents()} />);

    await user.click(screen.getByRole('button', { name: TODAY }));

    expect(screen.queryByLabelText('Selected day details')).not.toBeInTheDocument();
    expect(screen.queryByText('No events on this day.')).not.toBeInTheDocument();
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('shows a flat strip with locale date when the day has events', async () => {
    const user = userEvent.setup();
    const event = makeEvent({
      id: 'evt-1',
      title: 'Design Systems Meetup',
      url: 'https://example.com/event',
    });
    const { container } = render(<EventsCalendarTab events={stubEvents([event])} />);

    await user.click(screen.getByRole('button', { name: `${TODAY}, 1 event` }));

    const strip = screen.getByLabelText('Selected day details');
    expect(strip.className).not.toMatch(/rounded-2xl/);
    expect(strip.className).not.toMatch(/shadow-sm/);
    expect(strip.className).not.toMatch(/border-t/);
    expect(strip.className).not.toMatch(/bg-gray-50/);
    expect(within(strip).getByText('Thursday, August 13')).toBeInTheDocument();
    expect(container.querySelector(`time[datetime="${TODAY}"]`)).toBeInTheDocument();
  });

  it('lists event titles and View / Register links when the day has events', async () => {
    const user = userEvent.setup();
    const event = makeEvent({
      id: 'evt-1',
      title: 'Design Systems Meetup',
      url: 'https://example.com/event',
    });

    render(<EventsCalendarTab events={stubEvents([event])} />);
    await user.click(screen.getByRole('button', { name: `${TODAY}, 1 event` }));

    const strip = screen.getByLabelText('Selected day details');
    expect(within(strip).getByText('Design Systems Meetup')).toBeInTheDocument();
    expect(within(strip).getByRole('link', { name: 'View / Register' })).toHaveAttribute(
      'href',
      'https://example.com/event'
    );
  });

  it('clears the strip when the selected day is clicked again', async () => {
    const user = userEvent.setup();
    const event = makeEvent({ id: 'evt-1', title: 'Design Systems Meetup' });
    render(<EventsCalendarTab events={stubEvents([event])} />);

    const dayButton = screen.getByRole('button', { name: `${TODAY}, 1 event` });
    await user.click(dayButton);
    expect(screen.getByLabelText('Selected day details')).toBeInTheDocument();

    await user.click(dayButton);
    expect(screen.queryByLabelText('Selected day details')).not.toBeInTheDocument();
  });

  it('navigates to the pad month without showing the detail strip when the pad day has no events', async () => {
    const user = userEvent.setup();
    render(<EventsCalendarTab events={stubEvents()} />);

    await user.click(screen.getByRole('button', { name: '2026-07-26' }));

    expect(screen.getByRole('heading', { level: 2, name: 'July 2026' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Selected day details')).not.toBeInTheDocument();
    expect(screen.queryByText('Sunday, July 26')).not.toBeInTheDocument();
  });

  it('Today button restores current month and selects today without a strip when today has no events', async () => {
    const user = userEvent.setup();
    render(<EventsCalendarTab events={stubEvents()} />);

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('heading', { level: 2, name: 'September 2026' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Selected day details')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Jump to today' }));

    expect(screen.getByRole('heading', { level: 2, name: 'August 2026' })).toBeInTheDocument();
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jump to today' })).toBeDisabled();
  });

  it('disables Today when already anchored on today in the current month without a strip', async () => {
    const user = userEvent.setup();
    render(<EventsCalendarTab events={stubEvents()} />);

    await user.click(screen.getByRole('button', { name: TODAY }));
    expect(screen.getByRole('button', { name: 'Jump to today' })).toBeDisabled();
    expect(screen.queryByLabelText('Selected day details')).not.toBeInTheDocument();
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });
});
