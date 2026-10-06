"use client";

import React, { useState, useEffect } from "react";
import { 
  X, CheckCircle2, ShieldAlert, Loader2, Mail, KeyRound, 
  Globe, Building2, FileEdit, EyeOff, ArrowRight, Clock, RefreshCw, Phone, Printer, User, FileText 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface CompanyCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  corporateNumber: string;
  companyName: string;
  initialWebsiteUrl?: string | null;
}

export const CompanyCorrectionModal: React.FC<CompanyCorrectionModalProps> = ({
  isOpen,
  onClose,
  corporateNumber,
  companyName
}) => {
  const { locale } = useLanguage();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const [activeTab, setActiveTab] = useState<"update" | "hide">("update");

  // All individual editable fields
  const [phone, setPhone] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [fax, setFax] = useState<string>("");
  const [representative, setRepresentative] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [verifyWebsite, setVerifyWebsite] = useState<string>("");

  const [hideReason, setHideReason] = useState<string>("代表者・担当者からの要請");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [personInCharge, setPersonInCharge] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");

  // OTP & Contact state
  const [email, setEmail] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Result state
  const [result, setResult] = useState<{
    success: boolean;
    autoApproved: boolean;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setErrorMessage(null);
      setOtpCode("");
      setOtpSent(false);
      setOtpCountdown(0);
      setPhone("");
      setWebsite("");
      setEmailAddress("");
      setFax("");
      setRepresentative("");
      setDescription("");
      setPersonInCharge("");
      setMobileNumber("");
      setCustomMessage("");
      setVerifyWebsite("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage(isVi ? "Vui lòng nhập địa chỉ email hợp lệ." : "有効なメールアドレスを入力してください。");
      return;
    }

    setSendingOtp(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/inquiry/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setOtpCountdown(60);
      } else {
        setErrorMessage(data.error || (isVi ? "Lỗi khi gửi mã OTP." : "認証コードの送信に失敗しました。"));
      }
    } catch {
      setErrorMessage(isVi ? "Không thể kết nối máy chủ." : "サーバー通信エラーが発生しました。");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !otpCode) {
      setErrorMessage(isVi ? "Vui lòng nhập email và mã OTP." : "メールアドレスと認証コードを入力してください。");
      return;
    }

    if (!personInCharge.trim()) {
      setErrorMessage(isVi ? "Vui lòng nhập họ tên người phụ trách (bắt buộc)." : "担当者名を入力してください。");
      return;
    }

    if (!mobileNumber.trim()) {
      setErrorMessage(isVi ? "Vui lòng nhập số điện thoại di động (bắt buộc)." : "連絡先携帯番号を入力してください。");
      return;
    }

    const cleanMobile = mobileNumber.trim().replace(/\s+/g, "");
    if (!/^0[5789]0-?\d{4}-?\d{4}$|^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(cleanMobile)) {
      setErrorMessage(isVi ? "Định dạng số điện thoại di động không hợp lệ (Ví dụ: 090-1234-5678)." : "連絡先携帯番号の形式が正しくありません (例: 090-1234-5678)。");
      return;
    }

    if (activeTab === "update") {
      const hasAnyField = !!(
        phone.trim() ||
        website.trim() ||
        emailAddress.trim() ||
        fax.trim() ||
        representative.trim() ||
        description.trim()
      );

      if (!hasAnyField) {
        setErrorMessage(isVi ? "Vui lòng nhập ít nhất 1 mục cần chỉnh sửa." : "修正したい項目を少なくとも1つ入力してください。");
        return;
      }

      if (phone.trim()) {
        const cleanPhone = phone.trim().replace(/\s+/g, "");
        if (!/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(cleanPhone)) {
          setErrorMessage(isVi ? "Định dạng số điện thoại không hợp lệ (Ví dụ: 03-1234-5678)." : "電話番号の形式が正しくありません (例: 03-1234-5678)。");
          return;
        }
      }

      if (fax.trim()) {
        const cleanFax = fax.trim().replace(/\s+/g, "");
        if (!/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(cleanFax)) {
          setErrorMessage(isVi ? "Định dạng số FAX không hợp lệ (Ví dụ: 03-1234-5679)." : "FAX番号の形式が正しくありません (例: 03-1234-5679)。");
          return;
        }
      }

      if (emailAddress.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress.trim())) {
          setErrorMessage(isVi ? "Định dạng email liên hệ không hợp lệ." : "メールアドレスの形式が正しくありません。");
          return;
        }
      }

      if (!verifyWebsite.trim()) {
        setErrorMessage(isVi ? "Vui lòng nhập URL website chính thức để đối chiếu (bắt buộc)." : "照合用公式ウェブサイトURLを入力してください（必須）。");
        return;
      }

      if (!/^https?:\/\/.+/i.test(verifyWebsite.trim())) {
        setErrorMessage(isVi ? "URL website đối chiếu không hợp lệ (Bắt đầu bằng https:// hoặc http://)." : "照合用公式ウェブサイトURLの形式が正しくありません (https:// または http:// から始まるURL)。");
        return;
      }
    }

    setSubmitting(true);

    try {
      const updates: Record<string, string> = {};
      if (phone.trim()) updates.phone_number = phone.trim();
      if (website.trim()) updates.website_url = website.trim();
      if (emailAddress.trim()) updates.email_address = emailAddress.trim();
      if (fax.trim()) updates.fax_number = fax.trim();
      if (representative.trim()) updates.representative_name = representative.trim();
      if (description.trim()) updates.jigyo_shumoku = description.trim();

      const payload = {
        corporate_number: corporateNumber,
        company_name: companyName,
        type: activeTab,
        requester_email: email.trim(),
        person_in_charge: personInCharge.trim(),
        mobile_number: mobileNumber.trim(),
        otp_code: otpCode.trim(),
        updates: activeTab === "update" ? updates : undefined,
        website_url: verifyWebsite.trim() || website.trim(),
        message: activeTab === "hide" 
          ? (customMessage.trim() ? `${hideReason} - ${customMessage.trim()}` : hideReason) 
          : customMessage.trim(),
        locale
      };

      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          success: true,
          autoApproved: !!data.auto_approved,
          message: data.message || (isVi ? "Thành công!" : "完了しました。")
        });
      } else {
        setErrorMessage(data.error || (isVi ? "Gặp lỗi khi xử lý yêu cầu." : "処理中にエラーが発生しました。"));
      }
    } catch {
      setErrorMessage(isVi ? "Lỗi kết nối mạng." : "通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isVi ? "Yêu cầu chỉnh sửa / Ẩn thông tin" : "掲載情報の修正・取り下げ依頼"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isVi ? "Quy trình xác thực nhanh trong 60 giây" : "ワンタイム認証でスピード完了（約60秒）"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Company Info Card */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{companyName}</span>
          </div>
          <span className="font-mono text-[11px] bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded shrink-0">
            #{corporateNumber}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {result ? (
            /* Result Success Screen */
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                result.autoApproved 
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" 
                  : "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
              }`}>
                {result.autoApproved ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <Clock className="w-8 h-8" />
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                  {result.autoApproved 
                    ? (isVi ? "Đã duyệt và cập nhật thành công!" : "自動承認され、反映が完了しました") 
                    : (isVi ? "Yêu cầu đã được tiếp nhận" : "リクエストを受け付けました")}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {result.message}
                </p>
              </div>

              <div className="pt-2 w-full">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs hover:opacity-90 transition-opacity"
                >
                  {isVi ? "Đóng cửa sổ" : "閉じる"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Tabs: Update vs Hide */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("update")}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "update"
                      ? "bg-white dark:bg-[#1C2128] text-primary shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>{isVi ? "Chỉnh sửa thông tin" : "情報の修正"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("hide")}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "hide"
                      ? "bg-white dark:bg-[#1C2128] text-rose-600 dark:text-rose-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{isVi ? "Ẩn / Gỡ bỏ công ty" : "掲載の取り下げ（非公開）"}</span>
                </button>
              </div>

              {/* Tab 1: Update fields - ALL individual inputs displayed */}
              {activeTab === "update" && (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileEdit className="w-3.5 h-3.5 text-primary" />
                      {isVi ? "Các mục muốn chỉnh sửa (chỉ nhập vào mục cần thay đổi)" : "修正したい項目（変更がある項目のみご入力ください）"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isVi ? "※ 1 mục trở lên" : "※ 1項目以上入力"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 1. 電話番号 */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {isVi ? "Số điện thoại liên hệ" : "電話番号 (代表・窓口)"}
                      </label>
                      <input 
                        type="tel"
                        placeholder="例：03-1234-5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
                      />
                      <span className="text-[9px] text-slate-400 block">{isVi ? "Định dạng: 03-XXXX-XXXX" : "半角数字・ハイフン区切り (例: 03-XXXX-XXXX)"}</span>
                    </div>

                    {/* 2. 公式ウェブサイト URL */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        {isVi ? "Địa chỉ Website chính thức" : "公式ウェブサイト URL"}
                      </label>
                      <input 
                        type="url"
                        placeholder="例：https://example.co.jp"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
                      />
                      <span className="text-[9px] text-slate-400 block">{isVi ? "Bắt đầu bằng https://" : "https:// から始まるURL"}</span>
                    </div>

                    {/* 3. 代表・窓口メールアドレス */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {isVi ? "Email đại diện / liên hệ" : "代表・お問い合わせメール"}
                      </label>
                      <input 
                        type="email"
                        placeholder="例：contact@example.co.jp"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
                      />
                      <span className="text-[9px] text-slate-400 block">{isVi ? "Email công ty hợp lệ" : "正しいメールアドレス形式"}</span>
                    </div>

                    {/* 4. FAX番号 */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                        {isVi ? "Số FAX" : "FAX番号"}
                      </label>
                      <input 
                        type="tel"
                        placeholder="例：03-1234-5679"
                        value={fax}
                        onChange={(e) => setFax(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
                      />
                      <span className="text-[9px] text-slate-400 block">{isVi ? "Định dạng: 03-XXXX-XXXX" : "半角数字・ハイフン区切り (例: 03-XXXX-XXXX)"}</span>
                    </div>

                    {/* 5. 代表者名 */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {isVi ? "Họ tên người đại diện" : "代表者名"}
                      </label>
                      <input 
                        type="text"
                        placeholder="例：山田 太郎"
                        value={representative}
                        onChange={(e) => setRepresentative(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    {/* 6. 事業内容・PR */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {isVi ? "Mô tả kinh doanh / PR" : "事業内容・PR情報"}
                      </label>
                      <textarea 
                        rows={2}
                        placeholder={isVi ? "Mô tả ngành nghề, kinh doanh hoặc dịch vụ chính..." : "事業内容や事業概要の修正内容を入力してください"}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* 照合用公式ウェブサイト URL (BẮT BUỘC) */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {isVi ? "Website công ty để đối chiếu" : "照合用公式ウェブサイト URL"} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {isVi ? "Bắt buộc đối chiếu" : "照合用（必須）"}
                      </span>
                    </div>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        required
                        value={verifyWebsite}
                        onChange={(e) => setVerifyWebsite(e.target.value)}
                        placeholder="例：https://www.example.co.jp"
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isVi 
                        ? "Vui lòng nhập chính xác URL website của công ty để hệ thống đối chiếu tính xác thực của thông tin." 
                        : "※入力内容の確認およびAIによる照合のため、貴社の公式ウェブサイトURLを必ずご入力ください。"}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Hide fields */}
              {activeTab === "hide" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isVi ? "Lý do yêu cầu ẩn" : "掲載取り下げの理由"} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={hideReason}
                      onChange={(e) => setHideReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    >
                      <option value="代表者・担当者からの要請">{isJa ? "代表者または担当者からの要請" : "Đại diện / Người phụ trách yêu cầu"}</option>
                      <option value="閉業・解散したため">{isJa ? "閉業・解散したため" : "Công ty đã giải thể / ngừng hoạt động"}</option>
                      <option value="誤った情報が掲載されているため">{isJa ? "誤った情報が掲載されているため" : "Thông tin bị sai lệch"}</option>
                      <option value="プライバシー・その他の理由">{isJa ? "プライバシー保護・その他" : "Bảo vệ thông tin / Lý do khác"}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Requester Information & Email OTP Verification */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {/* 1. 担当者名 & 連絡先携帯番号 (Cả hai đều BẮT BUỘC) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isVi ? "Họ tên người phụ trách" : "担当者名"}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={personInCharge}
                      onChange={(e) => setPersonInCharge(e.target.value)}
                      placeholder={isVi ? "Ví dụ: Nguyễn Văn A" : "例：山田 太郎"}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isVi ? "Số điện thoại di động" : "連絡先携帯番号"}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="例：090-1234-5678"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 2. お問い合わせ内容・理由 */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isVi ? "Nội dung liên hệ / Lý do" : "お問い合わせ内容・理由"}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={
                      activeTab === "hide"
                        ? (isVi ? "Nhập chi tiết lý do yêu cầu ẩn thông tin..." : "修正内容や取り下げの理由をご記入ください...")
                        : (isVi ? "Nhập chi tiết nội dung hoặc lý do cần chỉnh sửa..." : "修正内容や取り下げの理由をご記入ください...")
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  />
                </div>

                {/* 3. ご担当者メールアドレス認証 & OTP (Bước xác thực cuối cùng) */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>{isVi ? "Xác thực Email (Gmail/Yahoo/Công ty)" : "ご担当者メールアドレス認証"}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {isVi ? "OTP 6 số" : "6桁コード"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com または gmail.com"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || otpCountdown > 0}
                      className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1 transition-all shadow-xs"
                    >
                      {sendingOtp ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : otpCountdown > 0 ? (
                        <span>{otpCountdown}s</span>
                      ) : otpSent ? (
                        <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />{isVi ? "Gửi lại" : "再送"}</span>
                      ) : (
                        <span>{isVi ? "Lấy mã OTP" : "認証コード送信"}</span>
                      )}
                    </button>
                  </div>

                  {/* OTP Input Field */}
                  {otpSent && (
                    <div className="animate-in fade-in duration-200 space-y-1 pt-0.5">
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder={isVi ? "Nhập 6 chữ số mã OTP" : "メールに届いた6桁の数字を入力"}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-primary dark:border-primary rounded-xl text-xs font-mono tracking-widest focus:ring-2 focus:ring-primary outline-none transition-all"
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {isVi ? "Mã OTP đã được gửi vào email. Vui lòng kiểm tra hộp thư." : "認証コードをメールへ送信しました。確認してご入力ください。"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !otpSent || otpCode.length !== 6}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${
                    activeTab === "hide"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-primary hover:bg-primary-hover"
                  } disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isVi ? "Đang xử lý & đối chiếu..." : "照合・更新処理中..."}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {activeTab === "hide"
                          ? (isVi ? "Xác nhận ẩn công ty ngay" : "認証して非公開を実行")
                          : (isVi ? "Xác nhận cập nhật thông tin" : "認証して情報を更新する")}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
