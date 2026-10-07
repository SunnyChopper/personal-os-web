import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type {
  LessonGenerationArtifact,
  LessonGenerationPhaseId,
  LessonGenerationProgress,
  LessonGenerationTrace,
} from '@/services/knowledge-vault/course-generation/types';
import {
  lessonGenArtifactPanelClassName,
  lessonGenPhaseRowClassName,
} from '@/lib/knowledge-vault/course-lesson-generation-surfaces';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';

const PHASE_STEPS: Array<{ phase: LessonGenerationPhaseId; label: string; icon: string }> = [
  { phase: 'analyzing', label: 'Analyzing Lesson Context', icon: '🔍' },
  { phase: 'structuring', label: 'Structuring Content', icon: '📋' },
  { phase: 'writing', label: 'Writing Lesson Content', icon: '✍️' },
  { phase: 'polishing', label: 'Polishing Content', icon: '✨' },
];

function artifactFromTrace(
  phase: LessonGenerationPhaseId,
  trace: LessonGenerationTrace | null | undefined
): LessonGenerationArtifact | undefined {
  if (!trace) return undefined;
  if (phase === 'analyzing' && trace.analysisBullets?.length) {
    return { kind: 'analysis', title: 'Analysis', bullets: trace.analysisBullets };
  }
  if (phase === 'structuring' && trace.outlineMarkdown) {
    return { kind: 'outline', title: 'Lesson outline', markdown: trace.outlineMarkdown };
  }
  if (phase === 'polishing' && trace.polishNotes) {
    return { kind: 'polishNotes', title: 'Polish notes', markdown: trace.polishNotes };
  }
  return undefined;
}

function ArtifactBody({ artifact }: { artifact: LessonGenerationArtifact }) {
  if (artifact.bullets?.length) {
    return (
      <ul className="list-disc pl-5 space-y-1">
        {artifact.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    );
  }
  if (artifact.markdown) {
    return <MarkdownRenderer content={artifact.markdown} />;
  }
  return null;
}

type Props = {
  progress: LessonGenerationProgress | null;
  artifactsByPhase: Partial<Record<LessonGenerationPhaseId, LessonGenerationArtifact>>;
  storedTrace?: LessonGenerationTrace | null;
  showStoredTrace?: boolean;
};

export function LessonGenerationProgressPanel({
  progress,
  artifactsByPhase,
  storedTrace,
  showStoredTrace,
}: Props) {
  const [openPhases, setOpenPhases] = useState<Set<LessonGenerationPhaseId>>(new Set());

  const activePhase = progress?.phase;
  const phaseOrder = PHASE_STEPS.map((s) => s.phase);
  const activeIndex = activePhase ? phaseOrder.indexOf(activePhase) : -1;

  const toggle = (phase: LessonGenerationPhaseId) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  if (showStoredTrace && storedTrace && !progress) {
    return (
      <details className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
          Generation process
        </summary>
        <div className="mt-3 space-y-3">
          {PHASE_STEPS.map((step) => {
            const artifact = artifactFromTrace(step.phase, storedTrace);
            if (!artifact) return null;
            return (
              <div key={step.phase}>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{step.label}</p>
                <div className={lessonGenArtifactPanelClassName}>
                  <ArtifactBody artifact={artifact} />
                </div>
              </div>
            );
          })}
        </div>
      </details>
    );
  }

  if (!progress) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {progress.phaseName}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{progress.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>

      {progress.summary && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">{progress.summary}</p>
        </div>
      )}

      <div className="space-y-3">
        {PHASE_STEPS.map((step, index) => {
          const isActive = activePhase === step.phase;
          const isCompleted = activeIndex > index;
          const artifact =
            artifactsByPhase[step.phase] ??
            (progress.artifact && progress.phase === step.phase ? progress.artifact : undefined);
          const canExpand = Boolean(artifact) && (isCompleted || isActive);
          const expanded = openPhases.has(step.phase);

          return (
            <div key={step.phase} className={lessonGenPhaseRowClassName(isActive, isCompleted)}>
              <div className="flex items-center gap-3">
                <span className={`text-xl ${isActive ? 'animate-pulse' : ''}`}>{step.icon}</span>
                <button
                  type="button"
                  className="flex-1 text-left"
                  disabled={!canExpand}
                  onClick={() => canExpand && toggle(step.phase)}
                >
                  <p
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-green-700 dark:text-green-300'
                        : isCompleted
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {step.label}
                  </p>
                </button>
                {canExpand && (
                  <span className="text-gray-400" aria-hidden>
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                )}
                {isActive && (
                  <div
                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"
                    aria-hidden
                  />
                )}
                {isCompleted && !isActive && (
                  <span className="text-green-600 dark:text-green-400" aria-label="Complete">
                    ✓
                  </span>
                )}
              </div>
              {canExpand && expanded && artifact && (
                <div className={lessonGenArtifactPanelClassName}>
                  <ArtifactBody artifact={artifact} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
