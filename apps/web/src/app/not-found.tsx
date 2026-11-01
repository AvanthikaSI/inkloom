'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-panel p-8 max-w-md w-full border border-white/10 rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          404
        </h2>
        <p className="mt-2 text-lg text-slate-200 font-semibold">Page Not Found</p>
        <p className="mt-2 text-sm text-slate-400">
          The requested page or resource could not be found in Inkloom Studio.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block silver-btn px-6 py-2.5 rounded-xl font-medium text-sm transition-all"
        >
          Return to Studio
        </Link>
      </div>
    </div>
  );
}
