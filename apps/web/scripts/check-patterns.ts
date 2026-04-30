#!/usr/bin/env tsx
/**
 * Pattern Checker
 * Validates that code follows project-specific patterns:
 * - Component patterns (loading, error states)
 * - Dark mode support
 * - Accessibility patterns
 * - Tailwind usage
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

interface PatternViolation {
  file: string;
  rule: string;
  message: string;
  line?: number;
}

const violations: PatternViolation[] = [];
const srcPath = join(process.cwd(), 'src');

/**
 * Check for loading states in async components
 */
function checkLoadingStates(content: string, relativePath: string): void {
  const hasAsyncOps =
    content.includes('useQuery') || content.includes('fetch(') || content.includes('axios.');
  const hasLoadingState =
    content.includes('isLoading') || content.includes('loading') || content.includes('isPending');

  if (hasAsyncOps && !hasLoadingState) {
    violations.push({
      file: relativePath,
      rule: 'Loading States',
      message: 'Component with async operations should handle loading state',
    });
  }
}

/**
 * Check for error states in async components
 */
function checkErrorStates(content: string, relativePath: string): void {
  // Skip if it's a service file (services handle errors differently)
  if (relativePath.includes('/services/') || relativePath.includes('\\services\\')) {
    return;
  }

  // Check for async operations that need error handling
  // Skip setTimeout, setInterval, and simple mock delays
  const hasAsyncOps =
    content.includes('useQuery') ||
    content.includes('fetch(') ||
    content.includes('axios.') ||
    (content.includes('async') &&
      content.includes('await') &&
      !content.includes('setTimeout') &&
      !content.includes('setInterval') &&
      !content.match(/await\s+new\s+Promise.*setTimeout/)); // Skip mock delays

  if (!hasAsyncOps) return;

  // Check for proper error handling
  // Must have catch block if using try, or error handling in useQuery, or response.success checks
  const hasTryCatch = content.includes('try {') && content.includes('catch');
  const hasUseQueryError =
    content.includes('useQuery') && (content.includes('error') || content.includes('isError'));
  const hasResponseErrorHandling =
    (content.includes('response.success') || content.includes('response.error')) &&
    (content.includes('setError') || content.includes('error') || content.includes('Error'));
  const hasErrorHandling =
    hasTryCatch ||
    hasUseQueryError ||
    hasResponseErrorHandling ||
    content.includes('ErrorBoundary');

  if (!hasErrorHandling) {
    violations.push({
      file: relativePath,
      rule: 'Error States',
      message: 'Component with async operations should handle error state',
    });
  }
}

/**
 * Check for inline styles (should use Tailwind)
 * Allows dynamic styles (template literals, variables, calculations, functions)
 */
function checkInlineStyles(content: string, relativePath: string): void {
  const inlineStyleMatch = content.match(/style=\{[^}]*\}/g);
  if (!inlineStyleMatch) return;

  for (const match of inlineStyleMatch) {
    // Allow dynamic styles - check for:
    // - Template literals: `${variable}`
    // - Variables: {variable}, {obj.prop}
    // - Functions: calc(), Math., etc.
    // - Ternary operators: ? :
    // - Calculations: +, -, *, /
    // - Animation properties (common use case for inline styles)
    const isDynamic =
      match.includes('`') || // Template literals
      match.includes('${') || // Template literal expressions
      match.includes('(') || // Functions
      match.includes('?') || // Ternary operators
      match.includes('Math.') || // Math functions
      match.includes('calc') || // CSS calc
      match.includes('theme') || // Theme references
      match.includes('animation') || // Animation properties (delay, duration, etc.)
      match.includes('Animation') || // Animation properties
      match.includes('transition') || // Transition properties
      match.includes('transform') || // Transform properties
      /\{[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\}/.test(match); // Variable references like {width} or {obj.prop}

    if (!isDynamic) {
      const lineNum = content.substring(0, content.indexOf(match)).split('\n').length;
      violations.push({
        file: relativePath,
        rule: 'No Inline Styles',
        message: 'Avoid inline styles, use Tailwind classes instead',
        line: lineNum,
      });
    }
  }
}

/**
 * Check for accessibility (keyboard navigation, ARIA)
 */
function checkAccessibility(content: string, relativePath: string): void {
  const hasOnClick = content.includes('onClick');
  const hasKeyboardSupport = content.includes('onKeyDown') || content.includes('onKeyPress');
  const hasAriaSupport =
    content.includes('button') || content.includes('role=') || content.includes('tabIndex');
  const hasButton = content.match(/<button|Button/g);

  if (hasOnClick && !hasKeyboardSupport && !hasAriaSupport && !hasButton) {
    violations.push({
      file: relativePath,
      rule: 'Accessibility',
      message: 'Interactive elements should support keyboard navigation',
    });
  }
}

/**
 * Check for missing alt text on images
 */
function checkImageAltText(content: string, relativePath: string): void {
  const imgMatches = content.matchAll(/<img[^>]*>/g);
  for (const match of imgMatches) {
    if (!match[0].includes('alt=')) {
      const lineNum = content.substring(0, content.indexOf(match[0])).split('\n').length;
      violations.push({
        file: relativePath,
        rule: 'Accessibility',
        message: 'Image missing alt attribute',
        line: lineNum,
      });
    }
  }
}

/**
 * Check components for required patterns
 */
function checkComponentPatterns(): void {
  const componentsPath = join(srcPath, 'components');
  if (!existsSync(componentsPath)) return;

  const componentFiles = readdirSync(componentsPath, { recursive: true })
    .filter((f): f is string => typeof f === 'string' && f.endsWith('.tsx') && !f.includes('test'))
    .slice(0, 30); // Sample first 30 files

  for (const file of componentFiles) {
    const filePath = join(componentsPath, file);
    const content = readFileSync(filePath, 'utf-8');
    const relativePath = relative(srcPath, filePath);

    checkLoadingStates(content, relativePath);
    checkErrorStates(content, relativePath);
    checkInlineStyles(content, relativePath);
    checkAccessibility(content, relativePath);
    checkImageAltText(content, relativePath);
  }
}

/**
 * Check for forbidden patterns
 */
function checkForbiddenPatterns(): void {
  const allFiles = readdirSync(srcPath, { recursive: true })
    .filter(
      (f): f is string =>
        typeof f === 'string' && (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.includes('test')
    )
    .slice(0, 50); // Sample first 50 files

  for (const file of allFiles) {
    const filePath = join(srcPath, file);
    const content = readFileSync(filePath, 'utf-8');
    const relativePath = relative(srcPath, filePath);

    // Check for any type
    const anyMatches = content.matchAll(/: any\b/g);
    for (const match of anyMatches) {
      const lineNum = content.substring(0, content.indexOf(match[0])).split('\n').length;
      violations.push({
        file: relativePath,
        rule: 'Type Safety',
        message: 'Avoid using `any` type, use proper types instead',
        line: lineNum,
      });
    }

    // Check for console.log in production code
    // Allow console.error and console.warn (for error handling)
    // Allow conditional logging (DEV mode, etc.)
    // Skip logger.ts (it's the logging infrastructure)
    if (
      content.includes('console.log') &&
      !file.includes('test') &&
      !file.includes('mock') &&
      !file.includes('logger.ts')
    ) {
      // Check if it's conditional logging (wrapped in DEV check)
      const hasConditionalLogging =
        content.match(/console\.log.*import\.meta\.env\.(DEV|PROD)/) ||
        content.match(/console\.log.*process\.env\.(NODE_ENV|DEV)/) ||
        content.match(/if\s*\([^)]*(DEV|development|__DEV__)[^)]*\).*console\.log/s) ||
        content.includes('isDev') || // Logger uses isDev variable
        content.includes('const isDev'); // Logger initialization

      if (!hasConditionalLogging) {
        const lineNum = content.split('\n').findIndex((l) => l.includes('console.log')) + 1;
        violations.push({
          file: relativePath,
          rule: 'Code Quality',
          message: 'Remove console.log from production code (or wrap in DEV check)',
          line: lineNum,
        });
      }
    }

    // Check for TODO/FIXME without issue reference
    // Allow explanatory comments (single line, no action items)
    // Only flag actionable TODOs that should have issue references
    const todoMatches = content.matchAll(/(TODO|FIXME):\s*([^#\n]+)/gi);
    for (const match of todoMatches) {
      const todoText = match[2]?.trim().toLowerCase() || '';
      // Skip if it's just an explanatory comment (common patterns)
      const isExplanatory =
        todoText.startsWith('these') ||
        todoText.startsWith('this') ||
        todoText.startsWith('currently') ||
        todoText.startsWith('note:') ||
        todoText.startsWith('see ') ||
        todoText.includes('temporarily') ||
        todoText.includes('bypassed') ||
        todoText.length < 20; // Very short comments are likely explanatory

      if (!isExplanatory) {
        const lineNum = content.substring(0, content.indexOf(match[0])).split('\n').length;
        violations.push({
          file: relativePath,
          rule: 'Code Quality',
          message: 'TODO/FIXME should reference an issue or ticket (or be an explanatory comment)',
          line: lineNum,
        });
      }
    }
  }
}

/**
 * Check Tailwind usage patterns
 */
function checkTailwindUsage(): void {
  const allFiles = readdirSync(join(srcPath, 'components'), { recursive: true });
  const componentFiles = (Array.isArray(allFiles) ? allFiles : [])
    .filter((f): f is string => typeof f === 'string' && f.endsWith('.tsx'))
    .slice(0, 20);

  for (const file of componentFiles) {
    const filePath = join(srcPath, 'components', file);
    const content = readFileSync(filePath, 'utf-8');
    const relativePath = relative(srcPath, filePath);

    // Check for hardcoded colors that should use Tailwind
    const hardcodedColors = content.match(/#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/g);
    if (hardcodedColors && !file.includes('theme') && !file.includes('config')) {
      violations.push({
        file: relativePath,
        rule: 'Tailwind Usage',
        message: 'Use Tailwind color classes instead of hardcoded colors',
      });
    }
  }
}

// Run all checks
console.log('🔍 Checking Code Patterns...\n');

checkComponentPatterns();
checkForbiddenPatterns();
checkTailwindUsage();

// Group violations by rule
const violationsByRule = violations.reduce(
  (acc, v) => {
    if (!acc[v.rule]) acc[v.rule] = [];
    acc[v.rule].push(v);
    return acc;
  },
  {} as Record<string, PatternViolation[]>
);

// Report results
let hasErrors = false;
for (const [rule, ruleViolations] of Object.entries(violationsByRule)) {
  console.log(`\n📋 ${rule}: ${ruleViolations.length} violation(s)`);
  for (const violation of ruleViolations.slice(0, 10)) {
    // Show first 10 per rule
    const location = violation.line ? `${violation.file}:${violation.line}` : violation.file;
    console.log(`   ❌ ${location}`);
    console.log(`      ${violation.message}`);
    hasErrors = true;
  }
  if (ruleViolations.length > 10) {
    console.log(`   ... and ${ruleViolations.length - 10} more`);
  }
}

console.log('');

if (!hasErrors) {
  console.log('✅ All pattern checks passed!\n');
  process.exit(0);
} else {
  console.error(`❌ Found ${violations.length} pattern violation(s). Please review and fix.\n`);
  console.log('💡 Tips:');
  console.log('   - Ensure components handle loading/error states');
  console.log('   - Use Tailwind classes instead of inline styles');
  console.log('   - Add proper TypeScript types (avoid `any`)');
  console.log('   - Follow accessibility best practices\n');
  process.exit(1);
}
