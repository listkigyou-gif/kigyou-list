'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, ArrowLeft } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected runtime errors for observability
    console.error('[LocaleError Boundary Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-[#0D1117] text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-xs text-center">
        {/* Subtle status indicator */}
        <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-4 font-mono text-sm font-semibold border border-slate-200 dark:border-slate-700">
          !
        </div>

        <h1 className="text-base font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          ページの読み込み中にエラーが発生しました
        </h1>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          アクセスが集中しているか、一時的な通信遅延が発生した可能性があります。
          再読み込みをお試しいただくか、時間をおいて再度アクセスしてください。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>再読み込みする</span>
          </button>

          <Link
            href="/ja"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>トップへ戻る</span>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
