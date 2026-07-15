import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RadarDiscoveryRunMonitor from './RadarDiscoveryRunMonitor';
import type { RadarDiscoveryRun } from '@/types/api/personal-branding.dto';

function makeRun(status: RadarDiscoveryRun['status']): RadarDiscoveryRun {
  return {
    runId: 'run-1',
    status,
    profileSnapshots: [],
    profileNames: ['Builder'],
    customTopics: [],
    effectiveTopics: ['AI Systems'],
    generatedQueries: [],
    phase: 'evaluating',
    currentActivity: 'Scoring candidates',
    progress: {
      queriesTotal: 4,
      queriesCompleted: 2,
      candidatesDiscovered: 8,
      candidatesEvaluated: 3,
      candidatesRelevant: 2,
      candidatesNotRelevant: 1,
      candidatesFailed: 0,
    },
    createdAt: '2026-07-14T12:00:00Z',
    updatedAt: '2026-07-14T12:01:00Z',
  };
}

describe('RadarDiscoveryRunMonitor', () => {
  it('offers Continue and Cancel for a paused durable run', async () => {
    const user = userEvent.setup();
    const onResume = vi.fn();
    const onCancel = vi.fn();
    render(
      <RadarDiscoveryRunMonitor
        run={makeRun('paused')}
        onPause={vi.fn()}
        onResume={onResume}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onResume).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('makes queued HTTP acceptance distinct from completion', () => {
    render(
      <RadarDiscoveryRunMonitor
        run={makeRun('queued')}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/request was accepted/i)).toBeInTheDocument();
    expect(screen.getByText(/has not completed yet/i)).toBeInTheDocument();
  });
});
