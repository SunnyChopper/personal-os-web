import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { BrandProjectJob } from '@/types/api/personal-branding.dto';
import BuildKitRevisePanel from './BuildKitRevisePanel';

const kitReviseMutate = vi.fn();
const applyMutate = vi.fn();
const alertSpy = vi.fn();

const state = {
  kitRevise: {
    mutate: kitReviseMutate,
    isPending: false,
    variables: undefined as { ideaId: string; repo: string } | undefined,
  },
  applyKitRevision: {
    mutate: applyMutate,
    isPending: false,
    error: null as Error | null,
  },
  jobQuery: { data: undefined as BrandProjectJob | undefined },
};

vi.mock('@/hooks/usePersonalBrandingProjects', () => ({
  usePersonalBrandingProjectsMutations: () => state,
}));

vi.mock('@/hooks/useTerminalJobFailureAlert', () => ({
  useTerminalJobFailureAlert: (input: unknown) => {
    alertSpy(input);
  },
}));

function proposalJob(overrides: Partial<BrandProjectJob> = {}): BrandProjectJob {
  return {
    jobId: 'job-1',
    jobType: 'kitrevise',
    status: 'succeeded',
    ideaIds: [],
    droppedDuplicateCount: 0,
    createdAt: '2026-10-05T00:00:00Z',
    proposal: {
      repo: 'acme/demo',
      baseGeneratedAt: '2026-10-01T00:00:00Z',
      summary: 'Align the skill with the repo',
      treeTruncated: false,
      items: [
        {
          reason: 'The README describes a tighter skill',
          operation: { op: 'updateSkill', name: 'api-style', skillMarkdown: '# tighter' },
        },
      ],
    },
    ...overrides,
  };
}

describe('BuildKitRevisePanel', () => {
  beforeEach(() => {
    kitReviseMutate.mockClear();
    applyMutate.mockClear();
    alertSpy.mockClear();
    state.kitRevise.isPending = false;
    state.kitRevise.variables = undefined;
    state.applyKitRevision.isPending = false;
    state.applyKitRevision.error = null;
    state.jobQuery.data = undefined;
  });

  it('submits a public repo', () => {
    render(<BuildKitRevisePanel ideaId="idea-1" generatedAt="2026-10-01T00:00:00Z" />);
    fireEvent.change(screen.getByLabelText('Public GitHub repository'), {
      target: { value: 'acme/demo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Suggest changes' }));
    expect(kitReviseMutate).toHaveBeenCalledWith(
      { ideaId: 'idea-1', repo: 'acme/demo' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  function latchJob() {
    kitReviseMutate.mockImplementation(
      (_args: unknown, options: { onSuccess: (data: { jobId: string }) => void }) => {
        options.onSuccess({ jobId: 'job-1' });
      }
    );
    fireEvent.change(screen.getByLabelText('Public GitHub repository'), {
      target: { value: 'acme/demo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Suggest changes' }));
  }

  it('shows a proposal and applies it only after confirm', () => {
    state.jobQuery.data = proposalJob();
    render(<BuildKitRevisePanel ideaId="idea-1" generatedAt="2026-10-01T00:00:00Z" />);
    latchJob();
    expect(screen.getByText('Align the skill with the repo')).toBeInTheDocument();
    expect(screen.getByText('Update skill api-style')).toBeInTheDocument();
    expect(screen.getByText('The README describes a tighter skill')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply 1 changes' }));
    expect(applyMutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }));
    expect(applyMutate).toHaveBeenCalledWith(
      {
        ideaId: 'idea-1',
        baseGeneratedAt: '2026-10-01T00:00:00Z',
        operations: [{ op: 'updateSkill', name: 'api-style', skillMarkdown: '# tighter' }],
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('disables apply when the kit changed', () => {
    state.jobQuery.data = proposalJob();
    render(<BuildKitRevisePanel ideaId="idea-1" generatedAt="2026-10-02T00:00:00Z" />);
    latchJob();
    expect(screen.getByText(/changed after the suggestion/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply 1 changes' })).toBeDisabled();
  });

  it('reports telemetry for provider failures and not for private repos', () => {
    state.jobQuery.data = proposalJob({
      status: 'failed',
      error: 'Repository not found, or it is private. Only public repositories can be read.',
      errorCode: 'VALIDATION_FAILED',
      retryable: false,
      proposal: null,
    });
    const view = render(<BuildKitRevisePanel ideaId="idea-1" generatedAt="2026-10-01T00:00:00Z" />);
    latchJob();
    expect(screen.getByRole('alert')).toHaveTextContent(/private/i);
    expect(alertSpy.mock.lastCall?.[0]).toEqual(expect.objectContaining({ jobId: undefined }));

    state.jobQuery.data = proposalJob({
      status: 'failed',
      error: 'Kit revision cannot be applied',
      errorCode: 'LLM_PROVIDER_ERROR',
      retryable: true,
      proposal: null,
    });
    view.rerender(<BuildKitRevisePanel ideaId="idea-1" generatedAt="2026-10-01T00:00:00Z" />);
    expect(alertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-1', errorCode: 'LLM_PROVIDER_ERROR' })
    );
  });
});
