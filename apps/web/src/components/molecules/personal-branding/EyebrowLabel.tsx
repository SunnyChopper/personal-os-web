import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { pbEyebrowClassName } from '@/pages/admin/personal-branding/personal-branding-ui';

interface EyebrowLabelProps {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span';
}

export function EyebrowLabel({ children, className, as: Component = 'p' }: EyebrowLabelProps) {
  return <Component className={cn(pbEyebrowClassName, className)}>{children}</Component>;
}
