import { useCallback, useEffect, useState } from 'react';
import type { CareerGeneratedResume, CareerResumeDraftSection } from '@/types/api/career.types';
import { Textarea } from '@/components/atoms/Textarea';

type Props = {
  draft: CareerGeneratedResume;
  busySectionId?: string | null;
  onSaveSection: (sectionId: string, contentMarkdown: string) => Promise<void>;
  onRegenerateSection: (sectionId: string, instructions?: string) => Promise<void>;
};

function sectionLabel(section: CareerResumeDraftSection): string {
  if (section.title?.trim()) return section.title;
  if (section.sectionType === 'summary') return 'Summary';
  if (section.sectionType === 'skills') return 'Skills';
  if (section.sectionType === 'experience_header') return 'Experience';
  if (section.sectionType === 'experience_bullet') return 'Bullet';
  if (section.sectionType === 'education') return 'Education';
  return section.sectionType || 'Section';
}

export function CareerResumeDraftEditor({
  draft,
  busySectionId,
  onSaveSection,
  onRegenerateSection,
}: Props) {
  const sections = draft.resumeSections ?? [];
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [regenNotes, setRegenNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const s of sections) {
      next[s.sectionId] = s.contentMarkdown;
    }
    setDrafts(next);
    setDirty({});
  }, [draft.id, draft.draftRevision, sections]);

  const revert = useCallback(
    (sectionId: string) => {
      const orig = sections.find((s) => s.sectionId === sectionId);
      if (!orig) return;
      setDrafts((d) => ({ ...d, [sectionId]: orig.contentMarkdown }));
      setDirty((d) => ({ ...d, [sectionId]: false }));
    },
    [sections]
  );

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="career-resume-draft-editor">
      {sections.map((section) => {
        const sid = section.sectionId;
        const value = drafts[sid] ?? section.contentMarkdown;
        const isDirty = dirty[sid] ?? false;
        const busy = busySectionId === sid;
        const provenanceBad =
          section.sectionType === 'experience_bullet' && section.provenanceOk === false;

        return (
          <div
            key={sid}
            className={`rounded-lg border p-3 space-y-2 ${
              provenanceBad
                ? 'border-amber-500/50 bg-amber-50/40 dark:bg-amber-950/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950'
            }`}
            data-section-id={sid}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {sectionLabel(section)}
              </span>
              {section.manuallyEdited ? (
                <span className="text-[10px] text-blue-600 dark:text-blue-400">Edited</span>
              ) : null}
              {provenanceBad && section.provenanceMessage ? (
                <span className="text-[10px] text-amber-700 dark:text-amber-300">
                  {section.provenanceMessage}
                </span>
              ) : null}
            </div>
            <Textarea
              className="w-full min-h-[72px] rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 font-mono"
              value={value}
              disabled={busy}
              onChange={(ev) => {
                const v = ev.target.value;
                setDrafts((d) => ({ ...d, [sid]: v }));
                setDirty((d) => ({ ...d, [sid]: v !== section.contentMarkdown }));
              }}
            />
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                className="text-xs px-2.5 py-1 rounded-md bg-blue-600 text-white disabled:opacity-40"
                disabled={!isDirty || busy}
                onClick={() => void onSaveSection(sid, value)}
              >
                {busy ? 'Saving…' : 'Save section'}
              </button>
              <button
                type="button"
                className="text-xs px-2.5 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                disabled={!isDirty || busy}
                onClick={() => revert(sid)}
              >
                Revert
              </button>
              <input
                type="text"
                placeholder="Regenerate instructions (optional)"
                className="flex-1 min-w-[140px] text-xs rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900"
                value={regenNotes[sid] ?? ''}
                disabled={busy}
                onChange={(ev) => setRegenNotes((n) => ({ ...n, [sid]: ev.target.value }))}
              />
              <button
                type="button"
                className="text-xs px-2.5 py-1 rounded-md border border-violet-400 text-violet-700 dark:text-violet-300 disabled:opacity-40"
                disabled={busy}
                onClick={() => void onRegenerateSection(sid, regenNotes[sid]?.trim() || undefined)}
              >
                {busy ? 'Regenerating…' : 'Regenerate section'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
