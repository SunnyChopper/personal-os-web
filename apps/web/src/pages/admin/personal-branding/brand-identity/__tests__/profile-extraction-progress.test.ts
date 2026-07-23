import { describe, expect, it } from 'vitest';
import {
  extractionEffectiveStage,
  extractionIsTerminal,
  extractionPipelineSteps,
  extractionProgressPercent,
  extractionStatusLabel,
  extractionStepCaption,
  formatExtractionMetrics,
  formatUploadProgressDetail,
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
    ).toBe(8);
  });

  it('stays below 50% when analyzing starts with zero sources processed', () => {
    expect(
      extractionProgressPercent(
        makeJob({
          status: 'running',
          stage: 'analyzing_sources',
          sourceTypes: ['pdf'],
          sourceCount: 70,
          processedSourceCount: 0,
          totalChunkCount: 0,
          processedChunkCount: 0,
        })
      )
    ).toBe(24);
  });

  it('advances analyzing progress via chunk ratio when totals are known', () => {
    expect(
      extractionProgressPercent(
        makeJob({
          status: 'running',
          stage: 'analyzing_sources',
          sourceTypes: ['pdf'],
          sourceCount: 70,
          processedSourceCount: 60,
          totalChunkCount: 400,
          processedChunkCount: 128,
        })
      )
    ).toBe(42);
  });

  it('interpolates parsing progress near the parsing band start', () => {
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
    ).toBe(12);
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

  it('tracks client upload byte progress within the uploading band', () => {
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
    ).toBe(4);
  });
});

describe('formatExtractionMetrics', () => {
  it('omits chunks when totalChunkCount is zero', () => {
    expect(
      formatExtractionMetrics(
        makeJob({
          status: 'running',
          stage: 'analyzing_sources',
          sourceCount: 70,
          processedSourceCount: 0,
          totalChunkCount: 0,
          processedChunkCount: 128,
        })
      )
    ).toEqual({
      sources: { processed: 0, total: 70, succeeded: 0, failed: 0 },
      chunks: null,
      chunksPendingDiscovery: true,
    });
  });

  it('shows chunks when totalChunkCount is positive', () => {
    expect(
      formatExtractionMetrics(
        makeJob({
          status: 'running',
          stage: 'analyzing_sources',
          sourceCount: 70,
          processedSourceCount: 60,
          totalChunkCount: 400,
          processedChunkCount: 128,
        })
      ).chunks
    ).toEqual({ processed: 128, total: 400 });
  });
});

describe('extractionStepCaption', () => {
  it('shows chunk caption during analyzing when totals are known', () => {
    expect(
      extractionStepCaption(
        'analyzing_sources',
        makeJob({
          status: 'running',
          stage: 'analyzing_sources',
          sourceCount: 70,
          totalChunkCount: 400,
          processedChunkCount: 128,
        })
      )
    ).toBe('128 of 400 chunks analyzed');
  });
});

describe('extractionIsTerminal', () => {
  it('treats cancelled as terminal', () => {
    expect(extractionIsTerminal(makeJob({ status: 'cancelled', stage: 'cancelled' }))).toBe(true);
    expect(extractionIsTerminal(makeJob({ status: 'running', stage: 'analyzing' }))).toBe(false);
    expect(extractionIsTerminal(makeJob({ status: 'cancelling', stage: 'cancelling' }))).toBe(
      false
    );
  });
});

describe('extractionStatusLabel', () => {
  it('labels cancelled jobs neutrally', () => {
    expect(extractionStatusLabel(makeJob({ status: 'cancelled', stage: 'cancelled' }))).toBe(
      'Extraction cancelled'
    );
  });
});

describe('extractionStatusLabel upload', () => {
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

  it('normalizes reading_sources to parsing_sources', () => {
    expect(extractionEffectiveStage(makeJob({ status: 'running', stage: 'reading_sources' }))).toBe(
      'parsing_sources'
    );
  });
});
