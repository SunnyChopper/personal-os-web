/** Toast copy after a habit completion awards wallet points (shared by Habits + Goals UI). */

export type HabitCompletionToast = {
  title: string;
  message: string;
};

export function buildHabitCompletionToasts(
  pointsAwarded: number,
  milestoneBonus: number,
  streak: number
): { points?: HabitCompletionToast; milestone?: HabitCompletionToast } {
  const result: { points?: HabitCompletionToast; milestone?: HabitCompletionToast } = {};
  if (pointsAwarded > 0) {
    result.points = {
      title: `+${pointsAwarded} pts`,
      message: `${streak}-day streak`,
    };
  }
  if (milestoneBonus > 0) {
    result.milestone = {
      title: 'Milestone reached',
      message: `${streak}-day streak · +${milestoneBonus} bonus pts`,
    };
  }
  return result;
}
