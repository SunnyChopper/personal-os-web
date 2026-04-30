// Dynamic imports for optional dependencies
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let remarkMath: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rehypeKatex: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Prism: any = null;

export const loadMathSupport = async () => {
  if (typeof window !== 'undefined') {
    try {
      if (!remarkMath) {
        remarkMath = (await import('remark-math')).default;
      }
      if (!rehypeKatex) {
        rehypeKatex = (await import('rehype-katex')).default;
        // Import KaTeX CSS
        await import('katex/dist/katex.min.css');
      }
    } catch {
      // Math support not available - packages need to be installed
      // Install with: npm install remark-math rehype-katex katex
    }
  }
  return { remarkMath, rehypeKatex };
};

export const loadPrism = async () => {
  if (typeof window !== 'undefined' && !Prism) {
    try {
      const prism = await import('prismjs');
      Prism = prism.default;

      // Import Prism CSS (will use custom dark mode styles from index.css)
      await import('prismjs/themes/prism-tomorrow.css');

      // Load common language support
      const languages = [
        'javascript',
        'typescript',
        'python',
        'java',
        'cpp',
        'c',
        'csharp',
        'go',
        'rust',
        'php',
        'ruby',
        'swift',
        'kotlin',
        'sql',
        'bash',
        'json',
        'yaml',
        'markdown',
        'css',
        'html',
        'jsx',
        'tsx',
      ];

      for (const lang of languages) {
        try {
          await import(/* @vite-ignore */ `prismjs/components/prism-${lang}`);
        } catch {
          // Language not available, skip
        }
      }
    } catch {
      // Syntax highlighting not available - packages need to be installed
      // Install with: npm install prismjs @types/prismjs
    }
  }
  return Prism;
};

// Export Prism instance for use in components
export const getPrism = () => Prism;

// Export math plugins for use in ReactMarkdown
export const getRemarkMath = () => remarkMath;
export const getRehypeKatex = () => rehypeKatex;
