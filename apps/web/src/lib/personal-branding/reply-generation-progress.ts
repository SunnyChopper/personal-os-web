import type { ReplyGenerationMode, ReplyRunStatus } from '@/types/api/personal-branding.dto';

export type ReplyAgentStepId =
  | 'plan'
  | 'research'
  | 'vault_ground'
  | 'draft'
  | 'critique'
  | 'polish';

export type ReplyAgentStep = {
  id: ReplyAgentStepId;
  label: string;
  /** Wall-clock budget (ms) for client heuristic progress within this step. */
  budgetMs: number;
};

const BASE_AGENT_STEPS: readonly ReplyAgentStep[] = [
  { id: 'plan', label: 'Planning engagement…', budgetMs: 8_000 },
  { id: 'research', label: 'Researching context…', budgetMs: 12_000 },
  { id: 'vault_ground', label: 'Grounding from vault…', budgetMs: 8_000 },
  { id: 'draft', label: 'Drafting replies…', budgetMs: 18_000 },
  { id: 'critique', label: 'Critiquing drafts…', budgetMs: 10_000 },
  { id: 'polish', label: 'Polishing suggestions…', budgetMs: 12_000 },
] as const;

const QUEUED_LABEL = 'Queued for generation…';
const MAX_IN_FLIGHT_PERCENT = 95;

export function resolveReplyAgentSteps(
  researchEnabled: boolean,
  vaultGroundingEnabled = false
): ReplyAgentStep[] {
  return BASE_AGENT_STEPS.filter((step) => {
    if (step.id === 'research' && !researchEnabled) return false;
    if (step.id === 'vault_ground' && !vaultGroundingEnabled) return false;
    return true;
  });
}

export function resolveReplySkeletonCount(
  run?: { suggestionCount?: number | null } | null,
  fallback?: number | null
): number {
  const raw = run?.suggestionCount ?? fallback ?? 3;
  return Math.min(5, Math.max(1, Math.round(raw)));
}

export type ReplyAgentProgressInput = {
  status: ReplyRunStatus | 'PENDING';
  mode: ReplyGenerationMode;
  researchEnabled: boolean;
  vaultGroundingEnabled: boolean;
  startedAtMs: number;
  nowMs: number;
};

export type ReplyAgentProgress = {
  stepId: ReplyAgentStepId | 'queued';
  label: string;
  percent: number;
};

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function replyAgentProgress(input: ReplyAgentProgressInput): ReplyAgentProgress | null {
  if (input.mode !== 'AGENT') return null;

  if (input.status === 'PENDING' || input.status === 'QUEUED') {
    return { stepId: 'queued', label: QUEUED_LABEL, percent: 4 };
  }

  const steps = resolveReplyAgentSteps(input.researchEnabled, input.vaultGroundingEnabled);
  const totalBudget = steps.reduce((sum, step) => sum + step.budgetMs, 0);
  const elapsed = Math.max(0, input.nowMs - input.startedAtMs);

  let consumed = 0;
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index]!;
    const stepEnd = consumed + step.budgetMs;
    if (elapsed < stepEnd || index === steps.length - 1) {
      const stepElapsed = Math.min(step.budgetMs, Math.max(0, elapsed - consumed));
      const stepFraction = step.budgetMs > 0 ? stepElapsed / step.budgetMs : 1;
      const priorFraction = consumed / totalBudget;
      const withinStepFraction = (stepFraction * step.budgetMs) / totalBudget;
      const percent = clampPercent((priorFraction + withinStepFraction) * 100);
      return {
        stepId: step.id,
        label: step.label,
        percent: Math.min(MAX_IN_FLIGHT_PERCENT, percent),
      };
    }
    consumed = stepEnd;
  }

  const last = steps[steps.length - 1]!;
  return { stepId: last.id, label: last.label, percent: MAX_IN_FLIGHT_PERCENT };
}

const POLISHING_FALLBACK_LABEL = 'Polishing drafts…';

/** Progress heuristic when early drafts are visible but critique/polish still runs. */
export function replyPolishingProgress(input: ReplyAgentProgressInput): ReplyAgentProgress | null {
  if (input.mode !== 'AGENT') return null;

  const allSteps = resolveReplyAgentSteps(input.researchEnabled, input.vaultGroundingEnabled);
  const polishSteps = allSteps.filter((step) => step.id === 'critique' || step.id === 'polish');
  if (polishSteps.length === 0) {
    return { stepId: 'polish', label: POLISHING_FALLBACK_LABEL, percent: MAX_IN_FLIGHT_PERCENT };
  }

  const priorBudget = allSteps
    .filter((step) => step.id !== 'critique' && step.id !== 'polish')
    .reduce((sum, step) => sum + step.budgetMs, 0);
  const polishBudget = polishSteps.reduce((sum, step) => sum + step.budgetMs, 0);
  const elapsed = Math.max(0, input.nowMs - input.startedAtMs);
  const polishElapsed = Math.max(0, elapsed - priorBudget);

  let consumed = 0;
  for (let index = 0; index < polishSteps.length; index += 1) {
    const step = polishSteps[index]!;
    const stepEnd = consumed + step.budgetMs;
    if (polishElapsed < stepEnd || index === polishSteps.length - 1) {
      const stepElapsed = Math.min(step.budgetMs, Math.max(0, polishElapsed - consumed));
      const stepFraction = step.budgetMs > 0 ? stepElapsed / step.budgetMs : 1;
      const priorFraction = consumed / polishBudget;
      const withinStepFraction = (stepFraction * step.budgetMs) / polishBudget;
      const percent = clampPercent((priorFraction + withinStepFraction) * 100);
      return {
        stepId: step.id,
        label: step.label,
        percent: Math.min(MAX_IN_FLIGHT_PERCENT, percent),
      };
    }
    consumed = stepEnd;
  }

  const last = polishSteps[polishSteps.length - 1]!;
  return { stepId: last.id, label: last.label, percent: MAX_IN_FLIGHT_PERCENT };
}

export function replyGenerationStartedAtMs(
  run?: { startedAt?: string | null; createdAt?: string | null } | null,
  fallbackMs?: number | null
): number {
  const iso = run?.startedAt ?? run?.createdAt;
  if (iso) {
    const parsed = Date.parse(iso);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallbackMs ?? Date.now();
}
