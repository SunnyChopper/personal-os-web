import { Link } from 'react-router-dom';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

const headingBase =
  '!mt-4 !mb-2 first:!mt-0 font-semibold font-sans tracking-tight text-gray-900 dark:text-gray-100';

const userHeadingBase = '!mt-4 !mb-2 first:!mt-0 font-semibold font-sans tracking-tight text-white';

/**
 * Stable markdown component map for assistant chat bubbles (avoids new object identity each render).
 * Headings/blockquote are plain (no CollapsibleHeading / MarkdownContentWrapper — those are for long-form docs).
 */
export const chatMessageMarkdownComponents: Partial<Components> = {
  h1: ({ children, className }) => (
    <h1 className={cn(headingBase, 'text-xl', className)}>{children}</h1>
  ),
  h2: ({ children, className }) => (
    <h2 className={cn(headingBase, 'text-lg', className)}>{children}</h2>
  ),
  h3: ({ children, className }) => (
    <h3 className={cn(headingBase, 'text-base', className)}>{children}</h3>
  ),
  h4: ({ children, className }) => (
    <h4 className={cn(headingBase, 'text-sm', className)}>{children}</h4>
  ),
  blockquote: ({ children, className }) => (
    <blockquote
      className={cn(
        '!mt-0 !mb-2 border-l-4 border-gray-300 dark:border-gray-600 pl-3 py-0.5 text-gray-700 dark:text-gray-300',
        className
      )}
    >
      {children}
    </blockquote>
  ),
  p: ({ children }) => <p className="!mt-0 !mb-2 last:!mb-0">{children}</p>,
  strong: ({ children, className }) => (
    <strong className={cn('font-semibold text-gray-900 dark:text-gray-100', className)}>
      {children}
    </strong>
  ),
  em: ({ children, className }) => <em className={cn('italic', className)}>{children}</em>,
  ul: ({ children }) => (
    <ul
      className={cn(
        '!mt-0 !mb-2 list-disc list-outside pl-6 space-y-1 [&>li]:list-item',
        '[&_ul]:!mt-1 [&_ul]:!mb-0 [&_ul]:list-[circle] [&_ul]:pl-6',
        '[&_ul_ul]:list-[square]',
        '[&_ul_ul_ul]:list-[disc]'
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      className={cn(
        '!mt-0 !mb-2 list-decimal list-outside pl-6 space-y-1 [&>li]:list-item',
        '[&_ol]:!mt-1 [&_ol]:!mb-0 [&_ol]:list-[lower-alpha] [&_ol]:pl-6',
        '[&_ol_ol]:list-[lower-roman]'
      )}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="list-item leading-relaxed min-h-[1em] [&>p]:!m-0">{children}</li>
  ),
  hr: ({ className, ...props }) => (
    <hr
      className={cn(
        '!my-2 border-0 border-t border-solid border-gray-300 dark:border-gray-500',
        className
      )}
      {...props}
    />
  ),
  a: ({ ...props }) => {
    const href = props.href || '';
    if (href.startsWith('/')) {
      return (
        <Link to={href} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          {props.children}
        </Link>
      );
    }
    return (
      <a
        {...props}
        className="text-blue-600 dark:text-blue-400 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="my-2 w-full max-w-full overflow-x-auto overscroll-x-contain rounded-md border border-gray-200 dark:border-gray-600 touch-pan-x">
      <table className="w-max min-w-full border-collapse border-gray-200 text-left text-xs sm:text-sm dark:border-gray-600">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-100 dark:bg-gray-800/90">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children, className }) => (
    <th
      className={cn(
        'border border-gray-200 px-2 py-1.5 font-semibold text-gray-900 dark:border-gray-600 dark:text-gray-100 sm:px-3 sm:py-2',
        className
      )}
    >
      {children}
    </th>
  ),
  td: ({ children, className }) => (
    <td
      className={cn(
        'border border-gray-200 px-2 py-1.5 text-gray-800 dark:border-gray-600 dark:text-gray-200 sm:px-3 sm:py-2',
        className
      )}
    >
      {children}
    </td>
  ),
};

/** User bubble (blue background): light text and link colors for MarkdownRenderer chat variant. */
export const chatUserMessageMarkdownComponents: Partial<Components> = {
  h1: ({ children, className }) => (
    <h1 className={cn(userHeadingBase, 'text-xl', className)}>{children}</h1>
  ),
  h2: ({ children, className }) => (
    <h2 className={cn(userHeadingBase, 'text-lg', className)}>{children}</h2>
  ),
  h3: ({ children, className }) => (
    <h3 className={cn(userHeadingBase, 'text-base', className)}>{children}</h3>
  ),
  h4: ({ children, className }) => (
    <h4 className={cn(userHeadingBase, 'text-sm', className)}>{children}</h4>
  ),
  blockquote: ({ children, className }) => (
    <blockquote
      className={cn('!mt-0 !mb-2 border-l-4 border-white/40 pl-3 py-0.5 text-white/90', className)}
    >
      {children}
    </blockquote>
  ),
  p: ({ children }) => <p className="!mt-0 !mb-2 last:!mb-0 text-white">{children}</p>,
  strong: ({ children, className }) => (
    <strong className={cn('font-semibold text-white', className)}>{children}</strong>
  ),
  em: ({ children, className }) => (
    <em className={cn('italic text-white/95', className)}>{children}</em>
  ),
  ul: ({ children }) => (
    <ul
      className={cn(
        '!mt-0 !mb-2 list-disc list-outside pl-6 space-y-1 text-white [&>li]:list-item',
        '[&_ul]:!mt-1 [&_ul]:!mb-0 [&_ul]:list-[circle] [&_ul]:pl-6',
        '[&_ul_ul]:list-[square]',
        '[&_ul_ul_ul]:list-[disc]',
        '[&_li]:marker:text-blue-200'
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      className={cn(
        '!mt-0 !mb-2 list-decimal list-outside pl-6 space-y-1 text-white [&>li]:list-item',
        '[&_ol]:!mt-1 [&_ol]:!mb-0 [&_ol]:list-[lower-alpha] [&_ol]:pl-6',
        '[&_ol_ol]:list-[lower-roman]',
        '[&_li]:marker:text-blue-200'
      )}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="list-item leading-relaxed min-h-[1em] text-white [&>p]:!m-0 [&>p]:text-white">
      {children}
    </li>
  ),
  hr: ({ className, ...props }) => (
    <hr
      className={cn('!my-2 border-0 border-t border-solid border-white/45', className)}
      {...props}
    />
  ),
  a: ({ ...props }) => {
    const href = props.href || '';
    if (href.startsWith('/')) {
      return (
        <Link to={href} className="text-blue-100 hover:text-white hover:underline font-medium">
          {props.children}
        </Link>
      );
    }
    return (
      <a
        {...props}
        className="text-blue-100 hover:text-white hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.children}
      </a>
    );
  },
};
