import { describe, expect, it } from 'vitest';
import { PLATFORM_RULE_CATALOG } from './platform-rule-catalog';
import type {
  RhetoricalDeviceId,
  RhetoricalModeId,
  RhetoricalStrength,
} from '@/types/api/personal-branding.dto';

const EXPECTED_MODES: RhetoricalModeId[] = [
  'narrative',
  'descriptive',
  'expository',
  'argumentative',
  'persuasive',
  'instructional',
];

const EXPECTED_DEVICES: RhetoricalDeviceId[] = [
  'metaphor',
  'simile',
  'analogy',
  'anecdote',
  'rhetoricalQuestion',
  'anaphora',
  'antithesis',
  'parallelism',
  'ruleOfThree',
  'hyperbole',
];

const EXPECTED_STRENGTHS: RhetoricalStrength[] = [
  'subtle',
  'light',
  'moderate',
  'strong',
  'dominant',
];

describe('PLATFORM_RULE_CATALOG (aafeaa15dfe7)', () => {
  it('mirrors backend mode/device/strength ids and limit defaults', () => {
    expect(PLATFORM_RULE_CATALOG.modes.map((m) => m.id)).toEqual(EXPECTED_MODES);
    expect(PLATFORM_RULE_CATALOG.devices.map((d) => d.id)).toEqual(EXPECTED_DEVICES);
    expect(PLATFORM_RULE_CATALOG.strengths).toEqual(EXPECTED_STRENGTHS);
    expect(PLATFORM_RULE_CATALOG.wordsPerMinute).toBe(200);
    expect(PLATFORM_RULE_CATALOG.limitDefaults).toEqual({
      x: { characterLimit: 280, readTimeLimitMinutes: 1 },
      linkedin: { characterLimit: 1300, readTimeLimitMinutes: 3 },
      medium: { characterLimit: 2500, readTimeLimitMinutes: 6 },
      instagram: { characterLimit: 2200, readTimeLimitMinutes: 2 },
      youtube: { characterLimit: 5000, readTimeLimitMinutes: 8 },
      newsletter: { characterLimit: 3500, readTimeLimitMinutes: 7 },
    });
    expect(PLATFORM_RULE_CATALOG.ideaCountDefaults?.x).toBe(3);
    expect(PLATFORM_RULE_CATALOG.ideaCountSoftMax?.x).toBe(6);
  });

  it('includes tooltip fields for every catalog entry', () => {
    for (const entry of [...PLATFORM_RULE_CATALOG.modes, ...PLATFORM_RULE_CATALOG.devices]) {
      expect(entry.label.trim().length).toBeGreaterThan(0);
      expect(entry.definition.trim().length).toBeGreaterThan(0);
      expect(entry.example.trim().length).toBeGreaterThan(0);
      expect(entry.enabledEffect.trim().length).toBeGreaterThan(0);
      expect(entry.disabledEffect.trim().length).toBeGreaterThan(0);
    }
  });
});
