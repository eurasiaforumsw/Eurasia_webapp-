'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to error logging service (Sentry, LogRocket, etc.)
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundColor: 'var(--surface-0, #05070C)',
            color: 'var(--text-primary, #F5F5F5)'
          }}
        >
          <div
            className="max-w-md w-full text-center p-8 rounded-lg"
            style={{
              backgroundColor: 'var(--surface-2, #0F131C)',
              border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))'
            }}
          >
            <div
              className="mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4"
              style={{
                backgroundColor: 'var(--color-error, #EF4444)',
                opacity: 0.1
              }}
            >
              <AlertTriangle
                size={32}
                style={{ color: 'var(--color-error, #EF4444)' }}
              />
            </div>

            <h1
              className="text-2xl font-bold mb-2"
              style={{
                fontSize: 'var(--text-2xl, 1.5rem)',
                fontWeight: 'var(--font-bold, 700)'
              }}
            >
              เกิดข้อผิดพลาด
            </h1>

            <p
              className="mb-6"
              style={{
                color: 'var(--text-secondary, #D1D1D1)',
                fontSize: 'var(--text-base, 1rem)',
                lineHeight: 'var(--leading-relaxed, 1.625)'
              }}
            >
              เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง หากปัญหายังคงอยู่ กรุณาติดต่อผู้ดูแลระบบ
            </p>

            {/* Show error message in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                className="mb-6 text-left p-4 rounded"
                style={{
                  backgroundColor: 'var(--surface-1, #0A0D12)',
                  fontSize: 'var(--text-sm, 0.875rem)',
                  fontFamily: 'monospace'
                }}
              >
                <summary
                  className="cursor-pointer font-semibold mb-2"
                  style={{ color: 'var(--color-error, #EF4444)' }}
                >
                  Error Details (Development Only)
                </summary>
                <pre
                  className="overflow-auto"
                  style={{
                    color: 'var(--text-muted, #A8A8A8)',
                    fontSize: 'var(--text-xs, 0.75rem)'
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 rounded font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--surface-3, #161D2B)',
                  color: 'var(--text-primary, #F5F5F5)',
                  borderRadius: 'var(--radius-lg, 0.5rem)',
                  fontWeight: 'var(--font-semibold, 600)',
                  border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))'
                }}
              >
                ลองอีกครั้ง
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 rounded font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--accent-primary, #38BDF8)',
                  color: 'var(--text-inverse, #0A0D12)',
                  borderRadius: 'var(--radius-lg, 0.5rem)',
                  fontWeight: 'var(--font-semibold, 600)'
                }}
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary helper
 * For use in functional components that need to trigger error boundary
 */
export function useErrorHandler() {
  const [, setError] = React.useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
