import type { Area } from '@/types/growth-system';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';
import { AREAS, AREA_LABELS } from '@/constants/growth-system';

export interface ProjectCoreFormValues {
  name: string;
  description?: string;
  area: Area;
}

export interface ProjectCoreFormFieldsProps {
  values: ProjectCoreFormValues;
  onChange: <K extends keyof ProjectCoreFormValues>(
    field: K,
    value: ProjectCoreFormValues[K]
  ) => void;
  disabled?: boolean;
}

export function ProjectCoreFormFields({ values, onChange, disabled }: ProjectCoreFormFieldsProps) {
  return (
    <div className="space-y-6">
      <FormField label="Project name" htmlFor="project-name" required>
        <FormInput
          id="project-name"
          type="text"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full"
          required
          disabled={disabled}
        />
      </FormField>
      <FormField label="Description" htmlFor="project-description">
        <Textarea
          id="project-description"
          value={values.description || ''}
          onChange={(e) => onChange('description', e.target.value || undefined)}
          rows={3}
          className="w-full"
          disabled={disabled}
        />
      </FormField>
      <FormField label="Area" htmlFor="project-area" required>
        <Select
          id="project-area"
          value={values.area}
          onChange={(e) => onChange('area', e.target.value as Area)}
          className="w-full"
          disabled={disabled}
        >
          {AREAS.map((area) => (
            <option key={area} value={area}>
              {AREA_LABELS[area]}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  );
}
