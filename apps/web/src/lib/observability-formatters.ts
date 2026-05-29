const USD = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 4,
});

export function formatObservabilityUsd(value: number | null | undefined): string {
  if (value == null) return '—';
  return USD.format(value);
}

export function formatObservabilityTokenCount(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('en-US');
}

export function computeTokenInputSharePercent(
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined
): number | null {
  if (inputTokens == null || outputTokens == null) return null;
  const sum = inputTokens + outputTokens;
  if (sum <= 0) return null;
  return Math.round((inputTokens / sum) * 100);
}

export function formatPromptTokenValue(
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined
): string {
  const count = formatObservabilityTokenCount(inputTokens);
  const share = computeTokenInputSharePercent(inputTokens, outputTokens);
  if (share == null) return count;
  return `${count} (${share}% input share)`;
}
