import React, { createContext, useContext } from 'react';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

type ContentWrapper = (props: {
  children: React.ReactNode;
  className?: string;
}) => React.JSX.Element;
type CodeComponent = Components['code'];

// Context to track if we're inside a list item (to avoid wrapping nested lists/paragraphs)
const ListItemContext = createContext<boolean>(false);

/**
 * Create list components (ul, ol, li) for markdown rendering.
 */
export function createListComponents(ContentWrapper: ContentWrapper): {
  ul: Components['ul'];
  ol: Components['ol'];
  li: Components['li'];
} {
  // React components that use hooks must be proper components
  const UlComponent: Components['ul'] = ({ className, children, ...props }) => {
    // Check if this is a task list (contains checkboxes)
    const isTaskList = className?.includes('contains-task-list');
    // Check if we're inside a list item (nested list)
    const isInsideListItem = useContext(ListItemContext);

    const listElement = (
      <ul className={cn(isTaskList ? '' : 'list-disc space-y-2', className)} {...props}>
        {children}
      </ul>
    );

    // Only wrap top-level lists in ContentWrapper, not nested ones
    if (isInsideListItem) {
      return listElement;
    }

    return (
      <ContentWrapper className={cn(isTaskList ? '' : 'list-disc space-y-2', className)}>
        {listElement}
      </ContentWrapper>
    );
  };

  const OlComponent: Components['ol'] = ({ className, children, ...props }) => {
    // Check if we're inside a list item (nested list)
    const isInsideListItem = useContext(ListItemContext);

    const listElement = (
      <ol className={cn('list-decimal space-y-2', className)} {...props}>
        {children}
      </ol>
    );

    // Only wrap top-level lists in ContentWrapper, not nested ones
    if (isInsideListItem) {
      return listElement;
    }

    return (
      <ContentWrapper className={cn('list-decimal space-y-2', className)}>
        {listElement}
      </ContentWrapper>
    );
  };

  return {
    ul: UlComponent,
    ol: OlComponent,
    li({ className, children, ...props }) {
      // Task list items have special styling
      const isTaskListItem = className?.includes('task-list-item');

      return (
        <ListItemContext.Provider value={true}>
          <li className={cn(isTaskListItem ? 'task-list-item' : '', className)} {...props}>
            {children}
          </li>
        </ListItemContext.Provider>
      );
    },
  };
}

/**
 * Create text components (p, strong, em, hr) for markdown rendering.
 */
export function createTextComponents(ContentWrapper: ContentWrapper): {
  p: Components['p'];
  strong: Components['strong'];
  em: Components['em'];
  hr: Components['hr'];
} {
  // React component that uses hooks must be a proper component
  const PComponent: Components['p'] = ({ className, children, ...props }) => {
    // Check if we're inside a list item (don't wrap paragraphs inside list items)
    const isInsideListItem = useContext(ListItemContext);

    const paragraph = (
      <p className={cn('leading-relaxed', className)} {...props}>
        {children}
      </p>
    );

    // Don't wrap paragraphs that are inside list items
    if (isInsideListItem) {
      return paragraph;
    }

    return <ContentWrapper>{paragraph}</ContentWrapper>;
  };

  return {
    p: PComponent,
    strong({ className, children, ...props }) {
      return (
        <strong className={cn('font-bold', className)} {...props}>
          {children}
        </strong>
      );
    },
    em({ className, children, ...props }) {
      return (
        <em className={cn('italic', className)} {...props}>
          {children}
        </em>
      );
    },
    hr({ className, ...props }) {
      return (
        <hr className={cn('my-8 border-gray-300 dark:border-gray-700', className)} {...props} />
      );
    },
  };
}

/**
 * Create table components (table, th, td) for markdown rendering.
 */
export function createTableComponents(ContentWrapper: ContentWrapper): {
  table: Components['table'];
  th: Components['th'];
  td: Components['td'];
} {
  return {
    table({ className, children, ...props }) {
      return (
        <ContentWrapper>
          <div className="overflow-x-auto">
            <table
              className={cn(
                'min-w-full border-collapse border border-gray-300 dark:border-gray-700',
                className
              )}
              {...props}
            >
              {children}
            </table>
          </div>
        </ContentWrapper>
      );
    },
    th({ className, children, ...props }) {
      return (
        <th
          className={cn(
            'border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left',
            className
          )}
          {...props}
        >
          {children}
        </th>
      );
    },
    td({ className, children, ...props }) {
      return (
        <td
          className={cn('border border-gray-300 dark:border-gray-700 px-4 py-2', className)}
          {...props}
        >
          {children}
        </td>
      );
    },
  };
}

/**
 * Create link component for markdown rendering.
 */
export function createLinkComponent(): {
  a: Components['a'];
} {
  return {
    a({ className, href, children, ...props }) {
      return (
        <a
          href={href}
          className={cn('text-blue-600 dark:text-blue-400 hover:underline', className)}
          {...props}
        >
          {children}
        </a>
      );
    },
  };
}

/**
 * Create input component for markdown rendering (primarily for task list checkboxes).
 */
export function createInputComponent(): {
  input: Components['input'];
} {
  return {
    input({ type, checked, disabled, ...props }) {
      if (type === 'checkbox') {
        return <input type="checkbox" checked={checked} disabled={disabled} readOnly {...props} />;
      }
      return <input type={type} {...props} />;
    },
  };
}

/**
 * Create blockquote component for markdown rendering.
 */
export function createBlockquoteComponent(ContentWrapper: ContentWrapper): {
  blockquote: Components['blockquote'];
} {
  return {
    blockquote({ className, children, ...props }) {
      return (
        <ContentWrapper>
          <blockquote
            className={cn('border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic', className)}
            {...props}
          >
            {children}
          </blockquote>
        </ContentWrapper>
      );
    },
  };
}

/**
 * Create default markdown components for ReactMarkdown.
 * Combines all component factories into a single components object.
 */
export function createDefaultMarkdownComponents(
  ContentWrapper: ContentWrapper,
  codeComponent: CodeComponent,
  headingComponents: {
    h1?: Components['h1'];
    h2?: Components['h2'];
    h3?: Components['h3'];
    h4?: Components['h4'];
  }
): Partial<Components> {
  return {
    ...createListComponents(ContentWrapper),
    ...createTextComponents(ContentWrapper),
    ...createTableComponents(ContentWrapper),
    ...createLinkComponent(),
    ...createInputComponent(),
    ...createBlockquoteComponent(ContentWrapper),
    ...headingComponents,
    code: codeComponent,
  };
}
