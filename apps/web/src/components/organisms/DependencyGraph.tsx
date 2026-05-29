import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import dagre from '@dagrejs/dagre';
import {
  Background,
  Controls,
  MarkerType,
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
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { Task, TaskDependency } from '@/types/growth-system';
import {
  TaskGraphNode,
  TASK_GRAPH_NODE_HEIGHT,
  TASK_GRAPH_NODE_WIDTH,
  type TaskGraphRfNode,
} from '@/components/molecules/TaskGraphNode';
import { cn } from '@/lib/utils';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  isLoading?: boolean;
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

const nodeTypes = { taskGraph: TaskGraphNode };

const GRAPH_SHELL_CLASS =
  'h-[min(70vh,600px)] min-h-96 w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden';

function layoutElements(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB',
    nodesep: 48,
    ranksep: 80,
    marginx: 24,
    marginy: 24,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: TASK_GRAPH_NODE_WIDTH, height: TASK_GRAPH_NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - TASK_GRAPH_NODE_WIDTH / 2,
        y: pos.y - TASK_GRAPH_NODE_HEIGHT / 2,
      },
    };
  });
}

function buildFlowGraph(
  tasks: Task[],
  dependencies: TaskDependency[],
  selectedNodeId: string | null
): { nodes: TaskGraphRfNode[]; edges: Edge[] } {
  const taskIds = new Set(tasks.map((t) => t.id));

  const flowNodes: TaskGraphRfNode[] = tasks.map((task) => ({
    id: task.id,
    type: 'taskGraph',
    position: { x: 0, y: 0 },
    data: { task },
    selected: selectedNodeId === task.id,
  }));

  const flowEdges: Edge[] = dependencies
    .filter((dep) => taskIds.has(dep.taskId) && taskIds.has(dep.dependsOnTaskId))
    .map((dep) => {
      const highlighted = selectedNodeId === dep.taskId || selectedNodeId === dep.dependsOnTaskId;
      return {
        id: `dep-${dep.dependsOnTaskId}-${dep.taskId}`,
        source: dep.dependsOnTaskId,
        target: dep.taskId,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: highlighted,
        style: highlighted
          ? { stroke: '#3b82f6', strokeWidth: 2.5 }
          : { stroke: '#9ca3af', strokeWidth: 2 },
      };
    });

  const layoutedNodes = layoutElements(flowNodes, flowEdges) as TaskGraphRfNode[];
  return { nodes: layoutedNodes, edges: flowEdges };
}

function DependencyGraphFlow({
  tasks,
  dependencies,
  onTaskClick,
  className,
}: Omit<DependencyGraphProps, 'isLoading'>) {
  const { fitView } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildFlowGraph(tasks, dependencies, selectedNode),
    [tasks, dependencies, selectedNode]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const id = requestAnimationFrame(() => {
      void fitView({ padding: 0.2, duration: 280 });
    });
    return () => cancelAnimationFrame(id);
  }, [nodes, fitView]);

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      onTaskClick?.(node.id);
    },
    [onTaskClick]
  );

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedNode) ?? null,
    [tasks, selectedNode]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('bg-white dark:bg-gray-800', className)}
    >
      <div className={GRAPH_SHELL_CLASS}>
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
          className="bg-gray-50 dark:bg-gray-900/50"
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

      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Selected Task</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTask.title}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DependencyGraph({
  tasks,
  dependencies,
  isLoading = false,
  onTaskClick,
  className,
}: DependencyGraphProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex min-h-96 flex-col items-center justify-center gap-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
          className
        )}
        aria-busy="true"
        aria-label="Loading dependency graph"
      >
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading dependency graph…</p>
        <div className="h-32 w-full max-w-md animate-pulse rounded-lg bg-gray-200/80 dark:bg-gray-700/80" />
      </motion.div>
    );
  }

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex h-96 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800',
          className
        )}
      >
        <p className="text-gray-500 dark:text-gray-400">No tasks to display</p>
      </motion.div>
    );
  }

  if (dependencies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex h-96 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800',
          className
        )}
      >
        <p className="text-gray-500 dark:text-gray-400">No dependencies to visualize</p>
      </motion.div>
    );
  }

  return (
    <ReactFlowProvider>
      <DependencyGraphFlow
        tasks={tasks}
        dependencies={dependencies}
        onTaskClick={onTaskClick}
        className={className}
      />
    </ReactFlowProvider>
  );
}
