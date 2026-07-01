import { describe, expect, it } from 'vitest';
import {
  formatModelDisplayLabel,
  formatProviderDisplay,
  stripParentheticalSegment,
} from './assistantMemoryIngestionDisplay';

describe('assistantMemoryIngestionDisplay', () => {
  it('formats known providers with brand casing', () => {
    expect(formatProviderDisplay('groq')).toBe('Groq');
    expect(formatProviderDisplay('openai')).toBe('OpenAI');
    expect(formatProviderDisplay('OPENAI')).toBe('OpenAI');
  });

  it('strips trailing parenthetical system ids', () => {
    expect(stripParentheticalSegment('Groq GPT-OSS 20B (openai/gpt-oss-20b)')).toBe(
      'Groq GPT-OSS 20B'
    );
  });

  it('removes redundant provider prefix from model label', () => {
    expect(formatModelDisplayLabel('Groq GPT-OSS 20B (openai/gpt-oss-20b)', 'groq')).toBe(
      'GPT-OSS 20B'
    );
    expect(formatModelDisplayLabel('OpenAI GPT-4o mini', 'openai')).toBe('GPT-4o mini');
  });
});
