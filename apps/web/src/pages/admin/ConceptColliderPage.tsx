import { useCallback, useEffect, useMemo, useState } from 'react';
import dagre from '@dagrejs/dagre';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Search, Sparkles, RefreshCw, Link2 } from 'lucide-react';
import { vaultItemsService, conceptGraphService } from '@/services/knowledge-vault';
import type { VaultItem } from '@/types/knowledge-vault';
import Button from '@/components/atoms/Button';
import { SynthesisPanel } from '@/components/organisms/SynthesisPanel';
import {
  CONCEPT_COLLIDER_MAX_SEEDS,
  useConceptColliderStore,
} from '@/store/concept-collider.store';

const nodeWidth = 200;
const nodeHeight = 64;

const GRAPH_SHELL_CLASS =
  'min-h-[560px] h-[calc(100vh-260px)] max-h-[900px] border border-gray-200 dark:border-gray-700 bg-slate-950 rounded-lg overflow-hidden';

function layoutElements(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });
  nodes.forEach((n) => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
    };
  });
}

export default function ConceptColliderPage() {
  const searchQuery = useConceptColliderStore((s) => s.searchQuery);
  const setSearchQuery = useConceptColliderStore((s) => s.setSearchQuery);
  const seeds = useConceptColliderStore((s) => s.seeds);
  const addSeed = useConceptColliderStore((s) => s.addSeed);
  const selectedNodeIds = useConceptColliderStore((s) => s.selectedNodeIds);
  const toggleSelectedNodeId = useConceptColliderStore((s) => s.toggleSelectedNodeId);
  const setSelectedNodeIds = useConceptColliderStore((s) => s.setSelectedNodeIds);
  const synthesisOpen = useConceptColliderStore((s) => s.synthesisOpen);
  const setSynthesisOpen = useConceptColliderStore((s) => s.setSynthesisOpen);

  const [searchHits, setSearchHits] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await vaultItemsService.search(searchQuery.trim());
      if (res.success && res.data) {
        setSearchHits(
          res.data.filter((i) => i.type === 'note' || i.type === 'document').slice(0, 20)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSubgraph = useCallback(async () => {
    if (!seeds.length) return;
    setLoading(true);
    try {
      const sub = await conceptGraphService.getSubgraph(
        seeds.map((s) => s.id),
        2
      );
      if (!sub.success || !sub.data) return;

      const idSet = new Set(sub.data.nodes.map((n) => n.id));
      const titleMap = new Map<string, string>();
      seeds.forEach((s) => titleMap.set(s.id, s.title));
      for (const nid of idSet) {
        if (titleMap.has(nid)) continue;
        const got = await vaultItemsService.getById(nid);
        if (got.success && got.data) {
          titleMap.set(nid, got.data.title);
        } else {
          titleMap.set(nid, nid.slice(0, 8));
        }
      }

      const flowNodes: Node[] = sub.data.nodes.map((n) => {
        const isSeed = !!n.isSeed;
        return {
          id: n.id,
          data: { label: titleMap.get(n.id) || n.id, isSeed },
          position: { x: 0, y: 0 },
          style: {
            padding: 10,
            borderRadius: 8,
            border: isSeed ? '2px solid #22c55e' : '1px solid #64748b',
            background: isSeed ? '#14532d33' : '#1e293b',
            color: '#e2e8f0',
            width: nodeWidth,
            fontSize: 13,
          },
        };
      });

      const flowEdges: Edge[] = sub.data.edges.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        markerEnd: { type: MarkerType.ArrowClosed },
        label: e.connectionType || '',
      }));

      setNodes(layoutElements(flowNodes, flowEdges));
      setEdges(flowEdges);
    } finally {
      setLoading(false);
    }
  }, [seeds, setEdges, setNodes]);

  useEffect(() => {
    if (!seeds.length) {
      setNodes([]);
      setEdges([]);
      return;
    }
    void loadSubgraph();
  }, [seeds, loadSubgraph, setEdges, setNodes]);

  useEffect(() => {
    const allowed = new Set(nodes.map((n) => n.id));
    setSelectedNodeIds((prev) => {
      const next = prev.filter((id) => allowed.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [nodes, setSelectedNodeIds]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      toggleSelectedNodeId(node.id);
    },
    [toggleSelectedNodeId]
  );

  const idToLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) {
      const label = typeof n.data?.label === 'string' ? n.data.label : n.id;
      m.set(n.id, label);
    }
    return m;
  }, [nodes]);

  const selectionSummary = useMemo(() => {
    if (selectedNodeIds.length === 0) return 'Click one or more nodes to select them for synthesis';
    if (selectedNodeIds.length === 1)
      return `${idToLabel.get(selectedNodeIds[0]) ?? selectedNodeIds[0]} (pick at least one more)`;
    return selectedNodeIds.map((id) => idToLabel.get(id) ?? id).join(' · ');
  }, [selectedNodeIds, idToLabel]);

  const canSynthesize = selectedNodeIds.length >= 2;

  const runSynthesis = () => {
    if (!canSynthesize) return;
    setSynthesisOpen(true);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Concept Collider</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Seed vault items, explore connections, synthesize new notes (backend graph + LLM).
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-gray-500">Search vault (notes/documents)</label>
          <div className="flex gap-2 mt-1 items-stretch">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runSearch();
              }}
              className="flex-1 min-h-[40px] px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
              placeholder="Keywords…"
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 self-stretch min-h-[40px] min-w-[40px] px-3"
              onClick={() => void runSearch()}
              disabled={loading}
              aria-label="Search vault"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 self-end min-h-[40px]"
          onClick={() => void loadSubgraph()}
          disabled={loading || !seeds.length}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload graph
        </Button>
      </div>

      {searchHits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchHits.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => addSeed(h)}
              className="text-xs px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-green-200 dark:hover:bg-green-900 transition"
            >
              + {h.title}
            </button>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400">
        Seeds ({seeds.length}/{CONCEPT_COLLIDER_MAX_SEEDS}):{' '}
        {seeds.length === 0 ? '—' : seeds.map((s) => s.title).join(' · ')}
      </div>

      <div className={`flex flex-col lg:flex-row gap-0 ${GRAPH_SHELL_CLASS}`}>
        <div
          className={`min-h-[480px] min-w-0 flex flex-col ${synthesisOpen ? 'lg:flex-1' : 'w-full'}`}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            className="flex-1 min-h-[480px] lg:min-h-0"
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        <SynthesisPanel
          open={synthesisOpen}
          onClose={() => setSynthesisOpen(false)}
          onSaved={() => void loadSubgraph()}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Link2 className="w-4 h-4 shrink-0" />
          <span className="break-words">
            Selected ({selectedNodeIds.length}): {selectionSummary}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => runSynthesis()} disabled={loading || !canSynthesize}>
            <Sparkles className="w-4 h-4 mr-2" />
            Synthesize
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSynthesisOpen(!synthesisOpen)}
            disabled={!canSynthesize}
          >
            {synthesisOpen ? 'Hide panel' : 'Show panel'}
          </Button>
        </div>
      </div>
    </div>
  );
}
