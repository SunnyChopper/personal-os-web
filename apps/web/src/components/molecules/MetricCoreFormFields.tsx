import { FormInput } from '@/components/atoms/FormInput';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';

export interface MetricCoreFormValues {
  name: string;
  description?: string;
}

export interface MetricCoreFormFieldsProps {
  values: MetricCoreFormValues;
  onChange: <K extends keyof MetricCoreFormValues>(
    field: K,
    value: MetricCoreFormValues[K]
  ) => void;
  disabled?: boolean;
}

export function MetricCoreFormFields({ values, onChange, disabled }: MetricCoreFormFieldsProps) {
  return (
    <div className="space-y-6">
      <FormField label="Name" htmlFor="metric-name" required>
        <FormInput
          id="metric-name"
          type="text"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full"
          required
          disabled={disabled}
        />
      </FormField>
      <FormField label="Description" htmlFor="metric-description">
        <Textarea
          id="metric-description"
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
