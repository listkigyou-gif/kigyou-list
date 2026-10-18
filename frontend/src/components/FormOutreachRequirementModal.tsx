"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Crown, 
  Filter, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Send
} from "lucide-react";

export type OutreachRequirementType = "PRO_REQUIRED" | "CONTACT_FORM_REQUIRED";

interface FormOutreachRequirementModalProps {
  isOpen: boolean;
  type: OutreachRequirementType | null;
  onClose: () => void;
  onApplyContactFilterAndProceed: () => void;
}

export const FormOutreachRequirementModal: React.FC<FormOutreachRequirementModalProps> = ({
  isOpen,
  type,
  onClose,
  onApplyContactFilterAndProceed,
}) => {
  const { locale } = useLanguage();
  const { isLoggedIn, setAuthModalOpen } = useAuth();
  const router = useRouter();

  if (!isOpen || !type) return null;

  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const handleUpgradeClick = () => {
    onClose();
    if (!isLoggedIn) {
      setAuthModalOpen(true);
    } else {
      router.push(`/${locale}/pricing`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl max-w-lg w-full relative animate-in zoom-in-95 duration-150 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {type === "PRO_REQUIRED" ? (
          <div>
            {/* Top Icon Badge - B2B Washoku Amber */}
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center mb-4">
              <Crown className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>

            {/* Status Badge Tag */}
            <div className="mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>{isJa ? "Proプラン以上限定機能" : isVi ? "Tính năng dành riêng cho gói PRO trở lên" : "PRO Plan Feature"}</span>
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2.5 [font-feature-settings:'palt']">
              {isJa 
                ? "フォーム営業のご利用にはProプランが必要です" 
                : isVi 
                ? "Cần nâng cấp gói PRO để dùng tính năng gửi Form tự động" 
                : "PRO Plan Required for Automated Form Outreach"}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-350 leading-relaxed mb-4 [font-feature-settings:'palt']">
              {isJa ? (
                <>
                  「この条件でフォーム営業（自動配信）」をご利用いただくには、
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">Proプラン以上</strong>
                  のご契約と、左側メニュー
                  <strong className="text-[#1B4F8A] dark:text-blue-400 font-semibold">「連絡先情報の有無 ＞ お問い合わせフォーム」</strong>
                  の絞り込みが必要です。
                </>
              ) : isVi ? (
                <>
                  Để sử dụng tính năng gửi Form tự động theo điều kiện tìm kiếm, tài khoản của bạn cần có gói 
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold"> PRO trở lên</strong>. 
                  Gói PRO sẽ mở khóa bộ lọc 
                  <strong className="text-[#1B4F8A] dark:text-blue-400 font-semibold">「Kênh liên lạc có sẵn ＞ Biểu mẫu liên hệ」</strong> 
                  nhằm trích xuất chính xác các doanh nghiệp có form gửi hợp lệ.
                </>
              ) : (
                <>
                  Automated Form Outreach requires a 
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold"> PRO plan or higher</strong>. 
                  Upgrading unlocks the 
                  <strong className="text-[#1B4F8A] dark:text-blue-400 font-semibold">「Contact Presence ＞ Contact Form」</strong> 
                  filter to precisely target companies with verifiable outreach forms.
                </>
              )}
            </p>

            {/* Benefits highlights */}
            <div className="bg-slate-50/80 dark:bg-[#0D1117] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 mb-5 flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed [font-feature-settings:'palt']">
                  {isJa 
                    ? "「連絡先情報の有無」（フォーム・メール・電話）の全絞り込みを即時アンロック" 
                    : isVi 
                    ? "Mở khóa toàn bộ bộ lọc liên lạc (Form, Email, SĐT, Fax) độc quyền" 
                    : "Instant unlock for all Contact Presence filters (Form, Email, Phone, Fax)"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed [font-feature-settings:'palt']">
                  {isJa 
                    ? "フォーム実在企業のみを抽出し、無駄打ちのない高反響アプローチが可能" 
                    : isVi 
                    ? "Đảm bảo 100% doanh nghiệp có Form liên hệ thật, tối đa tỷ lệ phản hồi" 
                    : "Guarantees 100% verified inquiry forms for maximum response rates"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed [font-feature-settings:'palt']">
                  {isJa 
                    ? "特定商取引法遵守の1クリック配信停止リンク自動付与・送信ログCSV納品対応" 
                    : isVi 
                    ? "Tự động chèn link hủy nhận tin chuẩn Tokushōhō & xuất file CSV kết quả minh bạch" 
                    : "Automatic 1-click Tokushōhō opt-out footer & verifiable delivery CSV logs"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleUpgradeClick}
                className="flex-1 h-10 px-4 rounded-lg font-semibold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#143D6C] active:bg-[#0F2D50] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Crown className="w-4 h-4" />
                <span>
                  {!isLoggedIn 
                    ? (isJa ? "無料会員登録 / ログインして確認" : isVi ? "Đăng ký / Đăng nhập ngay" : "Register / Sign In")
                    : (isJa ? "Proプランにアップグレード (料金を見る)" : isVi ? "Nâng cấp lên gói PRO (Xem bảng giá)" : "Upgrade to PRO Plan")}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg font-medium text-xs sm:text-sm text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-[#151B22] dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isJa ? "閉じる" : isVi ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Top Icon Badge - B2B Kachi-iro Blue */}
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center mb-4">
              <Filter className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
            </div>

            {/* Status Badge Tag */}
            <div className="mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-[#1B4F8A] border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A]"></span>
                <span>{isJa ? "必須絞り込み条件" : isVi ? "Điều kiện bộ lọc bắt buộc" : "Required Filter Condition"}</span>
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2.5 [font-feature-settings:'palt']">
              {isJa 
                ? "「お問い合わせフォーム」の絞り込みが必要です" 
                : isVi 
                ? "Vui lòng chọn bộ lọc「Biểu mẫu liên hệ」" 
                : "「Contact Form」Filter Required"}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-350 leading-relaxed mb-4 [font-feature-settings:'palt']">
              {isJa ? (
                <>
                  フォーム営業（自動配信）を実行するには、左メニュー
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">「連絡先情報の有無」</strong>
                  の
                  <strong className="text-[#1B4F8A] dark:text-blue-400 font-semibold">「お問い合わせフォーム」</strong>
                  にチェックを入れて検索してください。
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">
                    ※ フォームの実在が確認されている企業のみに対象を絞り込むことで、正常な配信と高いアプローチ効果を担保します。
                  </span>
                </>
              ) : isVi ? (
                <>
                  Để sử dụng tính năng gửi Form tự động, vui lòng tích chọn 
                  <strong className="text-[#1B4F8A] dark:text-blue-400 font-semibold">「Biểu mẫu liên hệ (お問い合わせフォーム)」</strong> 
                  trong phần 
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">「Kênh liên lạc có sẵn」</strong> 
                  ở cột bộ lọc bên trái.
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">
                    ※ Việc này đảm bảo hệ thống chỉ gửi tới những công ty đã xác định có form liên hệ trực tuyến.
                  </span>
                </>
              ) : (
                <>
                  To run automated form outreach, please enable 
                  <strong className="text-[#1B4F8A] dark:text-blue-400 font-semibold">「Contact Form」</strong> 
                  under 
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">「Contact Presence」</strong> 
                  in the search filters.
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">
                    ※ This guarantees outreach is only directed at businesses with active contact forms.
                  </span>
                </>
              )}
            </p>

            {/* Visual Guide Box */}
            <div className="bg-slate-50/80 dark:bg-[#0D1117] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 mb-5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                {isJa ? "必要なフィルター設定:" : isVi ? "Bộ lọc cần tích chọn:" : "Required Filter:"}
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="w-4 h-4 rounded bg-[#1B4F8A] text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isJa ? "お問い合わせフォーム" : isVi ? "Biểu mẫu liên hệ" : "Contact Form"}
                </span>
                <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                  FORM
                </span>
              </div>
            </div>

            {/* Actions: One-click Apply & Continue */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={onApplyContactFilterAndProceed}
                className="flex-1 h-10 px-4 rounded-lg font-semibold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#143D6C] active:bg-[#0F2D50] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isJa 
                    ? "「お問い合わせフォーム」を適用して進む" 
                    : isVi 
                    ? "「Biểu mẫu liên hệ」áp dụng & tiếp tục" 
                    : "Apply Filter & Continue"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg font-medium text-xs sm:text-sm text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-[#151B22] dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isJa ? "自分で選ぶ" : isVi ? "Đóng" : "Dismiss"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
