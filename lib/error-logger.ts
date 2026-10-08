/**
 * Error Logger Utility
 *
 * Centralized error logging system for the application.
 * Supports console logging and future integration with external services.
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
  page?: string;
  action?: string;
  component?: string;
  additionalData?: Record<string, any>;
}

export interface LoggedError {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

class ErrorLogger {
  private errors: LoggedError[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  /**
   * Log an error with context
   */
  log(
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = {}
  ): void {
    const loggedError: LoggedError = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      severity,
      context: {
        ...context,
        page: context.page || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      },
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Store in memory
    this.errors.push(loggedError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Console logging
    this.logToConsole(loggedError);

    // Send to external service (if configured)
    if (this.shouldSendToExternalService(severity)) {
      this.sendToExternalService(loggedError);
    }
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(error: LoggedError): void {
    const prefix = `[${error.severity.toUpperCase()}]`;
    const message = `${prefix} ${error.message}`;

    switch (error.severity) {
      case 'critical':
      case 'high':
        console.error(message, {
          stack: error.stack,
          context: error.context,
          timestamp: error.timestamp,
        });
        break;
      case 'medium':
        console.warn(message, {
          context: error.context,
          timestamp: error.timestamp,
        });
        break;
      case 'low':
        console.log(message, {
          context: error.context,
          timestamp: error.timestamp,
        });
        break;
    }
  }

  /**
   * Determine if error should be sent to external service
   */
  private shouldSendToExternalService(severity: ErrorSeverity): boolean {
    // Only send medium+ errors in production
    if (process.env.NODE_ENV !== 'production') {
      return false;
    }

    return severity === 'medium' || severity === 'high' || severity === 'critical';
  }

  /**
   * Send error to external logging service
   * TODO: Integrate with Sentry, LogRocket, or similar service
   */
  private sendToExternalService(error: LoggedError): void {
    // Example Sentry integration:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(new Error(error.message), {
    //     level: this.mapSeverityToSentryLevel(error.severity),
    //     tags: {
    //       page: error.context.page,
    //       component: error.context.component,
    //     },
    //     extra: {
    //       context: error.context,
    //       userAgent: error.userAgent,
    //       url: error.url,
    //     },
    //   });
    // }

    // Example custom API logging:
    // fetch('/api/logs/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(error),
    // }).catch(console.error);

    console.log('[ErrorLogger] Would send to external service:', error.severity);
  }

  /**
   * Get recent errors from memory
   */
  getRecentErrors(count: number = 10): LoggedError[] {
    return this.errors.slice(-count);
  }

  /**
   * Clear error history
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): LoggedError[] {
    return this.errors.filter(error => error.severity === severity);
  }
}

// Singleton instance
const errorLogger = new ErrorLogger();

// Convenience functions
export const logError = (
  error: Error | string,
  severity: ErrorSeverity = 'medium',
  context: ErrorContext = {}
) => {
  errorLogger.log(error, severity, context);
};

export const logCriticalError = (error: Error | string, context: ErrorContext = {}) => {
  errorLogger.log(error, 'critical', context);
};

export const logHighError = (error: Error | string, context: ErrorContext = {}) => {
  errorLogger.log(error, 'high', context);
};

export const logMediumError = (error: Error | string, context: ErrorContext = {}) => {
  errorLogger.log(error, 'medium', context);
};

export const logLowError = (error: Error | string, context: ErrorContext = {}) => {
  errorLogger.log(error, 'low', context);
};

export const getRecentErrors = (count?: number) => {
  return errorLogger.getRecentErrors(count);
};

export const clearErrorLog = () => {
  errorLogger.clear();
};

export default errorLogger;
