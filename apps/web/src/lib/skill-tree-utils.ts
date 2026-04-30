import type { SkillTreeSkill } from '@/types/knowledge-vault';

/** Maps API skill level to numeric tier for layout (1–5). */
export function skillLevelToNum(level: string): number {
  const m: Record<string, number> = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
    Expert: 4,
    Master: 5,
  };
  return m[level] ?? 1;
}

/**
 * Product definition: true mastery requires completion at Master tier,
 * fresh verification, and low knowledge decay.
 */
export function isSkillMastered(skill: SkillTreeSkill): boolean {
  if (!skill.isCompleted || skill.progressPercentage < 100) return false;
  if (skill.level !== 'Master') return false;
  const vs = skill.verificationStatus ?? '';
  if (vs !== 'current') return false;
  const dr = skill.decayRate ?? 0;
  return dr < 0.25;
}
