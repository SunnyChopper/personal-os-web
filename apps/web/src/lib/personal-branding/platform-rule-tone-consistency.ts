import { normalizeToneMetrics } from '@/lib/personal-branding/profile-strength';

export type ConsistencySeverity = 'warning' | 'info';

export interface ConsistencyIssue {
  id: string;
  severity: ConsistencySeverity;
  message: string;
  profileId?: string;
  profileName?: string;
  metricKey?: string;
  metricValue?: number;
  evidence?: string;
}

export interface ConsistencyCatalogEntry {
  id: string;
  label: string;
  definition: string;
  enabledEffect?: string;
  disabledEffect?: string;
}

export interface CheckPlatformRuleToneConsistencyInput {
  requirements: string[] | string;
  rhetoricalModes: { mode: string; strength: string }[];
  rhetoricalDevices: string[];
  catalog?: {
    modes: ConsistencyCatalogEntry[];
    devices: ConsistencyCatalogEntry[];
  };
  profiles: Array<{
    id: string;
    name: string;
    toneMetrics: Record<string, unknown>;
    bannedPhrases?: string[];
  }>;
}

const HIGH_THRESHOLD = 0.7;
const LOW_THRESHOLD = 0.3;
const MAX_ISSUES = 8;

type ToneAxis = 'authority' | 'humor' | 'warmth' | 'clarity';

const AXIS_ALIASES: Record<ToneAxis, string[]> = {
  authority: ['authority', 'formal', 'formality'],
  humor: ['humor', 'humour', 'funny', 'wit'],
  warmth: ['warmth', 'warm', 'friendly', 'empathy', 'empathetic'],
  clarity: ['clarity', 'clear', 'readable'],
};

const AXIS_LABELS: Record<ToneAxis, string> = {
  authority: 'Authority',
  humor: 'Humor',
  warmth: 'Warmth',
  clarity: 'Clarity',
};

interface CueGroup {
  cues: string[];
  axis: ToneAxis;
  when: 'high' | 'low';
  severity: ConsistencySeverity;
}

const CONFLICT_CUE_GROUPS: CueGroup[] = [
  {
    axis: 'authority',
    when: 'high',
    severity: 'warning',
    cues: [
      'conversational',
      'casual',
      'slang',
      'chill',
      'emoji',
      'lol',
      'lmao',
      'informal',
      'relaxed tone',
      'buddy',
      'bro',
    ],
  },
  {
    axis: 'authority',
    when: 'low',
    severity: 'warning',
    cues: [
      'authoritative',
      'commanding',
      'formal tone',
      'executive voice',
      'boardroom',
      'stern',
      'directive',
    ],
  },
  {
    axis: 'humor',
    when: 'low',
    severity: 'warning',
    cues: ['joke', 'jokes', 'witty', 'meme', 'sarcasm', 'sarcastic', 'punchline', 'comedic'],
  },
  {
    axis: 'humor',
    when: 'high',
    severity: 'info',
    cues: ['serious tone', 'no humor', 'avoid jokes', 'grave', 'solemn'],
  },
  {
    axis: 'warmth',
    when: 'low',
    severity: 'warning',
    cues: ['warm', 'friendly', 'empathetic', 'caring', 'personable', 'heartfelt', 'compassionate'],
  },
  {
    axis: 'warmth',
    when: 'high',
    severity: 'info',
    cues: ['clinical', 'cold', 'detached', 'impersonal', 'sterile', 'distant'],
  },
  {
    axis: 'clarity',
    when: 'high',
    severity: 'info',
    cues: ['jargon-heavy', 'dense', 'ambiguous', 'obscure', 'convoluted', 'opaque'],
  },
  {
    axis: 'clarity',
    when: 'low',
    severity: 'info',
    cues: ['plain language', 'simple words', 'easy to read', 'straightforward'],
  },
];

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function resolveAxisMetric(
  toneMetrics: Record<string, number>,
  axis: ToneAxis
): { key: string; value: number } | null {
  const aliases = new Set(AXIS_ALIASES[axis].map(normalizeKey));
  for (const [rawKey, value] of Object.entries(toneMetrics)) {
    if (aliases.has(normalizeKey(rawKey))) {
      return { key: rawKey, value };
    }
  }
  return null;
}

function formatMetricValue(value: number): string {
  return value.toFixed(2);
}

function formatMetricLabel(axis: ToneAxis, metricKey: string): string {
  const canonical = AXIS_LABELS[axis];
  if (normalizeKey(metricKey) === normalizeKey(canonical)) {
    return canonical;
  }
  const titled = metricKey.trim();
  return titled.charAt(0).toUpperCase() + titled.slice(1);
}

function findCueInText(text: string, cue: string): string | null {
  const haystack = text.toLowerCase();
  const needle = cue.toLowerCase();
  if (!haystack.includes(needle)) {
    return null;
  }
  return cue;
}

function scanTextForCues(
  text: string,
  groups: CueGroup[]
): Array<{ group: CueGroup; evidence: string }> {
  const matches: Array<{ group: CueGroup; evidence: string }> = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const cue of group.cues) {
      const evidence = findCueInText(text, cue);
      if (!evidence) {
        continue;
      }
      const dedupeKey = `${group.axis}:${group.when}:${evidence.toLowerCase()}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      matches.push({ group, evidence });
    }
  }

  return matches;
}

function buildRhetoricText(
  rhetoricalModes: CheckPlatformRuleToneConsistencyInput['rhetoricalModes'],
  rhetoricalDevices: string[],
  catalog?: CheckPlatformRuleToneConsistencyInput['catalog']
): string {
  if (!catalog) {
    return '';
  }

  const parts: string[] = [];
  for (const modeSetting of rhetoricalModes) {
    const entry = catalog.modes.find((mode) => mode.id === modeSetting.mode);
    if (entry) {
      parts.push(entry.label, entry.definition, entry.enabledEffect ?? '');
    }
  }
  for (const deviceId of rhetoricalDevices) {
    const entry = catalog.devices.find((device) => device.id === deviceId);
    if (entry) {
      parts.push(entry.label, entry.definition, entry.enabledEffect ?? '');
    }
  }
  return parts.join(' ');
}

function buildConflictMessage(
  axis: ToneAxis,
  metricKey: string,
  metricValue: number,
  evidence: string,
  profileName?: string
): string {
  const label = formatMetricLabel(axis, metricKey);
  const value = formatMetricValue(metricValue);
  const qualifier = metricValue >= HIGH_THRESHOLD ? 'High' : 'Low';
  const profilePrefix = profileName ? `[${profileName}] ` : '';
  return `${profilePrefix}${qualifier} ${label} (${value}) may conflict with the "${evidence}" requirement`;
}

function issueId(parts: string[]): string {
  return parts.join(':');
}

export function checkPlatformRuleToneConsistency(
  input: CheckPlatformRuleToneConsistencyInput
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const trimmedRequirements = Array.isArray(input.requirements)
    ? input.requirements
        .map((item) => item.trim())
        .filter(Boolean)
        .join('\n')
    : input.requirements.trim();

  if (input.profiles.length === 0) {
    return [
      {
        id: 'no-mapped-profiles',
        severity: 'info',
        message:
          'Map at least one Core Profile to compare tone metrics against this rule’s requirements.',
      },
    ];
  }

  const rhetoricText = buildRhetoricText(
    input.rhetoricalModes,
    input.rhetoricalDevices,
    input.catalog
  );
  const scanText = [trimmedRequirements, rhetoricText].filter(Boolean).join('\n');

  for (const profile of input.profiles) {
    const toneMetrics = normalizeToneMetrics(profile.toneMetrics ?? {});

    if (trimmedRequirements) {
      for (const phrase of profile.bannedPhrases ?? []) {
        const trimmedPhrase = phrase.trim();
        if (!trimmedPhrase) {
          continue;
        }
        if (trimmedRequirements.toLowerCase().includes(trimmedPhrase.toLowerCase())) {
          issues.push({
            id: issueId(['banned', profile.id, trimmedPhrase.toLowerCase()]),
            severity: 'warning',
            message: `[${profile.name}] Requirements include banned phrase "${trimmedPhrase}"`,
            profileId: profile.id,
            profileName: profile.name,
            evidence: trimmedPhrase,
          });
        }
      }
    }

    if (!scanText) {
      continue;
    }

    const cueMatches = scanTextForCues(scanText, CONFLICT_CUE_GROUPS);
    for (const { group, evidence } of cueMatches) {
      const metric = resolveAxisMetric(toneMetrics, group.axis);
      if (!metric) {
        continue;
      }

      const isHigh = metric.value >= HIGH_THRESHOLD;
      const isLow = metric.value <= LOW_THRESHOLD;
      const conflicts = (group.when === 'high' && isHigh) || (group.when === 'low' && isLow);
      if (!conflicts) {
        continue;
      }

      issues.push({
        id: issueId(['tone', profile.id, group.axis, group.when, evidence.toLowerCase()]),
        severity: group.severity,
        message: buildConflictMessage(group.axis, metric.key, metric.value, evidence, profile.name),
        profileId: profile.id,
        profileName: profile.name,
        metricKey: metric.key,
        metricValue: metric.value,
        evidence,
      });
    }
  }

  const severityRank: Record<ConsistencySeverity, number> = { warning: 0, info: 1 };
  issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return issues.slice(0, MAX_ISSUES);
}
