import { useState, useEffect } from 'react';
import { X, Tag, FolderKanban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { markdownFilesService } from '@/services/markdown-files.service';
import type { MarkdownFile } from '@/types/markdown-files';
import CategoryCombobox from '@/components/molecules/CategoryCombobox';
import Dialog from '@/components/molecules/Dialog';
import { FormField } from '@/components/molecules/FormField';
import { FormInput } from '@/components/atoms/FormInput';
import Button from '@/components/atoms/Button';

interface EditFileMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: MarkdownFile | null;
  onSave: (tags: string[], category: string) => Promise<void>;
}

export default function EditFileMetadataModal({
  isOpen,
  onClose,
  file,
  onSave,
}: EditFileMetadataModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: availableTagsResponse, isFetching: tagsSuggestionsLoading } = useQuery({
    queryKey: ['markdown-tags'],
    queryFn: () => markdownFilesService.getTags(),
    enabled: isOpen,
  });

  const { data: availableCategoriesResponse, isFetching: categoriesSuggestionsLoading } = useQuery({
    queryKey: ['markdown-categories'],
    queryFn: () => markdownFilesService.getCategories(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (file) {
      setTags(file.tags || []);
      setCategory(file.category || '');
      setError(null);
    }
  }, [file, isOpen]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(tags, category.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save metadata');
    } finally {
      setIsSaving(false);
    }
  };

  if (!file) return null;

  const tagSuggestions =
    availableTagsResponse?.success && Array.isArray(availableTagsResponse.data)
      ? availableTagsResponse.data.filter(
          (tag) => !tags.includes(tag) && tag.includes(tagInput.toLowerCase())
        )
      : [];

  const categoryOptions =
    availableCategoriesResponse?.success && Array.isArray(availableCategoriesResponse.data)
      ? availableCategoriesResponse.data
      : [];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Edit Tags & Category" size="sm">
      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={isSaving}
          className="min-w-0 space-y-6 border-0 p-0 m-0 disabled:opacity-60"
        >
          <FormField
            label={
              <span className="inline-flex items-center gap-1">
                <Tag size={14} />
                Tags
              </span>
            }
            htmlFor="tag-input"
            hint={tagsSuggestionsLoading ? 'Loading tag suggestions…' : undefined}
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FormInput
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag"
                  className="w-full"
                />
                {tagInput && tagSuggestions.length > 0 ? (
                  <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {tagSuggestions.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setTags([...tags, tag]);
                          setTagInput('');
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={isSaving}
                size="sm"
                variant="secondary"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isSaving}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </FormField>

          <FormField
            label={
              <span className="inline-flex items-center gap-1">
                <FolderKanban size={14} />
                Category
              </span>
            }
            hint="Categories group files in the sidebar. Existing values appear in the dropdown; anything you type is saved as a new category."
          >
            <CategoryCombobox
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              disabled={isSaving}
              isLoadingOptions={categoriesSuggestionsLoading}
              placeholder="Type a new category or pick from your library"
            />
          </FormField>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} size="sm">
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
