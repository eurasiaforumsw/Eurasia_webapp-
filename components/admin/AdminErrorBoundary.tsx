'use client';

import React from 'react';
import { AlertTriangle, Home, LogOut } from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary';

interface AdminErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

/**
 * Admin-specific Error Boundary
 *
 * Provides a styled error fallback UI for the admin console.
 * Includes options to return to overview or sign out.
 */
export function AdminErrorBoundary({ children, onReset }: AdminErrorBoundaryProps) {
  const handleSignOut = () => {
    // Clear admin session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin-session');
      window.location.href = '/admin/login';
    }
  };

  const handleReturnHome = () => {
    window.location.href = '/admin';
  };

  const fallback = (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--surface-0, #05070C)',
        color: 'var(--text-primary, #F5F5F5)'
      }}
    >
      <div
        className="max-w-lg w-full p-8 rounded-xl"
        style={{
          backgroundColor: 'var(--surface-2, #0F131C)',
          border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.5))'
        }}
      >
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid var(--color-error, #EF4444)'
            }}
          >
            <AlertTriangle
              size={40}
              style={{ color: 'var(--color-error, #EF4444)' }}
            />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-center mb-3"
          style={{
            fontSize: 'var(--text-3xl, 1.875rem)',
            fontWeight: 'var(--font-bold, 700)',
            color: 'var(--text-primary, #F5F5F5)'
          }}
        >
          Admin Console Error
        </h1>

        {/* Description */}
        <p
          className="text-center mb-8"
          style={{
            fontSize: 'var(--text-base, 1rem)',
            color: 'var(--text-secondary, #D1D1D1)',
            lineHeight: 'var(--leading-relaxed, 1.625)'
          }}
        >
          เกิดข้อผิดพลาดที่ไม่คาดคิดในระบบจัดการ กรุณาลองใหม่อีกครั้ง หรือออกจากระบบแล้วเข้าสู่ระบบใหม่
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Return to Overview */}
          <button
            onClick={handleReturnHome}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-primary, #38BDF8)',
              color: 'var(--text-inverse, #0A0D12)',
              fontSize: 'var(--text-base, 1rem)',
              fontWeight: 'var(--font-semibold, 600)',
              borderRadius: 'var(--radius-lg, 0.5rem)'
            }}
          >
            <Home size={20} />
            กลับหน้าแรก Admin
          </button>

          {/* Try Again */}
          {onReset && (
            <button
              onClick={onReset}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{
                backgroundColor: 'var(--surface-3, #161D2B)',
                color: 'var(--text-primary, #F5F5F5)',
                border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
                fontSize: 'var(--text-base, 1rem)',
                fontWeight: 'var(--font-semibold, 600)',
                borderRadius: 'var(--radius-lg, 0.5rem)'
              }}
            >
              ลองอีกครั้ง
            </button>
          )}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all hover:opacity-90"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-muted, #A8A8A8)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
              fontSize: 'var(--text-sm, 0.875rem)',
              fontWeight: 'var(--font-medium, 500)',
              borderRadius: 'var(--radius-lg, 0.5rem)'
            }}
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <div
            className="mt-6 p-4 rounded-lg text-xs"
            style={{
              backgroundColor: 'var(--surface-1, #0A0D12)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
              fontSize: 'var(--text-xs, 0.75rem)',
              color: 'var(--text-muted, #A8A8A8)'
            }}
          >
            <p className="font-semibold mb-1" style={{ color: 'var(--color-warning, #F59E0B)' }}>
              Development Mode
            </p>
            <p>Check browser console for detailed error information.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error, errorInfo) => {
        // Log admin-specific error
        console.error('[Admin Error]', error, errorInfo);

        // TODO: Send to admin activity log
        // logAdminError({
        //   error: error.message,
        //   stack: error.stack,
        //   componentStack: errorInfo.componentStack,
        //   timestamp: new Date().toISOString()
        // });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
