import { describe, expect, it } from 'vitest';
import {
  buildSpecialistFormSnapshot,
  specialistFormSnapshotsEqual,
  type SpecialistFormDraft,
} from './specialist-form-snapshot';

const draft: SpecialistFormDraft = {
  id: 'growth_coach',
  displayName: 'Growth Coach',
  systemPrompt: 'Advise on growth.',
  enabled: true,
  livingContextDomains: ['tasks', 'projects'],
  mode: 'auto',
  keywords: 'planning',
  aliases: '',
  intentCategories: 'tasks',
  priority: '40',
  includeBrandProfile: false,
  includeLtm: false,
  includeToolResults: true,
  domainDeltaModules: 'content',
  toolNames: ['list_tasks'],
  maxToolRounds: '1',
  timeoutSeconds: '12',
  temperature: '0.4',
  modelOverride: '',
  contextCharBudget: '2400',
  corpusIds: '',
  graphEnabled: false,
  graphId: '',
};

describe('specialist form snapshots', () => {
  it('ignores ordering and incidental whitespace', () => {
    const baseline = buildSpecialistFormSnapshot(draft);
    const reordered = buildSpecialistFormSnapshot({
      ...draft,
      displayName: ' Growth Coach ',
      livingContextDomains: ['projects', 'tasks', 'tasks'],
      toolNames: ['list_tasks', 'list_tasks'],
    });

    expect(specialistFormSnapshotsEqual(reordered, baseline)).toBe(true);
  });

  it('detects meaningful form changes', () => {
    const baseline = buildSpecialistFormSnapshot(draft);
    const changed = buildSpecialistFormSnapshot({ ...draft, temperature: '0.8' });

    expect(specialistFormSnapshotsEqual(changed, baseline)).toBe(false);
  });
});
