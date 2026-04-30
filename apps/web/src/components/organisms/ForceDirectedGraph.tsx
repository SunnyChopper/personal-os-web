import { useEffect, useRef, useState, useCallback } from 'react';
import type { ConceptNode, ConceptEdge } from '@/types/concept-graph';
import { getAreaColor } from '@/constants/growth-system';

interface ForceDirectedGraphProps {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  selectedNodeId?: string | null;
  onNodeClick?: (node: ConceptNode) => void;
  onNodeDoubleClick?: (node: ConceptNode) => void;
  onCanvasClick?: () => void;
  width?: number;
  height?: number;
}

interface SimulationNode extends ConceptNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
}

export default function ForceDirectedGraph({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
  onNodeDoubleClick,
  onCanvasClick,
  width = 800,
  height = 600,
}: ForceDirectedGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [simulationNodes, setSimulationNodes] = useState<SimulationNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<SimulationNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const initializeSimulation = useCallback(() => {
    const simNodes: SimulationNode[] = nodes.map((node) => ({
      ...node,
      x: node.x !== undefined ? node.x : Math.random() * width,
      y: node.y !== undefined ? node.y : Math.random() * height,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    }));
    setSimulationNodes(simNodes);
  }, [nodes, width, height]);

  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  const applyForces = useCallback(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    const repulsionStrength = 3000;
    const attractionStrength = 0.001;
    const centeringStrength = 0.01;
    const damping = 0.8;

    setSimulationNodes((prevNodes) => {
      const newNodes = [...prevNodes];

      newNodes.forEach((node) => {
        if (node.fx !== null && node.fy !== null) {
          node.x = node.fx;
          node.y = node.fy;
          node.vx = 0;
          node.vy = 0;
          return;
        }

        let fx = 0;
        let fy = 0;

        newNodes.forEach((other) => {
          if (node.id === other.id) return;

          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;

          const repulsion = repulsionStrength / distSq;
          fx -= (dx / dist) * repulsion;
          fy -= (dy / dist) * repulsion;
        });

        edges.forEach((edge) => {
          const isSource = edge.source === node.id;
          const isTarget = edge.target === node.id;
          if (!isSource && !isTarget) return;

          const otherId = isSource ? edge.target : edge.source;
          const other = newNodes.find((n) => n.id === otherId);
          if (!other) return;

          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const attraction = attractionStrength * dist * edge.connectionStrength;
          fx += dx * attraction;
          fy += dy * attraction;
        });

        const dxCenter = centerX - node.x;
        const dyCenter = centerY - node.y;
        fx += dxCenter * centeringStrength;
        fy += dyCenter * centeringStrength;

        node.vx = (node.vx + fx) * damping;
        node.vy = (node.vy + fy) * damping;

        node.x += node.vx;
        node.y += node.vy;

        const padding = 40;
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });

      return newNodes;
    });
  }, [edges, width, height]);

  useEffect(() => {
    let iterations = 0;
    const maxIterations = 300;

    const animate = () => {
      if (iterations < maxIterations) {
        applyForces();
        iterations++;
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [applyForces]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    edges.forEach((edge) => {
      const sourceNode = simulationNodes.find((n) => n.id === edge.source);
      const targetNode = simulationNodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return;

      const gradient = ctx.createLinearGradient(
        sourceNode.x,
        sourceNode.y,
        targetNode.x,
        targetNode.y
      );
      gradient.addColorStop(0, 'rgba(148, 163, 184, 0.3)');
      gradient.addColorStop(1, 'rgba(148, 163, 184, 0.3)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(1, edge.connectionStrength * 3);
      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.stroke();
    });

    simulationNodes.forEach((node) => {
      const isSelected = node.id === selectedNodeId;
      const radius = isSelected ? 35 : 28;
      const color = getAreaColor(node.area);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = isSelected ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const label = node.label.length > 15 ? node.label.substring(0, 13) + '...' : node.label;
      ctx.fillText(label, node.x, node.y);
    });
  }, [simulationNodes, edges, selectedNodeId, width, height]);

  const getNodeAtPosition = (x: number, y: number): SimulationNode | null => {
    for (let i = simulationNodes.length - 1; i >= 0; i--) {
      const node = simulationNodes[i];
      const dx = x - node.x;
      const dy = y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 30) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = getNodeAtPosition(x, y);
    if (node) {
      setIsDragging(true);
      setDraggedNode(node);
      node.fx = node.x;
      node.fy = node.y;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedNode) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSimulationNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === draggedNode.id ? { ...node, fx: x, fy: y, x, y } : node))
    );
  };

  const handleMouseUp = () => {
    if (draggedNode) {
      setSimulationNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggedNode.id ? { ...node, fx: null, fy: null } : node
        )
      );
    }
    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = getNodeAtPosition(x, y);
    if (node) {
      onNodeClick?.(node);
    } else {
      onCanvasClick?.();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = getNodeAtPosition(x, y);
    if (node) {
      onNodeDoubleClick?.(node);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}
