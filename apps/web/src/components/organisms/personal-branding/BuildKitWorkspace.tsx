import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Button from '@/components/atoms/Button';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import BuildKitItemEditor, {
  BUILD_KIT_LIMITS,
} from '@/components/organisms/personal-branding/BuildKitItemEditor';
import {
  buildKitDesignNotesPlainText,
  buildKitPlainTextAll,
} from '@/lib/personal-branding/build-kit-plain-text';
import { cn } from '@/lib/utils';
import {
  linkAccentClassName,
  pbBodySecondaryClassName,
  pbFeedbackTextClassName,
  pbMetaClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import type {
  BrandProjectBuildKit,
  BrandProjectBuildKitHarness,
  BuildKitPatchOperation,
} from '@/types/api/personal-branding.dto';

const COPY_RESET_MS = 2000;

export interface BuildKitWorkspaceProps {
  kit: BrandProjectBuildKit | null | undefined;
  isLoading?: boolean;
  error?: string;
  isGeneratePending?: boolean;
  onGenerate: () => void;
  onRetry?: () => void;
  /** Present only on the detail page. Omitted keeps the workspace copy-only. */
  onPatch?: (operations: BuildKitPatchOperation[]) => Promise<void>;
  /** Shown under the heading when a kit is stored. */
  revisePanel?: ReactNode;
}

type KitEditor =
  | { kind: 'skill'; name: string }
  | { kind: 'module'; order: number }
  | { kind: 'addSkill' }
  | { kind: 'addModule' };

type PendingRemove =
  | { kind: 'skill'; name: string }
  | { kind: 'module'; order: number; name: string };

function nextModuleOrder(modules: Array<{ order: number }>): number {
  return modules.reduce((max, mod) => Math.max(max, mod.order), 0) + 1;
}

function saveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Could not save this change.';
}

function removeOperation(target: PendingRemove): BuildKitPatchOperation {
  switch (target.kind) {
    case 'skill':
      return { op: 'removeSkill', name: target.name };
    case 'module':
      // ponytail: removeModule does not rewrite other modules' dependsOn or harness waves.
      // Ceiling: a removed name can linger as a dependency string. Upgrade: strip it in the same batch.
      return { op: 'removeModule', order: target.order };
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}

function ItemActions({
  editLabel,
  removeLabel,
  disabled,
  onEdit,
  onRemove,
}: {
  editLabel: string;
  removeLabel: string;
  disabled: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label={editLabel}
        disabled={disabled}
        onClick={onEdit}
      >
        Edit
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        aria-label={removeLabel}
        disabled={disabled}
        onClick={onRemove}
      >
        Remove
      </Button>
    </>
  );
}

type CopyButtonLabel = 'Copy' | 'Copied' | 'Copy all' | 'Copy design notes';

function useCopyToClipboard(labelWhenIdle: CopyButtonLabel) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const scheduleReset = () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
      resetTimeoutRef.current = null;
    }, COPY_RESET_MS);
  };

  const copy = async (text: string) => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    setCopied(false);
    setFailed(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      scheduleReset();
    } catch {
      setFailed(true);
      scheduleReset();
    }
  };

  const buttonLabel: CopyButtonLabel = copied ? 'Copied' : labelWhenIdle;

  return { copy, failed, copied, buttonLabel };
}

function BuildKitCopyBlock({
  label,
  text,
  id,
  extraActions,
  replacement,
}: {
  label: string;
  text: string;
  id?: string;
  extraActions?: ReactNode;
  replacement?: ReactNode;
}) {
  const { copy, failed, buttonLabel } = useCopyToClipboard('Copy');

  return (
    <section id={id} className="scroll-mt-24 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {extraActions}
          <Button type="button" variant="secondary" size="sm" onClick={() => void copy(text)}>
            {buttonLabel}
          </Button>
        </div>
      </div>
      {failed ? (
        <p role="alert" className={pbFeedbackTextClassName('danger')}>
          Couldn&apos;t copy
        </p>
      ) : null}
      {replacement ?? (
        <pre
          className={cn(
            'whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-100'
          )}
        >
          {text}
        </pre>
      )}
    </section>
  );
}

function BuildKitModuleSection({
  mod,
  anchorId,
  extraActions,
  promptReplacement,
}: {
  mod: BrandProjectBuildKit['modules'][number];
  anchorId: string;
  extraActions?: ReactNode;
  promptReplacement?: ReactNode;
}) {
  const { copy, failed, buttonLabel } = useCopyToClipboard('Copy');
  const dependsLine = mod.dependsOn.length > 0 ? `Depends on ${mod.dependsOn.join(', ')}` : null;

  return (
    <section
      id={anchorId}
      className="scroll-mt-24 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-700"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Module {mod.order}: {mod.name}
      </h3>
      {dependsLine ? <p className={pbMetaClassName}>{dependsLine}</p> : null}
      <div>
        <EyebrowLabel>Goal</EyebrowLabel>
        <div className={cn('mt-1', pbBodySecondaryClassName)}>
          <MarkdownRenderer content={mod.goal} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <EyebrowLabel as="span">Module prompt</EyebrowLabel>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {extraActions}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void copy(mod.prompt)}
            >
              {buttonLabel}
            </Button>
          </div>
        </div>
        {failed ? (
          <p role="alert" className={pbFeedbackTextClassName('danger')}>
            Couldn&apos;t copy
          </p>
        ) : null}
        {promptReplacement ?? (
          <pre
            className={cn(
              'whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-100'
            )}
          >
            {mod.prompt}
          </pre>
        )}
      </div>
    </section>
  );
}

const sectionClassName =
  'scroll-mt-24 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-700';
const headingClassName = 'text-sm font-semibold text-gray-900 dark:text-gray-100';

function BuildKitDesignSection({ harness }: { harness: BrandProjectBuildKitHarness }) {
  return (
    <section id="build-kit-design" className={sectionClassName}>
      <h3 className={headingClassName}>Design</h3>
      <div>
        <EyebrowLabel>Demo surface</EyebrowLabel>
        <div className={cn('mt-1', pbBodySecondaryClassName)}>
          <MarkdownRenderer content={harness.demo.demoSurface} />
        </div>
      </div>
      <div>
        <EyebrowLabel>Frontend</EyebrowLabel>
        <div className={cn('mt-1', pbBodySecondaryClassName)}>
          <MarkdownRenderer content={harness.demo.frontend} />
        </div>
      </div>
      <div>
        <EyebrowLabel>Backend</EyebrowLabel>
        <div className={cn('mt-1', pbBodySecondaryClassName)}>
          <MarkdownRenderer content={harness.demo.backend} />
        </div>
      </div>
      {harness.stack.choices.length > 0 ? (
        <div>
          <EyebrowLabel>Stack</EyebrowLabel>
          <ul className={cn('mt-1 list-disc space-y-1 pl-5', pbBodySecondaryClassName)}>
            {harness.stack.choices.map((choice, index) => (
              <li key={`${choice.layer}-${index}`}>
                {choice.layer}: {choice.choice} — {choice.rationale}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {harness.stack.pulledSkills.length > 0 ? (
        <div>
          <EyebrowLabel>Pulled skills</EyebrowLabel>
          <ul className={cn('mt-1 list-disc space-y-1 pl-5', pbBodySecondaryClassName)}>
            {harness.stack.pulledSkills.map((skill, index) => (
              <li key={`${skill.name}-${index}`}>
                {skill.name} — {skill.why}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {harness.codebaseMap.length > 0 ? (
        <div>
          <EyebrowLabel>Codebase map</EyebrowLabel>
          <ul className={cn('mt-1 list-disc space-y-1 pl-5', pbBodySecondaryClassName)}>
            {harness.codebaseMap.map((entry, index) => (
              <li key={`${entry.path}-${index}`}>
                <code>{entry.path}</code> — {entry.purpose}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function BuildKitWavesSection({ waves }: { waves: BrandProjectBuildKitHarness['waves'] }) {
  const sorted = waves.slice().sort((a, b) => a.order - b.order);

  return (
    <section id="build-kit-waves" className={sectionClassName}>
      <h3 className={headingClassName}>Waves</h3>
      {sorted.map((wave) => {
        const dependsLine =
          wave.dependsOn.length > 0 ? `Depends on ${wave.dependsOn.join(', ')}` : null;
        return (
          <div key={wave.order} className="space-y-1">
            <h4 className={headingClassName}>
              Wave {wave.order}: {wave.name}
            </h4>
            {wave.moduleNames.length > 0 ? (
              <p className={pbMetaClassName}>Modules {wave.moduleNames.join(', ')}</p>
            ) : null}
            {dependsLine ? <p className={pbMetaClassName}>{dependsLine}</p> : null}
            <p className={pbMetaClassName}>Integration point: {wave.integrationPoint}</p>
          </div>
        );
      })}
    </section>
  );
}

export default function BuildKitWorkspace({
  kit,
  isLoading,
  error,
  isGeneratePending,
  onGenerate,
  onRetry,
  onPatch,
  revisePanel,
}: BuildKitWorkspaceProps) {
  const sortedModules = useMemo(
    () => (kit ? kit.modules.slice().sort((a, b) => a.order - b.order) : []),
    [kit]
  );
  const [editor, setEditor] = useState<KitEditor | null>(null);
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const harness = kit?.harness ?? null;
  const editable = Boolean(kit && onPatch);
  const locked = saving || editor !== null;
  const skillsFull = (kit?.cursorSkills.length ?? 0) >= BUILD_KIT_LIMITS.skillCap;
  const proposedModuleOrder = nextModuleOrder(sortedModules);
  const modulesFull =
    sortedModules.length >= BUILD_KIT_LIMITS.moduleCap ||
    proposedModuleOrder > BUILD_KIT_LIMITS.moduleOrderMax;
  const moduleCapReason =
    sortedModules.length >= BUILD_KIT_LIMITS.moduleCap
      ? `${BUILD_KIT_LIMITS.moduleCap} modules is the limit.`
      : `Module order can't go past ${BUILD_KIT_LIMITS.moduleOrderMax}.`;

  const submit = async (operations: BuildKitPatchOperation[]) => {
    if (!onPatch) return;
    setSaving(true);
    try {
      await onPatch(operations);
      setEditor(null);
      setPendingRemove(null);
      setRemoveError(null);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!pendingRemove) return;
    try {
      await submit([removeOperation(pendingRemove)]);
    } catch (caught) {
      setRemoveError(saveErrorMessage(caught));
    }
  };
  const copyAll = useCopyToClipboard('Copy all');
  const copyDesign = useCopyToClipboard('Copy design notes');
  const copyAllLabel = copyAll.copied ? 'Copied' : 'Copy all';
  const copyDesignLabel = copyDesign.copied ? 'Copied' : 'Copy design notes';

  const renderSkillBlock = (skill: BrandProjectBuildKit['cursorSkills'][number], index: number) => {
    const editing = editor?.kind === 'skill' && editor.name === skill.name;
    return (
      <BuildKitCopyBlock
        key={skill.name}
        id={`build-kit-skill-${index}`}
        label={`Skill: ${skill.name}`}
        text={skill.skillMarkdown}
        extraActions={
          editable && !editing ? (
            <ItemActions
              editLabel={`Edit ${skill.name}`}
              removeLabel={`Remove ${skill.name}`}
              disabled={locked}
              onEdit={() => setEditor({ kind: 'skill', name: skill.name })}
              onRemove={() => {
                setRemoveError(null);
                setPendingRemove({ kind: 'skill', name: skill.name });
              }}
            />
          ) : null
        }
        replacement={
          editing ? (
            <BuildKitItemEditor
              mode="edit"
              fieldLabel="Skill prompt"
              initialText={skill.skillMarkdown}
              maxLength={BUILD_KIT_LIMITS.skillMarkdown}
              pending={saving}
              onCancel={() => setEditor(null)}
              onSave={(text) =>
                submit([{ op: 'updateSkill', name: skill.name, skillMarkdown: text }])
              }
            />
          ) : undefined
        }
      />
    );
  };

  const addSkillControl = !editable ? null : editor?.kind === 'addSkill' ? (
    <BuildKitItemEditor
      mode="addSkill"
      pending={saving}
      onCancel={() => setEditor(null)}
      onSave={(input) => submit([{ op: 'addSkill', ...input }])}
    />
  ) : (
    <div className="space-y-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={locked || skillsFull}
        onClick={() => setEditor({ kind: 'addSkill' })}
      >
        Add skill
      </Button>
      {skillsFull ? (
        <p className={pbMetaClassName}>{BUILD_KIT_LIMITS.skillCap} skills is the limit.</p>
      ) : null}
    </div>
  );

  const addModuleControl = !editable ? null : editor?.kind === 'addModule' ? (
    <BuildKitItemEditor
      mode="addModule"
      pending={saving}
      onCancel={() => setEditor(null)}
      onSave={(input) =>
        submit([
          {
            op: 'addModule',
            order: proposedModuleOrder,
            name: input.name,
            goal: input.goal,
            prompt: input.prompt,
          },
        ])
      }
    />
  ) : (
    <div className="space-y-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={locked || modulesFull}
        onClick={() => setEditor({ kind: 'addModule' })}
      >
        Add module
      </Button>
      {modulesFull ? <p className={pbMetaClassName}>{moduleCapReason}</p> : null}
    </div>
  );

  return (
    <section
      id="build-kit"
      className="scroll-mt-24 space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EyebrowLabel as="h2">Build kit</EyebrowLabel>
        {kit ? (
          <div className="flex flex-wrap items-start justify-end gap-2">
            {harness ? (
              <div className="flex flex-col items-end gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void copyDesign.copy(buildKitDesignNotesPlainText(harness))}
                >
                  {copyDesignLabel}
                </Button>
                {copyDesign.failed ? (
                  <p role="alert" className={pbFeedbackTextClassName('danger')}>
                    Couldn&apos;t copy
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-col items-end gap-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void copyAll.copy(buildKitPlainTextAll(kit))}
              >
                {copyAllLabel}
              </Button>
              {copyAll.failed ? (
                <p role="alert" className={pbFeedbackTextClassName('danger')}>
                  Couldn&apos;t copy
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {kit && revisePanel ? revisePanel : null}

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-4 dark:border-red-900/50 dark:bg-red-950/20"
          role="alert"
        >
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          {onRetry ? (
            <Button type="button" variant="secondary" className="mt-3" size="sm" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : isLoading ? (
        <p className={pbFeedbackTextClassName('info')} aria-busy="true">
          Generating prompts…
        </p>
      ) : !kit ? (
        <div className="space-y-3">
          <p className={pbBodySecondaryClassName}>
            Generate a build kit to get setup prompts, Cursor skills, and module prompts.
          </p>
          <Button type="button" onClick={onGenerate} disabled={isGeneratePending}>
            Generate build kit
          </Button>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
          <nav
            aria-label="Build kit contents"
            className="mb-4 lg:mb-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto"
          >
            <ul className="space-y-1 text-sm">
              <li>
                <a href="#build-kit-setup" className={linkAccentClassName}>
                  Setup
                </a>
              </li>
              {harness ? (
                <li>
                  <a href="#build-kit-design" className={linkAccentClassName}>
                    Design
                  </a>
                </li>
              ) : null}
              {harness && harness.waves.length > 0 ? (
                <li>
                  <a href="#build-kit-waves" className={linkAccentClassName}>
                    Waves
                  </a>
                </li>
              ) : null}
              {kit.cursorSkills.length > 0 ? (
                harness ? (
                  <li>
                    <a href="#build-kit-skills" className={linkAccentClassName}>
                      Skills
                    </a>
                    <ul className="mt-1 space-y-1 pl-3">
                      {kit.cursorSkills.map((skill, index) => (
                        <li key={skill.name}>
                          <a href={`#build-kit-skill-${index}`} className={linkAccentClassName}>
                            {skill.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  kit.cursorSkills.map((skill, index) => (
                    <li key={skill.name}>
                      <a href={`#build-kit-skill-${index}`} className={linkAccentClassName}>
                        {skill.name}
                      </a>
                    </li>
                  ))
                )
              ) : null}
              {sortedModules.length > 0
                ? sortedModules.map((mod) => (
                    <li key={mod.order}>
                      <a href={`#build-kit-module-${mod.order}`} className={linkAccentClassName}>
                        Module {mod.order}: {mod.name}
                      </a>
                    </li>
                  ))
                : null}
            </ul>
          </nav>

          <div className="min-w-0 space-y-6">
            <BuildKitCopyBlock id="build-kit-setup" label="Setup prompt" text={kit.setupPrompt} />
            {harness ? <BuildKitDesignSection harness={harness} /> : null}
            {harness && harness.waves.length > 0 ? (
              <BuildKitWavesSection waves={harness.waves} />
            ) : null}
            {kit.cursorSkills.length > 0 ? (
              harness ? (
                <section id="build-kit-skills" className={sectionClassName}>
                  <h3 className={headingClassName}>Skills</h3>
                  {kit.cursorSkills.map((skill, index) => renderSkillBlock(skill, index))}
                </section>
              ) : (
                kit.cursorSkills.map((skill, index) => renderSkillBlock(skill, index))
              )
            ) : null}
            {addSkillControl}
            {sortedModules.map((mod) => {
              const editing = editor?.kind === 'module' && editor.order === mod.order;
              return (
                <BuildKitModuleSection
                  key={mod.order}
                  mod={mod}
                  anchorId={`build-kit-module-${mod.order}`}
                  extraActions={
                    editable && !editing ? (
                      <ItemActions
                        editLabel={`Edit module ${mod.order}: ${mod.name}`}
                        removeLabel={`Remove module ${mod.order}: ${mod.name}`}
                        disabled={locked}
                        onEdit={() => setEditor({ kind: 'module', order: mod.order })}
                        onRemove={() => {
                          setRemoveError(null);
                          setPendingRemove({
                            kind: 'module',
                            order: mod.order,
                            name: mod.name,
                          });
                        }}
                      />
                    ) : null
                  }
                  promptReplacement={
                    editing ? (
                      <BuildKitItemEditor
                        mode="edit"
                        fieldLabel="Module prompt"
                        initialText={mod.prompt}
                        maxLength={BUILD_KIT_LIMITS.modulePrompt}
                        pending={saving}
                        onCancel={() => setEditor(null)}
                        onSave={(text) =>
                          submit([{ op: 'updateModule', order: mod.order, prompt: text }])
                        }
                      />
                    ) : undefined
                  }
                />
              );
            })}
            {addModuleControl}
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={pendingRemove !== null}
        onClose={() => {
          if (saving) return;
          setPendingRemove(null);
          setRemoveError(null);
        }}
        onConfirm={() => void confirmRemove()}
        title={
          pendingRemove?.kind === 'module'
            ? `Remove module ${pendingRemove.order}: ${pendingRemove.name}?`
            : `Remove ${pendingRemove?.name ?? 'this item'}?`
        }
        description="This removes it from the kit."
        confirmLabel="Remove"
        variant="danger"
        isLoading={saving}
      >
        {removeError ? (
          <p role="alert" className={pbFeedbackTextClassName('danger')}>
            {removeError}
          </p>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
