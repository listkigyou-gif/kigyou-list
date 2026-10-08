"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Crown, 
  Sparkles, 
  Filter, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  AlertCircle,
  FileSpreadsheet,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-250 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {type === "PRO_REQUIRED" ? (
          <div>
            {/* Top Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white flex items-center justify-center mb-5 shadow-lg shadow-amber-500/25">
              <Crown className="w-7 h-7" />
            </div>

            {/* Badge Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold mb-2.5">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isJa ? "Proプラン以上限定機能" : isVi ? "Tính năng dành riêng cho gói PRO trở lên" : "PRO Plan Feature"}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-3">
              {isJa 
                ? "フォーム営業のご利用にはProプランが必要です" 
                : isVi 
                ? "Cần nâng cấp gói PRO để dùng tính năng gửi Form tự động" 
                : "PRO Plan Required for Automated Form Outreach"}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed mb-5">
              {isJa ? (
                <>
                  「この条件でフォーム営業（自動配信）」をご利用いただくには、
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">Proプラン以上</strong>
                  のご契約と、左側メニューの
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">「連絡先情報の有無 🔑 ＞ お問い合わせフォーム」</strong>
                  の絞り込みが必要です。
                </>
              ) : isVi ? (
                <>
                  Để sử dụng tính năng gửi Form tự động theo điều kiện tìm kiếm, tài khoản của bạn cần có gói 
                  <strong className="text-slate-900 dark:text-slate-100 font-bold"> PRO trở lên</strong>. 
                  Gói PRO sẽ mở khóa bộ lọc 
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">「Kênh liên lạc có sẵn 🔑 ＞ Biểu mẫu liên hệ」</strong> 
                  nhằm trích xuất chính xác các doanh nghiệp có form gửi hợp lệ.
                </>
              ) : (
                <>
                  Automated Form Outreach requires a 
                  <strong className="text-slate-900 dark:text-slate-100 font-bold"> PRO plan or higher</strong>. 
                  Upgrading unlocks the 
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">「Contact Presence 🔑 ＞ Contact Form」</strong> 
                  filter to precisely target companies with verifiable outreach forms.
                </>
              )}
            </p>

            {/* Benefits highlights */}
            <div className="bg-slate-50 dark:bg-[#151921] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-6 flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  {isJa 
                    ? "「連絡先情報の有無 🔑」（フォーム・メール・電話）の全絞り込みを即時アンロック" 
                    : isVi 
                    ? "Mở khóa toàn bộ bộ lọc liên lạc (Form, Email, SĐT, Fax) độc quyền" 
                    : "Instant unlock for all Contact Presence filters (Form, Email, Phone, Fax)"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  {isJa 
                    ? "フォーム実在企業のみを抽出し、無駄打ちのない高反響アプローチが可能" 
                    : isVi 
                    ? "Đảm bảo 100% doanh nghiệp có Form liên hệ thật, tối đa tỷ lệ phản hồi" 
                    : "Guarantees 100% verified inquiry forms for maximum response rates"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  {isJa 
                    ? "クレーム除外・AIスパム判定・送信ログCSV納品に対応" 
                    : isVi 
                    ? "Tự động tránh web cấm chào hàng & báo cáo CSV minh bạch" 
                    : "Built-in anti-spam compliance and live proof CSV logs"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleUpgradeClick}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 hover:from-amber-500 hover:to-indigo-500 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
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
                className="py-3 px-4 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                {isJa ? "閉じる" : isVi ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Top Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/25">
              <Filter className="w-7 h-7" />
            </div>

            {/* Badge Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-[11px] font-bold mb-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isJa ? "必須絞り込み条件" : isVi ? "Điều kiện bộ lọc bắt buộc" : "Required Filter Condition"}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-3">
              {isJa 
                ? "「お問い合わせフォーム」の絞り込みが必要です" 
                : isVi 
                ? "Vui lòng chọn bộ lọc 'Biểu mẫu liên hệ'" 
                : "'Contact Form' Filter Required"}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed mb-5">
              {isJa ? (
                <>
                  フォーム営業（自動配信）を実行するには、左メニュー
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">「連絡先情報の有無 🔑」</strong>
                  の
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">「お問い合わせフォーム」</strong>
                  にチェックを入れて検索してください。
                  <br />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    ※ フォームの存在が確認されている企業のみに対象を絞り込むことで、正常な配信と高いアプローチ効果を担保します。
                  </span>
                </>
              ) : isVi ? (
                <>
                  Để sử dụng tính năng gửi Form tự động, vui lòng tích chọn 
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">「Biểu mẫu liên hệ (お問い合わせフォーム)」</strong> 
                  trong phần 
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">「Kênh liên lạc có sẵn 🔑」</strong> 
                  ở cột bộ lọc bên trái.
                  <br />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    ※ Việc này đảm bảo hệ thống chỉ gửi tới những công ty đã xác định có form liên hệ trực tuyến.
                  </span>
                </>
              ) : (
                <>
                  To run automated form outreach, please enable 
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">「Contact Form」</strong> 
                  under 
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">「Contact Presence 🔑」</strong> 
                  in the search filters.
                  <br />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    ※ This guarantees outreach is only directed at businesses with active contact forms.
                  </span>
                </>
              )}
            </p>

            {/* Visual Guide Box */}
            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 rounded-2xl p-4 mb-6">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                {isJa ? "必要なフィルター設定:" : isVi ? "Bộ lọc cần tích chọn:" : "Required Filter:"}
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2128] border border-indigo-300 dark:border-indigo-700 shadow-xs">
                <div className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                  ✓
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isJa ? "お問い合わせフォーム" : isVi ? "Biểu mẫu liên hệ" : "Contact Form"}
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded font-black">
                  FORM
                </span>
              </div>
            </div>

            {/* Actions: One-click Apply & Continue */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onApplyContactFilterAndProceed}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 hover:from-blue-600 hover:to-indigo-500 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isJa 
                    ? "「お問い合わせフォーム」を適用して進む" 
                    : isVi 
                    ? "Tự động bật bộ lọc & Tiếp tục" 
                    : "Apply Filter & Continue"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
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
