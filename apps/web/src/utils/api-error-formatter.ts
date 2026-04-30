import type { ApiError } from '@/types/api-contracts';

/**
 * Formats API error messages for display to users
 * Handles validation errors with details arrays
 */
export function formatApiError(
  error:
    | {
        code?: string;
        message?: string;
        details?: Array<{ type?: string; loc?: string[]; msg?: string; input?: unknown }>;
      }
    | ApiError
    | undefined
): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // If there are validation details, format them into a user-friendly message
  if (error.details && Array.isArray(error.details) && error.details.length > 0) {
    const detailMessages = error.details
      .map((detail) => {
        // Extract field name from location array (e.g., ["body", "title"] -> "title")
        const field =
          detail.loc && Array.isArray(detail.loc) && detail.loc.length > 0
            ? detail.loc[detail.loc.length - 1]
            : 'field';
        // Capitalize first letter of field name
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        return detail.msg ? `${fieldName}: ${detail.msg}` : `${fieldName} validation failed`;
      })
      .filter(Boolean);

    if (detailMessages.length > 0) {
      const baseMessage = error.message || 'Validation failed';
      return `${baseMessage}. ${detailMessages.join('. ')}`;
    }
  }

  // Fallback to error message or code
  return (
    error.message || (error as ApiError).code || 'An unexpected error occurred. Please try again.'
  );
}

/**
 * Multi-line message for thrown errors / debug UI: includes `code` and full `details`
 * (e.g. Pydantic issue lists from the backend).
 */
export function formatApiFailure(error: ApiError | undefined, fallback: string): string {
  if (!error) return fallback;

  const lines: string[] = [];
  if (error.message?.trim()) {
    lines.push(error.message.trim());
  } else {
    lines.push(fallback);
  }

  if (error.code) {
    lines.push(`Code: ${error.code}`);
  }

  const { details } = error;
  if (details === undefined || details === null) {
    return lines.join('\n');
  }

  if (Array.isArray(details)) {
    lines.push('Details:');
    for (const item of details) {
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const loc = rec.loc;
        const msg = rec.msg;
        const typ = rec.type;
        const locStr = Array.isArray(loc) ? loc.map(String).join('.') : JSON.stringify(loc);
        const parts = [locStr, typeof msg === 'string' ? msg : JSON.stringify(msg)];
        if (typeof typ === 'string') parts.push(`(${typ})`);
        lines.push(`  • ${parts.filter(Boolean).join(' — ')}`);
      } else {
        lines.push(`  • ${String(item)}`);
      }
    }
    return lines.join('\n');
  }

  if (typeof details === 'string') {
    lines.push(`Details: ${details}`);
    return lines.join('\n');
  }

  try {
    lines.push(`Details:\n${JSON.stringify(details, null, 2)}`);
  } catch {
    lines.push(`Details: ${String(details)}`);
  }

  return lines.join('\n');
}
