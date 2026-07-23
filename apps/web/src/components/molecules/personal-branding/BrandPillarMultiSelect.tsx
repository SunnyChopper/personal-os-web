import { cn } from '@/lib/utils';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';

interface BrandPillarMultiSelectProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  emptyMessage?: string;
}

export default function BrandPillarMultiSelect({
  options,
  value,
  onChange,
  disabled = false,
  ariaLabel = 'Brand pillars',
  className,
  emptyMessage = 'Add pillars in Brand Identity to tag content.',
}: BrandPillarMultiSelectProps) {
  const toggle = (pillar: string) => {
    if (disabled) return;
    onChange(value.includes(pillar) ? value.filter((item) => item !== pillar) : [...value, pillar]);
  };

  if (options.length === 0) {
    return (
      <p className={cn('text-xs text-gray-500 dark:text-gray-400', className)}>{emptyMessage}</p>
    );
  }

  return (
    <div role="group" aria-label={ariaLabel} className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map((pillar) => {
        const selected = value.includes(pillar);
        return (
          <button
            key={pillar}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => toggle(pillar)}
            className={cn(selectableChipClassName(selected), 'text-xs')}
          >
            {pillar}
          </button>
        );
      })}
    </div>
  );
}
