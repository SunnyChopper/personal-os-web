import { useState } from 'react';
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
}

const emptySource = (): SourceDraft => ({ title: '', url: '', text: '' });

const resetState = () => ({
  name: '',
  sources: [emptySource()],
  pdfFiles: [] as File[],
});

export default function ProfileExtractionDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ProfileExtractionDialogProps) {
  const [name, setName] = useState('');
  const [sources, setSources] = useState<SourceDraft[]>([emptySource()]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateSource = (index: number, patch: Partial<SourceDraft>) => {
    setSources((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const pastedSources: ProfileExtractionSourceInput[] = sources
    .filter((s) => s.text.trim())
    .map((s) => ({
      title: s.title.trim() || null,
      url: s.url.trim() || null,
      text: s.text.trim(),
    }));

  const canSubmit = pdfFiles.length > 0 || pastedSources.length > 0;

  const handleClose = () => {
    if (isSubmitting) return;
    const next = resetState();
    setName(next.name);
    setSources(next.sources);
    setPdfFiles(next.pdfFiles);
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!canSubmit) {
      setSubmitError('Upload at least one PDF or paste a text snippet.');
      return;
    }
    try {
      await onSubmit({
        name: name.trim() || null,
        sources: pastedSources.length ? pastedSources : undefined,
        files: pdfFiles.length ? pdfFiles : undefined,
      });
      const next = resetState();
      setName(next.name);
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
        <fieldset disabled={isSubmitting} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload PDF exports from Medium, X, or similar platforms. Parsed text feeds the same
            extraction job as pasted snippets. Scanned/image-only PDFs are not supported yet.
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
            <h3 className="text-sm font-medium">PDF uploads</h3>
            <FileUploadZone
              key={isOpen ? 'extraction-upload-open' : 'extraction-upload-closed'}
              accept=".pdf"
              extensions={['pdf']}
              multiple
              maxSizeMB={10}
              onFilesSelected={setPdfFiles}
            />
            {pdfFiles.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pdfFiles.length} PDF{pdfFiles.length === 1 ? '' : 's'} selected (max 10 per run).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Pasted snippets (optional)</h3>
            {sources.map((source, index) => (
              <div
                key={index}
                className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Snippet {index + 1}
                  </h4>
                  {sources.length > 1 && (
                    <button
                      type="button"
                      className="text-sm text-red-600"
                      onClick={() => setSources((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  )}
                </div>
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
                <FormTextarea
                  value={source.text}
                  onChange={(e) => updateSource(index, { text: e.target.value })}
                  placeholder="Paste text snippet (optional when PDFs are attached)"
                />
              </div>
            ))}

            <button
              type="button"
              className={cn('text-sm', linkAccentClassName)}
              onClick={() => setSources((prev) => [...prev, emptySource()])}
            >
              + Add another snippet
            </button>
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
