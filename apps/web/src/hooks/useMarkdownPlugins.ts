import { useEffect, useState } from 'react';
import { loadMathSupport, loadPrism, getPrism } from '@/lib/markdown/plugins';

export interface UseMarkdownPluginsReturn {
  mathLoaded: boolean;
  prismLoaded: boolean;
  Prism: ReturnType<typeof getPrism>;
}

/**
 * Hook to manage loading of optional markdown plugins (math support and Prism syntax highlighting).
 * Loads plugins asynchronously and tracks their loading state.
 */
export function useMarkdownPlugins(content: string): UseMarkdownPluginsReturn {
  const [mathLoaded, setMathLoaded] = useState(false);
  const [prismLoaded, setPrismLoaded] = useState(false);

  useEffect(() => {
    // Load math support
    loadMathSupport().then(() => {
      setMathLoaded(true);
    });

    // Load Prism and highlight code blocks
    loadPrism().then((prism) => {
      if (prism) {
        setPrismLoaded(true);
      }
    });
  }, [content]);

  return {
    mathLoaded,
    prismLoaded,
    Prism: getPrism(),
  };
}
