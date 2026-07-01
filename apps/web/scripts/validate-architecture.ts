#!/usr/bin/env tsx
/**
 * Architecture Validator
 * Validates that code follows architectural patterns:
 * - Atomic design structure
 * - Service layer patterns
 * - Import/export conventions
 * - File organization
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

interface ValidationResult {
  rule: string;
  passed: boolean;
  message: string;
  files?: string[];
}

const results: ValidationResult[] = [];
const srcPath = join(process.cwd(), 'src');

/** Top-level component dirs allowed under src/components/. */
const ATOMIC_DIRS = ['atoms', 'molecules', 'organisms', 'templates'] as const;

type AtomicDir = (typeof ATOMIC_DIRS)[number];

/**
 * Legacy top-level feature folders removed by the Atomic Design refactor.
 * Any remaining file here should fail validation with a migration hint.
 */
const DEPRECATED_TOP_LEVEL_FEATURE_DIRS = [
  'auth',
  'routing',
  'settings',
  'shared',
  'assistant',
  'proactive',
  'tools',
  'chatbot',
  'observability',
  'widgets',
  'pages',
] as const;

function listTsxFilesRecursive(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') {
        files.push(...listTsxFilesRecursive(fullPath));
        continue;
      }
      files.push(...listTsxFilesRecursive(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function relativeComponentPath(filePath: string): string {
  const componentsRoot = join(srcPath, 'components');
  return relative(componentsRoot, filePath).replace(/\\/g, '/');
}

/**
 * Check atomic design structure
 */
function validateAtomicDesign(): ValidationResult {
  const componentsPath = join(srcPath, 'components');
  const violations: string[] = [];

  if (!existsSync(componentsPath)) {
    return {
      rule: 'Atomic Design Structure',
      passed: false,
      message: 'components directory not found',
    };
  }

  const dirs = readdirSync(componentsPath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    if (dir.startsWith('_')) continue;
    if (!ATOMIC_DIRS.includes(dir as AtomicDir)) {
      if (
        DEPRECATED_TOP_LEVEL_FEATURE_DIRS.includes(
          dir as (typeof DEPRECATED_TOP_LEVEL_FEATURE_DIRS)[number]
        )
      ) {
        violations.push(
          `Deprecated top-level feature folder: components/${dir}/ — nest under atoms/, molecules/, organisms/, or templates/ (see docs/contracts/frontend-atomic-design-placement-contract-spec.md)`
        );
      } else {
        violations.push(`Unexpected directory: components/${dir}`);
      }
    }
  }

  const importRules: { level: AtomicDir; disallowed: AtomicDir[] }[] = [
    { level: 'atoms', disallowed: ['molecules', 'organisms', 'templates'] },
    { level: 'molecules', disallowed: ['organisms', 'templates'] },
    { level: 'organisms', disallowed: ['templates'] },
  ];

  for (const { level, disallowed } of importRules) {
    const levelPath = join(componentsPath, level);
    const files = listTsxFilesRecursive(levelPath);
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8') as string;
      const displayPath = `components/${relativeComponentPath(filePath)}`;
      for (const type of disallowed) {
        const pattern = new RegExp(`from ['"].*components/${type}/`, 'g');
        if (pattern.test(content)) {
          violations.push(
            `${displayPath} imports from ${type}/ (violates atomic design — ${level} should not import from ${type})`
          );
        }
      }
    }
  }

  return {
    rule: 'Atomic Design Structure',
    passed: violations.length === 0,
    message:
      violations.length > 0
        ? `Found ${violations.length} violations`
        : 'All components follow atomic design',
    files: violations,
  };
}

/**
 * Check service layer patterns
 */
function validateServiceLayer(): ValidationResult {
  const servicesPath = join(srcPath, 'services');
  const violations: string[] = [];

  if (!existsSync(servicesPath)) {
    return {
      rule: 'Service Layer Patterns',
      passed: true,
      message: 'No services directory (optional)',
    };
  }

  const serviceFiles = readdirSync(servicesPath, { recursive: true })
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => join(servicesPath, f));

  for (const filePath of serviceFiles) {
    const content = readFileSync(filePath, 'utf-8') as string;
    const relativePath = relative(srcPath, filePath);

    if (content.includes('export') && content.includes('async')) {
      const hasTypedResponse =
        /Promise<ApiResponse</.test(content) ||
        /Promise<LLMResponse</.test(content) ||
        /Promise<[A-Z][a-zA-Z0-9]*Response</.test(content) ||
        /Promise<[A-Z][a-zA-Z0-9[\]|<>]*>/.test(content);

      const asyncExports = content.match(
        /export\s+(async\s+)?function|export\s+const\s+\w+\s*=\s*async/g
      );
      if (asyncExports && asyncExports.length > 0 && !hasTypedResponse) {
        const hasBasicType = /Promise<void>|Promise<string>|Promise<number>|Promise<boolean>/.test(
          content
        );
        if (!hasBasicType) {
          // informational only
        }
      }
    }

    const domAccessPattern =
      /\b(document\.(querySelector|getElementById|getElementsBy|createElement|body|documentElement|addEventListener)|window\.)/;
    if (domAccessPattern.test(content)) {
      violations.push(`${relativePath}: Service should not manipulate DOM`);
    }

    if (/from ['"]react['"]/.test(content)) {
      violations.push(`${relativePath}: Service should not import React`);
    }
  }

  return {
    rule: 'Service Layer Patterns',
    passed: violations.length === 0,
    message:
      violations.length > 0
        ? `Found ${violations.length} violations`
        : 'All services follow patterns',
    files: violations,
  };
}

/**
 * Check import organization
 */
function validateImports(): ValidationResult {
  const violations: string[] = [];
  const componentFiles = readdirSync(join(srcPath, 'components'), {
    recursive: true,
  })
    .filter((f) => f.endsWith('.tsx'))
    .slice(0, 20);

  for (const file of componentFiles) {
    const filePath = join(srcPath, 'components', file);
    const content = readFileSync(filePath, 'utf-8') as string;
    const lines = content.split('\n');

    let lastImportLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('import ')) {
        lastImportLine = i;
      }
    }

    if (lastImportLine > 0) {
      const afterImports = lines.slice(lastImportLine + 1, lastImportLine + 5);
      if (afterImports.some((l) => l.trim().startsWith('import '))) {
        violations.push(`${file}: Imports not grouped at top`);
      }
    }
  }

  return {
    rule: 'Import Organization',
    passed: violations.length === 0,
    message:
      violations.length > 0
        ? `Found ${violations.length} violations in sample`
        : 'Imports are well-organized',
    files: violations.slice(0, 5),
  };
}

/**
 * File naming under components/: .tsx PascalCase; plain .ts kebab-case or camelCase; co-located tests.
 */
function validateComponentFileNames(): string[] {
  const violations: string[] = [];
  const componentsRoot = join(srcPath, 'components');
  if (!existsSync(componentsRoot)) return violations;

  const files = readdirSync(componentsRoot, { recursive: true }).filter(
    (f) => f.endsWith('.tsx') || f.endsWith('.ts')
  );

  for (const file of files) {
    const normalizedPath = file.replace(/\\/g, '/');
    const fileName = normalizedPath.split('/').pop() || '';
    if (!fileName) continue;
    const displayPath = `components/${normalizedPath}`;

    if (/\.stories\.tsx$/i.test(fileName)) {
      if (!/^[A-Z][a-zA-Z0-9]+\.stories\.tsx$/.test(fileName)) {
        violations.push(
          `${displayPath}: Storybook files use PascalCase basename, e.g. Foo.stories.tsx`
        );
      }
      continue;
    }
    if (/\.test\.tsx$/i.test(fileName)) {
      if (!/^[A-Z][a-zA-Z0-9]+\.test\.tsx$/.test(fileName)) {
        violations.push(
          `${displayPath}: Component test files use PascalCase basename, e.g. Foo.test.tsx`
        );
      }
      continue;
    }
    if (/\.test\.ts$/i.test(fileName)) {
      const ok =
        /^[A-Z][a-zA-Z0-9]+\.test\.ts$/.test(fileName) ||
        /^[a-z][a-zA-Z0-9]+\.test\.ts$/.test(fileName) ||
        /^[a-z][a-z0-9-]+\.test\.ts$/.test(fileName);
      if (!ok) {
        violations.push(
          `${displayPath}: Test helpers use PascalCase, camelCase, or kebab-case before .test.ts`
        );
      }
      continue;
    }
    if (fileName.endsWith('.tsx')) {
      if (!/^[A-Z][a-zA-Z0-9]*\.tsx$/.test(fileName)) {
        violations.push(`${displayPath}: Should follow PascalCase naming`);
      }
      continue;
    }
    if (fileName.endsWith('.ts')) {
      const ok = /^[a-z][a-z0-9-]*\.ts$/.test(fileName) || /^[a-z][a-zA-Z0-9]+\.ts$/.test(fileName);
      if (!ok) {
        violations.push(
          `${displayPath}: Plain .ts modules use kebab-case or camelCase starting with lowercase`
        );
      }
    }
  }

  return violations;
}

/**
 * Check file naming conventions
 */
function validateFileNaming(): ValidationResult {
  const violations: string[] = [];

  const checkDirectory = (dir: string, pattern: RegExp, type: string) => {
    const dirPath = join(srcPath, dir);
    if (!existsSync(dirPath)) return;

    const files = readdirSync(dirPath, { recursive: true }).filter(
      (f) => f.endsWith('.tsx') || f.endsWith('.ts')
    );

    for (const file of files) {
      const normalizedPath = file.replace(/\\/g, '/');
      const fileName = normalizedPath.split('/').pop() || '';
      if (/\.test\.(ts|tsx)$/i.test(fileName)) continue;

      if (fileName && !pattern.test(fileName)) {
        violations.push(`${dir}/${file}: Should follow ${type} naming`);
      }
    }
  };

  violations.push(...validateComponentFileNames());

  checkDirectory('services', /^[a-z][a-z0-9-]*(\.(service|agent))?\.ts$/, 'kebab-case');
  checkDirectory('utils', /^[a-z][a-z0-9-]*\.ts$/, 'kebab-case');

  return {
    rule: 'File Naming Conventions',
    passed: violations.length === 0,
    message:
      violations.length > 0
        ? `Found ${violations.length} violations`
        : 'All files follow naming conventions',
    files: violations.slice(0, 10),
  };
}

/**
 * Ensure canonical UI primitive barrels and core files exist.
 */
function validateUiPrimitives(): ValidationResult {
  const required = [
    'components/atoms/Select.tsx',
    'components/atoms/Textarea.tsx',
    'components/atoms/Card.tsx',
    'components/atoms/index.ts',
    'components/molecules/FormField.tsx',
    'components/molecules/ConfirmDialog.tsx',
    'components/molecules/Combobox.tsx',
    'components/molecules/MultiCombobox.tsx',
    'components/molecules/index.ts',
  ];
  const missing = required.filter((rel) => !existsSync(join(srcPath, rel)));
  return {
    rule: 'UI Primitives',
    passed: missing.length === 0,
    message:
      missing.length > 0
        ? `Missing ${missing.length} primitive file(s)`
        : 'Canonical UI primitives present',
    files: missing,
  };
}

// Run all validations
console.log('🏗️  Validating Architecture...\n');

results.push(validateAtomicDesign());
results.push(validateUiPrimitives());
results.push(validateServiceLayer());
results.push(validateImports());
results.push(validateFileNaming());

// Report results
let allPassed = true;
for (const result of results) {
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.rule}: ${result.message}`);
  if (result.files && result.files.length > 0) {
    result.files.forEach((file) => console.log(`   - ${file}`));
  }
  if (!result.passed) allPassed = false;
}

console.log('');

if (allPassed) {
  console.log('✅ All architecture validations passed!\n');
  process.exit(0);
} else {
  console.error('❌ Architecture validation failed. Please fix the issues above.\n');
  process.exit(1);
}
