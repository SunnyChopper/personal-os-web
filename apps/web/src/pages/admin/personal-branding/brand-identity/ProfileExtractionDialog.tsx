import { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import { linkAccentClassName } from '../personal-branding-ui';
import { cn } from '@/lib/utils';
import FileUploadZone from '@/components/molecules/FileUploadZone';
import { FormInput } from '@/components/atoms/FormInput';
import { FormTextarea } from './BrandIdentityFormFields';
import type {
  ProfileExtractionSourceInput,
  StartProfileExtractionInput,
} from '@/types/api/personal-branding.dto';

interface SourceDraft {
  title: string;
  url: string;
  text: string;
}

interface ProfileExtractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (body: StartProfileExtractionInput) => Promise<void>;
  isSubmitting?: boolean;
  hasRapidApiKey?: boolean;
}

const emptySource = (): SourceDraft => ({ title: '', url: '', text: '' });

const resetState = () => ({
  name: '',
  xUsername: '',
  sources: [] as SourceDraft[],
  pdfFiles: [] as File[],
});

export default function ProfileExtractionDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  hasRapidApiKey = true,
}: ProfileExtractionDialogProps) {
  const [name, setName] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [sources, setSources] = useState<SourceDraft[]>([]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateSource = (index: number, patch: Partial<SourceDraft>) => {
    setSources((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeSource = (index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index));
  };

  const normalizedXUsername = xUsername.trim().replace(/^@+/, '');
  const pastedSources: ProfileExtractionSourceInput[] = sources
    .filter((s) => s.text.trim())
    .map((s) => ({
      title: s.title.trim() || null,
      url: s.url.trim() || null,
      text: s.text.trim(),
    }));

  const hasXOnly =
    Boolean(normalizedXUsername) && pdfFiles.length === 0 && pastedSources.length === 0;
  const xBlocked = hasXOnly && !hasRapidApiKey;
  const canSubmit =
    (pdfFiles.length > 0 || pastedSources.length > 0 || Boolean(normalizedXUsername)) && !xBlocked;

  const handleClose = () => {
    if (isSubmitting) return;
    const next = resetState();
    setName(next.name);
    setXUsername(next.xUsername);
    setSources(next.sources);
    setPdfFiles(next.pdfFiles);
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!canSubmit) {
      if (xBlocked) {
        setSubmitError(
          'Configure a RapidAPI key under Rolodex → Recon Feed before importing from X.'
        );
        return;
      }
      setSubmitError('Upload at least one PDF, paste a text snippet, or enter an X username.');
      return;
    }
    try {
      await onSubmit({
        name: name.trim() || null,
        xUsername: normalizedXUsername || null,
        sources: pastedSources.length ? pastedSources : undefined,
        files: pdfFiles.length ? pdfFiles : undefined,
      });
      const next = resetState();
      setName(next.name);
      setXUsername(next.xUsername);
      setSources(next.sources);
      setPdfFiles(next.pdfFiles);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Extraction failed');
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Extract profile from sources" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isSubmitting} className="min-w-0 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Import an X profile timeline, upload PDF exports from Medium or similar platforms, or
            paste text snippets. Each PDF may be up to 10 MB. Extraction runs in the background;
            unreadable sources are reported while successful sources still build the profile.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium">Profile name (optional)</label>
            <FormInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My brand voice"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="text-sm font-medium">Import from X</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pulls up to ~200 recent posts via RapidAPI (same key as Rolodex Recon Feed).
            </p>
            <FormInput
              value={xUsername}
              onChange={(e) => setXUsername(e.target.value)}
              placeholder="username (without @)"
              aria-label="X username"
            />
            {!hasRapidApiKey && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Configure a RapidAPI key under Rolodex → Recon Feed to import from X.
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="text-sm font-medium">PDF uploads</h3>
            <FileUploadZone
              key={isOpen ? 'extraction-upload-open' : 'extraction-upload-closed'}
              accept=".pdf"
              extensions={['pdf']}
              multiple
              append
              maxSizeMB={10}
              onFilesSelected={setPdfFiles}
            />
            {pdfFiles.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pdfFiles.length} PDF{pdfFiles.length === 1 ? '' : 's'} selected.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Pasted snippets (optional)</h3>
              {sources.length > 0 && (
                <button
                  type="button"
                  className={cn('text-sm', linkAccentClassName)}
                  onClick={() => setSources((prev) => [...prev, emptySource()])}
                >
                  + Add snippet
                </button>
              )}
            </div>

            {sources.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/60 px-4 py-6 text-center dark:border-gray-600 dark:bg-gray-900/30">
                <ClipboardPaste
                  className="mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-gray-500"
                  aria-hidden
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No text snippets added yet. Paste text directly from articles, posts, or
                  transcripts.
                </p>
                <button
                  type="button"
                  className={cn('mt-3 text-sm font-medium', linkAccentClassName)}
                  onClick={() => setSources([emptySource()])}
                >
                  + Paste a snippet
                </button>
              </div>
            ) : (
              sources.map((source, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/30 p-4 dark:border-gray-700 dark:bg-gray-900/10"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Snippet {index + 1}
                    </h4>
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => removeSource(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <FormInput
                      value={source.title}
                      onChange={(e) => updateSource(index, { title: e.target.value })}
                      placeholder="Title (optional)"
                    />
                    <FormInput
                      value={source.url}
                      onChange={(e) => updateSource(index, { url: e.target.value })}
                      placeholder="URL (optional)"
                    />
                  </div>
                  <FormTextarea
                    value={source.text}
                    onChange={(e) => updateSource(index, { text: e.target.value })}
                    placeholder="Paste text snippet (optional when PDFs or X import are provided)"
                  />
                </div>
              ))
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {submitError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" size="sm" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Starting extraction…' : 'Start extraction'}
            </Button>
          </DialogFooter>
        </fieldset>
      </form>
    </Dialog>
  );
}
