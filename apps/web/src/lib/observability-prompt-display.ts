/**
 * Normalize observability execution `promptText` for display.
 * Backend astream logs use `{ role, text }`; OpenAI-style payloads use `{ role, content }`.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/** Turn literal escape sequences (e.g. `\n` as two chars) into real control chars when needed. */
export function normalizePromptDisplayString(value: string): string {
  if (!value.includes('\\')) {
    return value;
  }
  if (value.includes('\n') || value.includes('\r')) {
    return value;
  }
  if (!/\\(?:n|r|t|\\|")/.test(value)) {
    return value;
  }
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

export function extractObservabilityMessageContent(content: unknown): string {
  if (content == null) return '';
  if (typeof content === 'string') {
    return normalizePromptDisplayString(content);
  }
  if (Array.isArray(content)) {
    const parts = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (isRecord(part) && typeof part.text === 'string') return part.text;
        if (isRecord(part) && typeof part.content === 'string') return part.content;
        return '';
      })
      .filter((part) => part.length > 0);
    if (parts.length > 0) {
      return parts.map((part) => normalizePromptDisplayString(part)).join('\n\n');
    }
  }
  if (isRecord(content)) {
    if ('content' in content) {
      return extractObservabilityMessageContent(content.content);
    }
    if (typeof content.text === 'string') {
      return normalizePromptDisplayString(content.text);
    }
  }
  return JSON.stringify(content, null, 2);
}

export function getObservabilityMessageRole(msg: unknown): string {
  if (isRecord(msg) && typeof msg.role === 'string' && msg.role.trim()) {
    return msg.role;
  }
  return 'Message';
}

export function resolveObservabilityMessageContent(msg: unknown): string {
  if (isRecord(msg) && ('content' in msg || 'text' in msg)) {
    return extractObservabilityMessageContent(msg.content ?? msg.text);
  }
  return extractObservabilityMessageContent(msg);
}

export type ParsedObservabilityPrompt =
  | { kind: 'messages'; messages: unknown[] }
  | { kind: 'json'; value: unknown }
  | { kind: 'plain'; content: string };

export function parseObservabilityPromptText(text: string): ParsedObservabilityPrompt {
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return { kind: 'messages', messages: parsed };
    }
    if (parsed !== null && typeof parsed === 'object') {
      if (isRecord(parsed) && ('content' in parsed || 'text' in parsed || 'role' in parsed)) {
        return { kind: 'messages', messages: [parsed] };
      }
      return { kind: 'json', value: parsed };
    }
    return { kind: 'plain', content: normalizePromptDisplayString(String(parsed)) };
  } catch {
    return { kind: 'plain', content: normalizePromptDisplayString(text) };
  }
}
