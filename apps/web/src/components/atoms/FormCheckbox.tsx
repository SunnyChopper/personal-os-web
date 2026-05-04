import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const formCheckboxClassName =
  'size-4 shrink-0 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-blue-600 focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-0 dark:focus:ring-blue-400/40';

export type FormCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(function FormCheckbox(
  { className, ...props },
  ref
) {
  return (
    <input ref={ref} type="checkbox" className={cn(formCheckboxClassName, className)} {...props} />
  );
});
