import { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
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
  useX: false,
  usePdf: false,
  useSnippets: false,
  attemptedSubmit: false,
});

const fieldErrorClassName = 'text-sm text-red-600 dark:text-red-400';

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
  const [useX, setUseX] = useState(false);
  const [usePdf, setUsePdf] = useState(false);
  const [useSnippets, setUseSnippets] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateSource = (index: number, patch: Partial<SourceDraft>) => {
    setSources((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeSource = (index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index));
  };

  const applyReset = () => {
    const next = resetState();
    setName(next.name);
    setXUsername(next.xUsername);
    setSources(next.sources);
    setPdfFiles(next.pdfFiles);
    setUseX(next.useX);
    setUsePdf(next.usePdf);
    setUseSnippets(next.useSnippets);
    setAttemptedSubmit(next.attemptedSubmit);
    setSubmitError(null);
  };

  const handleUseXChange = (checked: boolean) => {
    setUseX(checked);
    if (!checked) setXUsername('');
  };

  const handleUsePdfChange = (checked: boolean) => {
    setUsePdf(checked);
    if (!checked) setPdfFiles([]);
  };

  const handleUseSnippetsChange = (checked: boolean) => {
    setUseSnippets(checked);
    if (!checked) setSources([]);
  };

  const trimmedName = name.trim();
  const normalizedXUsername = xUsername.trim().replace(/^@+/, '');
  const pastedSources: ProfileExtractionSourceInput[] = sources
    .filter((s) => s.text.trim())
    .map((s) => ({
      title: s.title.trim() || null,
      url: s.url.trim() || null,
      text: s.text.trim(),
    }));

  const hasSourceTypeSelected = useX || usePdf || useSnippets;
  const xBlocked = useX && !hasRapidApiKey;
  const xValid = !useX || (Boolean(normalizedXUsername) && !xBlocked);
  const pdfValid = !usePdf || pdfFiles.length > 0;
  const snippetsValid = !useSnippets || pastedSources.length > 0;

  const canSubmit =
    Boolean(trimmedName) && hasSourceTypeSelected && xValid && pdfValid && snippetsValid;

  const nameError = attemptedSubmit && !trimmedName ? 'Enter a profile name.' : null;
  const sourceTypeError =
    attemptedSubmit && !hasSourceTypeSelected ? 'Select at least one source type.' : null;
  const xUsernameError =
    attemptedSubmit && useX && !normalizedXUsername && !xBlocked ? 'Enter an X username.' : null;
  const pdfError =
    attemptedSubmit && usePdf && pdfFiles.length === 0 ? 'Upload at least one PDF.' : null;
  const snippetsError =
    attemptedSubmit && useSnippets && pastedSources.length === 0
      ? 'Paste at least one non-empty snippet.'
      : null;

  const handleClose = () => {
    if (isSubmitting) return;
    applyReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setAttemptedSubmit(true);
    if (!canSubmit) return;

    try {
      await onSubmit({
        name: trimmedName,
        xUsername: useX && normalizedXUsername ? normalizedXUsername : null,
        sources: useSnippets && pastedSources.length ? pastedSources : undefined,
        files: usePdf && pdfFiles.length ? pdfFiles : undefined,
      });
      applyReset();
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
            Name your profile, choose one or more source types, then provide the matching inputs.
            Each PDF may be up to 10 MB. Extraction runs in the background; unreadable sources are
            reported while successful sources still build the profile.
          </p>

          <div>
            <label htmlFor="profile-extraction-name" className="mb-1 block text-sm font-medium">
              Profile name
            </label>
            <FormInput
              id="profile-extraction-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My brand voice"
              aria-invalid={Boolean(nameError)}
            />
            {nameError && (
              <p className={cn('mt-1', fieldErrorClassName)} role="alert">
                {nameError}
              </p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Which sources would you like to use?</legend>
            <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <label className="flex items-center gap-2 text-sm">
                <FormCheckbox
                  checked={useX}
                  onChange={(e) => handleUseXChange(e.target.checked)}
                  aria-label="Import from X"
                />
                Import from X
              </label>
              <label className="flex items-center gap-2 text-sm">
                <FormCheckbox
                  checked={usePdf}
                  onChange={(e) => handleUsePdfChange(e.target.checked)}
                  aria-label="PDF uploads"
                />
                PDF uploads
              </label>
              <label className="flex items-center gap-2 text-sm">
                <FormCheckbox
                  checked={useSnippets}
                  onChange={(e) => handleUseSnippetsChange(e.target.checked)}
                  aria-label="Pasted snippets"
                />
                Pasted snippets
              </label>
            </div>
            {sourceTypeError && (
              <p className={fieldErrorClassName} role="alert">
                {sourceTypeError}
              </p>
            )}
          </fieldset>

          {useX && (
            <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="text-sm font-medium">Import from X</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pulls up to ~200 recent posts via the platform RapidAPI integration.
              </p>
              <FormInput
                value={xUsername}
                onChange={(e) => setXUsername(e.target.value)}
                placeholder="username (without @)"
                aria-label="X username"
                aria-invalid={Boolean(xUsernameError || xBlocked)}
              />
              {xUsernameError && (
                <p className={fieldErrorClassName} role="alert">
                  {xUsernameError}
                </p>
              )}
              {xBlocked && (
                <p className="text-xs text-amber-700 dark:text-amber-300" role="alert">
                  Platform RapidAPI integration is not configured. Contact your operator to enable X
                  imports.
                </p>
              )}
            </div>
          )}

          {usePdf && (
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
              {pdfError && (
                <p className={fieldErrorClassName} role="alert">
                  {pdfError}
                </p>
              )}
            </div>
          )}

          {useSnippets && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Pasted snippets</h3>
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
                      placeholder="Paste text snippet"
                    />
                  </div>
                ))
              )}
              {snippetsError && (
                <p className={fieldErrorClassName} role="alert">
                  {snippetsError}
                </p>
              )}
            </div>
          )}

          {submitError && (
            <p className={fieldErrorClassName} role="alert">
              {submitError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" size="sm" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Starting extraction…' : 'Start extraction'}
            </Button>
          </DialogFooter>
        </fieldset>
      </form>
    </Dialog>
  );
}
