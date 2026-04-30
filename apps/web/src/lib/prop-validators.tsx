/**
 * Runtime prop validation utilities for React components
 * Uses Zod schemas to validate component props in development mode
 */

import React from 'react';
import { z } from 'zod';

/**
 * Validates component props against a Zod schema
 * Only runs in development mode to avoid performance impact in production
 */
export function validateProps<T>(props: unknown, schema: z.ZodSchema<T>, componentName: string): T {
  if (import.meta.env.DEV) {
    const result = schema.safeParse(props);
    if (!result.success) {
      const errorMessage = `[${componentName}] Prop validation failed: ${result.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')}`;
      console.error(errorMessage, {
        errors: result.error.issues,
        props,
      });
      throw new Error(errorMessage);
    }
    return result.data;
  }
  return props as T;
}

/**
 * Creates a prop validator hook for React components
 * Usage:
 * ```tsx
 * const MyComponent = (props: MyComponentProps) => {
 *   usePropValidation(props, MyComponentPropsSchema, 'MyComponent');
 *   // ... component logic
 * }
 * ```
 */
export function usePropValidation<T>(
  props: unknown,
  schema: z.ZodSchema<T>,
  componentName: string
): void {
  if (import.meta.env.DEV) {
    validateProps(props, schema, componentName);
  }
}

/**
 * Higher-order component that validates props
 * Usage:
 * ```tsx
 * const ValidatedComponent = withPropValidation(
 *   MyComponent,
 *   MyComponentPropsSchema,
 *   'MyComponent'
 * );
 * ```
 */
export function withPropValidation<P extends object>(
  Component: React.ComponentType<P>,
  schema: z.ZodSchema<P>,
  componentName: string
): React.ComponentType<P> {
  return function ValidatedComponent(props: P) {
    if (import.meta.env.DEV) {
      validateProps(props, schema, componentName);
    }
    return <Component {...props} />;
  };
}
