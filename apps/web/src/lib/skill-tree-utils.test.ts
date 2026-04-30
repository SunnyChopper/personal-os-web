import { describe, expect, it } from 'vitest';
import { isSkillMastered, skillLevelToNum } from '@/lib/skill-tree-utils';
import type { SkillTreeSkill } from '@/types/knowledge-vault';

function baseSkill(overrides: Partial<SkillTreeSkill> = {}): SkillTreeSkill {
  return {
    id: '1',
    name: 'Test',
    description: null,
    category: 'general',
    level: 'Beginner',
    progressPercentage: 0,
    parentSkillIds: [],
    childSkillIds: [],
    resources: [],
    isUnlocked: true,
    isCompleted: false,
    completedAt: null,
    knowledgeHalfLifeDays: 30,
    lastVerifiedAt: null,
    verificationStatus: 'current',
    decayRate: 0,
    linkedFlashcardDeckIds: [],
    userId: 'u',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('skillLevelToNum', () => {
  it('maps API levels to tiers', () => {
    expect(skillLevelToNum('Beginner')).toBe(1);
    expect(skillLevelToNum('Master')).toBe(5);
    expect(skillLevelToNum('unknown')).toBe(1);
  });
});

describe('isSkillMastered', () => {
  it('is true only when all mastery gates pass', () => {
    expect(
      isSkillMastered(
        baseSkill({
          isCompleted: true,
          progressPercentage: 100,
          level: 'Master',
          verificationStatus: 'current',
          decayRate: 0.1,
        })
      )
    ).toBe(true);
  });

  it('is false when level is not Master', () => {
    expect(
      isSkillMastered(
        baseSkill({
          isCompleted: true,
          progressPercentage: 100,
          level: 'Expert',
          verificationStatus: 'current',
          decayRate: 0,
        })
      )
    ).toBe(false);
  });

  it('is false when decay is too high', () => {
    expect(
      isSkillMastered(
        baseSkill({
          isCompleted: true,
          progressPercentage: 100,
          level: 'Master',
          verificationStatus: 'current',
          decayRate: 0.3,
        })
      )
    ).toBe(false);
  });

  it('is false when verification is not current', () => {
    expect(
      isSkillMastered(
        baseSkill({
          isCompleted: true,
          progressPercentage: 100,
          level: 'Master',
          verificationStatus: 'needs_verification',
          decayRate: 0,
        })
      )
    ).toBe(false);
  });
});
