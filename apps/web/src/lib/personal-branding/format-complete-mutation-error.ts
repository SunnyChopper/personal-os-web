import { formatApiError } from '@/utils/api-error-formatter';

export function formatCompleteMutationError(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as { message?: string; code?: string; details?: unknown };
    if (err.code !== undefined || err.details !== undefined) {
      return formatApiError({
        message: err.message,
        code: err.code,
        details: err.details as Array<{ type?: string; loc?: string[]; msg?: string }>,
      });
    }
    if (err.message) return err.message;
  }
  return 'Could not save links.';
}
