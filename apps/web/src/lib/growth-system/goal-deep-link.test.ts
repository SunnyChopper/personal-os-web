import { describe, expect, it } from 'vitest';
import {
  GOAL_DEEPLINK_FROM_PROJECT_PARAM,
  GOAL_DEEPLINK_GOAL_ID_PARAM,
  buildGoalDetailUrl,
  buildProjectDetailReturnUrl,
  parseGoalDeepLink,
} from './goal-deep-link';

describe('goal-deep-link', () => {
  it('parseGoalDeepLink reads goalId and fromProjectId', () => {
    const params = new URLSearchParams({
      [GOAL_DEEPLINK_GOAL_ID_PARAM]: 'goal-1',
      [GOAL_DEEPLINK_FROM_PROJECT_PARAM]: 'proj-9',
    });
    expect(parseGoalDeepLink(params)).toEqual({
      goalId: 'goal-1',
      fromProjectId: 'proj-9',
    });
  });

  it('parseGoalDeepLink returns nulls when params missing', () => {
    expect(parseGoalDeepLink(new URLSearchParams())).toEqual({
      goalId: null,
      fromProjectId: null,
    });
  });

  it('buildGoalDetailUrl includes fromProjectId when provided', () => {
    expect(buildGoalDetailUrl('goal-1', 'proj-9')).toBe(
      '/admin/goals?goalId=goal-1&fromProjectId=proj-9'
    );
    expect(buildGoalDetailUrl('goal-1')).toBe('/admin/goals?goalId=goal-1');
  });

  it('buildProjectDetailReturnUrl targets projects detail hydrate param', () => {
    expect(buildProjectDetailReturnUrl('proj-9')).toBe('/admin/projects?projectId=proj-9');
  });
});
