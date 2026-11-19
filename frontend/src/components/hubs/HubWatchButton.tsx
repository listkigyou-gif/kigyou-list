"use client";

import React from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HubWatchButtonProps {
  corporateNumber: string;
  companyName?: string;
  locale: string;
}

export default function HubWatchButton({
  corporateNumber,
  companyName,
  locale,
}: HubWatchButtonProps) {
  const { isCompanySaved, toggleSaveCompany } = useAuth();
  const isJa = locale === "ja";
  const saved = isCompanySaved(corporateNumber);

  return (
    <button
      type="button"
      onClick={() => toggleSaveCompany(corporateNumber)}
      aria-pressed={saved}
      title={
        isJa
          ? `${companyName || corporateNumber}を無料監視リスト（10社まで無料）に${saved ? "解除" : "追加"}`
          : `${saved ? "Remove" : "Add"} ${companyName || corporateNumber} ${saved ? "from" : "to"} free watchlist (up to 10 companies)`
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors shrink-0 ${
        saved
          ? "border-[#1B4F8A]/40 dark:border-[#60A5FA]/40 bg-[#F0F4F9] dark:bg-[#1B4F8A]/20 text-[#1B4F8A] dark:text-[#93C5FD]"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151B22] text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] hover:text-[#1B4F8A] dark:hover:text-[#60A5FA]"
      }`}
    >
      {saved ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>{isJa ? "監視中" : "Watching"}</span>
        </>
      ) : (
        <>
          <Bell className="w-3.5 h-3.5" />
          <span>{isJa ? "監視に追加" : "Watch"}</span>
        </>
      )}
    </button>
  );
}
