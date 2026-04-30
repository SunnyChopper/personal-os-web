import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const customRules = require(join(__dirname, '../../packages/eslint-config/rules', 'custom-rules.cjs'));

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage', '.husky']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
      'jsx-a11y': jsxA11y,
      unicorn,
      custom: { rules: customRules.rules },
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        // Disable TypeScript resolver - it's causing false positives
        // TypeScript compiler already handles type checking
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // React rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/display-name': 'warn',

      // Import rules - relaxed to reduce false positives
      'import/order': 'off', // Disabled - user preference
      'import/no-unresolved': 'off', // Disabled - TypeScript handles this
      'import/no-unused-modules': 'off', // Too noisy, can be checked separately
      'import/no-duplicates': 'warn', // Changed from error to warning

      // JSX A11y rules
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',

      // Unicorn rules - relaxed
      'unicorn/filename-case': [
        'warn',
        {
          case: 'kebabCase',
          ignore: [/^[A-Z]/, /\.config\.(js|ts)$/],
        },
      ],
      'unicorn/no-array-callback-reference': 'off', // Too strict, sometimes callback refs are clearer
      'unicorn/no-array-for-each': 'off', // Allow forEach for side effects
      'unicorn/no-array-reduce': 'off', // Reduce is sometimes the right tool
      'unicorn/prefer-array-find': 'warn',
      'unicorn/prefer-array-some': 'warn',
      'unicorn/prefer-includes': 'warn',
      'unicorn/prefer-string-starts-ends-with': 'warn',
      'unicorn/prefer-module': 'off', // ESM is used
      'unicorn/prefer-node-protocol': 'off', // Not critical, can be noisy
      'unicorn/prevent-abbreviations': 'off', // Too strict for this project

      // React Hooks rules - override recommended config
      'react-hooks/set-state-in-effect': 'warn', // Changed from error - sometimes necessary

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off', // Too strict
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too strict

      // Custom project rules
      'custom/service-returns-api-response': 'warn',
      'custom/no-inline-styles': 'warn',
      'custom/component-has-state-handling': 'warn',
    },
  },
]);
