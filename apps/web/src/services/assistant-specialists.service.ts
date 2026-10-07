import { apiClient } from '@/lib/api-client';
import type {
  ApiResponse,
  AssistantSpecialist,
  AssistantSpecialistDocument,
  AssistantSpecialistGraph,
  AssistantSpecialistGraphEdge,
  AssistantSpecialistGraphNode,
} from '@/types/api-contracts';

export type AssistantSpecialistWrite = Omit<AssistantSpecialist, 'createdAt' | 'updatedAt'>;

export const assistantSpecialistsService = {
  list(): Promise<ApiResponse<AssistantSpecialist[]>> {
    return apiClient.getAssistantSpecialists();
  },
  create(body: Record<string, unknown>): Promise<ApiResponse<AssistantSpecialist>> {
    return apiClient.createAssistantSpecialist(body);
  },
  update(id: string, body: Record<string, unknown>): Promise<ApiResponse<AssistantSpecialist>> {
    return apiClient.updateAssistantSpecialist(id, body);
  },
  remove(id: string): Promise<ApiResponse<void>> {
    return apiClient.deleteAssistantSpecialist(id);
  },
  restoreDefaults(): Promise<ApiResponse<AssistantSpecialist[]>> {
    return apiClient.restoreAssistantSpecialistDefaults();
  },
  listDocuments(id: string): Promise<ApiResponse<AssistantSpecialistDocument[]>> {
    return apiClient.getAssistantSpecialistDocuments(id);
  },
  createDocumentUpload(
    id: string,
    body: Record<string, unknown>
  ): Promise<ApiResponse<AssistantSpecialistDocument>> {
    return apiClient.createAssistantSpecialistDocumentUpload(id, body);
  },
  completeDocumentUpload(
    id: string,
    documentId: string
  ): Promise<ApiResponse<AssistantSpecialistDocument>> {
    return apiClient.completeAssistantSpecialistDocumentUpload(id, documentId);
  },
  deleteDocument(id: string, documentId: string): Promise<ApiResponse<void>> {
    return apiClient.deleteAssistantSpecialistDocument(id, documentId);
  },
  graph(id: string): Promise<ApiResponse<AssistantSpecialistGraph>> {
    return apiClient.getAssistantSpecialistGraph(id);
  },
  createGraphNode(
    id: string,
    body: Record<string, unknown>
  ): Promise<ApiResponse<AssistantSpecialistGraphNode>> {
    return apiClient.createAssistantSpecialistGraphNode(id, body);
  },
  deleteGraphNode(id: string, nodeId: string): Promise<ApiResponse<void>> {
    return apiClient.deleteAssistantSpecialistGraphNode(id, nodeId);
  },
  createGraphEdge(
    id: string,
    body: Record<string, unknown>
  ): Promise<ApiResponse<AssistantSpecialistGraphEdge>> {
    return apiClient.createAssistantSpecialistGraphEdge(id, body);
  },
  deleteGraphEdge(id: string, edgeId: string): Promise<ApiResponse<void>> {
    return apiClient.deleteAssistantSpecialistGraphEdge(id, edgeId);
  },
};
