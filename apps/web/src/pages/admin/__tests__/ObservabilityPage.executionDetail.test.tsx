import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import {
  computeTokenInputSharePercent,
  formatObservabilityTokenCount,
  formatPromptTokenValue,
} from '@/lib/observability-formatters';
import ObservabilityPage from '../ObservabilityPage';
import { observabilityService } from '@/services/observability.service';

vi.mock('@/services/assistant-sandbox.service', () => ({
  assistantSandboxService: {
    createSession: vi.fn(),
  },
}));

vi.mock('@/services/observability.service', () => ({
  observabilityService: {
    getBurnSummary: vi.fn(),
    getBurnTimeseries: vi.fn(),
    getBurnBreakdown: vi.fn(),
    getHealthSummary: vi.fn(),
    getHealthMatrix: vi.fn(),
    listExecutions: vi.fn(),
    getExecution: vi.fn(),
    replayJob: vi.fn(),
  },
}));

const emptyPage = { data: [], total: 0, page: 1, pageSize: 50, hasMore: false };

function renderPage(initialEntry = '/admin/assistant/observability') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={client}>
        <ObservabilityPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('ObservabilityPage execution detail', () => {
  beforeEach(() => {
    vi.mocked(observabilityService.getBurnSummary).mockResolvedValue({
      todayCostUsd: 0,
      last7dCostUsd: 0,
      totalTokens: 0,
      failedExecutions: 0,
      avgLatencyMs: null,
      totalCalls: 0,
    });
    vi.mocked(observabilityService.getBurnTimeseries).mockResolvedValue({ points: [] });
    vi.mocked(observabilityService.getBurnBreakdown).mockResolvedValue({
      rows: [],
      groupBy: 'module',
    });
    vi.mocked(observabilityService.getHealthSummary).mockResolvedValue({
      totalRuns: 0,
      failureCount: 0,
      lastFailureAt: null,
    });
    vi.mocked(observabilityService.getHealthMatrix).mockResolvedValue({ rows: [] });
    vi.mocked(observabilityService.listExecutions).mockResolvedValue(emptyPage);
  });

  it('shows providerRequestId when Trace & correlation is expanded', async () => {
    const user = userEvent.setup();
    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-1',
          occurredAt: new Date().toISOString(),
          module: 'assistant',
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          status: 'succeeded',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-1',
      occurredAt: new Date().toISOString(),
      module: 'assistant',
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      status: 'succeeded',
      requestId: null,
      providerRequestId: 'req_01provider',
      threadId: 't1',
      runId: 'r1',
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('assistant'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /trace & correlation/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /trace & correlation/i }));

    await waitFor(() => {
      expect(screen.getByText('req_01provider')).toBeInTheDocument();
    });
  });

  it('formats raw float latencyMs in execution detail', async () => {
    const user = userEvent.setup();
    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-lat',
          occurredAt: new Date().toISOString(),
          module: 'assistant',
          provider: 'groq',
          model: 'm',
          status: 'succeeded',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-lat',
      occurredAt: new Date().toISOString(),
      module: 'assistant',
      provider: 'groq',
      model: 'm',
      status: 'succeeded',
      latencyMs: 791.7987729999965,
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('assistant'));

    await waitFor(() => {
      expect(screen.getByText('791.8')).toBeInTheDocument();
      expect(screen.queryByText('791.7987729999965')).not.toBeInTheDocument();
    });
  });

  it('renders token and cost stats in Overview section', async () => {
    const user = userEvent.setup();
    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-tokens',
          occurredAt: new Date().toISOString(),
          module: 'assistant',
          provider: 'openai',
          model: 'gpt-4',
          status: 'succeeded',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-tokens',
      occurredAt: new Date().toISOString(),
      module: 'assistant',
      provider: 'openai',
      model: 'gpt-4',
      status: 'succeeded',
      inputTokens: 12453,
      outputTokens: 412,
      totalTokens: 12865,
      inputCostUsd: 0.0124,
      outputCostUsd: 0.0008,
      totalCostUsd: 0.0132,
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('assistant'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Overview')).toBeInTheDocument();
      expect(within(dialog).getByText('Tokens')).toBeInTheDocument();
      expect(dialog.textContent).toContain('12,453 (97% input share)');
      expect(dialog.textContent).toContain('412');
      expect(dialog.textContent).toContain('12,865');
      expect(dialog.textContent).toContain('$0.0124');
      expect(dialog.textContent).toContain('$0.0008');
    });
  });

  it('renders em dash for null token fields in detail', async () => {
    const user = userEvent.setup();
    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-unmeasured',
          occurredAt: new Date().toISOString(),
          module: 'assistant',
          provider: 'groq',
          model: 'm',
          status: 'succeeded',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-unmeasured',
      occurredAt: new Date().toISOString(),
      module: 'assistant',
      provider: 'groq',
      model: 'm',
      status: 'succeeded',
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('assistant'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Overview')).toBeInTheDocument();
      expect(dialog.textContent).toMatch(/In:\s*—/);
      expect(dialog.textContent).not.toContain('input share');
    });
  });

  it('collapses third-party frames in stack trace by default', async () => {
    const user = userEvent.setup();
    const stackTrace = [
      'Traceback (most recent call last):',
      '  File "/usr/local/lib/python3.12/site-packages/langchain_core/runnables/base.py", line 10, in invoke',
      '  File "/var/task/src/assistant/engine.py", line 99, in agent_callable',
      'RuntimeError: failed',
    ].join('\n');

    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-trace',
          occurredAt: new Date().toISOString(),
          module: 'assistant',
          provider: 'groq',
          model: 'm',
          status: 'failed',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-trace',
      occurredAt: new Date().toISOString(),
      module: 'assistant',
      provider: 'groq',
      model: 'm',
      status: 'failed',
      stackTrace,
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('assistant'));

    await waitFor(() => {
      expect(screen.getByText('Failure details')).toBeInTheDocument();
      expect(screen.getByText(/\/var\/task\/src\/assistant\/engine\.py/)).toBeInTheDocument();
      expect(screen.queryByText(/langchain_core\/runnables\/base\.py/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show 1 external frame/i })).toBeInTheDocument();
    });
  });

  it('renders assistant prompt messages with real line breaks, not literal \\n', async () => {
    const user = userEvent.setup();
    const promptText = JSON.stringify([
      { role: 'system', text: '## Context\n\nFirst line.\nSecond line.' },
      { role: 'user', text: 'What is on my calendar?' },
    ]);

    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-prompt',
          occurredAt: new Date().toISOString(),
          module: 'assistant',
          provider: 'groq',
          model: 'm',
          status: 'succeeded',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-prompt',
      occurredAt: new Date().toISOString(),
      module: 'assistant',
      provider: 'groq',
      model: 'm',
      status: 'succeeded',
      promptText,
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('assistant'));

    await waitFor(() => {
      expect(screen.getByText('system')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Context' })).toBeInTheDocument();
      expect(screen.getByText(/First line\.\s*Second line\./)).toBeInTheDocument();
      expect(screen.getByText('What is on my calendar?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /prompt/i })).toBeInTheDocument();
      const dialog = screen.getByRole('dialog');
      expect(dialog.textContent ?? '').not.toMatch(/\\n/);
      expect(dialog.textContent ?? '').not.toContain('```json');
    });
  });

  it('shows dash when providerRequestId is null', async () => {
    const user = userEvent.setup();
    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-2',
          occurredAt: new Date().toISOString(),
          module: 'assistant',
          provider: 'groq',
          model: 'm',
          status: 'succeeded',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-2',
      occurredAt: new Date().toISOString(),
      module: 'assistant',
      provider: 'groq',
      model: 'm',
      status: 'succeeded',
      requestId: null,
      providerRequestId: null,
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('assistant'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /trace & correlation/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /trace & correlation/i }));

    await waitFor(() => {
      const providerLabel = screen
        .getAllByText('providerRequestId')
        .find((el) => el.tagName === 'DT');
      const row = providerLabel?.parentElement;
      expect(row?.textContent).toContain('—');
    });
  });

  it('copies trace id via CopyIconButton', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-copy',
          occurredAt: new Date().toISOString(),
          module: 'assistant',
          provider: 'groq',
          model: 'm',
          status: 'succeeded',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-copy-id',
      occurredAt: new Date().toISOString(),
      module: 'assistant',
      provider: 'groq',
      model: 'm',
      status: 'succeeded',
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('assistant'));
    await user.click(screen.getByRole('button', { name: /trace & correlation/i }));

    await waitFor(() => {
      expect(screen.getByText('exec-copy-id')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /copy id/i }));
    expect(writeText).toHaveBeenCalledWith('exec-copy-id');
  });

  it('renders error banner and Raw payloads when present', async () => {
    const user = userEvent.setup();
    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-raw',
          occurredAt: new Date().toISOString(),
          module: 'assistant',
          provider: 'openai',
          model: 'gpt-4',
          status: 'failed',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-raw',
      occurredAt: new Date().toISOString(),
      module: 'assistant',
      provider: 'openai',
      model: 'gpt-4',
      status: 'failed',
      errorMessage: 'Model rate limit exceeded',
      requestMetadataJson: { temperature: 0.2 },
      pricingSnapshotJson: { inputUsdPer1M: 0.5 },
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('assistant'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Model rate limit exceeded');
      expect(screen.getByRole('button', { name: /raw payloads/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /raw payloads/i }));

    await waitFor(() => {
      expect(screen.getByText('requestMetadataJson')).toBeInTheDocument();
      expect(screen.getByText('pricingSnapshotJson')).toBeInTheDocument();
    });
  });
});

describe('ObservabilityPage investigate thread', () => {
  beforeEach(() => {
    vi.mocked(observabilityService.getBurnSummary).mockResolvedValue({
      todayCostUsd: 0,
      last7dCostUsd: 0,
      totalTokens: 0,
      failedExecutions: 0,
      avgLatencyMs: null,
      totalCalls: 0,
    });
    vi.mocked(observabilityService.getBurnTimeseries).mockResolvedValue({ points: [] });
    vi.mocked(observabilityService.getBurnBreakdown).mockResolvedValue({
      rows: [],
      groupBy: 'module',
    });
    vi.mocked(observabilityService.getHealthSummary).mockResolvedValue({
      totalRuns: 1,
      failureCount: 1,
      lastFailureAt: new Date().toISOString(),
    });
    vi.mocked(observabilityService.listExecutions).mockResolvedValue(emptyPage);
  });

  it('switches to execution log with filters when Investigate is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(observabilityService.getHealthMatrix).mockResolvedValue({
      rows: [
        {
          rowId: 'job-run-1',
          jobName: 'proactive_daily',
          jobType: 'proactive_automation',
          lastStatus: 'failed',
          lastStartedAt: new Date().toISOString(),
          threadId: 'thread-abc',
          runId: 'run-xyz',
          correlationId: 'corr-1',
        },
      ],
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: /automation health/i }));
    await user.click(screen.getByRole('button', { name: /investigate/i }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /execution log/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    const threadInput = screen.getByLabelText('threadId');
    const runInput = screen.getByLabelText('runId');
    const jobRunInput = screen.getByLabelText('jobRunId');
    expect(threadInput).toHaveValue('thread-abc');
    expect(runInput).toHaveValue('run-xyz');
    expect(jobRunInput).toHaveValue('job-run-1');

    await waitFor(() => {
      expect(observabilityService.listExecutions).toHaveBeenCalledWith(
        expect.objectContaining({
          threadId: 'thread-abc',
          runId: 'run-xyz',
          jobRunId: 'job-run-1',
          page: 1,
        })
      );
    });
  });

  it('hydrates execution filters from URL on load', async () => {
    renderPage(
      '/admin/assistant/observability?tab=executions&runId=run-from-url&jobRunId=job-from-url'
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /execution log/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    expect(screen.getByLabelText('runId')).toHaveValue('run-from-url');
    expect(screen.getByLabelText('jobRunId')).toHaveValue('job-from-url');

    await waitFor(() => {
      expect(observabilityService.listExecutions).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: 'run-from-url',
          jobRunId: 'job-from-url',
        })
      );
    });
  });

  it('shows Open in Sandbox disabled for non-assistant executions', async () => {
    const user = userEvent.setup();
    vi.mocked(observabilityService.listExecutions).mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'exec-ai',
          occurredAt: new Date().toISOString(),
          module: 'ai_http',
          provider: 'openai',
          model: 'gpt-5-mini',
          status: 'succeeded',
        },
      ],
      total: 1,
    });
    vi.mocked(observabilityService.getExecution).mockResolvedValue({
      id: 'exec-ai',
      occurredAt: new Date().toISOString(),
      module: 'ai_http',
      provider: 'openai',
      model: 'gpt-5-mini',
      status: 'succeeded',
      promptText: 'hello',
    });
    renderPage('/admin/assistant/observability?tab=executions');
    await user.click(screen.getByRole('tab', { name: /execution log/i }));
    await user.click(screen.getByText('ai_http'));
    const btn = await screen.findByRole('button', { name: /open in sandbox/i });
    expect(btn).toBeDisabled();
  });
});

describe('observability execution detail formatters', () => {
  it('formats token counts with locale grouping', () => {
    expect(formatObservabilityTokenCount(12453)).toBe('12,453');
    expect(formatObservabilityTokenCount(null)).toBe('—');
  });

  it('computes input share only when both sides are present', () => {
    expect(computeTokenInputSharePercent(12453, 412)).toBe(97);
    expect(computeTokenInputSharePercent(100, null)).toBeNull();
    expect(computeTokenInputSharePercent(0, 0)).toBeNull();
  });

  it('appends input share to prompt token display when derivable', () => {
    expect(formatPromptTokenValue(12453, 412)).toBe('12,453 (97% input share)');
    expect(formatPromptTokenValue(null, 412)).toBe('—');
  });
});
