"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Plus, Check, Lock } from "lucide-react";

interface CompanyActionsProps {
  corporateNumber: string;
}

export const CompanyActions: React.FC<CompanyActionsProps> = ({ corporateNumber }) => {
  const { isLoggedIn, isCompanySaved, toggleSaveCompany, setAuthModalOpen } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-wrap gap-2.5">
        <button
          disabled
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
        >
          <Plus className="w-3.5 h-3.5" />
          マイリストに保存
        </button>
        <button
          disabled
          className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-white bg-primary/70 rounded-xl"
        >
          連絡先を表示
        </button>
      </div>
    );
  }

  const isSaved = isCompanySaved(corporateNumber);

  return (
    <div className="flex flex-wrap gap-2.5 items-center">
      {/* MyList Save/Remove Button */}
      <button
        onClick={() => {
          if (!isLoggedIn) {
            setAuthModalOpen(true);
          } else {
            toggleSaveCompany(corporateNumber);
          }
        }}
        className={`inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
          isSaved
            ? "bg-amber-100 hover:bg-rose-50 text-amber-800 hover:text-rose-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 border border-amber-200/50 dark:border-amber-900/50"
            : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-[#1C2128] dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800"
        } shadow-sm active:scale-95`}
      >
        {isSaved ? (
          <>
            <Check className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>マイリスト登録済み</span>
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>マイリストに保存</span>
          </>
        )}
      </button>

      {/* View Contact Button */}
      <a
        href="#contact"
        onClick={(e) => {
          if (!isLoggedIn) {
            e.preventDefault();
            setAuthModalOpen(true);
          }
        }}
        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 active:scale-95"
      >
        {!isLoggedIn && <Lock className="w-3.5 h-3.5" />}
        <span>連絡先を表示</span>
      </a>
    </div>
  );
};
