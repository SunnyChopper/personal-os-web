import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ClipboardPaste, Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { FormTextarea } from '../PersonalBrandingFormFields';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import { selectableChipClassName } from '../personal-branding-ui';
import { personalBrandingService } from '@/services/personal-branding.service';
import {
  buildManualInteractionIntent,
  classifyPasteInput,
  matchConnectionByXHandle,
  type PrompterIntentAction,
} from '@/lib/personal-branding/manual-prompter-paste';
import type { ReconPrompterPrefill } from '@/lib/personal-branding/recon-prompter-seed';
import type {
  CreateCreatorConnectionInput,
  CreatorConnection,
  ResolveXContentResult,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import ConnectionEditorDialog from './ConnectionEditorDialog';

export const PASTE_POST_CTA_HINT = 'Paste any X URL or text';

interface ManualPrompterPasteDialogProps {
  open: boolean;
  connections: CreatorConnection[];
  isCreatingConnection?: boolean;
  onClose: () => void;
  onOpenPrompter: (connection: CreatorConnection, prefill: ReconPrompterPrefill) => void;
  onCreateConnection: (body: CreateCreatorConnectionInput) => Promise<CreatorConnection | void>;
  showToast: (toast: {
    type: 'error' | 'info' | 'success';
    title: string;
    message?: string;
  }) => void;
}

function connectionPrefillFromResolve(
  resolved: ResolveXContentResult
): CreateCreatorConnectionInput {
  const handle = resolved.authorUsername?.replace(/^@+/, '') || 'unknown';
  return {
    name: resolved.displayName?.trim() || handle,
    handles: { x: handle },
    targetProfileUrl: resolved.profileUrl ?? `https://x.com/${handle}`,
    personalContext: resolved.bio?.trim() || null,
    relationshipStage: 'target',
    relationshipPriority: 'watch',
    relationshipType: 'creator',
  };
}

export default function ManualPrompterPasteDialog({
  open,
  connections,
  isCreatingConnection = false,
  onClose,
  onOpenPrompter,
  onCreateConnection,
  showToast,
}: ManualPrompterPasteDialogProps) {
  const [pasteValue, setPasteValue] = useState('');
  const [creatorText, setCreatorText] = useState('');
  const [intentAction, setIntentAction] =
    useState<Extract<PrompterIntentAction, 'reply' | 'quote'>>('reply');
  const [resolved, setResolved] = useState<ResolveXContentResult | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<CreatorConnection | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [connectionEditorOpen, setConnectionEditorOpen] = useState(false);
  const [connectionPrefill, setConnectionPrefill] = useState<CreateCreatorConnectionInput | null>(
    null
  );

  useEffect(() => {
    if (!open) return;
    setPasteValue('');
    setCreatorText('');
    setIntentAction('reply');
    setResolved(null);
    setSelectedConnection(null);
    setIsResolving(false);
    setResolveError(null);
    setConnectionEditorOpen(false);
    setConnectionPrefill(null);
  }, [open]);

  const authorHandle = useMemo(() => {
    if (resolved?.authorUsername) return resolved.authorUsername.replace(/^@+/, '');
    const classified = classifyPasteInput(pasteValue);
    return classified.statusUrl?.authorUsername ?? null;
  }, [pasteValue, resolved]);

  useEffect(() => {
    if (!open || !authorHandle) return;
    const matched = matchConnectionByXHandle(connections, authorHandle);
    if (matched) {
      setSelectedConnection(matched);
    }
  }, [authorHandle, connections, open]);

  const evidenceUrl = resolved?.evidenceUrl ?? null;
  const platformPostId = resolved?.platformPostId ?? null;

  const interactionIntent = buildManualInteractionIntent({
    action: intentAction,
    authorUsername: authorHandle,
  });

  const canOpenPrompter = Boolean(selectedConnection && creatorText.trim());

  const runResolve = async (raw: string) => {
    const classified = classifyPasteInput(raw);
    if (classified.kind === 'plainText') {
      setResolved(null);
      setCreatorText(classified.creatorText ?? '');
      setResolveError(null);
      return;
    }

    setIsResolving(true);
    setResolveError(null);
    try {
      const result = await personalBrandingService.resolveXContent({
        url: classified.statusUrl?.evidenceUrl ?? raw.trim(),
        authorUsername: classified.statusUrl?.authorUsername,
        platformPostId: classified.statusUrl?.platformPostId,
      });
      setResolved(result);
      if (result.creatorText?.trim()) {
        setCreatorText(result.creatorText.trim());
      } else {
        setCreatorText('');
      }
      if (result.warning) {
        showToast({ type: 'info', title: result.warning });
      }
      const matched = matchConnectionByXHandle(connections, result.authorUsername);
      if (matched) {
        setSelectedConnection(matched);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not resolve post';
      setResolveError(message);
      if (classified.statusUrl) {
        setResolved({
          authorUsername: classified.statusUrl.authorUsername ?? '',
          evidenceUrl: classified.statusUrl.evidenceUrl,
          platformPostId: classified.statusUrl.platformPostId,
          matchedInTimeline: false,
          source: 'metadata_only',
          warning: message,
        });
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handlePasteFieldBlur = () => {
    const trimmed = pasteValue.trim();
    if (!trimmed) return;
    void runResolve(trimmed);
  };

  const openQuickAdd = () => {
    if (resolved) {
      setConnectionPrefill(connectionPrefillFromResolve(resolved));
    } else if (authorHandle) {
      setConnectionPrefill({
        name: authorHandle,
        handles: { x: authorHandle },
        targetProfileUrl: `https://x.com/${authorHandle}`,
        relationshipStage: 'target',
        relationshipPriority: 'watch',
        relationshipType: 'creator',
      });
    } else {
      showToast({
        type: 'error',
        title: 'Add a status URL with an @handle or pick a connection first',
      });
      return;
    }
    setConnectionEditorOpen(true);
  };

  const handleOpenPrompter = () => {
    if (!selectedConnection || !creatorText.trim()) return;
    onOpenPrompter(selectedConnection, {
      creatorText: creatorText.trim(),
      interactionIntent,
      authorHandle,
      evidenceUrl,
      platformPostId,
    });
    onClose();
  };

  return (
    <>
      <Dialog isOpen={open} onClose={onClose} title="Paste post" size="lg">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Paste an X post URL or the post text. Brand Identity rules apply in the Response Prompter.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Post URL or text
            </label>
            <FormTextarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              onBlur={handlePasteFieldBlur}
              placeholder="https://x.com/handle/status/… or paste the post text"
              className="min-h-[100px]"
            />
            {isResolving ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Resolving post metadata…
              </p>
            ) : null}
            {resolveError ? (
              <p className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {resolveError}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Creator text
            </label>
            <FormTextarea
              value={creatorText}
              onChange={(e) => setCreatorText(e.target.value)}
              placeholder="Paste the post text here if it was not auto-filled"
              className="min-h-[100px]"
            />
            {resolved?.matchedInTimeline ? (
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                Post text found from recent timeline.
              </p>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Intent
            </p>
            <div className="flex flex-wrap gap-2">
              {(['reply', 'quote'] as const).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setIntentAction(action)}
                  className={cn(
                    selectableChipClassName(
                      intentAction === action,
                      intentAction === action ? 'ring-2 ring-blue-500/40' : undefined
                    ),
                    'capitalize'
                  )}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/40">
            <p className="font-medium text-gray-900 dark:text-white">Connection</p>
            {selectedConnection ? (
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                Matched: {selectedConnection.name}
                {authorHandle ? ` · @${authorHandle}` : ''}
              </p>
            ) : (
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {authorHandle
                  ? `No directory match for @${authorHandle}. Add them to continue.`
                  : 'Paste a status URL with an @handle or add a connection.'}
              </p>
            )}
            {!selectedConnection ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={openQuickAdd}
              >
                <ClipboardPaste className="mr-1.5 h-4 w-4" />
                Add to Directory
              </Button>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canOpenPrompter || isResolving}
            onClick={handleOpenPrompter}
          >
            Open Prompter
          </Button>
        </DialogFooter>
      </Dialog>

      <ConnectionEditorDialog
        isOpen={connectionEditorOpen}
        onClose={() => {
          setConnectionEditorOpen(false);
          setConnectionPrefill(null);
        }}
        prefill={connectionPrefill}
        title="Quick-add connection"
        subtitle={
          authorHandle
            ? `Prefilled from @${authorHandle}. Review defaults, then save to open the prompter.`
            : 'Review defaults before saving.'
        }
        isSubmitting={isCreatingConnection}
        onCreate={async (body) => {
          const created = await onCreateConnection(body);
          setConnectionEditorOpen(false);
          setConnectionPrefill(null);
          if (created && typeof created === 'object' && 'id' in created) {
            setSelectedConnection(created);
          }
        }}
        onUpdate={async () => {
          /* create-only */
        }}
      />
    </>
  );
}
