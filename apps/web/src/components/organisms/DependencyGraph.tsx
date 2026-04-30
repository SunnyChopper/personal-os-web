import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { Task, TaskDependency } from '@/types/growth-system';
import { cn } from '@/lib/utils';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  isLoading?: boolean;
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  level: number;
}

interface GraphEdge {
  from: string;
  to: string;
  fromNode: GraphNode;
  toNode: GraphNode;
}

export default function DependencyGraph({
  tasks,
  dependencies,
  isLoading = false,
  onTaskClick,
  className,
}: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 60;
  const LEVEL_HEIGHT = 120;
  const NODE_SPACING = 40;

  useEffect(() => {
    if (tasks.length === 0) return;

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const dependencyMap = new Map<string, string[]>();

    dependencies.forEach((dep) => {
      if (!dependencyMap.has(dep.taskId)) {
        dependencyMap.set(dep.taskId, []);
      }
      dependencyMap.get(dep.taskId)!.push(dep.dependsOnTaskId);
    });

    const visited = new Set<string>();
    const levels = new Map<string, number>();

    function calculateLevel(taskId: string): number {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0;

      visited.add(taskId);
      const deps = dependencyMap.get(taskId) || [];

      if (deps.length === 0) {
        levels.set(taskId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(...deps.map((depId) => calculateLevel(depId)));
      const level = maxDepLevel + 1;
      levels.set(taskId, level);
      return level;
    }

    tasks.forEach((task) => {
      if (!levels.has(task.id)) {
        calculateLevel(task.id);
      }
    });

    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, taskId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(taskId);
    });

    const graphNodes: GraphNode[] = [];

    levelGroups.forEach((taskIds, level) => {
      const y = level * LEVEL_HEIGHT + 50;
      const startX = 50;

      taskIds.forEach((taskId, index) => {
        const task = taskMap.get(taskId);
        if (task) {
          graphNodes.push({
            id: taskId,
            task,
            x: startX + index * (NODE_WIDTH + NODE_SPACING),
            y,
            level,
          });
        }
      });
    });

    const nodeMap = new Map(graphNodes.map((n) => [n.id, n]));
    const graphEdges: GraphEdge[] = [];

    dependencies.forEach((dep) => {
      const fromNode = nodeMap.get(dep.taskId);
      const toNode = nodeMap.get(dep.dependsOnTaskId);
      if (fromNode && toNode) {
        graphEdges.push({
          from: dep.taskId,
          to: dep.dependsOnTaskId,
          fromNode,
          toNode,
        });
      }
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [tasks, dependencies]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'fill-green-500 dark:fill-green-600';
      case 'In Progress':
        return 'fill-blue-500 dark:fill-blue-600';
      case 'Blocked':
        return 'fill-red-500 dark:fill-red-600';
      case 'On Hold':
        return 'fill-yellow-500 dark:fill-yellow-600';
      default:
        return 'fill-gray-400 dark:fill-gray-600';
    }
  };

  const getStatusStroke = (status: string) => {
    switch (status) {
      case 'Done':
        return 'stroke-green-600 dark:stroke-green-700';
      case 'In Progress':
        return 'stroke-blue-600 dark:stroke-blue-700';
      case 'Blocked':
        return 'stroke-red-600 dark:stroke-red-700';
      case 'On Hold':
        return 'stroke-yellow-600 dark:stroke-yellow-700';
      default:
        return 'stroke-gray-500 dark:stroke-gray-700';
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    if (onTaskClick) {
      onTaskClick(nodeId);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 min-h-96 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
          className
        )}
        aria-busy="true"
        aria-label="Loading dependency graph"
      >
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading dependency graph…</p>
        <div className="w-full max-w-md h-32 rounded-lg bg-gray-200/80 dark:bg-gray-700/80 animate-pulse" />
      </motion.div>
    );
  }

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg',
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
          'flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg',
          className
        )}
      >
        <p className="text-gray-500 dark:text-gray-400">No dependencies to visualize</p>
      </motion.div>
    );
  }

  // Safety check for empty nodes
  if (nodes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg',
          className
        )}
      >
        <p className="text-gray-500 dark:text-gray-400">Calculating graph layout...</p>
      </motion.div>
    );
  }

  const viewBoxWidth = Math.max(...nodes.map((n) => n.x + NODE_WIDTH)) + 50;
  const viewBoxHeight = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT)) + 50;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto',
        className
      )}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full min-h-96 max-h-[600px]"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            className="fill-gray-400 dark:fill-gray-600"
          >
            <polygon points="0 0, 10 3, 0 6" />
          </marker>
          <style>
            {`
              @keyframes fadeInNode {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              @keyframes fadeInEdge {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}
          </style>
        </defs>

        {/* Edges - using regular line elements with CSS animation */}
        <g>
          {edges.map((edge, index) => {
            const fromX = edge.fromNode.x + NODE_WIDTH / 2;
            const fromY = edge.fromNode.y;
            const toX = edge.toNode.x + NODE_WIDTH / 2;
            const toY = edge.toNode.y + NODE_HEIGHT;

            const isHighlighted = selectedNode === edge.from || selectedNode === edge.to;

            return (
              <line
                key={`edge-${edge.from}-${edge.to}`}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                className={cn(
                  'stroke-2 transition-all',
                  isHighlighted
                    ? 'stroke-blue-500 dark:stroke-blue-400 stroke-[3]'
                    : 'stroke-gray-300 dark:stroke-gray-600'
                )}
                markerEnd="url(#arrowhead)"
                style={{
                  opacity: 0,
                  animation: `fadeInEdge 0.3s ease-out ${index * 0.05}s forwards`,
                }}
              />
            );
          })}
        </g>

        {/* Nodes - using regular g elements with SVG transform */}
        <g>
          {nodes.map((node, index) => {
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-opacity"
                style={{
                  opacity: 0,
                  animation: `fadeInNode 0.3s ease-out ${index * 0.1}s forwards`,
                }}
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="8"
                  className={cn(
                    'transition-all',
                    getStatusColor(node.task.status),
                    getStatusStroke(node.task.status),
                    'stroke-2',
                    isSelected && 'stroke-[4]',
                    isHovered && 'filter brightness-110'
                  )}
                  opacity={isSelected || isHovered ? 1 : 0.9}
                />

                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2 - 5}
                  textAnchor="middle"
                  className="fill-white text-sm font-semibold pointer-events-none"
                  style={{ fontSize: '14px' }}
                >
                  {node.task.title.length > 20
                    ? `${node.task.title.substring(0, 20)}...`
                    : node.task.title}
                </text>

                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2 + 12}
                  textAnchor="middle"
                  className="fill-white text-xs pointer-events-none opacity-90"
                  style={{ fontSize: '11px' }}
                >
                  {node.task.status} • {node.task.priority}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Selected Task</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {nodes.find((n) => n.id === selectedNode)?.task.title}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
