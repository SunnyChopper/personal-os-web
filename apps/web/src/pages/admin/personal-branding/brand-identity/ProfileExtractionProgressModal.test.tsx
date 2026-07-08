import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProfileExtractionProgressModal from './ProfileExtractionProgressModal';
import type { ProfileExtractionJob } from '@/types/api/personal-branding.dto';

function makeFailedJob(error: string): ProfileExtractionJob {
  return {
    jobId: 'job-1',
    profileId: 'profile-1',
    status: 'failed',
    stage: 'failed',
    message: 'Extraction failed',
    sourceCount: 2,
    processedSourceCount: 2,
    error,
    userId: 'user-1',
    createdAt: '2026-07-02T23:14:03.623736Z',
    updatedAt: '2026-07-02T23:14:14.196013Z',
  };
}

describe('ProfileExtractionProgressModal', () => {
  it('shows the extraction error and Close button when the job failed', () => {
    const onClose = vi.fn();
    const errorMessage = 'OpenAI API error: invalid_api_key';

    render(
      <ProfileExtractionProgressModal
        isOpen
        job={makeFailedJob(errorMessage)}
        pollTimedOut={false}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Extraction failed')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onClose when the user dismisses a failed extraction', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ProfileExtractionProgressModal
        isOpen
        job={makeFailedJob('Provider unavailable')}
        pollTimedOut={false}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
