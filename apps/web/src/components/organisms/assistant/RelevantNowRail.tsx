import { Loader2 } from 'lucide-react';

import { RelevantNowCard } from '@/components/molecules/assistant/RelevantNowCard';
import { cn } from '@/lib/utils';
import { useRelevantNow } from '@/hooks/chatbot/useRelevantNow';
import type { AmbientCoachData } from '@/types/chatbot';

export interface RelevantNowRailProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onAsk: (prompt: string) => void;
  onOpen: (href: string) => void;
  className?: string;
}

function AmbientCoachCards({
  data,
  onAsk,
  onOpen,
}: {
  data: AmbientCoachData;
  onAsk: (prompt: string) => void;
  onOpen: (href: string) => void;
}) {
  if (data.slots.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        Nothing needs your attention right now.
      </p>
    );
  }

  return (
    <>
      {data.slots.map((slot) => (
        <RelevantNowCard
          key={`${slot.kind}-${slot.entityId}`}
          item={slot}
          slotLabel={slot.slotLabel}
          onAsk={onAsk}
          onOpen={onOpen}
        />
      ))}
    </>
  );
}

export function RelevantNowRail({
  collapsed,
  onToggleCollapsed: _onToggleCollapsed,
  onAsk,
  onOpen,
  className,
}: RelevantNowRailProps) {
  const { data, isLoading, isError } = useRelevantNow();

  return (
    <aside
      className={cn(
        'hidden lg:flex bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-col transition-[width] duration-300 relative z-10 h-full overflow-hidden shrink-0',
        collapsed ? 'w-0 border-l-0' : 'w-72',
        className
      )}
      aria-label="Ambient Coach"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ambient Coach</h3>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            <Loader2 className="animate-spin" size={20} aria-hidden />
            <span className="sr-only">Loading ambient coach context</span>
          </div>
        ) : isError || !data ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-6">
            Couldn&apos;t load coach context right now.
          </p>
        ) : (
          <AmbientCoachCards data={data} onAsk={onAsk} onOpen={onOpen} />
        )}
      </div>
    </aside>
  );
}

export function RelevantNowRailDrawerBody({
  onAsk,
  onOpen,
}: {
  onAsk: (prompt: string) => void;
  onOpen: (href: string) => void;
}) {
  const { data, isLoading, isError } = useRelevantNow();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Loader2 className="animate-spin" size={22} aria-hidden />
        <span className="sr-only">Loading ambient coach context</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10 px-4">
        Couldn&apos;t load coach context right now.
      </p>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <AmbientCoachCards data={data} onAsk={onAsk} onOpen={onOpen} />
    </div>
  );
}
