import { describe, expect, it } from 'vitest';
import {
  collectThrottledFeatures,
  costGuardrailFeatureDisplayName,
  deriveCostGuardrailKpis,
  progressPct,
  ruleStatusLabel,
  scopeLabel,
  toRuleInput,
  upsertCostGuardrailRule,
} from './cost-guardrail-helpers';
import type { CostGuardrailRuleStatus, CostGuardrailStatus } from '@/types/observability';

function makeRule(overrides: Partial<CostGuardrailRuleStatus> = {}): CostGuardrailRuleStatus {
  return {
    id: 'rule-1',
    enabled: true,
    scopeType: 'module',
    module: 'personal_branding',
    feature: null,
    period: 'daily',
    limitUsd: 5,
    autoThrottle: false,
    spentUsd: 2,
    remainingUsd: 3,
    exceeded: false,
    utilizationPct: 40,
    approaching: false,
    periodStart: null,
    periodEnd: null,
    throttledFeatures: [],
    ...overrides,
  };
}

describe('cost-guardrail-helpers', () => {
  it('maps allowlist feature keys to display names', () => {
    expect(costGuardrailFeatureDisplayName('brandProfileExtraction')).toBe(
      'Brand profile extraction'
    );
    expect(costGuardrailFeatureDisplayName('contentIdeation')).toBe('Content ideation');
    expect(costGuardrailFeatureDisplayName('contentIdeaApprove')).toBe('Content idea approve');
    expect(costGuardrailFeatureDisplayName('customFeatureKey')).toBe('Custom Feature Key');
  });

  it('formats scope labels for module and feature rules', () => {
    expect(scopeLabel(makeRule())).toBe('Personal Branding');
    expect(
      scopeLabel(
        makeRule({
          scopeType: 'feature',
          feature: 'brandProfileExtraction',
        })
      )
    ).toBe('Personal Branding / Brand profile extraction');
  });

  it('clamps progress percentage', () => {
    expect(progressPct(makeRule({ spentUsd: 2, limitUsd: 5 }))).toBe(40);
    expect(progressPct(makeRule({ spentUsd: 10, limitUsd: 5 }))).toBe(100);
    expect(progressPct(makeRule({ spentUsd: 1, limitUsd: 0 }))).toBe(0);
  });

  it('merges throttled features from rules and manual overrides', () => {
    const status: CostGuardrailStatus = {
      rules: [makeRule({ throttledFeatures: ['brandProfileExtraction'] })],
      banner: { active: false, messages: [] },
      throttleAllowlist: ['brandProfileExtraction', 'radarGithubRelevance'],
      overrides: { radarGithubRelevance: { manualPaused: true } },
    };
    expect(collectThrottledFeatures(status)).toEqual([
      'brandProfileExtraction',
      'radarGithubRelevance',
    ]);
  });

  it('derives KPI counts', () => {
    const status: CostGuardrailStatus = {
      rules: [
        makeRule({ id: 'a', enabled: true, exceeded: true }),
        makeRule({ id: 'b', enabled: true, approaching: true }),
        makeRule({ id: 'c', enabled: false }),
      ],
      banner: { active: false, messages: [] },
      throttleAllowlist: [],
      overrides: { foo: { manualPaused: true } },
    };
    expect(deriveCostGuardrailKpis(status)).toEqual({
      activeRules: 2,
      exceededRules: 1,
      approachingRules: 1,
      pausedFeatures: 1,
    });
  });

  it('labels rule status by priority', () => {
    expect(ruleStatusLabel(makeRule({ enabled: false }))).toBe('Disabled');
    expect(ruleStatusLabel(makeRule({ exceeded: true }))).toBe('Exceeded');
    expect(ruleStatusLabel(makeRule({ throttledFeatures: ['brandProfileExtraction'] }))).toBe(
      'Throttling'
    );
    expect(ruleStatusLabel(makeRule({ approaching: true }))).toBe('Approaching');
    expect(ruleStatusLabel(makeRule())).toBe('Active');
  });

  it('converts rules to input shape', () => {
    const rule = makeRule({ feature: 'brandProfileExtraction', scopeType: 'feature' });
    expect(toRuleInput(rule)).toEqual({
      id: 'rule-1',
      enabled: true,
      scopeType: 'feature',
      module: 'personal_branding',
      feature: 'brandProfileExtraction',
      period: 'daily',
      limitUsd: 5,
      autoThrottle: false,
    });
  });

  it('upserts rules by scope identity', () => {
    const existing = toRuleInput(makeRule({ id: 'keep-me' }));
    const next = {
      ...existing,
      id: 'new-id',
      limitUsd: 10,
    };
    const merged = upsertCostGuardrailRule([existing], next);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe('keep-me');
    expect(merged[0]?.limitUsd).toBe(10);
  });
});
