#!/usr/bin/env tsx
/**
 * Master Validation Script
 * Runs all validation checks in sequence
 * Use this for comprehensive validation before commits/PRs
 */

import { execSync } from 'node:child_process';

interface ValidationStep {
  name: string;
  command: string;
  optional?: boolean;
}

const steps: ValidationStep[] = [
  { name: 'Type Check', command: 'npm run type-check' },
  { name: 'Lint', command: 'npm run lint' },
  { name: 'Format Check', command: 'npm run format:check' },
  { name: 'Type Coverage', command: 'npm run check-type-coverage', optional: true },
  { name: 'Architecture Validation', command: 'npm run validate-architecture' },
  { name: 'Pattern Check', command: 'npm run check-patterns' },
  { name: 'Unit Tests', command: 'npm run test', optional: true },
];

const quickSteps: ValidationStep[] = [
  { name: 'Type Check', command: 'npm run type-check' },
  { name: 'Lint', command: 'npm run lint' },
  { name: 'Format Check', command: 'npm run format:check' },
];

const isQuick = process.argv.includes('--quick') || process.argv.includes('-q');
const stepsToRun = isQuick ? quickSteps : steps;

console.log(isQuick ? '⚡ Quick Validation\n' : '🔍 Full Validation\n');
console.log('='.repeat(50) + '\n');

const failedSteps: string[] = [];

for (const step of stepsToRun) {
  try {
    console.log(`⏳ ${step.name}...`);
    execSync(step.command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log(`✅ ${step.name} passed\n`);
  } catch {
    if (step.optional) {
      console.log(`⚠️  ${step.name} failed (optional, continuing...)\n`);
    } else {
      console.error(`❌ ${step.name} failed\n`);
      failedSteps.push(step.name);
    }
  }
}

console.log('='.repeat(50) + '\n');

if (failedSteps.length === 0) {
  console.log('✅ All validations passed!\n');
  process.exit(0);
} else {
  console.error(`❌ Validation failed for: ${failedSteps.join(', ')}\n`);
  console.log('💡 Run individual checks:');
  failedSteps.forEach((step) => {
    const stepConfig = stepsToRun.find((s) => s.name === step);
    if (stepConfig) {
      console.log(`   npm run ${stepConfig.command.split(' ')[2]}`);
    }
  });
  console.log('');
  process.exit(1);
}
