import type { TextareaHTMLAttributes } from 'react';
import { FormInput, formFieldClassName } from '@/components/atoms/FormInput';
import { Textarea } from '@/components/atoms/Textarea';
import { cn } from '@/lib/utils';

/** Shared textarea surface for Personal Branding forms and dialogs. */
export function FormTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Textarea
      className={cn(formFieldClassName, 'min-h-[96px] w-full resize-y', className)}
      {...props}
    />
  );
}

export { FormInput };
