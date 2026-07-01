import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formFieldClassName } from '@/components/atoms/FormInput';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Native select with consistent theme-aware styling and chevron affordance.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(formFieldClassName, 'w-full appearance-none pr-9', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
        aria-hidden
      />
    </div>
  );
});
