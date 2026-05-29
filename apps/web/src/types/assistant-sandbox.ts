export interface SandboxMessageRow {
  role: string;
  text: string;
}

export interface SandboxSession {
  sessionId: string;
  sourceExecutionId: string;
  systemPrompt: string;
  messages: SandboxMessageRow[];
  provider: string;
  model: string;
  temperature?: number | null;
  maxTokens?: number | null;
  createdAt: string;
  expiresAt: string;
}

export interface CreateSandboxSessionRequest {
  fromExecutionId: string;
}
