import { describe, expect, it } from 'vitest';
import {
  extractionPipelineSteps,
  extractionProgressPercent,
  extractionStatusLabel,
  formatUploadProgressDetail,
  extractionEffectiveStage,
  resolveExtractionPipelineVariant,
  resolveExtractionSourceTypes,
} from '../profile-extraction-progress';
import type {
  ProfileExtractionClientProgress,
  ProfileExtractionJob,
} from '@/types/api/personal-branding.dto';

function makeJob(
  partial: Partial<ProfileExtractionJob> & Pick<ProfileExtractionJob, 'status'>
): ProfileExtractionJob {
  return {
    jobId: 'job-1',
    profileId: 'profile-1',
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

function makeClientUpload(
  partial: Partial<ProfileExtractionClientProgress> = {}
): ProfileExtractionClientProgress {
  return {
    phase: 'uploading',
    filesCompleted: 0,
    filesTotal: 10,
    bytesUploaded: 0,
    bytesTotal: 1000,
    ...partial,
  };
}

describe('resolveExtractionPipelineVariant', () => {
  it('prefers file pipeline when any pdf is present', () => {
    expect(resolveExtractionPipelineVariant(['x_profile', 'pdf'])).toBe('file');
    expect(resolveExtractionPipelineVariant(['pdf'])).toBe('file');
  });

  it('uses x pipeline for x_profile without pdf', () => {
    expect(resolveExtractionPipelineVariant(['x_profile'])).toBe('x');
    expect(resolveExtractionPipelineVariant(['x_profile', 'text'])).toBe('x');
  });

  it('uses text pipeline for snippets only', () => {
    expect(resolveExtractionPipelineVariant(['text'])).toBe('text');
    expect(resolveExtractionPipelineVariant(['url'])).toBe('text');
  });
});

describe('resolveExtractionSourceTypes', () => {
  it('uses client sourceTypesHint for x-only jobs before poll returns sourceTypes', () => {
    expect(
      resolveExtractionSourceTypes(undefined, {
        phase: 'starting',
        filesCompleted: 0,
        filesTotal: 0,
        bytesUploaded: 0,
        bytesTotal: 0,
        sourceTypesHint: ['x_profile'],
      })
    ).toEqual(['x_profile']);
  });
});

describe('extractionPipelineSteps', () => {
  it('omits uploading for x profile jobs', () => {
    const steps = extractionPipelineSteps('x');
    expect(steps.map((step) => step.label)).toEqual([
      'Queued',
      'Fetching X timeline',
      'Analyzing voice and pillars',
      'Reducing evidence',
      'Saving profile',
    ]);
  });
});

describe('extractionProgressPercent', () => {
  it('returns low progress for queued file jobs', () => {
    expect(
      extractionProgressPercent(
        makeJob({
          status: 'queued',
          stage: 'queued',
          sourceTypes: ['pdf'],
        })
      )
    ).toBe(19);
  });

  it('interpolates source reading progress for file jobs', () => {
    expect(
      extractionProgressPercent(
        makeJob({
          status: 'running',
          stage: 'parsing_sources',
          sourceTypes: ['pdf'],
          sourceCount: 4,
          processedSourceCount: 2,
        })
      )
    ).toBe(46);
  });

  it('returns completion for succeeded_with_warnings jobs', () => {
    expect(
      extractionProgressPercent(
        makeJob({
          status: 'succeeded_with_warnings',
          stage: 'succeeded',
        })
      )
    ).toBe(100);
  });

  it('returns completion for succeeded jobs', () => {
    expect(
      extractionProgressPercent(
        makeJob({
          status: 'succeeded',
          stage: 'succeeded',
        })
      )
    ).toBe(100);
  });

  it('tracks client upload byte progress within the uploading step', () => {
    expect(
      extractionProgressPercent(
        undefined,
        makeClientUpload({
          bytesUploaded: 500,
          bytesTotal: 1000,
          filesCompleted: 5,
          filesTotal: 10,
        })
      )
    ).toBe(8);
  });
});

describe('extractionStatusLabel', () => {
  it('shows file count and percent during client upload', () => {
    expect(
      extractionStatusLabel(
        undefined,
        makeClientUpload({
          filesCompleted: 12,
          filesTotal: 70,
          bytesUploaded: 340,
          bytesTotal: 1000,
        })
      )
    ).toBe('Uploading sources — 12/70 files (34%)');
  });

  it('uses X-specific parsing label', () => {
    expect(
      extractionStatusLabel(
        makeJob({
          status: 'running',
          stage: 'parsing_sources',
          sourceTypes: ['x_profile'],
        })
      )
    ).toBe('Fetching X timeline');
  });
});

describe('formatUploadProgressDetail', () => {
  it('formats uploaded file count and percent', () => {
    expect(
      formatUploadProgressDetail(
        makeClientUpload({
          filesCompleted: 12,
          filesTotal: 70,
          bytesUploaded: 340,
          bytesTotal: 1000,
        })
      )
    ).toBe('Uploaded 12/70 · 34%');
  });
});

describe('extractionEffectiveStage', () => {
  it('forces uploading while client upload is active', () => {
    expect(
      extractionEffectiveStage(
        makeJob({ status: 'queued', stage: 'queued' }),
        makeClientUpload({ phase: 'uploading' })
      )
    ).toBe('uploading');
  });

  it('shows queued while registering sources before poll catches up', () => {
    expect(
      extractionEffectiveStage(
        makeJob({ status: 'uploading', stage: 'uploading' }),
        makeClientUpload({ phase: 'registering_sources', filesTotal: 0, bytesTotal: 0 })
      )
    ).toBe('queued');
  });
});
