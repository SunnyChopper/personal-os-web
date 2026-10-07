import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ContentStreamProgressStrip from './ContentStreamProgressStrip';
import type { ContentStreamJob } from '@/types/api/personal-branding.dto';

function makeJob(overrides: Partial<ContentStreamJob> = {}): ContentStreamJob {
  return {
    jobId: 'job-1',
    status: 'running',
    stage: 'generating',
    message: 'Generating 3 X short posts with profile Demo',
    createdPostIds: [],
    userId: 'user-1',
    createdAt: '',
    updatedAt: '',
    pollAfterMs: 2000,
    ...overrides,
  };
}

describe('ContentStreamProgressStrip', () => {
  it('returns null when job is absent or terminal succeeded', () => {
    const { container: noJob } = render(<ContentStreamProgressStrip job={null} />);
    expect(noJob).toBeEmptyDOMElement();

    const { container: succeeded } = render(
      <ContentStreamProgressStrip job={makeJob({ status: 'succeeded' })} />
    );
    expect(succeeded).toBeEmptyDOMElement();
  });

  it('shows status strip with progressbar while running', () => {
    render(
      <ContentStreamProgressStrip
        job={makeJob({
          status: 'running',
          stage: 'generating',
          message: 'Generating 3 X short posts with profile Demo',
        })}
      />
    );

    expect(screen.getByRole('status', { name: 'Content stream progress' })).toBeInTheDocument();
    expect(screen.getByText('Generating 3 X short posts with profile Demo')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Content stream progress' })
    ).toBeInTheDocument();
  });

  it('uses danger progress styling when failed', () => {
    render(
      <ContentStreamProgressStrip
        job={makeJob({
          status: 'failed',
          stage: 'generating',
          message: 'Generation failed',
          error: 'Something went wrong',
        })}
      />
    );

    const bar = screen.getByRole('progressbar', { name: 'Content stream progress' });
    expect(bar.firstChild).toHaveClass('bg-red-600');
    expect(screen.getByText('Generation failed')).toHaveClass('text-red-800');
  });
});
