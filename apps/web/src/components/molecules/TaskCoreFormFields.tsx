import { FormInput } from '@/components/atoms/FormInput';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';

export interface TaskCoreFormValues {
  title: string;
  description?: string;
}

export interface TaskCoreFormFieldsProps {
  values: TaskCoreFormValues;
  onChange: <K extends keyof TaskCoreFormValues>(field: K, value: TaskCoreFormValues[K]) => void;
  disabled?: boolean;
}

export function TaskCoreFormFields({ values, onChange, disabled }: TaskCoreFormFieldsProps) {
  return (
    <div className="space-y-6">
      <FormField label="Title" htmlFor="task-title" required>
        <FormInput
          id="task-title"
          type="text"
          value={values.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full"
          required
          disabled={disabled}
        />
      </FormField>
      <FormField label="Description" htmlFor="task-description">
        <Textarea
          id="task-description"
          value={values.description || ''}
          onChange={(e) => onChange('description', e.target.value || undefined)}
          rows={3}
          className="w-full"
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}
