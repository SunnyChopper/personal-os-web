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

function makeQueuedJob(): ProfileExtractionJob {
  return {
    jobId: 'job-1',
    profileId: 'profile-1',
    status: 'queued',
    stage: 'queued',
    message: 'Queued for extraction',
    sourceCount: 70,
    processedSourceCount: 0,
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
      <ProfileExtractionProgressModal isOpen job={makeFailedJob(errorMessage)} onClose={onClose} />
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
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows uploading step detail while client upload is in progress', () => {
    render(
      <ProfileExtractionProgressModal
        isOpen
        job={undefined}
        clientUploadProgress={{
          phase: 'uploading',
          filesCompleted: 12,
          filesTotal: 70,
          bytesUploaded: 340,
          bytesTotal: 1000,
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Uploading sources — 12/70 files (34%)')).toBeInTheDocument();
    expect(screen.getByText('Uploaded 12/70 · 34%')).toBeInTheDocument();
    expect(screen.getByText('Uploading sources')).toBeInTheDocument();
  });

  it('calls onClose when Run in background is clicked for a non-terminal job', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ProfileExtractionProgressModal isOpen job={makeQueuedJob()} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Run in background' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the dialog X is clicked for a non-terminal job', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ProfileExtractionProgressModal isOpen job={makeQueuedJob()} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel extraction is clicked for a non-terminal job', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <ProfileExtractionProgressModal
        isOpen
        job={makeQueuedJob()}
        onClose={vi.fn()}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel extraction' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows cancelled message and Close button when the job was cancelled', () => {
    render(
      <ProfileExtractionProgressModal
        isOpen
        job={{
          ...makeQueuedJob(),
          status: 'cancelled',
          stage: 'cancelled',
          message: 'Extraction cancelled',
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Extraction cancelled')).toBeInTheDocument();
    expect(
      screen.getByText('Extraction was cancelled. No new profile version was created.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('shows X profile pipeline steps instead of PDF upload steps', () => {
    render(
      <ProfileExtractionProgressModal
        isOpen
        job={{
          ...makeQueuedJob(),
          sourceTypes: ['x_profile'],
          sourceCount: 1,
          message: 'Fetching X timeline for @amplifywithai',
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Fetching X timeline')).toBeInTheDocument();
    expect(screen.queryByText('Uploading sources')).not.toBeInTheDocument();
    expect(screen.queryByText('Parsing PDFs')).not.toBeInTheDocument();
  });
});
