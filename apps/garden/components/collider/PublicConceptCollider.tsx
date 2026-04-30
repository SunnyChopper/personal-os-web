"use client";

import type { ConceptNodeRow } from "@/lib/queries/public-collider";
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function PublicConceptCollider({ initialNodes }: { initialNodes: ConceptNodeRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nodes: Node[] = useMemo(
    () =>
      initialNodes.map((n, i) => ({
        id: n.id,
        position: { x: (i % 4) * 200, y: Math.floor(i / 4) * 120 },
        data: { label: n.label },
        style: {
          padding: 10,
          borderRadius: 8,
          background: selected.includes(n.id) ? "#eff6ff" : "#ffffff",
          border: selected.includes(n.id) ? "2px solid #3b82f6" : "1px solid #e5e7eb",
          color: "#374151",
          width: 160,
          fontSize: 12,
        },
      })),
    [initialNodes, selected],
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, , onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setRfNodes(nodes);
  }, [nodes, setRfNodes]);

  const onNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      setSelected((prev) => {
        if (prev.includes(node.id)) return prev.filter((x) => x !== node.id);
        if (prev.length >= 3) return [...prev.slice(1), node.id];
        return [...prev, node.id];
      });
    },
    [setSelected],
  );

  const synthesize = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/collider/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "failed");
      setResult(data.text as string);
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 p-2">
        <button
          type="button"
          onClick={synthesize}
          disabled={selected.length < 2 || loading}
          className="rounded bg-primary px-3 py-1 text-sm text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
        >
          {loading ? "…" : "Synthesize selection"}
        </button>
        <span className="text-xs text-gray-500">Select 2–3 nodes (click)</span>
      </div>
      <div className="relative min-h-[400px] flex-1">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      {result ? (
        <div className="max-h-48 overflow-auto border-t border-gray-200 p-3 text-sm text-gray-700">
          {result}
        </div>
      ) : null}
    </div>
  );
}
