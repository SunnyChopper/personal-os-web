import type { z } from 'zod';

export class StreamingStructuredOutputParser<T extends z.ZodType> {
  private schema: T;
  private accumulatedContent = '';
  private lastValidResult: z.infer<T> | null = null;

  constructor(schema: T) {
    this.schema = schema;
  }

  addChunk(chunk: string): z.infer<T> | null {
    this.accumulatedContent += chunk;

    const trimmed = this.accumulatedContent.trim();
    if (!trimmed) return this.lastValidResult;

    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
      return this.lastValidResult;
    }

    const possibleJson = trimmed.substring(jsonStart, jsonEnd + 1);

    try {
      const parsed = JSON.parse(possibleJson);
      const validated = this.schema.parse(parsed);
      this.lastValidResult = validated;
      return validated;
    } catch {
      return this.lastValidResult;
    }
  }

  getFinalResult(): z.infer<T> {
    if (this.lastValidResult) {
      return this.lastValidResult;
    }

    const trimmed = this.accumulatedContent.trim();
    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
      const possibleJson = trimmed.substring(jsonStart, jsonEnd + 1);
      try {
        const parsed = JSON.parse(possibleJson);
        return this.schema.parse(parsed);
      } catch (error) {
        throw new Error(`Failed to parse final result: ${error}`);
      }
    }

    throw new Error('No valid JSON found in accumulated content');
  }

  reset(): void {
    this.accumulatedContent = '';
    this.lastValidResult = null;
  }
}
