import type { ProactiveAutomationKind } from '@/types/api-contracts';
import { formatProactiveLocalTime12h } from '@/components/proactive/format-proactive-time';

const KIND_LABELS: Record<ProactiveAutomationKind, string> = {
  dailyBriefing: 'Daily briefing',
  logbookEvening: 'Evening logbook',
  custom: 'Custom automation',
  dailyLearningTrends: 'Daily learning — trends',
  dailyLearningTheory: 'Daily learning — theory',
};

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' && v.trim() ? v : undefined;
}

function readKind(obj: Record<string, unknown>): ProactiveAutomationKind | undefined {
  const k = readString(obj, 'kind');
  if (
    k === 'dailyBriefing' ||
    k === 'logbookEvening' ||
    k === 'custom' ||
    k === 'dailyLearningTrends' ||
    k === 'dailyLearningTheory'
  )
    return k;
  return undefined;
}

/** Weekday indices: Monday = 0 … Sunday = 6 (matches API / backend). */
const WEEKDAY_SHORT_MON0 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function readDaysOfWeek(obj: Record<string, unknown>): number[] | undefined {
  const v = obj.daysOfWeek ?? obj.daysofWeek;
  if (!Array.isArray(v)) return undefined;
  const nums: number[] = [];
  for (const x of v) {
    if (typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 6) {
      nums.push(x);
      continue;
    }
    const n = Number.parseInt(String(x), 10);
    if (Number.isInteger(n) && n >= 0 && n <= 6) nums.push(n);
  }
  return nums.length ? nums : undefined;
}

export function formatProactiveDaysOfWeek(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  return sorted.map((d) => WEEKDAY_SHORT_MON0[d] ?? `day ${d}`).join(', ');
}

export interface ProactiveSuggestionSummary {
  title: string;
  subtitle: string;
  kindLabel: string;
  reasoning?: string;
  displayTime12h: string;
  daysLabel?: string;
}

/**
 * Turn a suggestion proposedPayload (camelCase API shape) into human-readable lines.
 */
export function summarizeProactiveSuggestionPayload(
  proposedPayload: Record<string, unknown>
): ProactiveSuggestionSummary {
  const kind = readKind(proposedPayload);
  const kindLabel = kind ? KIND_LABELS[kind] : 'Automation';
  const localTimeRaw = readString(proposedPayload, 'localTime') ?? '—';
  const displayTime12h = localTimeRaw === '—' ? '—' : formatProactiveLocalTime12h(localTimeRaw);
  const timeZone = readString(proposedPayload, 'timeZone') ?? '—';
  const customPrompt = readString(proposedPayload, 'customUserPrompt');
  const days = readDaysOfWeek(proposedPayload);
  const llmTitle = readString(proposedPayload, 'title');
  const reasoning = readString(proposedPayload, 'reasoning');

  const title = llmTitle ?? (kind ? kindLabel : 'Suggested automation');
  let subtitle = `${displayTime12h} · ${timeZone}`;
  const daysLabel = days?.length ? formatProactiveDaysOfWeek(days) : undefined;
  if (daysLabel) {
    subtitle += ` · ${daysLabel}`;
  }
  if (kind === 'custom' && customPrompt) {
    const short =
      customPrompt.length > 120 ? `${customPrompt.slice(0, 117).trim()}…` : customPrompt;
    subtitle = subtitle ? `${subtitle} — ${short}` : short;
  }

  return {
    title,
    subtitle,
    kindLabel,
    reasoning,
    displayTime12h,
    daysLabel,
  };
}

export function readThreadStrategyLabel(obj: Record<string, unknown>): string {
  const s = readString(obj, 'threadStrategy');
  if (s === 'newThreadEachRun') return 'New thread each run';
  return 'Reuse fixed thread';
}

export function readChannelEmailEnabled(obj: Record<string, unknown>): boolean {
  const v = obj.channelEmailEnabled;
  if (typeof v === 'boolean') return v;
  return true;
}
