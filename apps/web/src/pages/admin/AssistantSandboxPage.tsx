import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Play, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { AssistantExecutionTracePanel } from '@/components/molecules/AssistantExecutionTracePanel';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import { authService } from '@/lib/auth/auth.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import { getResolvedWsUrl } from '@/lib/vite-public-env';
import { AssistantWsClient } from '@/lib/websocket/assistant-ws-client';
import { assistantSandboxService } from '@/services/assistant-sandbox.service';
import type { SandboxMessageRow, SandboxSession } from '@/types/assistant-sandbox';
import type { AssistantRunConfig, StatusEntry, WsToolCallCompletePayload } from '@/types/chatbot';
import { cn } from '@/lib/utils';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';

type SandboxRunHistoryItem = {
  id: string;
  userInput: string;
  content: string;
  statusHistory: StatusEntry[];
  toolCallDetails: WsToolCallCompletePayload[];
  error?: string;
};

function catalogModelId(provider: string, model: string): string {
  const p = provider.trim().toLowerCase();
  const m = model.trim();
  if (m.includes(':')) return m;
  return `${p}:${m}`;
}

function buildRunConfig(session: SandboxSession): AssistantRunConfig {
  const modelId = catalogModelId(session.provider, session.model);
  return {
    mode: 'manual',
    manual: {
      reasoningModelId: modelId,
      responseModelId: modelId,
    },
    compactionMode: 'auto',
  };
}

export default function AssistantSandboxPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session') ?? '';

  const sessionQ = useQuery({
    queryKey: queryKeys.admin.assistantSandbox.session(sessionId),
    queryFn: () => assistantSandboxService.getSession(sessionId),
    enabled: Boolean(sessionId),
  });

  const [systemPrompt, setSystemPrompt] = useState('');
  const [messages, setMessages] = useState<SandboxMessageRow[]>([]);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState<string>('');
  const [maxTokens, setMaxTokens] = useState<string>('');
  const [userInput, setUserInput] = useState('');
  const [running, setRunning] = useState(false);
  const [runHistory, setRunHistory] = useState<SandboxRunHistoryItem[]>([]);
  const [activeTraceExpanded, setActiveTraceExpanded] = useState(true);

  const clientRef = useRef<AssistantWsClient | null>(null);
  const activeRunRef = useRef<{
    historyId: string;
    statusHistory: StatusEntry[];
    toolCallDetails: WsToolCallCompletePayload[];
    buffer: string;
  } | null>(null);

  useEffect(() => {
    if (!sessionQ.data) return;
    const s = sessionQ.data;
    setSystemPrompt(s.systemPrompt);
    setMessages(s.messages);
    setProvider(s.provider);
    setModel(s.model);
    setTemperature(s.temperature != null ? String(s.temperature) : '');
    setMaxTokens(s.maxTokens != null ? String(s.maxTokens) : '');
  }, [sessionQ.data]);

  const sessionDraft = useMemo((): SandboxSession | null => {
    if (!sessionQ.data) return null;
    return {
      ...sessionQ.data,
      systemPrompt,
      messages,
      provider,
      model,
      temperature: temperature === '' ? null : Number(temperature),
      maxTokens: maxTokens === '' ? null : Number(maxTokens),
    };
  }, [sessionQ.data, systemPrompt, messages, provider, model, temperature, maxTokens]);

  const ensureClient = useCallback(async () => {
    const wsBaseUrl = getResolvedWsUrl();
    if (!wsBaseUrl) throw new Error('VITE_WS_URL is not configured');
    if (clientRef.current) return clientRef.current;
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => authService.getValidAccessToken(),
      beforeConnect: async () => {
        await authService.getValidAccessToken();
      },
      onStatusUpdate: (payload) => {
        const active = activeRunRef.current;
        if (!active) return;
        active.statusHistory = [
          ...active.statusHistory,
          {
            stage: payload.stage,
            message: payload.message ?? undefined,
            startedAt: Date.now(),
          },
        ];
        setRunHistory((prev) =>
          prev.map((row) =>
            row.id === active.historyId ? { ...row, statusHistory: [...active.statusHistory] } : row
          )
        );
      },
      onToolCallComplete: (payload) => {
        const active = activeRunRef.current;
        if (!active) return;
        active.toolCallDetails = [...active.toolCallDetails, payload];
        setRunHistory((prev) =>
          prev.map((row) =>
            row.id === active.historyId
              ? { ...row, toolCallDetails: [...active.toolCallDetails] }
              : row
          )
        );
      },
      onAssistantDelta: (payload) => {
        const active = activeRunRef.current;
        if (!active) return;
        active.buffer += payload.delta;
        setRunHistory((prev) =>
          prev.map((row) =>
            row.id === active.historyId ? { ...row, content: active.buffer } : row
          )
        );
      },
      onAssistantContentReplace: (payload) => {
        const active = activeRunRef.current;
        if (!active) return;
        active.buffer = payload.content;
        setRunHistory((prev) =>
          prev.map((row) =>
            row.id === active.historyId ? { ...row, content: active.buffer } : row
          )
        );
      },
      onMessageComplete: () => {
        setRunning(false);
        activeRunRef.current = null;
      },
      onRunError: (payload) => {
        const active = activeRunRef.current;
        setRunning(false);
        if (active) {
          setRunHistory((prev) =>
            prev.map((row) =>
              row.id === active.historyId ? { ...row, error: payload.message } : row
            )
          );
        }
        activeRunRef.current = null;
      },
    });
    await client.connect();
    clientRef.current = client;
    return client;
  }, []);

  const handleRun = useCallback(async () => {
    if (!sessionDraft || !sessionId || !userInput.trim()) return;
    setRunning(true);
    const historyId = `run-${Date.now()}`;
    activeRunRef.current = {
      historyId,
      statusHistory: [],
      toolCallDetails: [],
      buffer: '',
    };
    setRunHistory((prev) => [
      ...prev,
      {
        id: historyId,
        userInput: userInput.trim(),
        content: '',
        statusHistory: [],
        toolCallDetails: [],
      },
    ]);
    try {
      const client = await ensureClient();
      const threadId = `sandbox:${sessionId}`;
      await client.sendUserMessage({
        threadId,
        content: userInput.trim(),
        sandbox: true,
        sandboxSessionId: sessionId,
        runConfig: buildRunConfig(sessionDraft),
      });
    } catch (err) {
      setRunning(false);
      activeRunRef.current = null;
      setRunHistory((prev) =>
        prev.map((row) =>
          row.id === historyId
            ? { ...row, error: err instanceof Error ? err.message : String(err) }
            : row
        )
      );
    }
  }, [ensureClient, sessionDraft, sessionId, userInput]);

  const updateMessage = (index: number, patch: Partial<SandboxMessageRow>) => {
    setMessages((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const latestRun = runHistory[runHistory.length - 1];

  if (!sessionId) {
    return (
      <div className="p-6 text-sm text-gray-600 dark:text-gray-400">
        Open a sandbox from Observability → execution detail → <strong>Open in Sandbox</strong>, or
        add <code className="text-xs">?session=…</code> to the URL.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <AlertTriangle className="inline h-4 w-4 mr-1 align-text-bottom" />
        Sandbox — mutating tools are dry-run; no thread, STM, or LTM writes. Source execution:{' '}
        <span className="font-mono text-xs">{sessionQ.data?.sourceExecutionId ?? '…'}</span>
      </div>

      {sessionQ.isLoading && (
        <div className="flex justify-center py-16 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {sessionQ.isError && (
        <div className="p-6 text-sm text-red-600">{(sessionQ.error as Error).message}</div>
      )}

      {sessionQ.data && (
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                System prompt
              </label>
              <Textarea
                className="mt-1 w-full min-h-[120px] font-mono text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 p-2"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Messages
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setMessages((m) => [...m, { role: 'user', text: '' }])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add row
                </Button>
              </div>
              {messages.map((row, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Select
                    className="text-xs rounded border border-gray-300 dark:border-gray-600 px-1 py-1"
                    value={row.role}
                    onChange={(e) => updateMessage(index, { role: e.target.value })}
                  >
                    <option value="user">user</option>
                    <option value="assistant">assistant</option>
                    <option value="system">system</option>
                  </Select>
                  <Textarea
                    className="flex-1 min-h-[48px] font-mono text-xs rounded border border-gray-300 dark:border-gray-600 p-1"
                    value={row.text}
                    onChange={(e) => updateMessage(index, { text: e.target.value })}
                  />
                  <button
                    type="button"
                    className="text-gray-400 hover:text-red-500 p-1"
                    aria-label="Remove message row"
                    onClick={() => setMessages((m) => m.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">
                <span className="font-semibold text-gray-600 dark:text-gray-400">Provider</span>
                <input
                  className="mt-1 w-full text-xs rounded border border-gray-300 dark:border-gray-600 px-2 py-1"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                />
              </label>
              <label className="text-xs">
                <span className="font-semibold text-gray-600 dark:text-gray-400">Model</span>
                <input
                  className="mt-1 w-full text-xs rounded border border-gray-300 dark:border-gray-600 px-2 py-1"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </label>
              <label className="text-xs">
                <span className="font-semibold text-gray-600 dark:text-gray-400">Temperature</span>
                <input
                  className="mt-1 w-full text-xs rounded border border-gray-300 dark:border-gray-600 px-2 py-1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
              </label>
              <label className="text-xs">
                <span className="font-semibold text-gray-600 dark:text-gray-400">maxTokens</span>
                <input
                  className="mt-1 w-full text-xs rounded border border-gray-300 dark:border-gray-600 px-2 py-1"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                New user turn (this run)
              </label>
              <Textarea
                className="mt-1 w-full min-h-[72px] text-sm rounded border border-gray-300 dark:border-gray-600 p-2"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Message sent on Run (appended after seeded messages)"
              />
            </div>

            <Button
              type="button"
              disabled={running || !userInput.trim()}
              onClick={() => void handleRun()}
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run
            </Button>
          </div>

          <div className="lg:w-1/2 p-4 overflow-y-auto space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Run history</h2>
            {runHistory.length === 0 && (
              <p className="text-sm text-gray-500">No runs yet. Edit prompts and click Run.</p>
            )}
            {runHistory.map((run) => (
              <div
                key={run.id}
                className={cn(
                  'rounded-lg border p-3 text-sm',
                  run.id === latestRun?.id
                    ? 'border-indigo-300 dark:border-indigo-700'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="text-xs text-gray-500 mb-2">User: {run.userInput}</div>
                {run.error && <div className="text-red-600 text-xs mb-2">{run.error}</div>}
                {run.toolCallDetails.some((t) => {
                  const out = t.result as { dryRun?: boolean } | undefined;
                  return out?.dryRun === true;
                }) && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                    Dry-run: one or more mutating tools were not applied.
                  </div>
                )}
                {run.id === latestRun?.id && run.statusHistory.length > 0 && (
                  <AssistantExecutionTracePanel
                    messageId={run.id}
                    statusHistory={run.statusHistory}
                    isActive={running}
                    toolCallDetails={run.toolCallDetails}
                    expanded={activeTraceExpanded}
                    onToggle={() => setActiveTraceExpanded((v) => !v)}
                    runId={run.id}
                  />
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none mt-2">
                  <MarkdownRenderer content={run.content || '…'} variant="chat" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
