import { useId, useState } from 'react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { Textarea } from '@/components/atoms/Textarea';
import {
  pbFeedbackTextClassName,
  pbFormLabelClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';

/** Caps match `BrandProjectBuildKit` / the patch schemas. */
export const BUILD_KIT_LIMITS = {
  skillName: 120,
  skillDescription: 500,
  skillMarkdown: 20000,
  moduleName: 200,
  moduleGoal: 1000,
  modulePrompt: 12000,
  skillCap: 10,
  moduleCap: 20,
  moduleOrderMax: 50,
} as const;

type EditPromptProps = {
  mode: 'edit';
  fieldLabel: string;
  initialText: string;
  maxLength: number;
  pending: boolean;
  onCancel: () => void;
  onSave: (text: string) => Promise<void>;
};

type AddSkillProps = {
  mode: 'addSkill';
  pending: boolean;
  onCancel: () => void;
  onSave: (input: { name: string; description: string; skillMarkdown: string }) => Promise<void>;
};

type AddModuleProps = {
  mode: 'addModule';
  pending: boolean;
  onCancel: () => void;
  onSave: (input: { name: string; goal: string; prompt: string }) => Promise<void>;
};

export type BuildKitItemEditorProps = EditPromptProps | AddSkillProps | AddModuleProps;

function saveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Could not save this change.';
}

function EditorError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className={pbFeedbackTextClassName('danger')}>
      {message}
    </p>
  );
}

function EditPromptForm({
  fieldLabel,
  initialText,
  maxLength,
  pending,
  onCancel,
  onSave,
}: EditPromptProps) {
  const fieldId = useId();
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    try {
      await onSave(text);
    } catch (caught) {
      setError(saveErrorMessage(caught));
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className={pbFormLabelClassName}>
        {fieldLabel}
      </label>
      <Textarea
        id={fieldId}
        value={text}
        maxLength={maxLength}
        onChange={(event) => setText(event.target.value)}
        disabled={pending}
        className="min-h-40 font-mono text-xs"
      />
      <EditorError message={error} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void save()}
          disabled={pending || text === initialText}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AddSkillForm({ pending, onCancel, onSave }: AddSkillProps) {
  const nameId = useId();
  const descriptionId = useId();
  const promptId = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skillMarkdown, setSkillMarkdown] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canSave =
    name.trim().length > 0 && description.trim().length > 0 && skillMarkdown.trim().length > 0;

  const save = async () => {
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        skillMarkdown,
      });
    } catch (caught) {
      setError(saveErrorMessage(caught));
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="space-y-1">
        <label htmlFor={nameId} className={pbFormLabelClassName}>
          Name
        </label>
        <FormInput
          id={nameId}
          value={name}
          maxLength={BUILD_KIT_LIMITS.skillName}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={descriptionId} className={pbFormLabelClassName}>
          Description
        </label>
        <FormInput
          id={descriptionId}
          value={description}
          maxLength={BUILD_KIT_LIMITS.skillDescription}
          onChange={(event) => setDescription(event.target.value)}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={promptId} className={pbFormLabelClassName}>
          Skill prompt
        </label>
        <Textarea
          id={promptId}
          value={skillMarkdown}
          maxLength={BUILD_KIT_LIMITS.skillMarkdown}
          onChange={(event) => setSkillMarkdown(event.target.value)}
          disabled={pending}
          className="min-h-40 font-mono text-xs"
        />
      </div>
      <EditorError message={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void save()} disabled={pending || !canSave}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AddModuleForm({ pending, onCancel, onSave }: AddModuleProps) {
  const nameId = useId();
  const goalId = useId();
  const promptId = useId();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canSave = name.trim().length > 0 && goal.trim().length > 0 && prompt.trim().length > 0;

  const save = async () => {
    setError(null);
    try {
      await onSave({ name: name.trim(), goal: goal.trim(), prompt });
    } catch (caught) {
      setError(saveErrorMessage(caught));
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="space-y-1">
        <label htmlFor={nameId} className={pbFormLabelClassName}>
          Name
        </label>
        <FormInput
          id={nameId}
          value={name}
          maxLength={BUILD_KIT_LIMITS.moduleName}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={goalId} className={pbFormLabelClassName}>
          Goal
        </label>
        <Textarea
          id={goalId}
          value={goal}
          maxLength={BUILD_KIT_LIMITS.moduleGoal}
          onChange={(event) => setGoal(event.target.value)}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={promptId} className={pbFormLabelClassName}>
          Module prompt
        </label>
        <Textarea
          id={promptId}
          value={prompt}
          maxLength={BUILD_KIT_LIMITS.modulePrompt}
          onChange={(event) => setPrompt(event.target.value)}
          disabled={pending}
          className="min-h-40 font-mono text-xs"
        />
      </div>
      <EditorError message={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void save()} disabled={pending || !canSave}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function BuildKitItemEditor(props: BuildKitItemEditorProps) {
  switch (props.mode) {
    case 'edit':
      return <EditPromptForm {...props} />;
    case 'addSkill':
      return <AddSkillForm {...props} />;
    case 'addModule':
      return <AddModuleForm {...props} />;
    default: {
      const _exhaustive: never = props;
      return _exhaustive;
    }
  }
}
