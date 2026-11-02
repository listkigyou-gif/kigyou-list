'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, ArrowLeft, Search } from 'lucide-react';

interface SearchErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SearchError({ error, reset }: SearchErrorProps) {
  useEffect(() => {
    console.error('[SearchError Boundary Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-[#0D1117] text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-xs text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </div>

        <h1 className="text-base font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          検索結果の取得に時間がかかりました
        </h1>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          500万件超の法人データベースへのアクセスが集中しているか、指定された絞り込み条件の集計処理がタイムアウトした可能性があります。
          再試行するか、検索条件を緩和して再度お試しください。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>もう一度検索する</span>
          </button>

          <Link
            href="/ja/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>条件をリセット</span>
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
