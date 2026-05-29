import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LinkedStackTrace from './LinkedStackTrace';

const REPO_ROOT = '/Users/dev/personal-os';

const SAMPLE_TRACE = [
  'Traceback (most recent call last):',
  '  File "/usr/local/lib/python3.12/site-packages/langchain_core/runnables/base.py", line 100, in invoke',
  '  File "/usr/local/lib/python3.12/site-packages/langchain_core/runnables/base.py", line 200, in _call',
  '  File "/var/task/src/assistant/engine.py", line 42, in agent_callable',
  'ValueError: test failure',
].join('\n');

describe('LinkedStackTrace', () => {
  it('shows native frames and collapses external frames by default', () => {
    render(
      <LinkedStackTrace
        text={SAMPLE_TRACE}
        settings={{ localRepoRoot: REPO_ROOT, protocol: 'none' }}
      />
    );

    expect(screen.getByText(/Traceback \(most recent call last\):/)).toBeInTheDocument();
    expect(screen.getByText(/\/var\/task\/src\/assistant\/engine\.py/)).toBeInTheDocument();
    expect(screen.getByText(/ValueError: test failure/)).toBeInTheDocument();
    expect(screen.queryByText(/langchain_core\/runnables\/base\.py/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show 2 external frames/i })).toBeInTheDocument();
  });

  it('reveals external frames when the collapse control is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LinkedStackTrace
        text={SAMPLE_TRACE}
        settings={{ localRepoRoot: REPO_ROOT, protocol: 'none' }}
      />
    );

    const toggle = screen.getByRole('button', { name: /show 2 external frames/i });
    await user.click(toggle);

    expect(screen.getByText(/langchain_core\/runnables\/base\.py/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide 2 external frames/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await user.click(screen.getByRole('button', { name: /hide 2 external frames/i }));
    expect(screen.queryByText(/langchain_core\/runnables\/base\.py/)).not.toBeInTheDocument();
  });

  it('renders all frame lines when collapse is disabled', () => {
    render(
      <LinkedStackTrace
        text={SAMPLE_TRACE}
        settings={{ localRepoRoot: REPO_ROOT, protocol: 'none' }}
        collapseExternalFramesByDefault={false}
      />
    );

    expect(screen.getByText(/line 100/)).toBeInTheDocument();
    expect(screen.getByText(/line 200/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /external frame/i })).not.toBeInTheDocument();
  });
});
