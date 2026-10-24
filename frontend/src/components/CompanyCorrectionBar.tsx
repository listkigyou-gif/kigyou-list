"use client";

import React from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface CompanyCorrectionBarProps {
  corporateNumber: string;
  companyName: string;
}

export const CompanyCorrectionBar: React.FC<CompanyCorrectionBarProps> = ({
  corporateNumber,
  companyName
}) => {
  const { locale } = useLanguage();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const handleOpenPortal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-company-claim-modal"));
    }
  };

  return (
    <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-1.5 text-[11px]">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          {isJa 
            ? "掲載情報の修正・公式認証、または掲載停止の申請はこちら" 
            : isVi 
            ? "Chỉnh sửa thông tin, xác thực chính chủ hoặc yêu cầu gỡ bỏ thông tin" 
            : "Request information correction, official certification, or delisting"}
        </span>
      </div>

      <button
        type="button"
        onClick={handleOpenPortal}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1B4F8A] hover:underline dark:text-blue-400 cursor-pointer shrink-0"
      >
        <span>{isJa ? "情報修正・管理センターを開く" : isVi ? "Mở Trung tâm Quản lý & Sửa đổi" : "Open Management Portal"}</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};
