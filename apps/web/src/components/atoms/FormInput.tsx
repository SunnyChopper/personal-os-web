import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Shared admin form control surface (light + dark). */
export const formFieldClassName =
  'rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/25';

export type FormInputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Native text / month / etc. input with consistent theme-aware styling.
 * Month picks up `color-scheme` in dark mode so browser chrome matches better.
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  { className, type, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(formFieldClassName, type === 'month' && 'dark:[color-scheme:dark]', className)}
      {...props}
    />
  );
});
