import type { Area, SubCategory, TimeHorizon } from '@/types/growth-system';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';
import {
  AREAS,
  AREA_LABELS,
  GOAL_TIME_HORIZONS,
  SUBCATEGORIES_BY_AREA,
  SUBCATEGORY_LABELS,
} from '@/constants/growth-system';

export interface GoalCoreFormValues {
  title: string;
  description?: string;
  area: Area;
  subCategory?: SubCategory;
  timeHorizon: TimeHorizon;
}

export interface GoalCoreFormFieldsProps {
  values: GoalCoreFormValues;
  onChange: <K extends keyof GoalCoreFormValues>(field: K, value: GoalCoreFormValues[K]) => void;
  fieldErrors?: Partial<Record<keyof GoalCoreFormValues, string>>;
  touched?: Partial<Record<keyof GoalCoreFormValues, boolean>>;
  onBlur?: (field: keyof GoalCoreFormValues) => void;
  creatableTimeHorizons?: TimeHorizon[];
  showTimeHorizon?: boolean;
  disabled?: boolean;
}

/**
 * Shared title / description / area / sub-category / time-horizon fields for goal create + edit.
 */
export function GoalCoreFormFields({
  values,
  onChange,
  fieldErrors = {},
  touched = {},
  onBlur,
  creatableTimeHorizons = GOAL_TIME_HORIZONS.filter((h) => h !== 'Daily'),
  showTimeHorizon = true,
  disabled,
}: GoalCoreFormFieldsProps) {
  const availableSubCategories = SUBCATEGORIES_BY_AREA[values.area] || [];

  return (
    <div className="space-y-6">
      <FormField
        label="Title"
        htmlFor="goal-title"
        required
        error={touched.title ? fieldErrors.title : undefined}
      >
        <FormInput
          id="goal-title"
          type="text"
          value={values.title}
          onChange={(e) => onChange('title', e.target.value)}
          onBlur={() => onBlur?.('title')}
          className="w-full"
          placeholder="e.g., Run a marathon"
          required
          disabled={disabled}
          aria-invalid={!!(fieldErrors.title && touched.title)}
        />
      </FormField>

      <FormField label="Description" htmlFor="goal-description">
        <Textarea
          id="goal-description"
          value={values.description || ''}
          onChange={(e) => onChange('description', e.target.value || undefined)}
          rows={3}
          className="w-full"
          placeholder="Describe your goal…"
          disabled={disabled}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Area"
          htmlFor="goal-area"
          required
          error={touched.area ? fieldErrors.area : undefined}
        >
          <Select
            id="goal-area"
            value={values.area}
            onChange={(e) => onChange('area', e.target.value as Area)}
            onBlur={() => onBlur?.('area')}
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

        <FormField label="Sub-category" htmlFor="goal-subcategory">
          <Select
            id="goal-subcategory"
            value={values.subCategory || ''}
            onChange={(e) =>
              onChange('subCategory', (e.target.value || undefined) as SubCategory | undefined)
            }
            className="w-full"
            disabled={disabled || availableSubCategories.length === 0}
          >
            <option value="">None</option>
            {availableSubCategories.map((sub) => (
              <option key={sub} value={sub}>
                {SUBCATEGORY_LABELS[sub]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {showTimeHorizon ? (
        <FormField
          label="Time horizon"
          htmlFor="goal-time-horizon"
          required
          error={touched.timeHorizon ? fieldErrors.timeHorizon : undefined}
        >
          <Select
            id="goal-time-horizon"
            value={values.timeHorizon}
            onChange={(e) => onChange('timeHorizon', e.target.value as TimeHorizon)}
            onBlur={() => onBlur?.('timeHorizon')}
            className="w-full"
            disabled={disabled}
          >
            {creatableTimeHorizons.map((horizon) => (
              <option key={horizon} value={horizon}>
                {horizon}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}
    </div>
  );
}
