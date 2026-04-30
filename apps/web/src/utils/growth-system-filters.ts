import type { Task, Project, Goal, TimeHorizon, Metric, Habit } from '@/types/growth-system';

/**
 * Filters tasks that are linked to a specific project
 * @param tasks - Array of all tasks
 * @param projectId - The project ID to filter by
 * @returns Array of tasks that have the projectId in their projectIds array
 */
export function getTasksByProject(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((task) => task.projectIds?.includes(projectId) ?? false);
}

/**
 * Filters tasks that are linked to a specific goal
 * @param tasks - Array of all tasks
 * @param goalId - The goal ID to filter by
 * @returns Array of tasks that have the goalId in their goalIds array
 */
export function getTasksByGoal(tasks: Task[], goalId: string): Task[] {
  return tasks.filter((task) => task.goalIds?.includes(goalId) ?? false);
}

/**
 * Gets all project IDs that a task is linked to
 * @param task - The task to get project IDs from
 * @returns Array of project IDs (empty array if none)
 */
export function getTaskProjectIds(task: Task): string[] {
  return task.projectIds ?? [];
}

/**
 * Gets all goal IDs that a task is linked to
 * @param task - The task to get goal IDs from
 * @returns Array of goal IDs (empty array if none)
 */
export function getTaskGoalIds(task: Task): string[] {
  return task.goalIds ?? [];
}

/**
 * Counts tasks linked to a specific project
 * @param tasks - Array of all tasks
 * @param projectId - The project ID to count tasks for
 * @returns Number of tasks linked to the project
 */
export function countTasksByProject(tasks: Task[], projectId: string): number {
  return getTasksByProject(tasks, projectId).length;
}

/**
 * Counts completed tasks linked to a specific project
 * @param tasks - Array of all tasks
 * @param projectId - The project ID to count completed tasks for
 * @returns Number of completed tasks linked to the project
 */
export function countCompletedTasksByProject(tasks: Task[], projectId: string): number {
  return getTasksByProject(tasks, projectId).filter((task) => task.status === 'Done').length;
}

/**
 * Gets all tasks linked to multiple projects
 * @param tasks - Array of all tasks
 * @param projectIds - Array of project IDs to filter by
 * @returns Array of tasks that have at least one of the projectIds in their projectIds array
 */
export function getTasksByProjects(tasks: Task[], projectIds: string[]): Task[] {
  if (projectIds.length === 0) return [];
  const projectIdSet = new Set(projectIds);
  return tasks.filter(
    (task) => task.projectIds && task.projectIds.some((id) => projectIdSet.has(id))
  );
}

/**
 * Gets all tasks linked to multiple goals
 * @param tasks - Array of all tasks
 * @param goalIds - Array of goal IDs to filter by
 * @returns Array of tasks that have at least one of the goalIds in their goalIds array
 */
export function getTasksByGoals(tasks: Task[], goalIds: string[]): Task[] {
  if (goalIds.length === 0) return [];
  const goalIdSet = new Set(goalIds);
  return tasks.filter((task) => task.goalIds && task.goalIds.some((id) => goalIdSet.has(id)));
}

/**
 * Filters projects that are linked to a specific goal
 * @param projects - Array of all projects
 * @param goalId - The goal ID to filter by
 * @returns Array of projects that have the goalId in their goalIds array
 */
export function getProjectsByGoal(projects: Project[], goalId: string): Project[] {
  return projects.filter((project) => project.goalIds?.includes(goalId) ?? false);
}

/**
 * Filters metrics that are linked to a specific goal
 * @param metrics - Array of all metrics
 * @param goalId - The goal ID to filter by
 * @returns Array of metrics that have the goalId in their goalIds array
 */
export function getMetricsByGoal(metrics: Metric[], goalId: string): Metric[] {
  return metrics.filter((metric) => metric.goalIds?.includes(goalId) ?? false);
}

/**
 * Filters habits that are linked to a specific goal
 * @param habits - Array of all habits
 * @param goalId - The goal ID to filter by
 * @returns Array of habits that have the goalId in their goalIds array
 */
export function getHabitsByGoal(habits: Habit[], goalId: string): Habit[] {
  return habits.filter((habit) => habit.goalIds?.includes(goalId) ?? false);
}

/**
 * Gets the parent time horizon for a given time horizon
 * @param timeHorizon - The current time horizon
 * @returns The parent time horizon, or null if Yearly (top level)
 */
export function getParentTimeHorizon(timeHorizon: TimeHorizon): TimeHorizon | null {
  const hierarchy: TimeHorizon[] = ['Yearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'];
  const currentIndex = hierarchy.indexOf(timeHorizon);
  if (currentIndex === 0) return null; // Yearly has no parent
  return hierarchy[currentIndex - 1];
}

/**
 * Filters goals that can be valid parent goals for a given time horizon
 * @param goals - Array of all goals
 * @param timeHorizon - The time horizon of the goal looking for a parent
 * @param excludeGoalId - Optional goal ID to exclude from results (e.g., current goal being edited)
 * @returns Array of goals that are valid parent candidates (one timeframe higher)
 */
export function getValidParentGoals(
  goals: Goal[],
  timeHorizon: TimeHorizon,
  excludeGoalId?: string
): Goal[] {
  const parentTimeHorizon = getParentTimeHorizon(timeHorizon);
  if (!parentTimeHorizon) return []; // Yearly goals cannot have parents

  return goals.filter(
    (goal) =>
      goal.timeHorizon === parentTimeHorizon &&
      goal.id !== excludeGoalId &&
      goal.status !== 'Abandoned' // Optionally exclude abandoned goals
  );
}
