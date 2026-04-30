#!/usr/bin/env tsx
/**
 * Type Coverage Checker
 * Validates TypeScript type coverage using type-coverage
 * Ensures AI-generated code maintains type safety
 */

import { execSync } from 'node:child_process';

const MIN_COVERAGE = 90; // Minimum type coverage percentage

console.log('🔍 Checking TypeScript type coverage...\n');

try {
  // Check if type-coverage is available
  try {
    execSync('npx type-coverage --version', { stdio: 'ignore' });
  } catch {
    console.error(
      '❌ type-coverage not found. Install it with: npm install --save-dev type-coverage'
    );
    process.exit(1);
  }

  // Run type-coverage
  const output = execSync('npx type-coverage --detail', {
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  // Parse coverage percentage
  const match = output.match(/(\d+\.?\d*)%/);
  if (!match) {
    console.error('❌ Could not parse type coverage output');
    console.log(output);
    process.exit(1);
  }

  const coverage = parseFloat(match[1]);

  console.log(`📊 Type Coverage: ${coverage.toFixed(2)}%`);
  console.log(`🎯 Target: ${MIN_COVERAGE}%\n`);

  if (coverage < MIN_COVERAGE) {
    console.error(`❌ Type coverage is below ${MIN_COVERAGE}%`);
    console.error('   Please add type annotations to improve coverage.\n');
    console.log('💡 Common issues:');
    console.log('   - Missing return types on functions');
    console.log('   - Using `any` type');
    console.log('   - Missing type annotations on variables');
    console.log('\n📝 Full report:');
    console.log(output);
    process.exit(1);
  }

  console.log('✅ Type coverage meets requirements!\n');
  process.exit(0);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('❌ Error checking type coverage:', message);
  process.exit(1);
}
