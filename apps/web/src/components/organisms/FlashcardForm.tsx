import { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Plus, Trash2, Sparkles } from 'lucide-react';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import { aiFlashcardGeneratorService } from '@/services/knowledge-vault';
import type { Flashcard } from '@/types/knowledge-vault';
import type { Area } from '@/types/growth-system';

const AREAS: Area[] = ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'];

type CardRow = { localId: string; front: string; back: string };

let rowId = 0;
function nextRowId(): string {
  rowId += 1;
  return `card-${rowId}`;
}

interface FlashcardFormProps {
  flashcard?: Flashcard;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FlashcardForm({ flashcard, onSuccess, onCancel }: FlashcardFormProps) {
  const { createFlashcardDeck, updateFlashcard, vaultItems } = useKnowledgeVault();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deckName, setDeckName] = useState(flashcard?.title || '');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<Area>(flashcard?.area || 'Operations');
  const [tags, setTags] = useState<string[]>(flashcard?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [cards, setCards] = useState<CardRow[]>(() => [
    {
      localId: nextRowId(),
      front: flashcard?.front || '',
      back: flashcard?.back || '',
    },
  ]);

  const [aiSourceTitle, setAiSourceTitle] = useState('');
  const [aiSourceText, setAiSourceText] = useState('');
  const [aiCount, setAiCount] = useState(8);
  const [vaultSourceId, setVaultSourceId] = useState<string>('');

  const noteAndDocItems = vaultItems.filter((v) => v.type === 'note' || v.type === 'document');

  useEffect(() => {
    if (flashcard) {
      setDeckName(flashcard.title);
      setArea(flashcard.area);
      setTags(flashcard.tags);
      setCards([
        {
          localId: nextRowId(),
          front: flashcard.front,
          back: flashcard.back,
        },
      ]);
    }
  }, [flashcard]);

  useEffect(() => {
    if (!vaultSourceId) return;
    const item = vaultItems.find((v) => v.id === vaultSourceId);
    if (item && (item.type === 'note' || item.type === 'document')) {
      setAiSourceTitle(item.title);
      setAiSourceText(item.content || '');
    }
  }, [vaultSourceId, vaultItems]);

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

  const addCardRow = () => {
    setCards((prev) => [...prev, { localId: nextRowId(), front: '', back: '' }]);
  };

  const removeCardRow = (localId: string) => {
    setCards((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.localId !== localId)));
  };

  const updateCard = (localId: string, field: 'front' | 'back', value: string) => {
    setCards((prev) => prev.map((c) => (c.localId === localId ? { ...c, [field]: value } : c)));
  };

  const handleGenerateFromText = async () => {
    const title = aiSourceTitle.trim() || deckName.trim() || 'Flashcards';
    const content = aiSourceText.trim();
    if (!content) {
      setError('Paste or select source text to generate from.');
      return;
    }
    setError(null);
    setAiLoading(true);
    try {
      const res = await aiFlashcardGeneratorService.generateFromText(title, content, aiCount);
      if (!res.success || !res.data?.length) {
        throw new Error(res.error || 'No flashcards generated');
      }
      setCards((prev) => [
        ...prev.filter((c) => c.front.trim() || c.back.trim()),
        ...res.data!.map((c) => ({
          localId: nextRowId(),
          front: c.front,
          back: c.back,
        })),
      ]);
      if (!deckName.trim()) {
        setDeckName(title.slice(0, 200));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (flashcard) {
        if (filled.length !== 1) {
          throw new Error(
            'Editing supports a single card; remove extra rows or create a new deck.'
          );
        }
        await updateFlashcard(flashcard.id, {
          front: filled[0].front,
          back: filled[0].back,
          area,
          tags,
          deckId: flashcard.deckId,
        });
      } else {
        await createFlashcardDeck({
          name: deckName.trim(),
          description: description.trim() || undefined,
          area,
          tags,
          flashcards: filled.map((c) => ({ front: c.front.trim(), back: c.back.trim() })),
        });
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Deck title *
        </label>
        <input
          type="text"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
          placeholder="e.g. Quantum computing — midterm"
          required
          disabled={!!flashcard}
        />
      </div>

      {!flashcard && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
            placeholder="Notes about this deck"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Area *
        </label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value as Area)}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
          required
        >
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-3">
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
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
              >
                <TagIcon size={12} />
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {!flashcard && (
        <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            <Sparkles size={18} className="text-blue-500" />
            Auto-generate from text
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Paste a lesson, document, or notes. Generated cards are appended so you can edit before
            saving.
          </p>
          {noteAndDocItems.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Or pull from vault
              </label>
              <select
                value={vaultSourceId}
                onChange={(e) => setVaultSourceId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
              >
                <option value="">— Select note or document —</option>
                {noteAndDocItems.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.type}] {v.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <input
            type="text"
            value={aiSourceTitle}
            onChange={(e) => setAiSourceTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
            placeholder="Source title (for AI context)"
          />
          <textarea
            value={aiSourceText}
            onChange={(e) => setAiSourceText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
            placeholder="Paste content to turn into flashcards…"
          />
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Approx. cards</label>
              <input
                type="number"
                min={1}
                max={50}
                value={aiCount}
                onChange={(e) => setAiCount(Math.max(1, Math.min(50, Number(e.target.value) || 5)))}
                className="w-24 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateFromText}
              disabled={aiLoading}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {aiLoading ? 'Generating…' : 'Append generated cards'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cards *</label>
          {!flashcard && (
            <button
              type="button"
              onClick={addCardRow}
              className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Plus size={16} />
              Add card
            </button>
          )}
        </div>
        {cards.map((c, index) => (
          <div
            key={c.localId}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3 bg-gray-50/50 dark:bg-gray-900/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Card {index + 1}</span>
              {!flashcard && cards.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCardRow(c.localId)}
                  className="text-gray-500 hover:text-red-600 p-1"
                  aria-label="Remove card"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Front</label>
              <textarea
                value={c.front}
                onChange={(e) => updateCard(c.localId, 'front', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
                placeholder="Question or prompt"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Back</label>
              <textarea
                value={c.back}
                onChange={(e) => updateCard(c.localId, 'back', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
                placeholder="Answer"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Saving…' : flashcard ? 'Update card' : 'Create deck'}
        </button>
      </div>
    </form>
  );
}
