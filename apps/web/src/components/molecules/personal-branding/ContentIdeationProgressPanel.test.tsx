import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ContentIdeationProgressPanel from './ContentIdeationProgressPanel';
import type { ContentIdeationJob } from '@/types/api/personal-branding.dto';

function makeJob(overrides: Partial<ContentIdeationJob> = {}): ContentIdeationJob {
  return {
    jobId: 'job-1',
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    status: 'running',
    stage: 'generating',
    message: 'Generating ideas',
    pollAfterMs: 2000,
    ...overrides,
  };
}

describe('ContentIdeationProgressPanel', () => {
  it('returns null when job is absent or terminal succeeded', () => {
    const { container: noJob } = render(<ContentIdeationProgressPanel job={null} />);
    expect(noJob).toBeEmptyDOMElement();

    const { container: succeeded } = render(
      <ContentIdeationProgressPanel job={makeJob({ status: 'succeeded' })} />
    );
    expect(succeeded).toBeEmptyDOMElement();
  });

  it('shows slim status strip with progressbar while running', () => {
    render(
      <ContentIdeationProgressPanel
        job={makeJob({ status: 'running', stage: 'generating', message: 'Generating ideas' })}
      />
    );

    expect(screen.getByRole('status', { name: 'Content ideation progress' })).toBeInTheDocument();
    expect(screen.getByText('Generating ideas')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Content ideation progress' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('Queued')).not.toBeInTheDocument();
  });

  it('uses danger progress styling when failed', () => {
    render(
      <ContentIdeationProgressPanel
        job={makeJob({
          status: 'failed',
          stage: 'generating',
          message: 'Generation failed',
          error: 'Something went wrong',
        })}
      />
    );

    const bar = screen.getByRole('progressbar', { name: 'Content ideation progress' });
    expect(bar.firstChild).toHaveClass('bg-red-600');
    expect(screen.getByText('Generation failed')).toHaveClass('text-red-800');
  });

  it('shows Cancel while in-flight and invokes onCancel', async () => {
    const onCancel = vi.fn();
    render(
      <ContentIdeationProgressPanel
        job={makeJob({ status: 'running', message: 'Generating ideas' })}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows cancelled strip without Cancel control', () => {
    render(<ContentIdeationProgressPanel job={null} clientCancelled />);

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
