"use client";

import React from "react";
import { ShieldCheck, Sparkles, ArrowRight, Edit3 } from "lucide-react";

interface CompanyPRSectionProps {
  corporateNumber: string;
  isClaimed: boolean;
  prTitle?: string | null;
  prMessage?: string | null;
  locale: string;
}

export const CompanyPRSection: React.FC<CompanyPRSectionProps> = ({
  corporateNumber,
  isClaimed,
  prTitle,
  prMessage,
  locale,
}) => {
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const handleOpenClaimModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-company-claim-modal"));
    }
  };

  // State 1: When official PR message has been published
  if (prMessage && prMessage.trim()) {
    return (
      <div className="mb-5 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#1C2128]/50 border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {prTitle?.trim() || (isEn ? "Official Company Message" : isVi ? "Thông điệp chính thức từ Doanh nghiệp" : "企業公式メッセージ")}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {isEn ? "Official Company PR" : isVi ? "Doanh nghiệp chính thức" : "企業公式PR"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenClaimModal}
            className="text-[11px] font-medium text-[#1B4F8A] hover:underline dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            title={isEn ? "Edit official PR and info" : isVi ? "Chỉnh sửa thông điệp PR" : "公式PR・企業情報を編集"}
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEn ? "Edit" : isVi ? "Chỉnh sửa" : "編集する"}</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-normal">
          {prMessage}
        </p>
        <div className="mt-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <span>※ {isEn ? "This information is published and managed directly by the company representative." : isVi ? "Thông điệp này được đăng tải và quản trị trực tiếp bởi đại diện chính thức của doanh nghiệp." : "この情報は企業公式担当者によって直接発信・管理されています。"}</span>
        </div>
      </div>
    );
  }

  // State 2: When no PR message exists yet → Show clean, high-trust B2B CTA
  return (
    <div className="mb-5 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-3.5 rounded-xs bg-[#1B4F8A] dark:bg-blue-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {isEn
                ? "For Business Owners: Publish Official Company PR"
                : isVi
                ? "Dành cho đại diện doanh nghiệp: Đăng tải thông điệp PR chính thức"
                : "【企業ご担当者様へ】公式PRメッセージ・事業アピールを掲載しませんか？"}
            </h3>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              FREE
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {isEn
              ? "Claim your profile for free to showcase your core strengths, services, and recruitment messages directly on our 5M+ company database, boosting trust and inquiries."
              : isVi
              ? "Xác thực hồ sơ doanh nghiệp miễn phí để trực tiếp giới thiệu thế mạnh, dịch vụ chủ lực và thông điệp tuyển dụng đến đối tác tiềm năng, giúp tăng uy tín và cơ hội hợp tác."
              : "公式オーナー認証（無料）を行うことで、貴社の強み・主力サービス・採用メッセージを500万社データベース上で直接アピールでき、取引先候補や求職者からの信頼獲得・問い合わせ増加につながります。"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenClaimModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <span>
            {isEn
              ? "Claim & Edit PR (Free) →"
              : isVi
              ? "Đăng PR & Quản trị miễn phí →"
              : "無料でPR・企業情報を掲載する →"}
          </span>
        </button>
      </div>
    </div>
  );
};
