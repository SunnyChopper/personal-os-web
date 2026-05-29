import { describe, expect, it } from 'vitest';
import {
  extractObservabilityMessageContent,
  normalizePromptDisplayString,
  parseObservabilityPromptText,
  resolveObservabilityMessageContent,
} from '../observability-prompt-display';

describe('observability-prompt-display', () => {
  it('reads backend astream { role, text } messages instead of JSON-stringifying the object', () => {
    const body = 'Line one\nLine two';
    expect(resolveObservabilityMessageContent({ role: 'system', text: body })).toBe(body);
    expect(extractObservabilityMessageContent({ role: 'user', text: 'hello' })).toBe('hello');
  });

  it('reads OpenAI-style { role, content } messages', () => {
    expect(resolveObservabilityMessageContent({ role: 'user', content: 'Ask me anything' })).toBe(
      'Ask me anything'
    );
  });

  it('expands literal \\n when the string has no real newlines', () => {
    expect(normalizePromptDisplayString('line1\\nline2')).toBe('line1\nline2');
  });

  it('parses promptText JSON arrays from llm_observer', () => {
    const promptText = JSON.stringify([
      { role: 'system', text: 'You are helpful.' },
      { role: 'user', text: 'Summarize my day.' },
    ]);
    const parsed = parseObservabilityPromptText(promptText);
    expect(parsed.kind).toBe('messages');
    if (parsed.kind !== 'messages') return;
    expect(resolveObservabilityMessageContent(parsed.messages[0])).toBe('You are helpful.');
    expect(resolveObservabilityMessageContent(parsed.messages[1])).toBe('Summarize my day.');
  });

  it('treats a single message object as one message', () => {
    const promptText = JSON.stringify({ role: 'assistant', text: 'Done.' });
    const parsed = parseObservabilityPromptText(promptText);
    expect(parsed.kind).toBe('messages');
    if (parsed.kind !== 'messages') return;
    expect(parsed.messages).toHaveLength(1);
    expect(resolveObservabilityMessageContent(parsed.messages[0])).toBe('Done.');
  });
});
