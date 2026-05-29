/** Optional LLM selection for Knowledge Vault note AI endpoints. */
export type NoteAIOptions = {
  /** Catalog model id (e.g. openai:gpt-5.4-mini) when manual; omit for server vault defaults. */
  model?: string;
};

export function withNoteAIModel<T extends Record<string, unknown>>(
  body: T,
  options?: NoteAIOptions
): T & { model?: string } {
  const model = options?.model?.trim();
  if (!model) return body;
  return { ...body, model };
}
