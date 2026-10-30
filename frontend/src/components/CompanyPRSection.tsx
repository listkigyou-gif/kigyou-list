"use client";

import React from "react";
import { ShieldCheck, ArrowRight, Edit3, CheckCircle2 } from "lucide-react";

interface CompanyPRSectionProps {
  corporateNumber: string;
  companyName?: string;
  isClaimed: boolean;
  prTitle?: string | null;
  prMessage?: string | null;
  locale: string;
}

export const CompanyPRSection: React.FC<CompanyPRSectionProps> = ({
  corporateNumber,
  companyName = "",
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

  // Case 1: Official PR message has been published
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

  // Case 2: Company is officially verified, but has not set a PR message yet
  if (isClaimed) {
    return (
      <div className="mb-5 p-3.5 sm:p-4 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 mb-2 border-b border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {isEn ? "Official Company PR (Not set yet)" : isVi ? "Thông điệp PR chính thức (Chưa thiết lập)" : "企業公式PR・メッセージ（未設定）"}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              {isEn ? "Verified" : isVi ? "Đã xác minh" : "公式認証済"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenClaimModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-emerald-300 dark:border-emerald-700 rounded-lg shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
            <span>{isEn ? "Set PR Message" : isVi ? "Thiết lập thông điệp PR" : "PRメッセージを設定する"}</span>
            <ArrowRight className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
          </button>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {isEn
            ? "Your company is officially verified. You can publish your company catchcopy and PR message to be displayed at the top of this profile."
            : isVi
            ? "Doanh nghiệp đã được xác minh chính thức. Quý công ty có thể cập nhật thông điệp PR và khẩu hiệu kinh doanh bất cứ lúc nào."
            : "公式オーナー認証が完了しています。事業の強みや主力サービス、最新PRメッセージを設定すると、企業ページ最上部に常時優先掲載されます。"}
        </p>
      </div>
    );
  }

  // Case 3: Company is unclaimed -> Show gentle, refined Japanese B2B Preview & Claim CTA
  return (
    <div className="mb-5 p-3.5 sm:p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850/30 shadow-2xs transition-all">
      {/* Top Header Row with Badge & CTA */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isEn ? "Official Company PR Space" : isVi ? "Khu vực PR chính thức" : "企業公式PR・メッセージ掲載枠"}</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {isEn ? "Page Preview (Sample)" : isVi ? "Xem trước hiển thị (Mô phỏng)" : "ページ掲載時プレビュー（イメージ）"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenClaimModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-300 dark:hover:text-blue-200 bg-white hover:bg-slate-50 dark:bg-[#161B22] dark:hover:bg-slate-800 border border-[#1B4F8A]/35 hover:border-[#1B4F8A] dark:border-blue-500/40 rounded-lg shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          <span>{isEn ? "Verify & Publish PR" : isVi ? "Xác minh & Đăng PR" : "企業認証・公式PRを掲載する"}</span>
          <ArrowRight className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
        </button>
      </div>

      {/* Realistic Preview Mockup Card */}
      <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 mb-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500/80 shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {companyName ? `【公式】${companyName}` : (isEn ? "Official Company Statement" : isVi ? "Thông điệp chính thức từ Doanh nghiệp" : "【公式】企業キャッチコピー・事業紹介")}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
          {isEn
            ? "「(Company business strengths, flagship services, or recruitment messages will be prioritized and displayed here at the top of your corporate profile)」"
            : isVi
            ? "「(Thông điệp giới thiệu năng lực, dịch vụ chủ lực hoặc tin tuyển dụng sẽ được hiển thị ưu tiên tại đây ngay đầu trang hồ sơ công ty)」"
            : "「（ここに貴社独自の強み、主力サービス、取引先・求職者向けPRメッセージ等が企業ページの最上部に常時優先掲載されます）」"}
        </p>
      </div>

      {/* Explanatory subtitle & Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {isEn
            ? "※ Completing official ownership verification enables instant publication of verified badge and PR text (100% Free)."
            : isVi
            ? "※ Hoàn tất xác minh chính chủ doanh nghiệp để nhận huy hiệu chính thức và đăng tải thông điệp PR ngay lập tức (Hoàn toàn miễn phí)."
            : "※ 貴社公式アカウントでオーナー認証（完全無料）を完了すると、「公式認証企業」バッジとPRメッセージが即時掲載されます。"}
        </span>
        <button
          type="button"
          onClick={handleOpenClaimModal}
          className="text-[#1B4F8A] hover:underline dark:text-blue-400 font-semibold inline-flex items-center gap-0.5 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span>{isEn ? "Learn more & verify" : isVi ? "Tìm hiểu thêm & xác minh" : "詳しく見る・認証を申請"}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};