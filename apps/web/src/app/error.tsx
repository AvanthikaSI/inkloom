'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Inkloom Studio caught an unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-panel p-8 max-w-md w-full border border-rose-500/20 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold text-rose-400">Application Error</h2>
        <p className="mt-2 text-sm text-slate-300">
          {error?.message || 'An unexpected error occurred while rendering the studio.'}
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 silver-btn px-6 py-2.5 rounded-xl font-medium text-sm transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
