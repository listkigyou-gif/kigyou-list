'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError Boundary Caught]:', error);
  }, [error]);

  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-800 min-h-screen flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center">
          <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4 border border-slate-200 font-mono text-sm font-semibold">
            !
          </div>

          <h1 className="text-base font-bold text-slate-900 mb-2">
            システムエラーが発生しました
          </h1>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            一時的な通信エラーが発生しました。お手数ですが再読み込みをお試しください。
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            再読み込み
          </button>
        </div>
      </body>
    </html>
  );
}
