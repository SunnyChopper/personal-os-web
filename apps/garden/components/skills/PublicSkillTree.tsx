'use client';

import type { SkillEdgeRow, SkillNodeRow } from '@/lib/queries/public-skills';
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useMemo } from 'react';

function layoutNodes(nodes: SkillNodeRow[]): Node[] {
  const perCat: Record<string, SkillNodeRow[]> = {};
  for (const n of nodes) {
    const c = n.category || 'general';
    if (!perCat[c]) perCat[c] = [];
    perCat[c].push(n);
  }
  const out: Node[] = [];
  let col = 0;
  for (const [, items] of Object.entries(perCat)) {
    items.forEach((n, row) => {
      out.push({
        id: n.sourceSkillId,
        position: { x: col * 220, y: row * 90 },
        data: { label: `${n.name}\n${n.level} · ${Math.round(n.progressPercentage)}%` },
        style: {
          fontSize: 11,
          padding: 8,
          borderRadius: 8,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          color: '#374151',
          width: 180,
        },
      });
    });
    col += 1;
  }
  return out;
}

export function PublicSkillTree({
  nodes,
  edges,
}: {
  nodes: SkillNodeRow[];
  edges: SkillEdgeRow[];
}) {
  const initialNodes = useMemo(() => layoutNodes(nodes), [nodes]);
  const initialEdges: Edge[] = useMemo(
    () =>
      edges.map((e, i) => ({
        id: `e-${i}`,
        source: e.parentSourceSkillId,
        target: e.childSourceSkillId,
      })),
    [edges]
  );
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setRfNodes(layoutNodes(nodes));
    setRfEdges(
      edges.map((e, i) => ({
        id: `e-${i}`,
        source: e.parentSourceSkillId,
        target: e.childSourceSkillId,
      }))
    );
  }, [nodes, edges, setRfEdges, setRfNodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
