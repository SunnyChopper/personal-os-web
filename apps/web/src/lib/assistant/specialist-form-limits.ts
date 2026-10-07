/** Keep these limits aligned with api/schemas/assistant_specialists.py. */
export const specialistFormLimits = {
  id: { minLength: 2, maxLength: 64 },
  displayName: { maxLength: 120 },
  systemPrompt: { maxLength: 12000 },
  keywords: { maxItems: 64 },
  aliases: { maxItems: 32 },
  intentCategories: { maxItems: 32 },
  livingContextDomains: { maxItems: 16 },
  domainDeltaModules: { maxItems: 16 },
  modelOverride: { maxLength: 200 },
  contextCharBudget: { min: 400, max: 12000, integer: true },
  corpusIds: { maxItems: 32 },
  graphId: { maxLength: 120 },
  priority: { min: -100, max: 100, integer: true },
  maxToolRounds: { min: 0, max: 2, integer: true },
  timeoutSeconds: { min: 1, max: 60 },
  temperature: { min: 0, max: 1 },
} as const;
