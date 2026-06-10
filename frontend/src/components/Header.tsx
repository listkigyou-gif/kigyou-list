"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutDashboard, Menu, X, User } from "lucide-react";
import { LogoIcon } from "./LogoIcon";

export const Header: React.FC = () => {
  const { isLoggedIn, user, logout, setAuthModalOpen } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);

  const fetchHeaderQuota = useCallback(async () => {
    if (!isLoggedIn || !user?.email) return;
    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setQuotaRemaining(data.quota.remaining);
      }
    } catch (e) {
      console.error("Failed to fetch header quota", e);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      fetchHeaderQuota();
    } else {
      setQuotaRemaining(null);
    }

    const handleQuotaUpdate = () => {
      fetchHeaderQuota();
    };

    window.addEventListener("quotaUpdated", handleQuotaUpdate);
    return () => {
      window.removeEventListener("quotaUpdated", handleQuotaUpdate);
    };
  }, [isLoggedIn, user?.email, fetchHeaderQuota]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-slate-200/80 dark:bg-[#0D1117]/95 dark:border-slate-800/80 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 active:scale-98 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <LogoIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kigyou<span className="text-secondary">-list</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold">
          <Link href="/search" className="text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-secondary transition-colors">
            企業検索
          </Link>
          <Link href="/directory" className="text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-secondary transition-colors">
            企業データ一覧
          </Link>
          <Link href="/pricing" className="text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-secondary transition-colors">
            料金プラン
          </Link>
          {isLoggedIn && (
            <Link href="/dashboard" className="text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-secondary transition-colors flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              ABMダッシュボード
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {!mounted ? (
            <div className="w-32 h-8 bg-slate-100 dark:bg-slate-850 rounded-xl animate-pulse" />
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-5.5 h-5.5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                  {user?.name} 様
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                  user?.role === "pro" 
                    ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50" 
                    : user?.role === "business"
                    ? "bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50"
                    : user?.role === "enterprise"
                    ? "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}>
                  {user?.role ? user.role : "FREE"}
                </span>
                {quotaRemaining !== null && (
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 dark:border-emerald-900/40 px-1.5 py-0.5 rounded ml-1">
                    容量: {quotaRemaining.toLocaleString()}行
                  </span>
                )}
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md shadow-primary/10 transition-all"
              >
                マイページ
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
                title="ログアウト"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-xs font-black text-slate-600 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white transition-colors"
              >
                ログイン
              </button>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all scale-100 hover:scale-[1.02] active:scale-98"
              >
                無料会員登録
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && isLoggedIn && (
            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">
              {user?.role ? user.role.toUpperCase() : "FREE"}
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850"
          >
            {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1117] transition-all py-4 px-6 flex flex-col gap-4 shadow-inner">
          <Link 
            href="/search" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            企業検索
          </Link>
          <Link 
            href="/directory" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            企業データ一覧
          </Link>
          <Link 
            href="/pricing" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            料金プラン
          </Link>
          {isLoggedIn && (
            <Link 
              href="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
            >
              ABMダッシュボード (マイリスト)
            </Link>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            {!mounted ? null : isLoggedIn ? (
              <>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-white block mb-0.5">{user?.name} 様</span>
                  <span>{user?.email}</span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm block"
                >
                  ABMマイページへ
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-slate-850 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  ログイン
                </button>
                <button
                  onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md"
                >
                  無料会員登録
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
