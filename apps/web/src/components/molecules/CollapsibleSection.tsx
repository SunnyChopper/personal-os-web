import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/atoms/Card';
import { cn } from '@/lib/utils';

export type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Optional summary shown on the right side of the header when collapsed. */
  summary?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  summary,
  className,
  headerClassName,
  bodyClassName,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const headingId = `collapsible-section-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <Card className={className}>
      <CardHeader className={cn('py-2.5 sm:py-3', headerClassName)}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
          aria-expanded={isOpen}
          aria-controls={`${headingId}-panel`}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          )}
          <span
            id={headingId}
            className="text-sm font-semibold text-gray-900 dark:text-white flex-1 min-w-0"
          >
            {title}
          </span>
          {!isOpen && summary != null && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[50%]">
              {summary}
            </span>
          )}
        </button>
      </CardHeader>
      {isOpen && (
        <CardBody id={`${headingId}-panel`} className={cn('pt-0', bodyClassName)}>
          {children}
        </CardBody>
      )}
    </Card>
  );
}
