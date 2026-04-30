import { useState, useEffect, useCallback, useRef } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/types/knowledge-vault';
import type { Area } from '@/types/growth-system';
import MarkdownEditor from '@/components/molecules/MarkdownEditor';
import TagInput from '@/components/molecules/TagInput';
import LinkedItemsPicker from '@/components/molecules/LinkedItemsPicker';
import NoteAIAssistPanel from '@/components/molecules/NoteAIAssistPanel';
import { VaultKnowledgeToolsPanel } from '@/components/organisms/VaultKnowledgeToolsPanel';
import { cn } from '@/lib/utils';
import { llmConfig } from '@/lib/llm';
import { useDraftNote, useDraftNoteMutations } from '@/hooks/useDraftNotes';

const AREAS: Area[] = ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'];

interface NoteFormProps {
  note?: Note;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function NoteForm({ note, onSuccess, onCancel }: NoteFormProps) {
  const { createNote, updateNote } = useKnowledgeVault();
  const { draft } = useDraftNote();
  const { saveDraftNote, deleteDraftNote } = useDraftNoteMutations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
    area: note?.area || ('Operations' as Area),
    sourceUrl: (note as Note)?.sourceUrl || '',
    tags: note?.tags || [],
    linkedItems: note?.linkedItems || [],
  });

  // Load draft from React Query cache if creating new note
  useEffect(() => {
    if (!note && draft) {
      setFormData((prev) => ({
        ...prev,
        title: draft.title,
        content: draft.content,
        area: draft.area as Area,
        sourceUrl: draft.sourceUrl,
        tags: draft.tags,
        linkedItems: draft.linkedItems,
      }));
    }
  }, [note, draft]);

  // Auto-save draft every 30 seconds (debounced)
  useEffect(() => {
    if (!note && (formData.title || formData.content)) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer
      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          await saveDraftNote({
            title: formData.title,
            content: formData.content,
            area: formData.area,
            sourceUrl: formData.sourceUrl,
            tags: formData.tags,
            linkedItems: formData.linkedItems,
          });
        } catch (error) {
          console.error('Failed to save draft note:', error);
          // Silently fail - draft saving is best effort
        }
      }, 30000);

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }
  }, [formData, note, saveDraftNote]);

  // Clear draft on successful save
  const clearDraft = useCallback(async () => {
    try {
      await deleteDraftNote();
    } catch (error) {
      console.error('Failed to clear draft note:', error);
      // Silently fail - clearing draft is best effort
    }
  }, [deleteDraftNote]);

  // Real-time validation
  const validateTitle = useCallback((title: string) => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return false;
    }
    if (title.length > 200) {
      setTitleError('Title must be less than 200 characters');
      return false;
    }
    setTitleError(null);
    return true;
  }, []);

  const validateUrl = useCallback((url: string) => {
    if (!url.trim()) {
      setUrlError(null);
      return true;
    }
    try {
      new URL(url);
      setUrlError(null);
      return true;
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }
      // Esc to cancel
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateTitle(formData.title)) {
      return;
    }

    if (!validateUrl(formData.sourceUrl)) {
      return;
    }

    setLoading(true);

    try {
      if (note) {
        const input: UpdateNoteInput = {
          title: formData.title,
          content: formData.content || undefined,
          area: formData.area,
          sourceUrl: formData.sourceUrl || undefined,
          tags: formData.tags,
          linkedItems: formData.linkedItems,
        };
        await updateNote(note.id, input);
      } else {
        const input: CreateNoteInput = {
          title: formData.title,
          content: formData.content || undefined,
          area: formData.area,
          sourceUrl: formData.sourceUrl || undefined,
          tags: formData.tags,
          linkedItems: formData.linkedItems,
        };
        await createNote(input);
      }

      clearDraft();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceUrlPreview = () => {
    if (formData.sourceUrl && !urlError) {
      window.open(formData.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Title Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, title: e.target.value }));
            validateTitle(e.target.value);
          }}
          onBlur={(e) => validateTitle(e.target.value)}
          className={cn(
            'w-full px-4 py-3 text-lg bg-white dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition',
            titleError
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-700'
          )}
          placeholder="Enter note title"
          required
        />
        {titleError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{titleError}</p>}
      </div>

      {/* Content Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content
          </label>
          {llmConfig.isConfigured() && (
            <button
              type="button"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition',
                showAIPanel
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
              )}
            >
              <Sparkles size={16} />
              <span>AI Assistant</span>
            </button>
          )}
        </div>
        <MarkdownEditor
          value={formData.content}
          onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
          placeholder="Write your note content here (supports Markdown)"
          minHeight="500px"
          className="min-h-[500px]"
        />
        {note?.id && (
          <div className="mt-4">
            <VaultKnowledgeToolsPanel vaultItemId={note.id} />
          </div>
        )}
      </div>

      {/* AI Assistant Panel - Fixed Right Side */}
      {showAIPanel && llmConfig.isConfigured() && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-[75]"
            onClick={() => setShowAIPanel(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowAIPanel(false);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close AI panel"
          />
          <NoteAIAssistPanel
            content={formData.content}
            title={formData.title}
            area={formData.area}
            tags={formData.tags}
            onContentChange={(content) => setFormData((prev) => ({ ...prev, content }))}
            onTagsChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
            onAreaChange={(area) => setFormData((prev) => ({ ...prev, area }))}
            onClose={() => setShowAIPanel(false)}
          />
        </>
      )}

      {/* Metadata Section (Collapsible) */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <button
          type="button"
          onClick={() => setMetadataExpanded(!metadataExpanded)}
          className="flex items-center justify-between w-full mb-4"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Metadata</h3>
          {metadataExpanded ? (
            <ChevronUp size={20} className="text-gray-500" />
          ) : (
            <ChevronDown size={20} className="text-gray-500" />
          )}
        </button>

        {metadataExpanded && (
          <div className="space-y-6">
            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Area <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.area}
                onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value as Area }))}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                required
              >
                {AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <TagInput
                value={formData.tags}
                onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
                placeholder="Add a tag"
              />
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, sourceUrl: e.target.value }));
                    validateUrl(e.target.value);
                  }}
                  onBlur={(e) => validateUrl(e.target.value)}
                  className={cn(
                    'flex-1 px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent',
                    urlError
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                  )}
                  placeholder="https://example.com/article"
                />
                {formData.sourceUrl && !urlError && (
                  <button
                    type="button"
                    onClick={handleSourceUrlPreview}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
                    title="Open in new tab"
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
              {urlError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{urlError}</p>
              )}
            </div>

            {/* Linked Items */}
            <div>
              <LinkedItemsPicker
                value={formData.linkedItems}
                onChange={(linkedItems) => setFormData((prev) => ({ ...prev, linkedItems }))}
                excludeItemId={note?.id}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => {
            clearDraft();
            onCancel();
          }}
          className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading || !!titleError || !!urlError}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>{note ? 'Update Note' : 'Create Note'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
