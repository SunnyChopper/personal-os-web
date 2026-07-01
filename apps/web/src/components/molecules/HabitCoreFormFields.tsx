import type { Area, HabitFrequency, HabitType, SubCategory } from '@/types/growth-system';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';
import { AREAS, HABIT_FREQUENCIES, HABIT_TYPES } from '@/constants/growth-system';

export interface HabitCoreFormValues {
  name: string;
  description?: string;
  area: Area;
  subCategory?: SubCategory;
  habitType: HabitType;
  frequency: HabitFrequency;
}

export interface HabitCoreFormFieldsProps {
  values: HabitCoreFormValues;
  onChange: <K extends keyof HabitCoreFormValues>(field: K, value: HabitCoreFormValues[K]) => void;
  disabled?: boolean;
}

export function HabitCoreFormFields({ values, onChange, disabled }: HabitCoreFormFieldsProps) {
  return (
    <div className="space-y-6">
      <FormField label="Name" htmlFor="habit-name" required>
        <FormInput
          id="habit-name"
          type="text"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full"
          required
          disabled={disabled}
        />
      </FormField>

      <FormField label="Description" htmlFor="habit-description">
        <Textarea
          id="habit-description"
          value={values.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          className="w-full"
          disabled={disabled}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Area" htmlFor="habit-area" required>
          <Select
            id="habit-area"
            value={values.area}
            onChange={(e) => onChange('area', e.target.value as Area)}
            className="w-full"
            disabled={disabled}
          >
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Sub-category" htmlFor="habit-subcategory">
          <FormInput
            id="habit-subcategory"
            type="text"
            value={values.subCategory || ''}
            onChange={(e) => onChange('subCategory', (e.target.value || undefined) as SubCategory)}
            className="w-full"
            placeholder="Optional"
            disabled={disabled}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Type" htmlFor="habit-type" required>
          <Select
            id="habit-type"
            value={values.habitType}
            onChange={(e) => onChange('habitType', e.target.value as HabitType)}
            className="w-full"
            disabled={disabled}
          >
            {HABIT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Frequency" htmlFor="habit-frequency" required>
        <Select
          id="habit-frequency"
          value={values.frequency}
          onChange={(e) => onChange('frequency', e.target.value as HabitFrequency)}
          className="w-full"
          disabled={disabled}
        >
          {HABIT_FREQUENCIES.map((freq) => (
            <option key={freq} value={freq}>
              {freq}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  );
}
