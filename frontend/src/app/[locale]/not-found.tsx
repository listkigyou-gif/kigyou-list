import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 mb-6 font-bold text-2xl">
        404
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
        ページが見つかりませんでした (Page Not Found)
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
        お探しのページは削除されたか、URLが変更された可能性があります。
      </p>
      <Link
        href="/ja"
        className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
      >
        トップページに戻る
      </Link>
    </div>
  );
}
