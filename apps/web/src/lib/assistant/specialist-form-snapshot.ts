import type { AssistantSpecialistTriggerMode } from '@/types/api-contracts';

export interface SpecialistFormDraft {
  id: string;
  displayName: string;
  systemPrompt: string;
  enabled: boolean;
  livingContextDomains: string[];
  mode: AssistantSpecialistTriggerMode;
  keywords: string;
  aliases: string;
  intentCategories: string;
  priority: string;
  includeBrandProfile: boolean;
  includeLtm: boolean;
  includeToolResults: boolean;
  domainDeltaModules: string;
  toolNames: string[];
  maxToolRounds: string;
  timeoutSeconds: string;
  temperature: string;
  modelOverride: string;
  contextCharBudget: string;
  corpusIds: string;
  graphEnabled: boolean;
  graphId: string;
}

export type SpecialistFormSnapshot = SpecialistFormDraft;

function normalizedList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableSnapshotJson(snapshot: SpecialistFormSnapshot): string {
  return JSON.stringify({
    ...snapshot,
    id: snapshot.id.trim(),
    displayName: snapshot.displayName.trim(),
    systemPrompt: snapshot.systemPrompt.trim(),
    livingContextDomains: normalizedList(snapshot.livingContextDomains),
    keywords: snapshot.keywords.trim(),
    aliases: snapshot.aliases.trim(),
    intentCategories: snapshot.intentCategories.trim(),
    domainDeltaModules: snapshot.domainDeltaModules.trim(),
    toolNames: normalizedList(snapshot.toolNames),
    modelOverride: snapshot.modelOverride.trim(),
    corpusIds: snapshot.corpusIds.trim(),
    graphId: snapshot.graphId.trim(),
  });
}

export function specialistFormSnapshotsEqual(
  a: SpecialistFormSnapshot,
  b: SpecialistFormSnapshot
): boolean {
  return stableSnapshotJson(a) === stableSnapshotJson(b);
}

export function buildSpecialistFormSnapshot(draft: SpecialistFormDraft): SpecialistFormSnapshot {
  return {
    ...draft,
    livingContextDomains: [...draft.livingContextDomains],
    toolNames: [...draft.toolNames],
  };
}
