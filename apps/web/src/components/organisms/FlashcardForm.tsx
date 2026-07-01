import { useState, useEffect } from 'react';
import { X, Tag as TagIcon } from 'lucide-react';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import type { Flashcard } from '@/types/knowledge-vault';
import type { Area } from '@/types/growth-system';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';

const AREAS: Area[] = ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'];

interface FlashcardFormProps {
  flashcard: Flashcard;
  onSuccess: () => void;
  onCancel: () => void;
}

/** Single-card edit form (deck creation uses FlashcardDeckCreateDialog). */
export default function FlashcardForm({ flashcard, onSuccess, onCancel }: FlashcardFormProps) {
  const { updateFlashcard } = useKnowledgeVault();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deckName] = useState(flashcard.title);
  const [area, setArea] = useState<Area>(flashcard.area || 'Operations');
  const [tags, setTags] = useState<string[]>(flashcard.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [front, setFront] = useState(flashcard.front);
  const [back, setBack] = useState(flashcard.back);

  useEffect(() => {
    setArea(flashcard.area);
    setTags(flashcard.tags);
    setFront(flashcard.front);
    setBack(flashcard.back);
  }, [flashcard]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!front.trim() || !back.trim()) {
        throw new Error('Front and back are required');
      }
      await updateFlashcard(flashcard.id, {
        front: front.trim(),
        back: back.trim(),
        area,
        tags,
        deckId: flashcard.deckId,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset
        disabled={loading}
        className="m-0 min-w-0 space-y-6 border-0 p-0 disabled:opacity-60"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Deck
          </label>
          <input
            type="text"
            value={deckName}
            disabled
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Area
          </label>
          <Select
            value={area}
            onChange={(e) => setArea(e.target.value as Area)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
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

        <div>
          <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Front</label>
          <Textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Back</label>
          <Textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-gray-100 px-6 py-2 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-amber-600 px-6 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Update card'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
