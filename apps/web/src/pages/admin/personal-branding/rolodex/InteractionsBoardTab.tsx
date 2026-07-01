import { useMemo, useState } from 'react';
import { CalendarClock, MessageSquarePlus, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useToast } from '@/hooks/use-toast';
import type { useRolodex } from '@/hooks/useRolodex';
import type {
  CreatorConnection,
  RolodexResponseVectorItem,
} from '@/types/api/personal-branding.dto';
import LogInteractionDialog from './LogInteractionDialog';
import ProfileLinkBadge from './ProfileLinkBadge';
import RelationshipPriorityBadge from './RelationshipPriorityBadge';
import RolodexPrompterDrawer from './RolodexPrompterDrawer';
import { followUpSortKey } from './rolodex-platform';
import {
  PageCard,
  emptyStateCardClassName,
  gridItemCardClassName,
} from '../PersonalBrandingPageTemplate';
import { cn } from '@/lib/utils';

type RolodexHook = ReturnType<typeof useRolodex>;

function formatLastInteracted(value?: string | null): string {
  if (!value) return 'Never';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatFollowUp(value?: string | null): string {
  if (!value) return 'Not scheduled';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

interface InteractionsBoardTabProps {
  rolodex: RolodexHook;
  selectedProfileId?: string | null;
}

export default function InteractionsBoardTab({
  rolodex,
  selectedProfileId,
}: InteractionsBoardTabProps) {
  const { showToast, ToastContainer } = useToast();
  const connections = rolodex.connections.data?.data ?? [];
  const sorted = useMemo(
    () => [...connections].sort((a, b) => followUpSortKey(a) - followUpSortKey(b)),
    [connections]
  );

  const [checkInConnection, setCheckInConnection] = useState<CreatorConnection | null>(null);
  const [prompterConnection, setPrompterConnection] = useState<CreatorConnection | null>(null);
  const [vectors, setVectors] = useState<RolodexResponseVectorItem[] | null>(null);
  const [pendingLog, setPendingLog] = useState<{
    connection: CreatorConnection;
    creatorText: string;
    vector: RolodexResponseVectorItem;
  } | null>(null);

  const openCheckIn = (connection: CreatorConnection) => {
    setPrompterConnection(null);
    setVectors(null);
    setCheckInConnection(connection);
  };

  const openPrompter = (connection: CreatorConnection) => {
    setCheckInConnection(null);
    setPrompterConnection(connection);
    setVectors(null);
  };

  const handleGenerate = async (payload: {
    creatorText: string;
    platform: import('@/types/api/personal-branding.dto').BrandPlatform;
    interactionIntent?: string;
  }) => {
    if (!prompterConnection) return;
    try {
      const result = await rolodex.generateResponseVectors.mutateAsync({
        connectionId: prompterConnection.id,
        creatorText: payload.creatorText,
        platform: payload.platform,
        profileId: selectedProfileId ?? undefined,
        interactionIntent: payload.interactionIntent,
      });
      setVectors(result.vectors);
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Generation failed' });
    }
  };

  const handleUseVector = (vector: RolodexResponseVectorItem, creatorText: string) => {
    if (!prompterConnection) return;
    void navigator.clipboard.writeText(vector.draftText);
    showToast({ type: 'success', title: 'Draft copied to clipboard' });
    setPrompterConnection(null);
    setVectors(null);
    setPendingLog({ connection: prompterConnection, creatorText, vector });
    setCheckInConnection(prompterConnection);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        High-value connections sorted by next follow-up, then staleness. Check in with evidence or
        open the prompter for Brand Identity-aware reply vectors.
      </p>

      {sorted.length === 0 ? (
        <PageCard className={cn(emptyStateCardClassName, 'p-8 text-sm text-gray-500 text-left')}>
          No connections yet — add targets in the Connection Directory tab.
        </PageCard>
      ) : (
        <ul className="grid gap-3">
          {sorted.map((connection) => (
            <li
              key={connection.id}
              className={cn(
                gridItemCardClassName,
                'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{connection.name}</h3>
                  <RelationshipPriorityBadge connection={connection} />
                </div>
                <div className="mt-1">
                  <ProfileLinkBadge connection={connection} />
                </div>
                {connection.desiredOutcome?.trim() ? (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {connection.desiredOutcome}
                  </p>
                ) : null}
                {connection.nextAction?.trim() ? (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    Next action: {connection.nextAction}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3.5" />
                    Follow-up: {formatFollowUp(connection.nextFollowUpAt)}
                  </span>
                  <span>Last interacted: {formatLastInteracted(connection.lastInteractedAt)}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => openCheckIn(connection)}
                  className="inline-flex items-center gap-1.5"
                >
                  <MessageSquarePlus className="size-4" />
                  Check in
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openPrompter(connection)}
                  className="inline-flex items-center gap-1.5"
                >
                  <Sparkles className="size-4" />
                  Prompter
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <LogInteractionDialog
        isOpen={Boolean(checkInConnection)}
        onClose={() => {
          setCheckInConnection(null);
          setPendingLog(null);
        }}
        connectionName={checkInConnection?.name ?? ''}
        isSubmitting={rolodex.logInteraction.isPending}
        initialCreatorText={pendingLog?.creatorText}
        initialResponseVectorId={pendingLog?.vector.id}
        onSubmit={async (body) => {
          if (!checkInConnection) return;
          try {
            await rolodex.logInteraction.mutateAsync({ connectionId: checkInConnection.id, body });
            showToast({ type: 'success', title: 'Interaction logged' });
            setPendingLog(null);
          } catch (err) {
            showToast({ type: 'error', title: err instanceof Error ? err.message : 'Save failed' });
            throw err;
          }
        }}
      />

      <RolodexPrompterDrawer
        open={Boolean(prompterConnection)}
        connection={prompterConnection}
        profileId={selectedProfileId}
        isLoading={rolodex.generateResponseVectors.isPending}
        vectors={vectors}
        onClose={() => {
          setPrompterConnection(null);
          setVectors(null);
        }}
        onGenerate={handleGenerate}
        onUseVector={handleUseVector}
      />

      <ToastContainer />
    </div>
  );
}
