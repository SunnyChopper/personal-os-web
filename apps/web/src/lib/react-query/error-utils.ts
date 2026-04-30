/**
 * Shared error extraction utilities for React Query hooks
 */

import type { ApiError } from '@/types/api-contracts';

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errorObj = error as { code?: string; error?: { code?: string } };
  const errorCode = errorObj.code || errorObj.error?.code;
  return (
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'ERR_CONNECTION_REFUSED' ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ETIMEDOUT' ||
    errorCode === 'ERR_NETWORK'
  );
}

/**
 * Extracts ApiError from React Query error
 */
export function extractApiError(error: unknown): ApiError | null {
  if (!error) return null;

  // If it's already an ApiError
  if (typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as ApiError;
  }

  // If it's wrapped in an object with error property
  if (typeof error === 'object' && 'error' in error) {
    const wrappedError = (error as { error: unknown }).error;
    if (wrappedError && typeof wrappedError === 'object' && 'code' in wrappedError) {
      return wrappedError as ApiError;
    }
  }

  // If it's an Error object, try to extract network error info from message
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('connection refused') ||
      message.includes('econnrefused') ||
      message.includes('network error') ||
      message.includes('timeout') ||
      message.includes('failed to fetch')
    ) {
      return {
        message: error.message,
        code:
          message.includes('connection refused') || message.includes('econnrefused')
            ? 'ERR_CONNECTION_REFUSED'
            : message.includes('timeout')
              ? 'ETIMEDOUT'
              : 'NETWORK_ERROR',
      };
    }
  }

  return null;
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown, defaultMessage = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return defaultMessage;
}
