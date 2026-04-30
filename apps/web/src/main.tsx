import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { configureAmplify } from './lib/aws-config';
import { AuthProvider } from './contexts/Auth';
import { BackendStatusProvider } from './contexts/BackendStatusContext';
import { logger, queryLogger } from './lib/logger';
import {
  CHATBOT_CACHE_BUSTER,
  chatbotAsyncPersister,
  shouldPersistChatbotQuery,
} from './lib/react-query/chatbot-persist';
import './index.css';
import App from './App.tsx';

// Initialize theme synchronously before React renders
// This ensures the loader respects dark mode immediately
(function initializeTheme() {
  const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
  const theme = storedTheme || 'system';

  let effectiveTheme = theme;

  if (theme === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  if (effectiveTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

configureAmplify();

window.addEventListener('error', (event) => {
  logger.error('Unhandled window error', {
    message: event.message,
    fileName: event.filename,
    lineNumber: event.lineno,
    columnNumber: event.colno,
    error: event.error,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
  });
});

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      queryLogger.error('Query failed', {
        queryKey: query.queryKey,
        error,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      queryLogger.error('Mutation failed', {
        mutationKey: mutation.options.mutationKey,
        error,
      });
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        // Don't retry network errors (connection refused, timeout, etc.)
        // Don't retry 4xx client errors (404, 400, etc.) - these won't succeed on retry
        if (error) {
          // Check for error code in object
          if (typeof error === 'object') {
            const errorObj = error as {
              code?: string;
              error?: { code?: string };
              message?: string;
            };
            const errorCode = errorObj.code || errorObj.error?.code;
            const errorMessage = (errorObj.message || '').toLowerCase();

            // Don't retry network errors
            if (
              errorCode === 'NETWORK_ERROR' ||
              errorCode === 'ERR_CONNECTION_REFUSED' ||
              errorCode === 'ECONNREFUSED' ||
              errorCode === 'ETIMEDOUT' ||
              errorCode === 'ERR_NETWORK' ||
              errorMessage.includes('connection refused') ||
              errorMessage.includes('econnrefused') ||
              errorMessage.includes('network error') ||
              errorMessage.includes('failed to fetch')
            ) {
              return false;
            }

            // Don't retry 4xx client errors (404, 400, 403, etc.)
            if (errorCode && /^HTTP_4\d{2}$/.test(errorCode)) {
              return false;
            }
          }

          // Check for Error object with network-related messages
          if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (
              message.includes('connection refused') ||
              message.includes('econnrefused') ||
              message.includes('network error') ||
              message.includes('failed to fetch') ||
              message.includes('timeout')
            ) {
              return false;
            }
          }

          // Check for AxiosError with 4xx status codes
          if (
            typeof error === 'object' &&
            'response' in error &&
            error.response &&
            typeof error.response === 'object' &&
            'status' in error.response
          ) {
            const status = (error.response as { status: number }).status;
            if (status >= 400 && status < 500) {
              return false; // Don't retry 4xx client errors
            }
          }
        }
        // Retry other errors once
        return failureCount < 1;
      },
      staleTime: 5 * 60 * 1000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: chatbotAsyncPersister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        buster: CHATBOT_CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: shouldPersistChatbotQuery,
        },
      }}
    >
      <BackendStatusProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BackendStatusProvider>
    </PersistQueryClientProvider>
  </StrictMode>
);
