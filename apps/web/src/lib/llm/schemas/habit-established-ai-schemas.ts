import { z } from 'zod';

export const EstablishedHabitActionTypeSchema = z.enum([
  'patternInsight',
  'routineTuneUp',
  'recoveryPlan',
  'sevenDayExperiment',
]);

export type EstablishedHabitActionType = z.infer<typeof EstablishedHabitActionTypeSchema>;

export const EstablishedHabitEvidenceItemSchema = z.object({
  label: z.string(),
  detail: z.string(),
});

export const EstablishedHabitSuggestedPatchSchema = z
  .object({
    trigger: z.string().optional(),
    action: z.string().optional(),
    reward: z.string().optional(),
    dailyTarget: z.number().optional(),
    weeklyTarget: z.number().optional(),
    frictionUp: z.string().optional(),
    frictionDown: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict();

export type EstablishedHabitSuggestedPatch = z.infer<typeof EstablishedHabitSuggestedPatchSchema>;

export const EstablishedHabitExperimentSchema = z.object({
  hypothesis: z.string(),
  change: z.string(),
  metric: z.string(),
  successCriterion: z.string(),
});

export const EstablishedHabitNextCheckInSchema = z.object({
  whenLabel: z.string(),
  prompt: z.string(),
});

export const EstablishedHabitReadinessSchema = z.enum(['starter', 'established', 'strongSignal']);

export const EstablishedHabitActionResultSchema = z.object({
  habitId: z.string(),
  actionType: EstablishedHabitActionTypeSchema,
  readiness: EstablishedHabitReadinessSchema,
  title: z.string(),
  summary: z.string(),
  evidence: z.array(EstablishedHabitEvidenceItemSchema),
  recommendations: z.array(z.string()),
  suggestedHabitPatch: EstablishedHabitSuggestedPatchSchema.nullable().optional(),
  experiment: EstablishedHabitExperimentSchema.nullable().optional(),
  nextCheckIn: EstablishedHabitNextCheckInSchema.nullable().optional(),
});

export const EstablishedHabitAiEnvelopeSchema = z.object({
  result: EstablishedHabitActionResultSchema,
  confidence: z.number(),
  provider: z.string(),
  model: z.string(),
  cached: z.boolean(),
});

export type EstablishedHabitAiEnvelope = z.infer<typeof EstablishedHabitAiEnvelopeSchema>;
