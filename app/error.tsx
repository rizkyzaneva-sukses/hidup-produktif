'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-lg font-bold text-white">Terjadi Kesalahan</h1>
        <p className="text-sm text-slate-400">
          {error.message || 'Maaf, terjadi kesalahan yang tidak terduga.'}
        </p>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
