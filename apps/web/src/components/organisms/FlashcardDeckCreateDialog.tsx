import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileCheck,
  FileText,
  GraduationCap,
  Plus,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import { aiFlashcardGeneratorService } from '@/services/knowledge-vault';
import { resolveFlashcardSources } from '@/services/knowledge-vault/flashcard-source-resolver';
import type { DeckFlashcardInput } from '@/types/knowledge-vault';
import type { Area } from '@/types/growth-system';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';

const AREAS: Area[] = ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'];

type CreateStep = 'mode' | 'manual' | 'ai-select' | 'review';

type DraftCard = DeckFlashcardInput & { localId: string };

let rowId = 0;
function nextRowId(): string {
  rowId += 1;
  return `card-${rowId}`;
}

interface FlashcardDeckCreateDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FlashcardDeckCreateDialog({
  onSuccess,
  onCancel,
}: FlashcardDeckCreateDialogProps) {
  const { createFlashcardDeck, vaultItems, courses } = useKnowledgeVault();

  const [step, setStep] = useState<CreateStep>('mode');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deckName, setDeckName] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<Area | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  const [cards, setCards] = useState<DraftCard[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [aiCount, setAiCount] = useState(10);
  const [sourceContext, setSourceContext] = useState('');
  const [sourceItemIds, setSourceItemIds] = useState<string[]>([]);
  const [regenFeedback, setRegenFeedback] = useState<Record<string, string>>({});

  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<
    'all' | 'note' | 'document' | 'course_lesson' | 'course'
  >('all');

  const selectableSources = useMemo(() => {
    const notesAndDocs = vaultItems.filter(
      (v) => v.status !== 'archived' && (v.type === 'note' || v.type === 'document')
    );
    const lessons = vaultItems.filter((v) => v.status !== 'archived' && v.type === 'course_lesson');
    const courseEntries = courses.map((course) => ({
      id: course.id,
      title: course.title,
      type: 'course' as const,
      searchableText: `${course.title} ${course.topic}`.toLowerCase(),
    }));
    return [...notesAndDocs, ...lessons, ...courseEntries];
  }, [vaultItems, courses]);

  const filteredSources = useMemo(() => {
    return selectableSources.filter((item) => {
      if (sourceTypeFilter !== 'all' && item.type !== sourceTypeFilter) return false;
      if (!sourceSearch.trim()) return true;
      const q = sourceSearch.toLowerCase();
      const title = 'title' in item ? item.title : '';
      const text =
        'searchableText' in item && item.searchableText ? item.searchableText : title.toLowerCase();
      return title.toLowerCase().includes(q) || text.includes(q);
    });
  }, [selectableSources, sourceSearch, sourceTypeFilter]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags((prev) => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addCardRow = () => {
    setCards((prev) => [...prev, { localId: nextRowId(), front: '', back: '' }]);
  };

  const removeCardRow = (localId: string) => {
    setCards((prev) => prev.filter((c) => c.localId !== localId));
  };

  const updateCard = (localId: string, field: 'front' | 'back', value: string) => {
    setCards((prev) => prev.map((c) => (c.localId === localId ? { ...c, [field]: value } : c)));
  };

  const handleGenerateFromSources = async () => {
    if (!selectedSourceIds.length) {
      setError('Select at least one note, document, or course.');
      return;
    }
    setError(null);
    setAiLoading(true);
    try {
      const resolved = await resolveFlashcardSources(selectedSourceIds, vaultItems, courses);
      if (!resolved.content.trim()) {
        throw new Error('Selected sources have no readable content.');
      }
      setSourceContext(resolved.content);
      setSourceItemIds(selectedSourceIds);
      if (!deckName.trim()) {
        setDeckName(resolved.title.slice(0, 200));
      }
      const res = await aiFlashcardGeneratorService.generateFromText(
        resolved.title,
        resolved.content,
        aiCount
      );
      if (!res.success || !res.data?.length) {
        throw new Error(res.error || 'No flashcards generated');
      }
      setCards(
        res.data.map((c) => ({
          localId: nextRowId(),
          front: c.front,
          back: c.back,
        }))
      );
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRegenerateCard = async (localId: string) => {
    const card = cards.find((c) => c.localId === localId);
    const feedback = (regenFeedback[localId] || '').trim();
    if (!card || !feedback) {
      setError('Add feedback before regenerating this card.');
      return;
    }
    setError(null);
    setRegeneratingId(localId);
    try {
      const res = await aiFlashcardGeneratorService.regenerateCard({
        front: card.front,
        back: card.back,
        feedback,
        sourceContext,
      });
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Regeneration failed');
      }
      setCards((prev) =>
        prev.map((c) =>
          c.localId === localId ? { ...c, front: res.data!.front, back: res.data!.back } : c
        )
      );
      setRegenFeedback((prev) => ({ ...prev, [localId]: '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regeneration failed');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!deckName.trim()) {
        throw new Error('Deck title is required');
      }
      const filled = cards.filter((c) => c.front.trim() && c.back.trim());
      if (!filled.length) {
        throw new Error('Add at least one card with front and back');
      }
      await createFlashcardDeck({
        name: deckName.trim(),
        description: description.trim() || undefined,
        area: area || undefined,
        tags,
        sourceItemIds: sourceItemIds.length ? sourceItemIds : undefined,
        flashcards: filled.map((c) => ({
          front: c.front.trim(),
          back: c.back.trim(),
          sourceItemId: c.sourceItemId,
        })),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const metadataSection = (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setMetadataExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <span>Optional metadata (area, tags)</span>
        {metadataExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {metadataExpanded && (
        <div className="space-y-4 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Area
            </label>
            <Select
              value={area}
              onChange={(e) => setArea(e.target.value as Area | '')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">— None —</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="rounded-lg bg-amber-100 px-4 py-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    <TagIcon size={12} />
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const cardsEditor = (showRegenerate: boolean) => (
    <div className="space-y-4">
      {cards.map((c, index) => (
        <div
          key={c.localId}
          className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Card {index + 1}</span>
            <button
              type="button"
              onClick={() => removeCardRow(c.localId)}
              className="p-1 text-gray-500 hover:text-red-600"
              aria-label="Remove card"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Front</label>
            <Textarea
              value={c.front}
              onChange={(e) => updateCard(c.localId, 'front', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Back</label>
            <Textarea
              value={c.back}
              onChange={(e) => updateCard(c.localId, 'back', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          {showRegenerate && (
            <div className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Regeneration feedback
              </label>
              <Textarea
                value={regenFeedback[c.localId] || ''}
                onChange={(e) =>
                  setRegenFeedback((prev) => ({ ...prev, [c.localId]: e.target.value }))
                }
                rows={2}
                placeholder="e.g. Make the answer more concise"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
              <button
                type="button"
                onClick={() => handleRegenerateCard(c.localId)}
                disabled={regeneratingId === c.localId}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
              >
                {regeneratingId === c.localId ? 'Regenerating…' : 'Regenerate with feedback'}
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addCardRow}
        className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline dark:text-amber-400"
      >
        <Plus size={16} />
        Add card
      </button>
    </div>
  );

  return (
    <fieldset
      disabled={loading}
      className="m-0 min-w-0 max-h-[85vh] space-y-6 overflow-y-auto border-0 p-0 pr-1 disabled:opacity-60"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {step === 'mode' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            How would you like to build this deck?
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setCards([{ localId: nextRowId(), front: '', back: '' }]);
                setStep('manual');
              }}
              className="rounded-xl border-2 border-gray-200 p-6 text-left transition hover:border-amber-400 dark:border-gray-700"
            >
              <CreditCard className="mb-3 text-amber-600" size={28} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Create manually</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Type your own flashcards card by card.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setStep('ai-select')}
              className="rounded-xl border-2 border-gray-200 p-6 text-left transition hover:border-blue-400 dark:border-gray-700"
            >
              <Sparkles className="mb-3 text-blue-600" size={28} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Generate from vault</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Pick notes, documents, or courses and review AI-generated cards before saving.
              </p>
            </button>
          </div>
        </div>
      )}

      {step === 'manual' && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Deck title *</label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              placeholder="e.g. Quantum computing — midterm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          {metadataSection}
          {cardsEditor(false)}
        </div>
      )}

      {step === 'ai-select' && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Deck title</label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Auto-filled from sources if left blank"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Sources *</label>
            <div className="mb-2 flex flex-wrap gap-2">
              {(['all', 'note', 'document', 'course_lesson', 'course'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSourceTypeFilter(t)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    sourceTypeFilter === t
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {t === 'all' ? 'All' : t.replace('_', ' ')}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              placeholder="Search sources…"
              className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
              {filteredSources.length === 0 ? (
                <p className="p-2 text-sm text-gray-500">No matching sources.</p>
              ) : (
                filteredSources.map((item) => {
                  const Icon =
                    item.type === 'note'
                      ? FileText
                      : item.type === 'document'
                        ? FileCheck
                        : item.type === 'course'
                          ? GraduationCap
                          : CreditCard;
                  const selected = selectedSourceIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                        selected
                          ? 'bg-blue-50 dark:bg-blue-950/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSource(item.id)}
                      />
                      <Icon size={16} className="shrink-0 text-gray-500" />
                      <span className="truncate">{item.title}</span>
                    </label>
                  );
                })
              )}
            </div>
            {selectedSourceIds.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">{selectedSourceIds.length} selected</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Approx. cards (max 20)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={aiCount}
              onChange={(e) => setAiCount(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
              className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Deck title *</label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review generated cards. Edit, remove, or regenerate individual cards before saving.
          </p>
          {metadataSection}
          {cardsEditor(true)}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          type="button"
          onClick={() => {
            if (step === 'mode') {
              onCancel();
            } else if (step === 'review') {
              setStep('ai-select');
            } else {
              setStep('mode');
            }
          }}
          className="rounded-lg bg-gray-100 px-6 py-2 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        >
          {step === 'mode' ? 'Cancel' : 'Back'}
        </button>
        {step === 'manual' && (
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-6 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Create deck'}
          </button>
        )}
        {step === 'ai-select' && (
          <button
            type="button"
            onClick={handleGenerateFromSources}
            disabled={aiLoading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aiLoading ? 'Generating…' : 'Generate cards'}
          </button>
        )}
        {step === 'review' && (
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-6 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save deck'}
          </button>
        )}
      </div>
    </fieldset>
  );
}
