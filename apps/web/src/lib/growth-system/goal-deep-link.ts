import { ROUTES } from '@/routes';

export const GOAL_DEEPLINK_GOAL_ID_PARAM = 'goalId';
export const GOAL_DEEPLINK_FROM_PROJECT_PARAM = 'fromProjectId';

export type GoalDeepLinkParams = {
  goalId: string | null;
  fromProjectId: string | null;
};

export function parseGoalDeepLink(searchParams: URLSearchParams): GoalDeepLinkParams {
  return {
    goalId: searchParams.get(GOAL_DEEPLINK_GOAL_ID_PARAM),
    fromProjectId: searchParams.get(GOAL_DEEPLINK_FROM_PROJECT_PARAM),
  };
}

export function buildGoalDetailUrl(goalId: string, fromProjectId?: string): string {
  const params = new URLSearchParams({ [GOAL_DEEPLINK_GOAL_ID_PARAM]: goalId });
  if (fromProjectId) {
    params.set(GOAL_DEEPLINK_FROM_PROJECT_PARAM, fromProjectId);
  }
  return `${ROUTES.admin.goals}?${params.toString()}`;
}

export function buildProjectDetailReturnUrl(projectId: string): string {
  const params = new URLSearchParams({ projectId });
  return `${ROUTES.admin.projects}?${params.toString()}`;
}
