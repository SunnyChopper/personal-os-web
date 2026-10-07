import type {
  CostGuardrailRuleInput,
  CostGuardrailRuleStatus,
  CostGuardrailStatus,
} from '@/types/observability';

/** Fixed throttle allowlist keys from observability-cost-guardrails contract. */
export const COST_THROTTLE_ALLOWLIST_DISPLAY_NAMES: Record<string, string> = {
  brandProfileExtraction: 'Brand profile extraction',
  reconFeedPostRelevance: 'Recon feed post relevance',
  reconFeedFollowSuggestions: 'Recon feed follow suggestions',
  reconFeedFollowConfidenceExplain: 'Recon feed follow confidence',
  reconFeedConnectionDraft: 'Recon feed connection draft',
  contentStreamXShortPosts: 'Content stream short posts',
  radarGithubRelevance: 'Radar GitHub relevance',
  contentIdeation: 'Content ideation',
  contentIdeaApprove: 'Content idea approve',
  contentImageInject: 'Content image inject',
  contentKeywordOptimize: 'Content keyword optimize',
};

export function toRuleInput(
  rule: CostGuardrailRuleInput | CostGuardrailRuleStatus
): CostGuardrailRuleInput {
  return {
    id: rule.id,
    enabled: rule.enabled,
    scopeType: rule.scopeType,
    module: rule.module,
    feature: rule.feature ?? null,
    period: rule.period,
    limitUsd: rule.limitUsd,
    autoThrottle: rule.autoThrottle,
  };
}

export function upsertCostGuardrailRule(
  rules: CostGuardrailRuleInput[],
  next: CostGuardrailRuleInput
): CostGuardrailRuleInput[] {
  const idx = rules.findIndex(
    (r) =>
      r.scopeType === next.scopeType &&
      r.module === next.module &&
      (r.feature ?? null) === (next.feature ?? null) &&
      r.period === next.period
  );
  if (idx >= 0) {
    return rules.map((r, i) => (i === idx ? { ...r, ...next, id: r.id ?? next.id } : r));
  }
  return [...rules, next];
}

export function humanizeModuleName(module: string): string {
  return module
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function costGuardrailFeatureDisplayName(feature: string): string {
  return COST_THROTTLE_ALLOWLIST_DISPLAY_NAMES[feature] ?? humanizeCamelCase(feature);
}

export function humanizeCamelCase(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function scopeLabel(rule: CostGuardrailRuleStatus): string {
  if (rule.scopeType === 'feature' && rule.feature) {
    return `${humanizeModuleName(rule.module)} / ${costGuardrailFeatureDisplayName(rule.feature)}`;
  }
  return humanizeModuleName(rule.module);
}

export function scopeMeta(rule: CostGuardrailRuleStatus): string {
  const parts = [`${rule.period} budget`, rule.scopeType];
  if (rule.periodEnd) {
    parts.push(
      `period ends ${new Date(rule.periodEnd).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}`
    );
  }
  return parts.join(' · ');
}

export function progressPct(rule: CostGuardrailRuleStatus): number {
  if (rule.limitUsd <= 0) return 0;
  return Math.min(100, (rule.spentUsd / rule.limitUsd) * 100);
}

export function collectThrottledFeatures(status: CostGuardrailStatus | undefined): string[] {
  const set = new Set<string>();
  for (const rule of status?.rules ?? []) {
    for (const feature of rule.throttledFeatures) {
      set.add(feature);
    }
  }
  const overrides = status?.overrides ?? {};
  for (const [feature, value] of Object.entries(overrides)) {
    if (value?.manualPaused) {
      set.add(feature);
    }
  }
  return [...set].sort();
}

export function isFeaturePaused(
  feature: string,
  status: CostGuardrailStatus | undefined,
  throttledFeatures?: string[]
): boolean {
  const throttled = throttledFeatures ?? collectThrottledFeatures(status);
  return status?.overrides?.[feature]?.manualPaused === true || throttled.includes(feature);
}

export function isFeatureManuallyPaused(
  feature: string,
  status: CostGuardrailStatus | undefined
): boolean {
  return status?.overrides?.[feature]?.manualPaused === true;
}

export type CostGuardrailKpiCounts = {
  activeRules: number;
  exceededRules: number;
  approachingRules: number;
  pausedFeatures: number;
};

export function deriveCostGuardrailKpis(
  status: CostGuardrailStatus | undefined
): CostGuardrailKpiCounts {
  const rules = status?.rules ?? [];
  return {
    activeRules: rules.filter((r) => r.enabled).length,
    exceededRules: rules.filter((r) => r.exceeded).length,
    approachingRules: rules.filter((r) => r.approaching && !r.exceeded).length,
    pausedFeatures: collectThrottledFeatures(status).length,
  };
}

export type CostGuardrailRuleStatusLabel =
  | 'Disabled'
  | 'Exceeded'
  | 'Approaching'
  | 'Throttling'
  | 'Active';

export function ruleStatusLabel(rule: CostGuardrailRuleStatus): CostGuardrailRuleStatusLabel {
  if (!rule.enabled) return 'Disabled';
  if (rule.exceeded) return 'Exceeded';
  if (rule.throttledFeatures.length > 0) return 'Throttling';
  if (rule.approaching) return 'Approaching';
  return 'Active';
}
