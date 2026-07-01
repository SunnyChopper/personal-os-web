import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import type { BrandProfile } from '@/types/api/personal-branding.dto';

interface ProfileMultiSelectProps {
  profiles: BrandProfile[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export default function ProfileMultiSelect({
  profiles,
  selectedIds,
  onChange,
  disabled = false,
}: ProfileMultiSelectProps) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (!profiles.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No profiles yet. Create a profile to map this rule.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Select profiles this rule applies to. Leave all unchecked for a universal fallback rule.
      </p>
      <ul className="max-h-40 space-y-2 overflow-y-auto rounded border p-3 dark:border-gray-700">
        {profiles.map((profile) => (
          <li key={profile.id} className="flex items-center gap-2">
            <FormCheckbox
              id={`profile-${profile.id}`}
              checked={selectedIds.includes(profile.id)}
              onChange={() => toggle(profile.id)}
              disabled={disabled}
            />
            <label htmlFor={`profile-${profile.id}`} className="text-sm cursor-pointer">
              {profile.name}
              {profile.status === 'extracting' && (
                <span className="ml-2 text-xs text-amber-600">(extracting)</span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
