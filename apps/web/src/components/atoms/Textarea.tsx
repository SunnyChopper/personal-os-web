import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { formFieldClassName } from '@/components/atoms/FormInput';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Native textarea with consistent theme-aware styling.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(formFieldClassName, 'w-full min-h-[4rem] resize-y', className)}
      {...props}
    />
  );
});
