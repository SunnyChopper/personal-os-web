import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { reportClientError } from '@/lib/client-telemetry';
import { isStaleChunkLoadError, tryReloadOnceForStaleChunk } from '@/lib/stale-chunk-reload';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  /** True while a post-deploy chunk reload is in flight (hide fatal UI). */
  reloadingForStaleChunk: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      reloadingForStaleChunk: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error', {
      error,
      componentStack: errorInfo.componentStack,
    });

    // Post-deploy: open tab still references hashed chunks that 403/404 after release.
    if (tryReloadOnceForStaleChunk(error)) {
      this.setState({ reloadingForStaleChunk: true, error, errorInfo });
      return;
    }

    void reportClientError(
      {
        message: error.message,
        source: 'web',
        stack: error.stack,
        componentStack: errorInfo.componentStack ?? undefined,
        metadata: {
          boundary: 'ErrorBoundary',
          ...(isStaleChunkLoadError(error) ? { kind: 'stale-chunk' } : {}),
        },
      },
      { flush: 'immediate' }
    );

    this.setState({
      error,
      errorInfo,
      reloadingForStaleChunk: false,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      reloadingForStaleChunk: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  copyErrorToClipboard = () => {
    const errorText = `
Error: ${this.state.error?.message}

Stack:
${this.state.error?.stack}

Component Stack:
${this.state.errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error details copied to clipboard!');
    });
  };

  render() {
    if (this.state.reloadingForStaleChunk) {
      return null;
    }

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                <p className="text-gray-600">
                  We encountered an unexpected error. This has been logged and we'll look into it.
                </p>
              </div>
            </div>

            {isDevelopment && this.state.error && (
              <div className="mb-6">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-64 font-mono text-sm">
                  <div className="text-red-400 font-bold mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  <div className="text-gray-300 whitespace-pre-wrap">{this.state.error.stack}</div>
                  {this.state.errorInfo && (
                    <div className="mt-4 text-yellow-400">
                      <div className="font-bold mb-2">Component Stack:</div>
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <RefreshCw size={20} />
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                <RefreshCw size={20} />
                Reload Page
              </button>

              <Link
                to="/"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <Home size={20} />
                Go Home
              </Link>

              {isDevelopment && (
                <button
                  onClick={this.copyErrorToClipboard}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                >
                  <MessageCircle size={20} />
                  Copy Error
                </button>
              )}
            </div>

            {!isDevelopment && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Need help?</strong> If this problem persists, please contact support with
                  a description of what you were doing when the error occurred.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
