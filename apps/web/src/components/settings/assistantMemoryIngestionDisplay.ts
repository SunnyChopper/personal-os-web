const PROVIDER_LABELS: Record<string, string> = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  cerebras: 'Cerebras',
  openrouter: 'OpenRouter',
  xai: 'xAI',
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Title-style label for provider id (value stays lowercase id). */
export function formatProviderDisplay(providerId: string): string {
  const k = providerId.trim().toLowerCase();
  if (PROVIDER_LABELS[k]) return PROVIDER_LABELS[k];
  if (!k) return '';
  return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
}

/** Remove trailing parenthetical (internal API route / system id). */
export function stripParentheticalSegment(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/u, '').trim();
}

/**
 * Display name for a model: no system parenthetical, no redundant leading provider.
 */
export function formatModelDisplayLabel(label: string, providerId: string): string {
  const withoutParen = stripParentheticalSegment(label);
  const provDisplay = formatProviderDisplay(providerId);
  const provKey = providerId.trim().toLowerCase();
  let rest = withoutParen;
  const patterns = [
    new RegExp(`^${escapeRegExp(provDisplay)}\\s+`, 'iu'),
    new RegExp(`^${escapeRegExp(provKey)}\\s+`, 'iu'),
  ];
  for (const re of patterns) {
    rest = rest.replace(re, '');
  }
  return rest.trim() || withoutParen.trim() || label.trim();
}
