import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { aiCoursePracticeService, practiceArtifactsService } from '@/services/knowledge-vault';
import type { PracticeSourceScope, VaultItemType } from '@/types/knowledge-vault';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import { queryKeys } from '@/lib/react-query/query-keys';

function errText(err: unknown, fallback: string): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

type CreateKind = Extract<VaultItemType, 'practice_question_set' | 'quiz' | 'homework_assignment'>;

interface PracticeArtifactCreateDialogProps {
  kind: CreateKind;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PracticeArtifactCreateDialog({
  kind,
  onSuccess,
  onCancel,
}: PracticeArtifactCreateDialogProps) {
  const { vaultItems } = useKnowledgeVault();
  const queryClient = useQueryClient();
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notesAndDocs = vaultItems.filter((v) => v.type === 'note' || v.type === 'document');

  const buildContext = () => {
    const parts = selectedSourceIds
      .map((id) => vaultItems.find((v) => v.id === id))
      .filter(Boolean)
      .map((v) => `# ${v!.title}\n\n${v!.content ?? ''}`);
    return parts.join('\n\n---\n\n') || 'General knowledge vault practice.';
  };

  const sourceScope: PracticeSourceScope = {
    sourceType: selectedSourceIds.length ? 'vault' : 'vault',
    sourceItemIds: selectedSourceIds,
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    const context = buildContext();
    try {
      if (kind === 'practice_question_set') {
        const gen = await aiCoursePracticeService.generatePracticeQuestions({
          context,
          sourceScope,
        });
        if (!gen.success || !gen.data) throw new Error(gen.error || 'Generation failed');
        const saved = await practiceArtifactsService.createPracticeSet({
          title: gen.data.title,
          questions: gen.data.questions,
          difficulty: gen.data.difficulty,
          sourceScope: gen.data.sourceScope,
        });
        if (!saved.success) throw new Error(errText(saved.error, 'Save failed'));
      } else if (kind === 'quiz') {
        const gen = await aiCoursePracticeService.generateQuiz({ context, sourceScope, count: 10 });
        if (!gen.success || !gen.data) throw new Error(gen.error || 'Generation failed');
        const saved = await practiceArtifactsService.createQuiz({
          title: gen.data.title,
          questions: gen.data.questions,
          difficulty: gen.data.difficulty,
          adaptiveContextSummary: gen.data.adaptiveContextSummary,
          timeLimitMinutes: gen.data.timeLimitMinutes,
          sourceScope: gen.data.sourceScope,
        });
        if (!saved.success) throw new Error(errText(saved.error, 'Save failed'));
      } else {
        const gen = await aiCoursePracticeService.generateHomework({ context, sourceScope });
        if (!gen.success || !gen.data) throw new Error(gen.error || 'Generation failed');
        const saved = await practiceArtifactsService.createHomework({
          title: gen.data.title,
          prompt: gen.data.prompt,
          deliverables: gen.data.deliverables,
          rubric: gen.data.rubric,
          dueDate: gen.data.suggestedDueDate,
          estimatedMinutes: gen.data.estimatedMinutes,
          sourceScope: gen.data.sourceScope,
        });
        if (!saved.success) throw new Error(errText(saved.error, 'Save failed'));
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgeVault.practiceArtifacts(),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeVault.vaultItems() });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setBusy(false);
    }
  };

  const label =
    kind === 'practice_question_set' ? 'Practice Questions' : kind === 'quiz' ? 'Quiz' : 'Homework';

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Generate {label.toLowerCase()} from selected Library sources (optional).
      </p>
      <div className="max-h-48 overflow-y-auto space-y-1 border rounded p-2">
        {notesAndDocs.length === 0 ? (
          <p className="text-sm text-gray-500">No notes or documents in Library.</p>
        ) : (
          notesAndDocs.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedSourceIds.includes(item.id)}
                onChange={(e) => {
                  setSelectedSourceIds((prev) =>
                    e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                  );
                }}
              />
              <span className="truncate">{item.title}</span>
            </label>
          ))
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded border">
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleCreate}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg disabled:opacity-50"
        >
          {busy ? 'Generating…' : `Generate ${label}`}
        </button>
      </div>
    </div>
  );
}
