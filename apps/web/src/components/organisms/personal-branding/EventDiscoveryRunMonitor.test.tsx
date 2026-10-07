import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { EventDiscoveryRun } from '@/types/api/personal-branding.dto';
import EventDiscoveryRunMonitor from './EventDiscoveryRunMonitor';

const run: EventDiscoveryRun = {
  id: 'run-1',
  status: 'running',
  triggerKind: 'manual',
  phase: 'scoring',
  queriesGenerated: 2,
  resultsFetched: 4,
  candidatesExtracted: 2,
  eventsCreated: 1,
  eventsDuplicate: 0,
  eventsFiltered: 1,
  generatedQueries: ['AI meetups Austin', 'AI conferences Austin'],
  activityLog: [{ at: '2026-08-21T01:00:00Z', phase: 'scoring', message: 'Scoring pages' }],
  extractedEvents: [
    {
      title: 'Austin AI Meetup',
      city: 'Austin',
      startsAt: '2026-09-10T18:00:00Z',
      eventType: 'meetup',
      fitScore: 82,
      sourceUrl: 'https://example.com/event',
      outcome: 'created',
      reason: null,
    },
    {
      title: 'Crypto Summit',
      city: 'Austin',
      startsAt: '2026-09-12T18:00:00Z',
      eventType: 'conference',
      fitScore: 35,
      sourceUrl: 'https://example.com/crypto',
      outcome: 'filtered',
      reason: 'excludedKeyword',
    },
  ],
  createdAt: '2026-08-21T00:59:00Z',
  updatedAt: '2026-08-21T01:00:00Z',
};

describe('EventDiscoveryRunMonitor', () => {
  it('renders queries, candidate outcomes, and cancellation control', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<EventDiscoveryRunMonitor run={run} onCancel={onCancel} />);

    expect(screen.getByText('AI meetups Austin')).toBeInTheDocument();
    expect(screen.getByText('Austin AI Meetup')).toBeInTheDocument();
    expect(screen.getByText(/Excluded keyword/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel event discovery run' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('disables cancellation while the run is cancelling', () => {
    render(<EventDiscoveryRunMonitor run={{ ...run, status: 'cancelling' }} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Cancel event discovery run' })).toBeDisabled();
    expect(screen.getByText(/Stopping discovery/i)).toBeInTheDocument();
  });
});
