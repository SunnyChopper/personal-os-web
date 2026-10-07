import { describe, expect, it } from 'vitest';
import {
  formatDetailSectionTitle,
  projectDetailHeaderButtonClassName,
  projectDetailImpactClusterClassName,
  projectDetailImpactRowClassName,
  projectDetailSectionBodyClassName,
  projectDetailSectionClassName,
} from './project-detail-surfaces';

describe('project-detail-surfaces', () => {
  describe('formatDetailSectionTitle', () => {
    it('returns bare title when count is undefined or null', () => {
      expect(formatDetailSectionTitle('Notes')).toBe('Notes');
      expect(formatDetailSectionTitle('Memory thread', null)).toBe('Memory thread');
      expect(formatDetailSectionTitle('Memory thread', undefined)).toBe('Memory thread');
    });

    it('formats title with parenthetical count including 0', () => {
      expect(formatDetailSectionTitle('Dependencies', 0)).toBe('Dependencies (0)');
      expect(formatDetailSectionTitle('Dependencies', 4)).toBe('Dependencies (4)');
      expect(formatDetailSectionTitle('Memory thread', 12)).toBe('Memory thread (12)');
    });
  });

  describe('class names', () => {
    it('exports consistent section and body classes', () => {
      expect(projectDetailSectionClassName).toContain('border-t');
      expect(projectDetailSectionClassName).toContain('py-4');
      expect(projectDetailSectionBodyClassName).toBe('pt-3');
    });

    it('exports impact row and cluster classes for responsive wrapping', () => {
      expect(projectDetailImpactRowClassName).toContain('sm:flex-row');
      expect(projectDetailImpactRowClassName).toContain('sm:flex-wrap');
      expect(projectDetailImpactClusterClassName).toContain('min-w-[10rem]');
      expect(projectDetailImpactClusterClassName).toContain('flex-1');
    });

    it('returns tone classes for default vs amber headers', () => {
      const defaultBtn = projectDetailHeaderButtonClassName('default');
      expect(defaultBtn).toContain('text-gray-700');
      expect(defaultBtn).toContain('dark:text-gray-300');

      const amberBtn = projectDetailHeaderButtonClassName('amber');
      expect(amberBtn).toContain('text-amber-600');
      expect(amberBtn).toContain('dark:text-amber-400');
    });
  });
});
