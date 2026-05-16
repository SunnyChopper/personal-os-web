import { PROJECT_TYPE_REGISTRY } from '@/features/projectTypes/built-registry';
import type { ProjectTypeId } from '@/types/growth-system';

interface ProjectTypeSelectProps {
  value: ProjectTypeId;
  onChange: (next: ProjectTypeId) => void;
  disabled?: boolean;
  id?: string;
}

export function ProjectTypeSelect({ value, onChange, disabled, id }: ProjectTypeSelectProps) {
  const options = Object.values(PROJECT_TYPE_REGISTRY);
  return (
    <select
      id={id}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value as ProjectTypeId)}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
    >
      {options.map((d) => (
        <option key={d.id} value={d.id}>
          {d.label}
        </option>
      ))}
    </select>
  );
}
