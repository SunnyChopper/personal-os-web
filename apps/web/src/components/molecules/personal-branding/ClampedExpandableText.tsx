import { useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  pbLineClamp2ExpandableClassName,
  pbLineClamp3ExpandableClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { cn } from '@/lib/utils';

type ClampedExpandableTextProps = {
  lines: 2 | 3;
  as?: 'h3' | 'p';
  className?: string;
  children: ReactNode;
};

const LINE_CLAMP_CLASS: Record<2 | 3, string> = {
  2: pbLineClamp2ExpandableClassName,
  3: pbLineClamp3ExpandableClassName,
};

export function ClampedExpandableText({
  lines,
  as: Component = 'p',
  className,
  children,
}: ClampedExpandableTextProps) {
  const [pinned, setPinned] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setPinned((value) => !value);
  };

  return (
    <Component
      role="button"
      tabIndex={0}
      aria-expanded={pinned}
      onClick={(event) => {
        event.stopPropagation();
        setPinned((value) => !value);
      }}
      onKeyDown={handleKeyDown}
      className={cn('cursor-pointer text-left', !pinned && LINE_CLAMP_CLASS[lines], className)}
    >
      {children}
    </Component>
  );
}
