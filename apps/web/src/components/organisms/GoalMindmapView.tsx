import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import dagre from '@dagrejs/dagre';
import {
  Background,
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
import { LocateFixed, Maximize, X, ZoomIn, ZoomOut } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import type { Goal, GoalHealth, GoalProgressBreakdown } from '@/types/growth-system';
import {
  buildPipelineSubtree,
  collectMatchingSubtreeGoals,
  formatGoalMindmapTimeframe,
  GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH,
  listTopMatchingRootGoals,
  pruneSubtreeOrphans,
} from '@/components/molecules/goal-mindmap-utils';
import { GoalMindmapNode, type GoalMindmapRfNode } from '@/components/molecules/GoalMindmapNode';
import { Select } from '@/components/atoms/Select';

const GOAL_MINDMAP_NODE_HEIGHT = 140;
const MINDMAP_VIEW_ANIMATION_MS = 300;
const MINDMAP_FIT_PADDING = 0.2;

const nodeTypes = { goalMindmap: GoalMindmapNode };

function MindmapToolbar() {
  const { zoomIn, zoomOut, fitView, setCenter, getNodes } = useReactFlow();

  const handleZoomIn = useCallback(() => {
    void zoomIn({ duration: MINDMAP_VIEW_ANIMATION_MS });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    void zoomOut({ duration: MINDMAP_VIEW_ANIMATION_MS });
  }, [zoomOut]);

  const handleFitToScreen = useCallback(() => {
    void fitView({ padding: MINDMAP_FIT_PADDING, duration: MINDMAP_VIEW_ANIMATION_MS });
  }, [fitView]);

  const handleResetCamera = useCallback(() => {
    const rootNode = getNodes().find((node) => node.data?.isRoot === true);
    if (!rootNode) return;

    const centerX = rootNode.position.x + GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH / 2;
    const centerY = rootNode.position.y + GOAL_MINDMAP_NODE_HEIGHT / 2;
    void setCenter(centerX, centerY, { zoom: 1, duration: MINDMAP_VIEW_ANIMATION_MS });
  }, [getNodes, setCenter]);

  return (
    <div
      role="toolbar"
      aria-label="Mindmap canvas controls"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-1 shadow-sm',
        'dark:border-gray-600 dark:bg-gray-800'
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disableSound
        className="!min-h-[44px] !min-w-[44px] !rounded-md !px-2"
        onClick={handleZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn className="h-5 w-5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disableSound
        className="!min-h-[44px] !min-w-[44px] !rounded-md !px-2"
        onClick={handleZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOut className="h-5 w-5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disableSound
        className="!min-h-[44px] !min-w-[44px] !rounded-md !px-2"
        onClick={handleFitToScreen}
        aria-label="Fit to screen"
        title="Fit to screen"
      >
        <Maximize className="h-5 w-5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disableSound
        className="!min-h-[44px] !min-w-[44px] !rounded-md !px-2"
        onClick={handleResetCamera}
        aria-label="Reset camera"
        title="Reset camera"
      >
        <LocateFixed className="h-5 w-5" aria-hidden />
      </Button>
    </div>
  );
}

type GoalsHealthEntry = {
  status: GoalHealth;
  daysRemaining: number | null;
  momentum: 'active' | 'dormant';
};

interface GoalMindmapViewProps {
  /** Goals that pass the active page filters (flat match set). */
  goals: Goal[];
  /** Full hierarchy used for parent/child links; defaults to `goals`. */
  allGoals?: Goal[];
  goalsProgress: Map<string, GoalProgressBreakdown>;
  goalsHealth: Map<string, GoalsHealthEntry>;
  onGoalClick: (goal: Goal) => void;
  onCreateSubgoal?: (parentGoal: Goal) => void;
  /** When set, show only this leaf goal and its ancestor pipeline. */
  focusGoalId?: string | null;
  onClearFocus?: () => void;
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
  onCreateSubgoal?: (parentGoal: Goal) => void,
  options?: {
    ancestorIds?: Set<string>;
    focusedLeafId?: string;
    onOpenDetail?: (goal: Goal) => void;
  }
): { nodes: GoalMindmapRfNode[]; edges: Edge[] } {
  const { ancestorIds, focusedLeafId, onOpenDetail } = options ?? {};
  const visibleSubtree = pruneSubtreeOrphans(subtree);
  const nodes: GoalMindmapRfNode[] = visibleSubtree.map((goal) => {
    const isDimmed = ancestorIds?.has(goal.id) ?? false;
    const isFocused = focusedLeafId != null && goal.id === focusedLeafId;
    return {
      id: goal.id,
      type: 'goalMindmap',
      position: { x: 0, y: 0 },
      data: {
        goal,
        progress: goalsProgress.get(goal.id),
        healthStatus: goalsHealth.get(goal.id)?.status,
        isRoot: goal.id === rootId,
        isDimmed,
        isFocused,
        timeframeLabel: formatGoalMindmapTimeframe(goal),
        isOverdue: isGoalOverdue(goal) && !isDimmed,
        onAddSubgoal: onCreateSubgoal,
        onOpenDetail: isDimmed ? onOpenDetail : undefined,
      },
    };
  });

  const edges: Edge[] = [];
  for (const goal of visibleSubtree) {
    if (goal.parentGoalId && visibleSubtree.some((g) => g.id === goal.parentGoalId)) {
      const targetOverdue = isGoalOverdue(goal);
      const parentDimmed = ancestorIds?.has(goal.parentGoalId) ?? false;
      const targetDimmed = ancestorIds?.has(goal.id) ?? false;
      const targetFocused = focusedLeafId != null && goal.id === focusedLeafId;
      const bothDimmed = parentDimmed && targetDimmed;
      const edgeDimmed = bothDimmed && !targetFocused;

      edges.push({
        id: `e-${goal.parentGoalId}-${goal.id}`,
        source: goal.parentGoalId,
        target: goal.id,
        type: 'smoothstep',
        animated: !targetOverdue && !edgeDimmed,
        style:
          targetOverdue && !edgeDimmed
            ? { stroke: '#ef4444', strokeWidth: 2.5 }
            : {
                stroke: '#64748b',
                strokeWidth: targetFocused ? 2.5 : 2,
                opacity: edgeDimmed ? 0.35 : 1,
              },
      });
    }
  }

  return { nodes, edges };
}

function MindmapFlowInner({
  goals,
  allGoals,
  goalsProgress,
  goalsHealth,
  onGoalClick,
  onCreateSubgoal,
  focusGoalId,
  onClearFocus,
}: GoalMindmapViewProps) {
  const { fitView } = useReactFlow();

  const hierarchyGoals = allGoals ?? goals;
  const matchingIds = useMemo(() => new Set(goals.map((g) => g.id)), [goals]);

  const pipelineFocus = useMemo(() => {
    if (!focusGoalId) return null;
    const result = buildPipelineSubtree(focusGoalId, hierarchyGoals);
    if (result.subtree.length === 0) return null;
    return result;
  }, [focusGoalId, hierarchyGoals]);

  const isPipelineFocusActive = pipelineFocus != null;

  const rootGoals = useMemo(
    () => listTopMatchingRootGoals(hierarchyGoals, matchingIds),
    [hierarchyGoals, matchingIds]
  );

  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);

  const effectiveRootId = useMemo(() => {
    if (pipelineFocus?.rootId) return pipelineFocus.rootId;
    if (rootGoals.length === 0) return null;
    if (selectedRootId && rootGoals.some((g) => g.id === selectedRootId)) {
      return selectedRootId;
    }
    return rootGoals[0]!.id;
  }, [pipelineFocus, rootGoals, selectedRootId]);

  const focusedLeafGoal = useMemo(() => {
    if (!pipelineFocus) return null;
    return pipelineFocus.subtree.find((g) => g.id === pipelineFocus.leafId) ?? null;
  }, [pipelineFocus]);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!effectiveRootId) {
      return { initialNodes: [] as GoalMindmapRfNode[], initialEdges: [] as Edge[] };
    }

    const subtree = pipelineFocus
      ? pipelineFocus.subtree
      : collectMatchingSubtreeGoals(effectiveRootId, hierarchyGoals, matchingIds, goalsHealth);

    const { nodes, edges } = buildGraph(
      subtree,
      effectiveRootId,
      goalsProgress,
      goalsHealth,
      onCreateSubgoal,
      pipelineFocus
        ? {
            ancestorIds: pipelineFocus.ancestorIds,
            focusedLeafId: pipelineFocus.leafId,
            onOpenDetail: onGoalClick,
          }
        : undefined
    );
    const laidOut = layoutMindmap(nodes, edges);
    return { initialNodes: laidOut.nodes as GoalMindmapRfNode[], initialEdges: laidOut.edges };
  }, [
    effectiveRootId,
    pipelineFocus,
    hierarchyGoals,
    matchingIds,
    goalsProgress,
    goalsHealth,
    onCreateSubgoal,
    onGoalClick,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const id = requestAnimationFrame(() => {
      void fitView({ padding: MINDMAP_FIT_PADDING, duration: 280 });
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

  if (rootGoals.length === 0 && !isPipelineFocusActive) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {isPipelineFocusActive && focusedLeafGoal ? (
            <div className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
              <span className="font-medium">Focusing:</span>
              <span className="max-w-[240px] truncate">{focusedLeafGoal.title}</span>
              {onClearFocus ? (
                <button
                  type="button"
                  onClick={onClearFocus}
                  className="ml-1 flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  aria-label="Clear pipeline focus"
                  title="Clear pipeline focus"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <label
                htmlFor="mindmap-root-goal"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Focus goal
              </label>
              <Select
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
              </Select>
            </>
          )}
        </div>
        <MindmapToolbar />
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
