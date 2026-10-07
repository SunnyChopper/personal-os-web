import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type EmptyStateSceneId =
  | 'actionRequired'
  | 'noSource'
  | 'noProfile'
  | 'noVariants'
  | 'filteredEmpty'
  | 'queueEmpty'
  | 'recoveryCheckIn'
  | 'auraCorrelation'
  | 'pantryEmpty'
  | 'rewardsQuickClaim'
  | 'rewardsRules'
  | 'rewardsClaims'
  | 'reconScarcity'
  | 'reconAwaitingIngest';

interface SceneProps {
  className?: string;
}

function SceneFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-[120px] w-[160px]', className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Split nodes with incomplete link */
export function ActionRequiredScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <circle
        cx="40"
        cy="60"
        r="22"
        className="fill-blue-100 stroke-blue-300 dark:fill-blue-950/50 dark:stroke-blue-700"
        strokeWidth="1.5"
      />
      <circle
        cx="120"
        cy="60"
        r="22"
        className="fill-blue-50 stroke-blue-200 dark:fill-blue-950/30 dark:stroke-blue-800"
        strokeWidth="1.5"
      />
      <circle cx="40" cy="60" r="6" className="fill-blue-500 dark:fill-blue-400" />
      <circle cx="120" cy="60" r="6" className="fill-gray-300 dark:fill-gray-600" />
      <path
        d="M62 60 L98 60"
        className="stroke-blue-400 dark:stroke-blue-500"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <path
        d="M78 52 L86 60 L78 68"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SceneFrame>
  );
}

/** Empty document stack */
export function NoSourceScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <rect
        x="44"
        y="28"
        width="72"
        height="88"
        rx="6"
        className="fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
        strokeWidth="1.5"
      />
      <rect
        x="52"
        y="20"
        width="72"
        height="88"
        rx="6"
        className="fill-white stroke-gray-200 dark:fill-gray-900 dark:stroke-gray-700"
        strokeWidth="1.5"
      />
      <line
        x1="64"
        y1="44"
        x2="108"
        y2="44"
        className="stroke-gray-200 dark:stroke-gray-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="64"
        y1="58"
        x2="100"
        y2="58"
        className="stroke-gray-200 dark:stroke-gray-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="64"
        y1="72"
        x2="104"
        y2="72"
        className="stroke-gray-200 dark:stroke-gray-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="80"
        cy="92"
        r="8"
        className="fill-blue-100 stroke-blue-300 dark:fill-blue-950/50 dark:stroke-blue-700"
        strokeWidth="1.5"
      />
      <path
        d="M77 92 L79 94 L83 90"
        className="stroke-blue-500 dark:stroke-blue-400"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SceneFrame>
  );
}

/** Identity silhouette / profile ring */
export function NoProfileScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <circle
        cx="80"
        cy="60"
        r="36"
        className="stroke-blue-200 dark:stroke-blue-800"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      <circle cx="80" cy="48" r="14" className="fill-gray-200 dark:fill-gray-700" />
      <path
        d="M52 88 C52 72 64 66 80 66 C96 66 108 72 108 88"
        className="fill-gray-200 dark:fill-gray-700"
      />
      <circle cx="80" cy="60" r="4" className="fill-blue-500 dark:fill-blue-400" />
    </SceneFrame>
  );
}

/** Platform fan-out rays (empty) */
export function NoVariantsScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <circle cx="80" cy="60" r="12" className="fill-blue-500 dark:fill-blue-400" />
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x2 = 80 + Math.cos(rad) * 44;
        const y2 = 60 + Math.sin(rad) * 44;
        const cx = 80 + Math.cos(rad) * 52;
        const cy = 60 + Math.sin(rad) * 52;
        return (
          <g key={angle}>
            <line
              x1="80"
              y1="60"
              x2={x2}
              y2={y2}
              className="stroke-blue-200 dark:stroke-blue-800"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx={cx}
              cy={cy}
              r="8"
              className="fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
              strokeWidth="1.5"
            />
          </g>
        );
      })}
    </SceneFrame>
  );
}

/** Soft funnel / filter mesh */
export function FilteredEmptyScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <path
        d="M48 32 L112 32 L88 68 L88 96 L72 104 L72 68 Z"
        className="fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line
        x1="56"
        y1="40"
        x2="104"
        y2="40"
        className="stroke-gray-200 dark:stroke-gray-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="64"
        y1="48"
        x2="96"
        y2="48"
        className="stroke-gray-200 dark:stroke-gray-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="80"
        cy="78"
        r="6"
        className="fill-blue-100 stroke-blue-300 dark:fill-blue-950/50 dark:stroke-blue-700"
        strokeWidth="1.5"
      />
    </SceneFrame>
  );
}

/** Empty calendar strip */
export function QueueEmptyScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <rect
        x="36"
        y="32"
        width="88"
        height="72"
        rx="8"
        className="fill-white stroke-gray-200 dark:fill-gray-900 dark:stroke-gray-700"
        strokeWidth="1.5"
      />
      <rect
        x="36"
        y="32"
        width="88"
        height="20"
        rx="8"
        className="fill-blue-100 dark:fill-blue-950/50"
      />
      <rect x="36" y="44" width="88" height="8" className="fill-blue-100 dark:fill-blue-950/50" />
      <circle cx="52" cy="42" r="3" className="fill-blue-400 dark:fill-blue-500" />
      <circle cx="64" cy="42" r="3" className="fill-blue-300 dark:fill-blue-600" />
      <circle cx="76" cy="42" r="3" className="fill-blue-300 dark:fill-blue-600" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 48 + col * 20;
        const y = 60 + row * 14;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="14"
            height="10"
            rx="2"
            className="fill-gray-100 stroke-gray-200 dark:fill-gray-800 dark:stroke-gray-700"
            strokeWidth="1"
          />
        );
      })}
    </SceneFrame>
  );
}

/** Empty pantry shelf with jars */
export function PantryEmptyScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <rect
        x="28"
        y="78"
        width="104"
        height="8"
        rx="2"
        className="fill-amber-200 stroke-amber-300 dark:fill-amber-950/40 dark:stroke-amber-800"
        strokeWidth="1.5"
      />
      <rect
        x="40"
        y="44"
        width="24"
        height="34"
        rx="4"
        className="fill-emerald-50 stroke-emerald-200 dark:fill-emerald-950/30 dark:stroke-emerald-800"
        strokeWidth="1.5"
      />
      <rect
        x="68"
        y="38"
        width="24"
        height="40"
        rx="4"
        className="fill-amber-50 stroke-amber-200 dark:fill-amber-950/30 dark:stroke-amber-800"
        strokeWidth="1.5"
      />
      <rect
        x="96"
        y="48"
        width="24"
        height="30"
        rx="4"
        className="fill-blue-50 stroke-blue-200 dark:fill-blue-950/30 dark:stroke-blue-800"
        strokeWidth="1.5"
      />
      <rect
        x="44"
        y="40"
        width="16"
        height="6"
        rx="2"
        className="fill-emerald-200 dark:fill-emerald-800"
      />
      <rect
        x="72"
        y="34"
        width="16"
        height="6"
        rx="2"
        className="fill-amber-200 dark:fill-amber-800"
      />
      <rect
        x="100"
        y="44"
        width="16"
        height="6"
        rx="2"
        className="fill-blue-200 dark:fill-blue-800"
      />
      <circle cx="52" cy="58" r="4" className="fill-emerald-300 dark:fill-emerald-600" />
      <circle cx="80" cy="56" r="4" className="fill-amber-300 dark:fill-amber-600" />
      <circle cx="108" cy="60" r="3" className="fill-blue-300 dark:fill-blue-600" />
      <path
        d="M36 92 C48 88 60 90 80 90 C100 90 112 88 124 92"
        className="stroke-gray-200 dark:stroke-gray-700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
    </SceneFrame>
  );
}

/** Aura correlation — soft axes with sparse scatter dots */
export function AuraCorrelationScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <line
        x1="32"
        y1="88"
        x2="128"
        y2="88"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="28"
        x2="32"
        y2="88"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M36 72 C48 68 60 70 72 64 C84 58 96 62 108 56 C116 52 122 48 126 44"
        className="stroke-cyan-200 dark:stroke-cyan-800"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <circle cx="52" cy="68" r="4" className="fill-blue-400/60 dark:fill-blue-500/50" />
      <circle cx="72" cy="60" r="5" className="fill-cyan-400/70 dark:fill-cyan-500/60" />
      <circle cx="96" cy="54" r="4" className="fill-blue-300/50 dark:fill-blue-600/40" />
      <circle cx="112" cy="50" r="3" className="fill-cyan-300/40 dark:fill-cyan-700/40" />
      <circle
        cx="80"
        cy="36"
        r="10"
        className="fill-blue-50 stroke-blue-200 dark:fill-blue-950/40 dark:stroke-blue-800"
        strokeWidth="1.5"
      />
      <path
        d="M76 36 C76 32 80 30 84 31 C82 33 82 37 85 39 C81 38 76 38 76 36 Z"
        className="fill-blue-300 dark:fill-blue-600"
      />
    </SceneFrame>
  );
}

/** Rest / recovery check-in — moon, pillow, soft pulse */
export function RecoveryCheckInScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <circle
        cx="118"
        cy="34"
        r="14"
        className="fill-blue-100 stroke-blue-200 dark:fill-blue-950/50 dark:stroke-blue-800"
        strokeWidth="1.5"
      />
      <path
        d="M112 34 C112 28 118 24 124 26 C120 30 120 36 124 40 C118 38 112 38 112 34 Z"
        className="fill-blue-300 dark:fill-blue-600"
      />
      <rect
        x="36"
        y="52"
        width="88"
        height="48"
        rx="12"
        className="fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
        strokeWidth="1.5"
      />
      <ellipse
        cx="80"
        cy="68"
        rx="28"
        ry="10"
        className="fill-white stroke-gray-200 dark:fill-gray-900 dark:stroke-gray-700"
        strokeWidth="1.5"
      />
      <path
        d="M52 76 C60 72 68 72 80 72 C92 72 100 72 108 76"
        className="stroke-blue-300 dark:stroke-blue-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="80" cy="88" r="6" className="fill-blue-400 dark:fill-blue-500" />
      <path
        d="M44 96 C56 90 68 88 80 88 C92 88 104 90 116 96"
        className="stroke-blue-200 dark:stroke-blue-800"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
    </SceneFrame>
  );
}

/** Tap / one-shot claim chip motif */
export function RewardsQuickClaimScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <rect
        x="44"
        y="48"
        width="72"
        height="32"
        rx="8"
        className="fill-blue-50 stroke-blue-200 dark:fill-blue-950/40 dark:stroke-blue-800"
        strokeWidth="1.5"
      />
      <line
        x1="56"
        y1="64"
        x2="88"
        y2="64"
        className="stroke-blue-300 dark:stroke-blue-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="104" cy="64" r="6" className="fill-blue-500 dark:fill-blue-400" />
      <path
        d="M80 28 L84 40 L96 40 L86 48 L90 60 L80 52 L70 60 L74 48 L64 40 L76 40 Z"
        className="fill-amber-300 stroke-amber-400 dark:fill-amber-500 dark:stroke-amber-600"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M52 88 C64 84 76 82 80 82 C84 82 96 84 108 88"
        className="stroke-blue-200 dark:stroke-blue-800"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
    </SceneFrame>
  );
}

/** Stacked rule rows / checklist motif */
export function RewardsRulesScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      {[0, 1, 2].map((i) => {
        const y = 32 + i * 28;
        return (
          <g key={i}>
            <rect
              x="36"
              y={y}
              width="88"
              height="22"
              rx="6"
              className="fill-white stroke-gray-200 dark:fill-gray-900 dark:stroke-gray-700"
              strokeWidth="1.5"
            />
            <rect
              x="44"
              y={y + 6}
              width="10"
              height="10"
              rx="2"
              className={
                i === 0
                  ? 'fill-blue-100 stroke-blue-300 dark:fill-blue-950/50 dark:stroke-blue-700'
                  : 'fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600'
              }
              strokeWidth="1.5"
            />
            {i === 0 && (
              <path
                d={`M46 ${y + 11} L48 ${y + 13} L52 ${y + 9}`}
                className="stroke-blue-500 dark:stroke-blue-400"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <line
              x1="60"
              y1={y + 11}
              x2={i === 2 ? 96 : 108}
              y2={y + 11}
              className="stroke-gray-200 dark:stroke-gray-600"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        );
      })}
      <circle
        cx="120"
        cy="40"
        r="10"
        className="fill-emerald-100 stroke-emerald-300 dark:fill-emerald-950/40 dark:stroke-emerald-700"
        strokeWidth="1.5"
      />
      <path
        d="M117 40 L119 42 L123 38"
        className="stroke-emerald-500 dark:stroke-emerald-400"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SceneFrame>
  );
}

/** Empty ledger / timeline motif */
export function RewardsClaimsScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <circle
        cx="48"
        cy="36"
        r="14"
        className="fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
        strokeWidth="1.5"
      />
      <line
        x1="48"
        y1="44"
        x2="48"
        y2="52"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="48"
        y1="50"
        x2="52"
        y2="54"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="48"
        y1="50"
        x2="44"
        y2="54"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="64"
        y="32"
        width="72"
        height="72"
        rx="8"
        className="fill-white stroke-gray-200 dark:fill-gray-900 dark:stroke-gray-700"
        strokeWidth="1.5"
      />
      {[0, 1, 2, 3].map((i) => {
        const y = 44 + i * 14;
        return (
          <g key={i}>
            <line
              x1="72"
              y1={y}
              x2="120"
              y2={y}
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 4"
            />
            <circle cx="128" cy={y} r="3" className="fill-gray-200 dark:fill-gray-700" />
          </g>
        );
      })}
      <path
        d="M36 96 C48 92 60 90 80 90 C100 90 112 92 124 96"
        className="stroke-gray-200 dark:stroke-gray-700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
    </SceneFrame>
  );
}

/** Sparse connection nodes — Rolodex Recon scarcity */
export function ReconScarcityScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <circle
        cx="48"
        cy="52"
        r="16"
        className="fill-blue-100 stroke-blue-300 dark:fill-blue-950/50 dark:stroke-blue-700"
        strokeWidth="1.5"
      />
      <circle cx="48" cy="52" r="5" className="fill-blue-500 dark:fill-blue-400" />
      <circle
        cx="112"
        cy="44"
        r="12"
        className="fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <circle
        cx="96"
        cy="78"
        r="10"
        className="fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <path
        d="M62 50 L84 46"
        className="stroke-blue-300 dark:stroke-blue-600"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <path
        d="M58 62 L88 72"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="128" cy="60" r="4" className="fill-amber-400 dark:fill-amber-500" />
    </SceneFrame>
  );
}

/** Idle ingest pipeline — Rolodex Recon awaiting / caught-up */
export function ReconAwaitingIngestScene({ className }: SceneProps) {
  return (
    <SceneFrame className={className}>
      <rect
        x="36"
        y="40"
        width="88"
        height="48"
        rx="10"
        className="fill-white stroke-gray-200 dark:fill-gray-900 dark:stroke-gray-700"
        strokeWidth="1.5"
      />
      <circle
        cx="56"
        cy="64"
        r="14"
        className="fill-blue-100 stroke-blue-300 dark:fill-blue-950/50 dark:stroke-blue-700"
        strokeWidth="1.5"
      />
      <path
        d="M52 64 L54 66 L60 60"
        className="stroke-blue-500 dark:stroke-blue-400"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="76"
        y1="58"
        x2="108"
        y2="58"
        className="stroke-gray-200 dark:stroke-gray-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="76"
        y1="70"
        x2="96"
        y2="70"
        className="stroke-gray-200 dark:stroke-gray-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="128"
        cy="36"
        r="12"
        className="fill-amber-100 stroke-amber-300 dark:fill-amber-950/40 dark:stroke-amber-700"
        strokeWidth="1.5"
      />
      <line
        x1="128"
        y1="32"
        x2="128"
        y2="36"
        className="stroke-amber-500 dark:stroke-amber-400"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="128"
        y1="36"
        x2="131"
        y2="40"
        className="stroke-amber-500 dark:stroke-amber-400"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </SceneFrame>
  );
}

const SCENE_COMPONENTS: Record<EmptyStateSceneId, React.ComponentType<SceneProps>> = {
  actionRequired: ActionRequiredScene,
  noSource: NoSourceScene,
  noProfile: NoProfileScene,
  noVariants: NoVariantsScene,
  filteredEmpty: FilteredEmptyScene,
  queueEmpty: QueueEmptyScene,
  recoveryCheckIn: RecoveryCheckInScene,
  auraCorrelation: AuraCorrelationScene,
  pantryEmpty: PantryEmptyScene,
  rewardsQuickClaim: RewardsQuickClaimScene,
  rewardsRules: RewardsRulesScene,
  rewardsClaims: RewardsClaimsScene,
  reconScarcity: ReconScarcityScene,
  reconAwaitingIngest: ReconAwaitingIngestScene,
};

export function EmptyStateScene({
  scene,
  className,
}: {
  scene: EmptyStateSceneId;
  className?: string;
}) {
  const Component = SCENE_COMPONENTS[scene];
  return <Component className={className} />;
}
