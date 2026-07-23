import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type EmptyStateSceneId =
  | 'actionRequired'
  | 'noSource'
  | 'noProfile'
  | 'noVariants'
  | 'filteredEmpty'
  | 'queueEmpty';

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

const SCENE_COMPONENTS: Record<EmptyStateSceneId, React.ComponentType<SceneProps>> = {
  actionRequired: ActionRequiredScene,
  noSource: NoSourceScene,
  noProfile: NoProfileScene,
  noVariants: NoVariantsScene,
  filteredEmpty: FilteredEmptyScene,
  queueEmpty: QueueEmptyScene,
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
