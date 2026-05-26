import React from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 dark:bg-[#0D1117] dark:border-slate-800 py-10 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Kigyou<span className="text-secondary">-list</span></span>
        </Link>

        <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold">
          <Link href="/directory" className="hover:text-primary dark:hover:text-secondary transition-colors">企業データ一覧</Link>
          <Link href="/pricing" className="hover:text-primary dark:hover:text-secondary transition-colors">料金プラン</Link>
          <Link href="/terms" className="hover:text-primary dark:hover:text-secondary transition-colors">利用規約</Link>
          <Link href="/privacy" className="hover:text-primary dark:hover:text-secondary transition-colors">プライバシーポリシー</Link>
          <Link href="/contact" className="hover:text-primary dark:hover:text-secondary transition-colors">お問い合わせ</Link>
        </div>

        <div className="text-[11px]">
          &copy; {new Date().getFullYear()} Kigyou-list. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
