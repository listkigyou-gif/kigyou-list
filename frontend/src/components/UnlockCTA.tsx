"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Unlock } from "lucide-react";
import Link from "next/link";

export const UnlockCTA: React.FC = () => {
  const { isLoggedIn, user, setAuthModalOpen } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isProOrHigher = user && (user.role === 'pro' || user.role === 'business' || user.role === 'enterprise');

  // If already Pro or higher, no need to show any unlock CTA
  if (isLoggedIn && isProOrHigher) return null;

  if (!isLoggedIn) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50 text-center flex flex-col gap-3">
        <span className="text-xs text-amber-800 dark:text-amber-300 font-bold leading-relaxed block">
          🔒 無料アカウントを作成して、
          <br />
          FAX・詳細シグナルを解放！
        </span>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-300 active:scale-[0.98]"
        >
          <Unlock className="w-3.5 h-3.5" />
          無料登録してすべて表示 (10秒)
        </button>
      </div>
    );
  }

  // Logged in but not Pro (i.e. Free/Trial)
  return (
    <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50 text-center flex flex-col gap-3">
      <span className="text-xs text-amber-800 dark:text-amber-300 font-bold leading-relaxed block">
        👑 Proプランにアップグレードして、
        <br />
        メールアドレスと連絡先検索を解放！
      </span>
      <Link
        href="/pricing"
        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-300 active:scale-[0.98]"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Proプランに移行する
      </Link>
    </div>
  );
};
