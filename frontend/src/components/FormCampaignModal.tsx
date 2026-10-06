"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Send, CheckCircle2, ShieldCheck, Sparkles, Building2, 
  User, Mail, Phone, ArrowRight, FileText, Check, Loader2, 
  MessageSquare, ExternalLink, HelpCircle
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface FormCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
  currentFilters?: any;
}

export const FormCampaignModal: React.FC<FormCampaignModalProps> = ({
  isOpen,
  onClose,
  totalCount,
  currentFilters = {}
}) => {
  const { locale } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const [selectedTier, setSelectedTier] = useState<"1k" | "3k" | "5k">("3k");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [pitchMessage, setPitchMessage] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      setEmail(user.email);
    }
  }, [isLoggedIn, user?.email]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !companyName || !contactName) {
      setErrorMsg(isJa ? "必須項目（会社名、お名前、メールアドレス）をご入力ください。" : isVi ? "Vui lòng nhập các mục bắt buộc (Tên công ty, Họ tên, Email)." : "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const tierLabels = {
      "1k": "1,000件プラン (28,000 JPY)",
      "3k": "3,000件プラン (69,000 JPY) [人気No.1]",
      "5k": "5,000件プラン (99,000 JPY)"
    };

    const payload = {
      type: "FORM_DM_CAMPAIGN",
      company_name: companyName,
      person_in_charge: contactName,
      requester_email: email,
      mobile_number: phone,
      website_url: website,
      locale,
      message: `【フォーム営業代行 お申し込み・相談】
■ 希望プラン: ${tierLabels[selectedTier]}
■ 検索該当件数: ${totalCount.toLocaleString()} 件
■ 検索フィルター条件: ${JSON.stringify(currentFilters)}
■ 貴社Webサイト: ${website || "未入力"}
■ 営業メッセージ案・要望:
${pitchMessage || "未入力（専任スタッフと相談希望）"}`
    };

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to submit campaign request");
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Form DM inquiry error:", err);
      setErrorMsg(isJa ? "送信に失敗しました。時間をおいて再試行してください。" : isVi ? "Gửi yêu cầu thất bại. Vui lòng thử lại sau." : "Submission failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-250 scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {isJa ? "お問い合わせ・お申し込みを受け付けました" : isVi ? "Đã nhận yêu cầu chiến dịch gửi Form" : "Campaign Request Received"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 max-w-md mx-auto mb-6 leading-relaxed">
              {isJa
                ? "担当者よりご入力いただいたメールアドレス宛に、24時間以内に詳細なスケジュール・文面確認・お見積りをご案内いたします。"
                : isVi
                ? "Đội ngũ chuyên viên sẽ liên hệ lại với bạn qua Email trong vòng 24 giờ để thống nhất kịch bản, lịch gửi và báo cáo chi tiết."
                : "Our sales specialist will contact you within 24 hours to confirm the pitch template, schedule, and execution plan."}
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
              >
                {isJa ? "閉じる" : isVi ? "Đóng" : "Close"}
              </button>
              <Link
                href={`/${locale}/form-marketing`}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/10"
              >
                <span>{isJa ? "サービス概要を見る" : isVi ? "Xem chi tiết dịch vụ" : "View Service Page"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isJa ? "丸投げB2Bアウトバウンド営業支援" : isVi ? "Dịch vụ Tiếp cận B2B Gửi Form Trọn Gói" : "DFY B2B Form DM Outreach Service"}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mb-2">
              {isJa ? "問い合わせフォーム営業代行（送信代行）" : isVi ? "Dịch vụ Gửi Form Doanh Nghiệp Trọn Gói" : "Done-For-You Contact Form DM Service"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              {isJa
                ? `現在絞り込まれた【約 ${totalCount.toLocaleString()} 社】のターゲット企業のお問い合わせ窓口へ、専任スタッフとAIクローラーが貴社の営業メッセージを安全に代行送信します。`
                : isVi
                ? `Thay vì tự copy-paste thủ công, hệ thống sẽ thay bạn gửi thông điệp chào hàng trực tiếp vào Form của 【khoảng ${totalCount.toLocaleString()} công ty】 đã lọc với tỷ lệ mở 50% - 90%.`
                : `Deliver your tailored sales pitch directly to contact forms of 【~${totalCount.toLocaleString()} filtered companies】 with 50%-90% read rates.`}
            </p>

            {/* Direct SaaS Link Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 mb-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs text-indigo-950 dark:text-indigo-200 font-medium">
                  {isJa
                    ? "自作テンプレートの登録・キャンペーン下書き保存をご自身で管理できます:"
                    : isVi
                    ? "Tự tạo mẫu kịch bản chào hàng và lưu bản nháp chiến dịch của riêng bạn:"
                    : "Create custom pitch templates and save your campaigns directly:"}
                </span>
              </div>
              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer"
              >
                <span>{isJa ? "セルフ設定ボードへ" : isVi ? "Quản lý mẫu & chiến dịch" : "Go to Campaign Studio"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Core Advantages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#151921] border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">
                    {isJa ? "営業お断り自動除外" : isVi ? "Lọc form cấm QC" : "AI Anti-Spam Filter"}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {isJa ? "クレームリスクを未然に防止" : isVi ? "Bảo vệ uy tín thương hiệu" : "Auto-skips strict warning forms"}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#151921] border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">
                    {isJa ? "日本ビジネス敬語監修" : isVi ? "Kiểm tra Kính ngữ Keigo" : "Keigo Proofread"}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {isJa ? "成約率を高める文面チェック" : isVi ? "Câu từ chuẩn B2B Nhật" : "Polite B2B Japanese copy"}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#151921] border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">
                    {isJa ? "送信完了レポート納品" : isVi ? "Báo cáo xác nhận chi tiết" : "Delivery Report"}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {isJa ? "送信URL・日時を完全開示" : isVi ? "Kèm log & bằng chứng gửi" : "Transparent URL & timestamp logs"}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                {isJa ? "1. 送信ボリュームを選択" : isVi ? "1. Chọn số lượng Form muốn tiếp cận" : "1. Select Outreach Volume"}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* 1k Tier */}
                <div
                  onClick={() => setSelectedTier("1k")}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedTier === "1k"
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">1,000 件</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">¥28,000</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">28円 / 件</div>
                </div>

                {/* 3k Tier (Recommended) */}
                <div
                  onClick={() => setSelectedTier("3k")}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                    selectedTier === "3k"
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:border-slate-300"
                  }`}
                >
                  <div className="absolute -top-2.5 right-3 px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black shadow-xs">
                    {isJa ? "人気No.1" : isVi ? "Phổ biến" : "POPULAR"}
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">3,000 件</div>
                  <div className="text-sm font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">¥69,000</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">23円 / 件 (お得)</div>
                </div>

                {/* 5k Tier */}
                <div
                  onClick={() => setSelectedTier("5k")}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedTier === "5k"
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">5,000 件</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">¥99,000</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">19.8円 / 件 (最安)</div>
                </div>
              </div>
            </div>

            {/* Request Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {isJa ? "2. ご連絡先とご相談内容を入力" : isVi ? "2. Thông tin liên hệ & Kịch bản chào hàng" : "2. Contact & Campaign Pitch"}
              </label>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isJa ? "貴社名 *" : isVi ? "Tên công ty của bạn *" : "Company Name *"}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder={isJa ? "例: 株式会社テクノロジー" : isVi ? "Ví dụ: Công ty Cổ phần ABC" : "e.g. Acme Corp"}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isJa ? "ご担当者様名 *" : isVi ? "Họ tên người liên hệ *" : "Contact Person *"}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder={isJa ? "例: 山田 太郎" : isVi ? "Ví dụ: Nguyễn Văn A" : "e.g. John Doe"}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isJa ? "メールアドレス *" : isVi ? "Email nhận báo cáo *" : "Business Email *"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isJa ? "電話番号" : isVi ? "Số điện thoại" : "Phone Number"}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="03-1234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isJa ? "営業メッセージ案・またはターゲット要望" : isVi ? "Nội dung chào hàng hoặc yêu cầu riêng" : "Sales Pitch Draft / Target Notes"}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    isJa
                      ? "例: IT受託開発企業向けにオフショア開発リソースの提案を行いたい。文面作成のサポートも希望。"
                      : isVi
                      ? "Ví dụ: Chúng tôi muốn tiếp cận các công ty IT để chào dịch vụ gia công phần mềm. Cần hỗ trợ tư vấn câu từ tiếng Nhật."
                      : "Describe your pitch offer or request consultation for Japanese copy."
                  }
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Link
                  href={`/${locale}/form-marketing`}
                  target="_blank"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>{isJa ? "料金・送信フローの詳細を見る" : isVi ? "Xem chi tiết bảng giá & quy trình" : "View Detailed Service Page"}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
                  >
                    {isJa ? "キャンセル" : isVi ? "Hủy" : "Cancel"}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isJa ? "営業代行の相談・申し込む" : isVi ? "Gửi yêu cầu chiến dịch DFY" : "Submit Campaign Request"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
