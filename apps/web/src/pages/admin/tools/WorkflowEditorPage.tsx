import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Loader2, Play, ShieldCheck, ToggleLeft } from 'lucide-react';
import WorkflowRfNode, { type WorkflowRfData } from '@/components/tools/workflow/WorkflowRfNode';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { workflowsService } from '@/services/tools/workflows.service';
import type { WorkflowDefinition } from '@/types/api/tools';
import { cn } from '@/lib/utils';

const nodeTypes = { workflowNode: WorkflowRfNode };

const PALETTE: { ntype: string; label: string; config: Record<string, unknown> }[] = [
  { ntype: 'trigger.manual', label: 'Manual', config: {} },
  { ntype: 'trigger.cron', label: 'Cron', config: { expression: '0 * * * *' } },
  { ntype: 'trigger.webhook', label: 'Webhook', config: {} },
  {
    ntype: 'action.fetch',
    label: 'HTTP fetch',
    config: { method: 'GET', url: 'https://httpbin.org/json', headers: {} },
  },
  {
    ntype: 'action.llmPrompt',
    label: 'LLM prompt',
    config: {
      systemPrompt: 'You are a helpful assistant.',
      userPromptTemplate: 'Summarize: {{ steps.n-fetch.output.body }}',
      model: 'gpt-4o-mini',
    },
  },
  { ntype: 'action.dbRead', label: 'DB read (tool)', config: { toolName: 'list_tasks', args: {} } },
  {
    ntype: 'action.dbWrite',
    label: 'DB write (tool)',
    config: { toolName: 'create_task', args: {} },
  },
  {
    ntype: 'action.vaultSave',
    label: 'Vault save',
    config: { title: 'Workflow output', bodyTemplate: '{{ trigger }}' },
  },
  {
    ntype: 'action.condition',
    label: 'Condition',
    config: { expression: 'steps.n-fetch.output.status' },
  },
];

function nodeLabel(ntype: string, config: Record<string, unknown>): string {
  if (ntype === 'action.fetch') return String(config.url ?? 'fetch');
  if (ntype === 'trigger.cron') return String(config.expression ?? 'cron');
  if (ntype === 'action.llmPrompt') return 'LLM';
  if (ntype === 'action.condition') return 'branch';
  return PALETTE.find((p) => p.ntype === ntype)?.label ?? ntype.split('.').pop() ?? ntype;
}

function apiToFlow(def: WorkflowDefinition): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: def.nodes.map((n) => ({
      id: n.id,
      type: 'workflowNode',
      position: n.position,
      data: {
        ntype: n.type,
        label: nodeLabel(n.type, n.config as Record<string, unknown>),
        config: { ...(n.config as Record<string, unknown>) },
      } satisfies WorkflowRfData,
    })),
    edges: def.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
    })),
  };
}

function flowToApi(nodes: Node[], edges: Edge[]): WorkflowDefinition {
  return {
    nodes: nodes.map((n) => {
      const d = n.data as WorkflowRfData;
      return {
        id: n.id,
        type: d.ntype,
        position: n.position,
        config: { ...d.config },
      };
    }),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
    })),
  };
}

function validateDefinition(def: WorkflowDefinition): string[] {
  const errs: string[] = [];
  const triggers = def.nodes.filter((n) => n.type.startsWith('trigger.'));
  if (triggers.length !== 1) errs.push('Exactly one trigger node is required.');
  const ids = new Set(def.nodes.map((n) => n.id));
  for (const e of def.edges) {
    if (!ids.has(e.source) || !ids.has(e.target))
      errs.push(`Edge ${e.id} references missing node.`);
  }
  for (const n of def.nodes) {
    const c = n.config as Record<string, unknown>;
    if (n.type === 'action.fetch' && !String(c.url || '').trim())
      errs.push(`Node ${n.id}: fetch needs url.`);
    if (n.type === 'trigger.cron' && !String(c.expression || '').trim())
      errs.push(`Node ${n.id}: cron needs expression.`);
    if (n.type === 'action.llmPrompt' && !String(c.userPromptTemplate || '').trim()) {
      errs.push(`Node ${n.id}: LLM needs userPromptTemplate.`);
    }
  }
  return errs;
}

export default function WorkflowEditorPage() {
  const { workflowId = '' } = useParams<{ workflowId: string }>();
  const qc = useQueryClient();
  const hydratedFor = useRef<string | null>(null);
  const canAutosave = useRef(false);

  const { data: wf, isLoading } = useQuery({
    queryKey: queryKeys.tools.workflows.detail(workflowId),
    queryFn: () => workflowsService.get(workflowId),
    enabled: !!workflowId,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [validationMsgs, setValidationMsgs] = useState<string[]>([]);

  useEffect(() => {
    canAutosave.current = false;
    const t = setTimeout(() => {
      canAutosave.current = true;
    }, 600);
    return () => clearTimeout(t);
  }, [workflowId]);

  useEffect(() => {
    hydratedFor.current = null;
  }, [workflowId]);

  useEffect(() => {
    if (!wf || !workflowId || wf.id !== workflowId) return;
    if (hydratedFor.current === workflowId) return;
    hydratedFor.current = workflowId;
    const flow = apiToFlow(wf.definition);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [wf, workflowId, setNodes, setEdges]);

  useEffect(() => {
    if (!workflowId || !canAutosave.current || nodes.length === 0) return;
    const t = window.setTimeout(() => {
      setSaveState('saving');
      void workflowsService
        .patch(workflowId, { definition: flowToApi(nodes, edges) })
        .then((updated) => {
          qc.setQueryData(queryKeys.tools.workflows.detail(workflowId), updated);
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 1200);
        })
        .catch(() => setSaveState('idle'));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [nodes, edges, workflowId, qc]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  const onConnect = useCallback(
    (c: Connection) =>
      startTransition(() => {
        setEdges((eds) => addEdge({ ...c, id: `e-${c.source}-${c.target}-${Date.now()}` }, eds));
      }),
    [setEdges]
  );

  const addPaletteNode = useCallback(
    (entry: (typeof PALETTE)[number]) => {
      startTransition(() => {
        setNodes((prev) => {
          const triggers = prev.filter((n) =>
            (n.data as WorkflowRfData).ntype.startsWith('trigger.')
          );
          if (entry.ntype.startsWith('trigger.') && triggers.length >= 1) {
            window.alert('Only one trigger is allowed. Remove the existing trigger first.');
            return prev;
          }
          const id = `n-${crypto.randomUUID().slice(0, 8)}`;
          const position = { x: 120 + prev.length * 24, y: 80 + prev.length * 16 };
          const data: WorkflowRfData = {
            ntype: entry.ntype,
            label: nodeLabel(entry.ntype, entry.config),
            config: { ...entry.config },
          };
          return [...prev, { id, type: 'workflowNode', position, data }];
        });
      });
    },
    [setNodes]
  );

  const updateSelectedConfig = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selectedId) return;
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== selectedId) return n;
          const d = n.data as WorkflowRfData;
          const config = { ...d.config, ...patch };
          return {
            ...n,
            data: {
              ...d,
              config,
              label: nodeLabel(d.ntype, config),
            },
          };
        })
      );
    },
    [selectedId, setNodes]
  );

  const runMut = useMutation({
    mutationFn: () => workflowsService.run(workflowId, {}),
    onSuccess: async (r) => {
      const detail = await workflowsService.getRun(workflowId, r.runId);
      const statusByNode: Record<string, 'success' | 'error'> = {};
      for (const log of detail.nodeLogs) {
        statusByNode[log.nodeId] = log.status === 'success' ? 'success' : 'error';
      }
      startTransition(() => {
        setNodes((prev) =>
          prev.map((n) => ({
            ...n,
            data: {
              ...(n.data as WorkflowRfData),
              runStatus: statusByNode[n.id],
            },
          }))
        );
      });
      void qc.invalidateQueries({ queryKey: queryKeys.tools.workflows.detail(workflowId) });
    },
  });

  const toggleEnabled = useMutation({
    mutationFn: () => workflowsService.patch(workflowId, { enabled: !wf?.enabled }),
    onSuccess: (d) => qc.setQueryData(queryKeys.tools.workflows.detail(workflowId), d),
  });

  const onValidate = () => {
    const def = flowToApi(nodes, edges);
    setValidationMsgs(validateDefinition(def));
  };

  const renderConfigFields = () => {
    if (!selectedNode) {
      return <p className="text-sm text-gray-500">Select a node to edit configuration.</p>;
    }
    const d = selectedNode.data as WorkflowRfData;
    const c = d.config;

    const field = (key: string, label: string, multiline = false) => (
      <label className="block text-xs" key={key}>
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        {multiline ? (
          <textarea
            className="mt-1 w-full rounded border border-gray-300 bg-white p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-900"
            rows={4}
            value={String(c[key] ?? '')}
            onChange={(e) => updateSelectedConfig({ [key]: e.target.value })}
          />
        ) : (
          <input
            className="mt-1 w-full rounded border border-gray-300 bg-white p-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-900"
            value={typeof c[key] === 'object' ? JSON.stringify(c[key]) : String(c[key] ?? '')}
            onChange={(e) => {
              const v = e.target.value;
              if (key === 'args' || key === 'headers') {
                try {
                  updateSelectedConfig({ [key]: JSON.parse(v) as object });
                } catch {
                  updateSelectedConfig({ [key]: v });
                }
              } else {
                updateSelectedConfig({ [key]: v });
              }
            }}
          />
        )}
      </label>
    );

    switch (d.ntype) {
      case 'trigger.cron':
        return field('expression', 'Cron expression');
      case 'action.fetch':
        return (
          <div className="space-y-2">
            {field('method', 'Method')}
            {field('url', 'URL')}
            {field('headers', 'Headers (JSON)', true)}
            {field('body', 'Body (optional)', true)}
          </div>
        );
      case 'action.llmPrompt':
        return (
          <div className="space-y-2">
            {field('systemPrompt', 'System prompt', true)}
            {field('userPromptTemplate', 'User template', true)}
            {field('model', 'Model')}
          </div>
        );
      case 'action.dbRead':
      case 'action.dbWrite':
        return (
          <div className="space-y-2">
            {field('toolName', 'Tool name')}
            {field('args', 'Args (JSON)', true)}
          </div>
        );
      case 'action.vaultSave':
        return (
          <div className="space-y-2">
            {field('title', 'Title')}
            {field('bodyTemplate', 'Body template', true)}
          </div>
        );
      case 'action.condition':
        return (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              JMESPath expression evaluated against context (trigger + steps). Truthy →
              &quot;true&quot; handle.
            </p>
            {field('expression', 'Expression')}
          </div>
        );
      default:
        return <p className="text-xs text-gray-500">No extra config for this node type.</p>;
    }
  };

  if (isLoading || !wf) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading workflow…
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[480px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={`${ROUTES.admin.tools.base}/workflows`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Workflows
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{wf.name}</h1>
        <span
          className={cn(
            'text-xs',
            saveState === 'saving' && 'text-amber-600',
            saveState === 'saved' && 'text-green-600'
          )}
        >
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && 'Saved'}
          {saveState === 'idle' && ''}
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600"
          onClick={() => toggleEnabled.mutate()}
        >
          <ToggleLeft className="h-3 w-3" />
          {wf.enabled ? 'Disable' : 'Enable'}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={runMut.isPending}
          onClick={() => runMut.mutate()}
        >
          {runMut.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          Run now
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600"
          onClick={onValidate}
        >
          <ShieldCheck className="h-3 w-3" />
          Validate
        </button>
      </div>

      {validationMsgs.length > 0 && (
        <ul className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {validationMsgs.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      <div className="flex min-h-0 flex-1 gap-3">
        <aside className="w-48 shrink-0 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500">Add node</p>
          {PALETTE.map((p) => (
            <button
              key={p.ntype}
              type="button"
              className="block w-full rounded border border-gray-200 px-2 py-1.5 text-left text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              onClick={() => addPaletteNode(p)}
            >
              {p.label}
            </button>
          ))}
        </aside>

        <div className="min-h-0 min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-gray-700">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <aside className="w-72 shrink-0 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Node config</h2>
          {selectedNode && (
            <p className="font-mono text-[10px] text-gray-500">
              {(selectedNode.data as WorkflowRfData).ntype}
            </p>
          )}
          {renderConfigFields()}
        </aside>
      </div>
    </div>
  );
}
