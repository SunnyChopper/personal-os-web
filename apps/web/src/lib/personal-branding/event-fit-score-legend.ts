/** Static legend copy for In-Person Events list fit-score tooltip (hover/focus-within). */
export const EVENT_FIT_SCORE_LEGEND_COPY =
  'AI fit 0–100: how well this event matches your interests, event types, and location stints. Keyword overlap with your interests can raise the score (up to +10). Scores below your min fit score are hidden (Settings).';

export function eventFitScoreChipAriaLabel(score: number): string {
  return `Fit ${score}. AI match score from 0 to 100.`;
}
