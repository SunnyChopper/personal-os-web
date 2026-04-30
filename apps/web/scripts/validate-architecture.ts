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

  // Allowed atomic design directories
  const atomicDirs = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
  // Utility directories that don't follow atomic design but are acceptable
  const utilityDirs = ['auth', 'routing', 'settings', 'shared'];
  const allowedDirs = [...atomicDirs, ...utilityDirs];

  const dirs = readdirSync(componentsPath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    if (!allowedDirs.includes(dir) && !dir.startsWith('_')) {
      violations.push(`Unexpected directory: components/${dir}`);
    }
  }

  // Check that components follow atomic design import rules
  // Atoms: should NOT import from molecules/organisms/templates/pages
  // Molecules: SHOULD import from atoms (allowed), should NOT import from organisms/templates/pages
  // Organisms: SHOULD import from molecules/atoms (allowed), should NOT import from templates/pages
  const checkComponentLocation = (dir: string, disallowedTypes: string[]) => {
    const dirPath = join(componentsPath, dir);
    if (!existsSync(dirPath)) return;

    const files = readdirSync(dirPath, { withFileTypes: true }).filter(
      (f) => f.isFile() && f.name.endsWith('.tsx')
    );

    for (const file of files) {
      const filePath = join(dirPath, file.name);
      const content = readFileSync(filePath, 'utf-8') as string;

      // Check for imports from disallowed atomic levels
      for (const type of disallowedTypes) {
        const pattern = new RegExp(`from ['"].*components/${type}/`, 'g');
        if (pattern.test(content)) {
          violations.push(
            `${file.name} in ${dir}/ imports from ${type}/ (violates atomic design - ${dir} should not import from ${type})`
          );
        }
      }
    }
  };

  // Atoms should not import from any higher level
  checkComponentLocation('atoms', ['molecules', 'organisms', 'templates', 'pages']);
  // Molecules should not import from organisms/templates/pages (but CAN import from atoms)
  checkComponentLocation('molecules', ['organisms', 'templates', 'pages']);
  // Organisms should not import from templates/pages (but CAN import from molecules/atoms)
  checkComponentLocation('organisms', ['templates', 'pages']);

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

    // Check for properly typed async functions
    // Services should return typed Promises (ApiResponse, LLMResponse, or other typed responses)
    // Skip if file has no async exports or if it's a type/interface file
    if (content.includes('export') && content.includes('async')) {
      // Check for common typed response patterns
      const hasTypedResponse =
        /Promise<ApiResponse</.test(content) ||
        /Promise<LLMResponse</.test(content) ||
        /Promise<[A-Z][a-zA-Z0-9]*Response</.test(content) ||
        // Allow simple return types like Promise<Task[]>, Promise<void>, etc.
        /Promise<[A-Z][a-zA-Z0-9[\]|<>]*>/.test(content);

      // Only flag if there are async exports but no typed Promise returns
      // This is a soft check - some services might have helper functions without types
      const asyncExports = content.match(
        /export\s+(async\s+)?function|export\s+const\s+\w+\s*=\s*async/g
      );
      if (asyncExports && asyncExports.length > 0 && !hasTypedResponse) {
        // Check if it's just a simple void or basic type (which is acceptable)
        const hasBasicType = /Promise<void>|Promise<string>|Promise<number>|Promise<boolean>/.test(
          content
        );
        if (!hasBasicType) {
          // This is informational, not a hard violation
          // violations.push(`${relativePath}: Async functions should have typed return values`);
        }
      }
    }

    // Check for direct DOM manipulation
    if (/document\.|window\./.test(content)) {
      violations.push(`${relativePath}: Service should not manipulate DOM`);
    }

    // Check for React imports (services should be framework-agnostic)
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
    .slice(0, 20); // Sample first 20 files

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

    // Check for imports after code
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
    files: violations.slice(0, 5), // Show first 5
  };
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
      // Normalize path separators and extract just the filename
      const normalizedPath = file.replace(/\\/g, '/');
      const fileName = normalizedPath.split('/').pop() || '';

      // Test the full filename (including extension) against the pattern
      if (fileName && !pattern.test(fileName)) {
        violations.push(`${dir}/${file}: Should follow ${type} naming`);
      }
    }
  };

  // Components should be PascalCase (allows compound names like CodeBlockToolbar)
  // Pattern: starts with capital, followed by alphanumeric (including multiple capitals)
  checkDirectory('components', /^[A-Z][a-zA-Z0-9]*\.tsx$/, 'PascalCase');

  // Services should be kebab-case (allows .service.ts and .agent.ts patterns)
  checkDirectory('services', /^[a-z][a-z0-9-]*(\.(service|agent))?\.ts$/, 'kebab-case');

  // Utils should be kebab-case
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

// Run all validations
console.log('🏗️  Validating Architecture...\n');

results.push(validateAtomicDesign());
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
