/** Tools module API DTOs (camelCase only; matches backend ApiResponse data). */

export interface WhiteboardSummary {
  id: string;
  name: string;
  vaultItemId: string;
  updatedAt: string;
  createdAt: string;
}

export interface WhiteboardListResponse {
  items: WhiteboardSummary[];
}

export interface WhiteboardDetailResponse {
  id: string;
  name: string;
  vaultItemId: string;
  sceneJson: string;
  updatedAt: string;
  createdAt: string;
}

export interface SaveWhiteboardPayload {
  boardId: string;
  name: string;
  sceneJson: string;
  thumbnailDataUrl?: string | null;
  vaultItemId?: string | null;
}

/** Workflows (node graph executor) */
export interface WorkflowNodeDto {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdgeDto {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
}

export interface WorkflowDefinition {
  nodes: WorkflowNodeDto[];
  edges: WorkflowEdgeDto[];
}

export interface WorkflowResponse {
  id: string;
  name: string;
  description: string;
  definition: WorkflowDefinition;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string | null;
  lastRunStatus?: 'success' | 'error' | 'running' | null;
}

export interface WorkflowRunResponse {
  id: string;
  workflowId: string;
  triggerKind: string;
  status: 'success' | 'error' | 'running';
  startedAt: string;
  finishedAt?: string | null;
  nodeLogs: Array<{
    nodeId: string;
    status: string;
    durationMs: number;
    outputPreview?: string | null;
    error?: string | null;
  }>;
}

export interface TriggerWorkflowRunRequest {
  inputs?: Record<string, unknown>;
}
