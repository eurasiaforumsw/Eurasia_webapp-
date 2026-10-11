'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, Clock, Ban, LogOut } from 'lucide-react';

function SuspendedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const type = searchParams.get('type') || 'permanent';
  const reason = searchParams.get('reason') || 'terms_violation';
  const details = searchParams.get('details');
  const expiresAt = searchParams.get('expiresAt');
  const suspendedAt = searchParams.get('suspendedAt');

  const handleLogout = async () => {
    // Clear member token
    document.cookie = 'member_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Redirect to login
    router.push('/member/login');
  };

  if (!mounted) {
    return null;
  }

  const reasonLabels: Record<string, string> = {
    spam_flooding: 'Spam or Flooding',
    abusive_language: 'Abusive Language',
    harassment: 'Harassment',
    inappropriate_content: 'Inappropriate Content',
    terms_violation: 'Terms of Service Violation',
    other: 'Other Violation',
  };

  const typeLabels: Record<string, string> = {
    temporary_24h: '24-Hour Temporary Suspension',
    temporary_custom: 'Temporary Suspension',
    permanent: 'Permanent Ban',
  };

  const isPermanent = type === 'permanent';
  const isTemporary = type === 'temporary_24h' || type === 'temporary_custom';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05070C] via-[#0A0D12] to-[#0F131C] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Warning Card */}
        <div className="bg-[#161D2B] border border-red-500/20 rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              {isPermanent ? (
                <Ban className="w-10 h-10 text-red-400" />
              ) : (
                <Clock className="w-10 h-10 text-yellow-400" />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2 text-white">
            {typeLabels[type] || 'Account Suspended'}
          </h1>

          {/* Subtitle */}
          <p className="text-center text-gray-400 mb-8">
            Your account access has been restricted
          </p>

          {/* Details Grid */}
          <div className="space-y-4 mb-8">
            {/* Reason */}
            <div className="bg-[#0F131C] rounded-2xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">Reason</p>
                  <p className="text-white font-medium">
                    {reasonLabels[reason] || reason}
                  </p>
                  {details && (
                    <p className="text-sm text-gray-400 mt-2">{details}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Suspended Date */}
            {suspendedAt && (
              <div className="bg-[#0F131C] rounded-2xl p-4 border border-white/5">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Suspended On</p>
                    <p className="text-white font-medium">
                      {new Date(suspendedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Expires Date (for temporary) */}
            {isTemporary && expiresAt && (
              <div className="bg-[#0F131C] rounded-2xl p-4 border border-green-500/10">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Expires On</p>
                    <p className="text-white font-medium">
                      {new Date(expiresAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Permanent Ban Notice */}
            {isPermanent && (
              <div className="bg-red-500/5 rounded-2xl p-4 border border-red-500/20">
                <p className="text-sm text-red-400 text-center">
                  This is a permanent suspension. Please contact the administrator if you believe this is an error.
                </p>
              </div>
            )}

            {/* Temporary Ban Notice */}
            {isTemporary && (
              <div className="bg-yellow-500/5 rounded-2xl p-4 border border-yellow-500/20">
                <p className="text-sm text-yellow-400 text-center">
                  Your access will be automatically restored after the suspension period ends.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0F131C] hover:bg-[#1E2636] text-white rounded-full border border-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>

            <p className="text-center text-xs text-gray-500">
              Need help? Contact{' '}
              <a
                href="mailto:support@eurasiaforum.org"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                support@eurasiaforum.org
              </a>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Eurasia Forum Society of Writers · Member Suspension Notice
        </p>
      </div>
    </div>
  );
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#05070C] via-[#0A0D12] to-[#0F131C] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SuspendedContent />
    </Suspense>
  );
}
