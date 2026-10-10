'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070C]">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-semibold text-white">Something went wrong</h2>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#38BDF8] text-white rounded-full hover:bg-[#38BDF8]/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
