/**
 * Type definitions for Markdown Viewer feature
 */

export interface MarkdownFile {
  id: string;
  path: string; // e.g., "docs/guides/getting-started.md"
  name: string; // e.g., "getting-started.md"
  content?: string; // Markdown content (may be missing if downloadUrl is provided)
  downloadUrl?: string; // S3 presigned URL to fetch content
  size: number; // bytes
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  tags?: string[];
  category?: string;
  folderPath?: string; // e.g., "docs/guides"
}

export interface FileTreeNode {
  type: 'file' | 'folder';
  name: string;
  path: string;
  children?: FileTreeNode[]; // For folders
  metadata?: MarkdownFile; // For files
}

// API Response Types
export interface GetFilesResponse {
  files: MarkdownFile[];
}

export interface GetFileTreeResponse {
  tree: FileTreeNode[];
}

export interface GetFileResponse {
  file: MarkdownFile;
}

export interface CreateFileRequest {
  path: string;
  content?: string;
}

export interface CreateFileResponse {
  file: MarkdownFile;
}

export interface UpdateFileRequest {
  content?: string;
  tags?: string[];
  category?: string;
}

export interface UpdateFileResponse {
  file: MarkdownFile;
}

export interface DeleteFileResponse {
  success: boolean;
}

export interface UploadFilesResponse {
  files: MarkdownFile[];
}

export interface PresignedUrlRequest {
  fileName: string; // e.g., "getting-started.md" (must end with .md)
  folderPath?: string; // e.g., "docs/guides" (optional, omit for root-level files)
  tags?: string[]; // Array of tags for organization
  category?: string; // Category for grouping files
}

export interface PresignedUrlFields {
  key: string; // S3 object key
  'Content-Type': string; // Must be "text/markdown"
  AWSAccessKeyId: string;
  policy: string;
  signature: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string; // S3 presigned POST URL endpoint
  fields: PresignedUrlFields; // Form fields to include in POST request
  fileId: string; // Generated file ID (use this to reference the file)
  s3Key: string; // S3 object key where the file will be stored
  expiresIn: number; // Expiration time in seconds (default: 3600 = 1 hour)
}

export interface SearchResult {
  file: MarkdownFile;
  matchScore?: number;
}

export interface SearchFilesResponse {
  results: SearchResult[];
}

export interface GetTagsResponse {
  tags: string[];
}

export interface GetCategoriesResponse {
  categories: string[];
}
