import { useState } from 'react';
import type { FocusEvent, TextareaHTMLAttributes } from 'react';
import { Textarea } from '@/components/atoms/Textarea';
import { cn } from '@/lib/utils';

export type ExpandOnFocusTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'rows'
> & {
  /** Row count when expanded (focused or has value). Default 3. */
  expandedRows?: number;
};

/**
 * Textarea that collapses to a single-line height when empty and unfocused.
 * Expands on focus or when the operator has entered content.
 */
export default function ExpandOnFocusTextarea({
  value,
  className,
  expandedRows = 3,
  onFocus,
  onBlur,
  ...props
}: ExpandOnFocusTextareaProps) {
  const [focused, setFocused] = useState(false);
  const textValue = typeof value === 'string' ? value : String(value ?? '');
  const expanded = focused || Boolean(textValue);

  const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <Textarea
      value={value}
      rows={expanded ? expandedRows : 1}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        expanded ? 'min-h-[4rem] resize-y' : 'min-h-0 resize-none overflow-hidden',
        className
      )}
      {...props}
    />
  );
}
