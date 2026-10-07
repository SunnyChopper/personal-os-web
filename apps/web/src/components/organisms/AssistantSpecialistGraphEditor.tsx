import { useMemo, useState } from 'react';
import { Background, Controls, ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { assistantSpecialistsService } from '@/services/assistant-specialists.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import { cn } from '@/lib/utils';
import {
  specialistLabelClassName,
  specialistMutedTextClassName,
  specialistPanelClassName,
} from '@/lib/assistant/specialist-admin-surfaces';

export function AssistantSpecialistGraphEditor({ specialistId }: { specialistId: string }) {
  const queryClient = useQueryClient();
  const graphQ = useQuery({
    queryKey: queryKeys.assistantSpecialists.graph(specialistId),
    queryFn: async () => {
      const response = await assistantSpecialistsService.graph(specialistId);
      if (!response.success) throw new Error(response.error?.message || 'Unable to load graph');
      return response.data ?? { nodes: [], edges: [] };
    },
  });
  const [label, setLabel] = useState('');
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [relation, setRelation] = useState('related_to');
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.assistantSpecialists.graph(specialistId) });
  const addNode = useMutation({
    mutationFn: async () => {
      const response = await assistantSpecialistsService.createGraphNode(specialistId, {
        label: label.trim(),
        description: '',
        positionX: 0,
        positionY: 0,
      });
      if (!response.success) throw new Error(response.error?.message || 'Unable to add node');
    },
    onSuccess: async () => {
      setLabel('');
      await refresh();
    },
  });
  const addEdge = useMutation({
    mutationFn: async () => {
      const response = await assistantSpecialistsService.createGraphEdge(specialistId, {
        source,
        target,
        relation: relation.trim() || 'related_to',
      });
      if (!response.success) throw new Error(response.error?.message || 'Unable to add edge');
    },
    onSuccess: async () => {
      setSource('');
      setTarget('');
      await refresh();
    },
  });
  const deleteNode = useMutation({
    mutationFn: (nodeId: string) =>
      assistantSpecialistsService.deleteGraphNode(specialistId, nodeId),
    onSuccess: refresh,
  });
  const deleteEdge = useMutation({
    mutationFn: (edgeId: string) =>
      assistantSpecialistsService.deleteGraphEdge(specialistId, edgeId),
    onSuccess: refresh,
  });
  const nodes = useMemo<Node[]>(
    () =>
      (graphQ.data?.nodes ?? []).map((node) => ({
        id: node.id,
        position: { x: node.positionX, y: node.positionY },
        data: { label: node.label },
      })),
    [graphQ.data?.nodes]
  );
  const edges = useMemo<Edge[]>(
    () =>
      (graphQ.data?.edges ?? []).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relation,
        animated: false,
      })),
    [graphQ.data?.edges]
  );
  const graphNodes = graphQ.data?.nodes ?? [];

  return (
    <div className={cn(specialistPanelClassName, 'space-y-3 p-4')}>
      <div>
        <span className={specialistLabelClassName}>Knowledge graph</span>
        <p className={cn('mt-1 text-xs', specialistMutedTextClassName)}>
          Author compact concepts and relationships injected into this specialist&apos;s context.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <FormInput
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="New concept"
          aria-label="New graph concept"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addNode.mutate()}
          disabled={!label.trim() || addNode.isPending}
        >
          Add node
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Select
          value={source}
          onChange={(event) => setSource(event.target.value)}
          aria-label="Edge source"
        >
          <option value="">Source node</option>
          {graphNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </Select>
        <Select
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          aria-label="Edge target"
        >
          <option value="">Target node</option>
          {graphNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </Select>
        <FormInput
          value={relation}
          onChange={(event) => setRelation(event.target.value)}
          placeholder="relation"
          aria-label="Edge relation"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addEdge.mutate()}
          disabled={!source || !target || source === target || addEdge.isPending}
        >
          Add edge
        </Button>
      </div>
      <div className="h-64 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <div className="space-y-1 text-xs">
        {graphNodes.map((node) => (
          <div key={node.id} className="flex items-center justify-between gap-2">
            <span className="truncate">{node.label}</span>
            <button
              type="button"
              className="text-red-700 hover:underline dark:text-red-300"
              onClick={() => deleteNode.mutate(node.id)}
            >
              Remove
            </button>
          </div>
        ))}
        {(graphQ.data?.edges ?? []).map((edge) => (
          <div
            key={edge.id}
            className="flex items-center justify-between gap-2 text-gray-500 dark:text-gray-400"
          >
            <span className="truncate">
              {edge.source} —{edge.relation}→ {edge.target}
            </span>
            <button
              type="button"
              className="text-red-700 hover:underline dark:text-red-300"
              onClick={() => deleteEdge.mutate(edge.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {graphQ.isError && (
        <p className="text-sm text-red-700 dark:text-red-300">Unable to load graph.</p>
      )}
    </div>
  );
}
