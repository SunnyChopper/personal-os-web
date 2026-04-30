import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Save } from 'lucide-react';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { AssistantWsClient } from '@/lib/websocket/assistant-ws-client';
import { authService } from '@/lib/auth/auth.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { webhooksService } from '@/services/tools/webhooks.service';
import { getResolvedApiBaseUrl, getResolvedWsUrl } from '@/lib/vite-public-env';

const WS_BASE = getResolvedWsUrl() ?? '';

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export default function WebhookDetailPage() {
  const { catcherId = '' } = useParams<{ catcherId: string }>();
  const qc = useQueryClient();
  const clientRef = useRef<AssistantWsClient | null>(null);

  const { data: list } = useQuery({
    queryKey: queryKeys.tools.webhooks.list(),
    queryFn: () => webhooksService.list(),
  });
  const catcher = useMemo(
    () => list?.items.find((c) => c.id === catcherId),
    [list?.items, catcherId]
  );

  const { data: evData, refetch } = useQuery({
    queryKey: queryKeys.tools.webhooks.events(catcherId),
    queryFn: () => webhooksService.listEvents(catcherId),
    enabled: !!catcherId,
    refetchInterval: 8000,
  });

  const [liveIds, setLiveIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!catcherId || !WS_BASE) return;
    const client = new AssistantWsClient({
      wsBaseUrl: WS_BASE,
      getAccessToken: async () => authService.getAccessToken(),
      reconnect: true,
      onOpen: () => {
        try {
          clientRef.current?.sendSubscribeToolsEvent(catcherId);
        } catch {
          /* not connected */
        }
      },
      onToolsEvent: (payload) => {
        startTransition(() => {
          const p = payload as { catcherId?: string; event?: { eventId?: string } };
          if (p?.catcherId === catcherId && p.event?.eventId) {
            setLiveIds((prev) => new Set(prev).add(String(p.event?.eventId)));
            void qc.invalidateQueries({ queryKey: queryKeys.tools.webhooks.events(catcherId) });
          }
        });
      },
    });
    clientRef.current = client;
    void client.connect().catch(() => {
      /* reconnect loop */
    });
    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [catcherId, qc]);

  const saveMut = useMutation({
    mutationFn: ({ eventId }: { eventId: string }) =>
      webhooksService.saveEventToVault(catcherId, eventId),
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });

  const apiBase = getResolvedApiBaseUrl();
  const ingestUrl = catcher ? `${apiBase.replace(/\/$/, '')}${catcher.ingestPath}` : '';

  const events = evData?.items ?? [];

  return (
    <div className="space-y-4">
      <Link
        to={`${ROUTES.admin.tools.base}/webhooks`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400"
      >
        <ArrowLeft className="h-4 w-4" />
        All catchers
      </Link>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{catcher?.name ?? '…'}</h1>
      {catcher && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
            <code className="min-w-0 flex-1 break-all text-xs">{ingestUrl}</code>
            <button
              type="button"
              className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600"
              onClick={() => void navigator.clipboard.writeText(ingestUrl)}
            >
              <Copy className="mr-1 inline h-3 w-3" />
              Copy
            </button>
          </div>
          <pre className="overflow-x-auto rounded border border-gray-200 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-950">
            {`curl -X POST '${ingestUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '{"hello":"world"}'`}
          </pre>
        </div>
      )}
      <p className="text-xs text-gray-500">
        Subscribes over WebSocket on connect; events list also refreshes periodically. Rows marked
        &quot;Live&quot; arrived via fanout since this page loaded.
      </p>
      <div className="space-y-4">
        {events.map((e) => {
          const parsedBody = tryParseJson(e.bodyText);
          const isJson = typeof parsedBody === 'object' && parsedBody !== null;
          const isLive = liveIds.has(e.eventId);
          return (
            <div
              key={e.eventId}
              className={`rounded-lg border p-3 ${
                isLive
                  ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-xs text-gray-600 dark:text-gray-400">
                  {e.receivedAt} · {e.method}
                  {e.truncated ? ' · truncated' : ''}
                  {isLive ? ' · live' : ''}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600"
                  disabled={saveMut.isPending}
                  onClick={() => saveMut.mutate({ eventId: e.eventId })}
                >
                  <Save className="h-3 w-3" />
                  Save to Vault
                </button>
              </div>
              <p className="mt-1 font-mono text-[11px] text-gray-500">{e.eventId}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-gray-600">Headers</summary>
                <div className="mt-1 max-h-40 overflow-auto rounded border border-gray-100 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
                  <JsonView src={e.headers} collapsed={1} />
                </div>
              </details>
              <p className="mt-2 text-xs text-gray-500">
                Query: <code>{e.query || '—'}</code>
              </p>
              <div className="mt-2 max-h-96 overflow-auto rounded border border-gray-100 bg-white p-2 text-xs dark:border-gray-800 dark:bg-gray-900">
                {isJson ? (
                  <JsonView src={parsedBody as object} collapsed={2} />
                ) : (
                  <pre className="whitespace-pre-wrap break-all">{e.bodyText}</pre>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="text-sm text-blue-600 hover:underline"
        onClick={() => void refetch()}
      >
        Refresh now
      </button>
    </div>
  );
}
