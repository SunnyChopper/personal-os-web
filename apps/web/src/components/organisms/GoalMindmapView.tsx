import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import dagre from '@dagrejs/dagre';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Goal, GoalProgressBreakdown } from '@/types/growth-system';
import {
  formatGoalMindmapTimeframe,
  GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH,
} from '@/components/molecules/goal-mindmap-utils';
import { GoalMindmapNode, type GoalMindmapRfNode } from '@/components/molecules/GoalMindmapNode';

const GOAL_MINDMAP_NODE_HEIGHT = 140;

const nodeTypes = { goalMindmap: GoalMindmapNode };

type GoalsHealthEntry = {
  status: 'healthy' | 'at_risk' | 'behind' | 'dormant';
  daysRemaining: number | null;
  momentum: 'active' | 'dormant';
};

interface GoalMindmapViewProps {
  goals: Goal[];
  goalsProgress: Map<string, GoalProgressBreakdown>;
  goalsHealth: Map<string, GoalsHealthEntry>;
  onGoalClick: (goal: Goal) => void;
  onCreateSubgoal?: (parentGoal: Goal) => void;
}

function compareGoalsByTargetDate(a: Goal, b: Goal): number {
  if (!a.targetDate && !b.targetDate) return 0;
  if (!a.targetDate) return 1;
  if (!b.targetDate) return -1;
  return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
}

function collectSubtreeGoals(rootId: string, allGoals: Goal[]): Goal[] {
  const byParent = new Map<string | null, Goal[]>();
  for (const g of allGoals) {
    const p = g.parentGoalId;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(g);
  }
  for (const [, arr] of byParent) {
    arr.sort(compareGoalsByTargetDate);
  }
  const out: Goal[] = [];
  const visit = (id: string) => {
    const goal = allGoals.find((x) => x.id === id);
    if (!goal) return;
    out.push(goal);
    const children = byParent.get(id) ?? [];
    for (const c of children) visit(c.id);
  };
  visit(rootId);
  return out;
}

function isGoalOverdue(goal: Goal): boolean {
  if (!goal.targetDate) return false;
  if (goal.completedDate) return false;
  if (goal.status === 'Achieved' || goal.status === 'Abandoned') return false;
  const target = new Date(goal.targetDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > target;
}

function layoutMindmap(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 48,
    ranksep: 80,
    marginx: 24,
    marginy: 24,
  });

  for (const node of nodes) {
    g.setNode(node.id, {
      width: GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH,
      height: GOAL_MINDMAP_NODE_HEIGHT,
    });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const n = g.node(node.id);
    return {
      ...node,
      position: {
        x: n.x - GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH / 2,
        y: n.y - GOAL_MINDMAP_NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function buildGraph(
  subtree: Goal[],
  rootId: string,
  goalsProgress: Map<string, GoalProgressBreakdown>,
  goalsHealth: Map<string, GoalsHealthEntry>,
  onCreateSubgoal?: (parentGoal: Goal) => void
): { nodes: GoalMindmapRfNode[]; edges: Edge[] } {
  const nodes: GoalMindmapRfNode[] = subtree.map((goal) => ({
    id: goal.id,
    type: 'goalMindmap',
    position: { x: 0, y: 0 },
    data: {
      goal,
      progress: goalsProgress.get(goal.id),
      healthStatus: goalsHealth.get(goal.id)?.status,
      isRoot: goal.id === rootId,
      timeframeLabel: formatGoalMindmapTimeframe(goal),
      isOverdue: isGoalOverdue(goal),
      onAddSubgoal: onCreateSubgoal,
    },
  }));

  const edges: Edge[] = [];
  for (const goal of subtree) {
    if (goal.parentGoalId && subtree.some((g) => g.id === goal.parentGoalId)) {
      const targetOverdue = isGoalOverdue(goal);
      edges.push({
        id: `e-${goal.parentGoalId}-${goal.id}`,
        source: goal.parentGoalId,
        target: goal.id,
        type: 'smoothstep',
        animated: !targetOverdue,
        style: targetOverdue
          ? { stroke: '#ef4444', strokeWidth: 2.5 }
          : { stroke: '#64748b', strokeWidth: 2 },
      });
    }
  }

  return { nodes, edges };
}

function MindmapFlowInner({
  goals,
  goalsProgress,
  goalsHealth,
  onGoalClick,
  onCreateSubgoal,
}: GoalMindmapViewProps) {
  const { fitView } = useReactFlow();

  const rootGoals = useMemo(
    () =>
      goals
        .filter((g) => !g.parentGoalId)
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title)),
    [goals]
  );

  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);

  const effectiveRootId = useMemo(() => {
    if (rootGoals.length === 0) return null;
    if (selectedRootId && rootGoals.some((g) => g.id === selectedRootId)) {
      return selectedRootId;
    }
    return rootGoals[0]!.id;
  }, [rootGoals, selectedRootId]);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!effectiveRootId) {
      return { initialNodes: [] as GoalMindmapRfNode[], initialEdges: [] as Edge[] };
    }
    const subtree = collectSubtreeGoals(effectiveRootId, goals);
    const { nodes, edges } = buildGraph(
      subtree,
      effectiveRootId,
      goalsProgress,
      goalsHealth,
      onCreateSubgoal
    );
    const laidOut = layoutMindmap(nodes, edges);
    return { initialNodes: laidOut.nodes as GoalMindmapRfNode[], initialEdges: laidOut.edges };
  }, [effectiveRootId, goals, goalsProgress, goalsHealth, onCreateSubgoal]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 280 });
    });
    return () => cancelAnimationFrame(id);
  }, [nodes, fitView]);

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: Node) => {
      const g = (node.data as { goal?: Goal }).goal;
      if (g) onGoalClick(g);
    },
    [onGoalClick]
  );

  if (rootGoals.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          No top-level goals match your filters. Adjust filters or create a root goal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[560px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="mindmap-root-goal"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Focus goal
        </label>
        <select
          id="mindmap-root-goal"
          value={effectiveRootId ?? ''}
          onChange={(e) => setSelectedRootId(e.target.value || null)}
          className="min-h-[44px] min-w-[200px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {rootGoals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Pan and zoom the canvas. Click a node to open details. Use + on a card to add a subgoal.
        </span>
      </div>

      <div className="h-[min(70vh,720px)] w-full rounded-lg border border-gray-200 dark:border-gray-700">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          fitView
          proOptions={{ hideAttribution: true }}
          className="rounded-lg bg-gray-50 dark:bg-gray-900/50"
        >
          <Background gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={2}
            className="!bg-white/90 dark:!bg-gray-800/90"
            maskColor="rgba(0,0,0,0.08)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function GoalMindmapView(props: GoalMindmapViewProps) {
  return (
    <ReactFlowProvider>
      <MindmapFlowInner {...props} />
    </ReactFlowProvider>
  );
}
