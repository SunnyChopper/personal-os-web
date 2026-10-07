import { describe, expect, it } from 'vitest';
import { taskCreatePrefillFromProject } from '@/lib/projects/task-create-prefill-from-project';

describe('taskCreatePrefillFromProject', () => {
  it('copies area, priority, and subCategory from the project', () => {
    expect(
      taskCreatePrefillFromProject({
        area: 'Day Job',
        subCategory: 'Projects',
        priority: 'P1',
      })
    ).toEqual({
      area: 'Day Job',
      subCategory: 'Projects',
      priority: 'P1',
    });
  });

  it('omits subCategory when the project has none', () => {
    expect(
      taskCreatePrefillFromProject({
        area: 'Operations',
        subCategory: null,
        priority: 'P2',
      })
    ).toEqual({
      area: 'Operations',
      priority: 'P2',
    });
  });

  it('omits subCategory when it is not valid for the project area', () => {
    expect(
      taskCreatePrefillFromProject({
        area: 'Health',
        subCategory: 'Projects',
        priority: 'P3',
      })
    ).toEqual({
      area: 'Health',
      priority: 'P3',
    });
  });

  it('does not invent default priority or area', () => {
    const prefill = taskCreatePrefillFromProject({
      area: 'Happiness',
      subCategory: 'Joy',
      priority: 'P4',
    });
    expect(prefill).toEqual({
      area: 'Happiness',
      subCategory: 'Joy',
      priority: 'P4',
    });
    expect(Object.keys(prefill).sort()).toEqual(['area', 'priority', 'subCategory']);
  });
});
