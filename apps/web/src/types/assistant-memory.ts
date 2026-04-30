import type { MarkdownFile } from '@/types/markdown-files';
import type { Area } from '@/types/growth-system';

export interface AssistantMemoryFile extends MarkdownFile {
  userId?: string;
  s3Key?: string;
  s3Bucket?: string;
  mimeType?: string;
  sharedWith?: string[];
}

export interface ShortTermMemoryResponse {
  file: AssistantMemoryFile;
  content: string;
}

export interface ShortTermMemoryHistoryResponse {
  files: AssistantMemoryFile[];
}

export interface ConsolidateMemoryResponse {
  date: string;
  sourceFile: AssistantMemoryFile;
  archivedFile?: AssistantMemoryFile | null;
  factsCreated: number;
  factsUpdated: number;
  linkedNotes: number;
  archived: boolean;
}

/** Assistant semantic LTM (PostgreSQL pgvector); not a Knowledge Vault note. */
export interface LongTermMemoryEntry {
  id: string;
  dedupeKey: string;
  title: string;
  summary: string;
  area: Area | string | null;
  tags: string[];
  source: string;
  relatedMemoryIds: string[];
  createdAt: string;
  updatedAt: string;
  embeddingModel: string;
  embeddingVersion: number;
  vaultNoteId?: string | null;
  score?: number | null;
  archived?: boolean;
  accessCount?: number;
  lastAccessedAt?: string | null;
}
