"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Building,
  User,
  Globe,
  Check,
  AlertCircle,
  Upload,
  FileCheck2,
  Trash2,
  Sparkles,
  Eye,
  Code,
  Copy,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { isDomainMatch, extractCleanDomain, isFreeEmailDomain } from "@/lib/domainUtils";

export interface CompanyOwnershipClaimFormProps {
  corporateNumber: string;
  companyName: string;
  websiteUrl?: string | null;
  phone?: string | null;
  initialPrTitle?: string | null;
  initialPrMessage?: string | null;
  isEmbedded?: boolean;
  onClose?: () => void;
  onSuccess?: (requestId?: number) => void;
  onInstantVerified?: () => void;
  claimToken?: string | null;
}

export const CompanyOwnershipClaimForm: React.FC<CompanyOwnershipClaimFormProps> = ({
  corporateNumber,
  companyName,
  websiteUrl = "",
  phone: initialCompanyPhone = "",
  initialPrTitle = "",
  initialPrMessage = "",
  isEmbedded = false,
  onClose,
  onSuccess,
  onInstantVerified,
  claimToken,
}) => {
  const { locale } = useLanguage();
  const { isLoggedIn, user, setAuthModalOpen } = useAuth();

  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // Form states
  const [applicantName, setApplicantName] = useState("");
  const [department, setDepartment] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [prTitle, setPrTitle] = useState(initialPrTitle || "");
  const [prMessage, setPrMessage] = useState(initialPrMessage || "");
  const [copiedCode, setCopiedCode] = useState(false);

  const embedSnippet = useMemo(() => {
    return `<a href="https://kigyoulist.com/ja/company/${corporateNumber}" target="_blank" rel="noopener noreferrer">\n  <img src="https://kigyoulist.com/icon.svg" alt="${companyName} - Kigyou-List公式認証" width="120" height="36" />\n</a>`;
  }, [corporateNumber, companyName]);

  // OTP states (for domain-matched flow)
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Document upload states (for non-domain or free email flow)
  const [documentType, setDocumentType] = useState<"business_card" | "registry_doc" | "other">("business_card");
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const [docFileSize, setDocFileSize] = useState<string | null>(null);
  const [docBase64, setDocBase64] = useState<string | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);

  // User manual track switcher override (null = auto-detect based on domain)
  const [manualTrackOverride, setManualTrackOverride] = useState<"domain" | "document" | null>(null);

  // Status & submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [instantVerifiedSuccess, setInstantVerifiedSuccess] = useState(false);
  const [assignedRequestId, setAssignedRequestId] = useState<number | null>(null);

  // Auto-fill user name and email from session
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (user?.name && !applicantName) {
      setApplicantName(user.name);
    }
  }, [user, email, applicantName]);

  // Handle OTP countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Smart domain detection
  const isMatchedDomain = useMemo(() => {
    return isDomainMatch(email, websiteUrl);
  }, [email, websiteUrl]);

  const cleanEmailDomain = useMemo(() => {
    return extractCleanDomain(email);
  }, [email]);

  const cleanWebsiteDomain = useMemo(() => {
    return extractCleanDomain(websiteUrl);
  }, [websiteUrl]);

  // Active track: defaults to "domain" if domain matched, else "document", unless user explicitly toggled
  const currentTrack: "domain" | "document" = manualTrackOverride
    ? manualTrackOverride
    : isMatchedDomain
      ? "domain"
      : "document";

  // Send OTP handler (Fast-track)
  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setErrorMsg(
        isJa
          ? "有効なメールアドレスを入力してください。"
          : isVi
            ? "Vui lòng nhập địa chỉ email hợp lệ."
            : "Please enter a valid email address."
      );
      return;
    }

    setSendingOtp(true);
    setErrorMsg(null);

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
        setErrorMsg(
          data.error ||
          (isJa
            ? "認証コードの送信に失敗しました。"
            : isVi
              ? "Gửi mã xác thực thất bại."
              : "Failed to send verification code.")
        );
      }
    } catch {
      setErrorMsg(
        isJa
          ? "サーバー通信エラーが発生しました。"
          : isVi
            ? "Lỗi kết nối máy chủ."
            : "Server connection error."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg(
        isJa
          ? "ファイルサイズは8MB以下にしてください。"
          : isVi
            ? "Kích thước tệp tải lên tối đa 8MB."
            : "File size must be 8MB or less."
      );
      return;
    }

    setErrorMsg(null);
    setDocFileName(file.name);
    setDocFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setDocBase64(base64Str);
      if (file.type.startsWith("image/")) {
        setDocPreviewUrl(base64Str);
      } else {
        setDocPreviewUrl(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setDocFileName(null);
    setDocFileSize(null);
    setDocBase64(null);
    setDocPreviewUrl(null);
  };

  // Submit claim handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!applicantName.trim()) {
      setErrorMsg(
        isJa
          ? "申請者様のお名前をご入力ください。"
          : isVi
            ? "Vui lòng nhập họ tên người nộp đơn."
            : "Please enter applicant name."
      );
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg(
        isJa
          ? "有効なメールアドレスをご入力ください。"
          : isVi
            ? "Vui lòng nhập email hợp lệ."
            : "Please enter a valid email."
      );
      return;
    }

    setSubmitting(true);

    try {
      if (currentTrack === "domain") {
        // FAST-TRACK: Verify via OTP and claim immediately
        if (!claimToken && (!otpCode.trim() || otpCode.trim().length !== 6)) {
          setErrorMsg(
            isJa
              ? "メール宛に送信された6桁の認証コード（OTP）をご入力ください。"
              : isVi
                ? "Vui lòng nhập mã OTP 6 số đã gửi về email."
                : "Please enter the 6-digit OTP sent to your email."
          );
          setSubmitting(false);
          return;
        }

        const res = await fetch("/api/companies/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            corporate_number: corporateNumber,
            email: email.trim(),
            person_in_charge: applicantName.trim(),
            department: department.trim() || undefined,
            phone: applicantPhone.trim() || undefined,
            otp_code: otpCode.trim(),
            claim_token: claimToken || undefined,
            pr_title: prTitle.trim() || undefined,
            pr_message: prMessage.trim() || undefined,
            locale,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setInstantVerifiedSuccess(true);
          if (onInstantVerified) {
            onInstantVerified();
          }
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setErrorMsg(
            data.error ||
            (isJa
              ? "認証に失敗しました。認証コードをお確かめいただくか、「書類審査」をお試しください。"
              : isVi
                ? "Xác thực thất bại. Vui lòng kiểm tra lại mã OTP hoặc gửi hồ sơ thẩm định."
                : "Verification failed. Please check OTP or submit document review.")
          );
        }
      } else {
        // TRACK B: Document Review (24h Manual Admin Review)
        if (!docBase64) {
          setErrorMsg(
            isJa
              ? "在籍・代表権を証明する書類（名刺または登記簿謄本）を添付してください。"
              : isVi
                ? "Vui lòng đính kèm hình ảnh Danh thiếp hoặc Giấy đăng ký kinh doanh."
                : "Please attach a business card or registry document."
          );
          setSubmitting(false);
          return;
        }

        const res = await fetch("/api/companies/claim-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            corporate_number: corporateNumber,
            company_name: companyName,
            email: email.trim(),
            applicant_name: applicantName.trim(),
            applicant_phone: applicantPhone.trim() || undefined,
            department: department.trim() || undefined,
            document_type: documentType,
            document_url: docBase64,
            notes: notes.trim() || undefined,
            pr_title: prTitle.trim() || undefined,
            pr_message: prMessage.trim() || undefined,
            locale,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSubmittedSuccess(true);
          setAssignedRequestId(data.request_id || null);
          if (onSuccess) {
            onSuccess(data.request_id);
          }
        } else {
          setErrorMsg(
            data.error ||
            (isJa
              ? "申請処理中にエラーが発生しました。"
              : isVi
                ? "Đã xảy ra lỗi khi gửi yêu cầu."
                : "Failed to submit verification request.")
          );
        }
      }
    } catch {
      setErrorMsg(
        isJa
          ? "サーバー通信エラーが発生しました。"
          : isVi
            ? "Lỗi kết nối máy chủ."
            : "Server connection error."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Render Login prompt for unauthenticated users
  const renderLoginPrompt = () => (
    <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center mx-auto text-[#1B4F8A] dark:text-blue-400">
        <ShieldCheck className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {isJa ? "ログインが必要です" : isVi ? "Yêu cầu đăng nhập tài khoản" : "Login Required"}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
          {isJa
            ? "企業公式オーナー認証のお手続きには、Kigyou-Listアカウントへのログインが必要です。認証完了後、貴社アカウントに「公式認証マーク」および「1日50件無料ダウンロード枠（月間1,500件）」が自動付与されます。"
            : isVi
              ? "Để tiến hành xác minh chính chủ doanh nghiệp, vui lòng đăng nhập tài khoản. Sau khi được duyệt, tài khoản của bạn sẽ nhận quyền quản trị và nâng hạn ngạch tải 50 dòng/ngày (1,500 dòng/tháng)."
              : "Please log in to claim this company profile. Verified owners receive official badges and 50 downloads/day."}
        </p>
      </div>

      {/* Target Company Card */}
      <div className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
        <div className="flex justify-between items-center text-slate-500">
          <span>{isJa ? "対象企業" : "Doanh nghiệp"}:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
            {companyName}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>{isJa ? "法人番号" : "Mã pháp nhân"}:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            #{corporateNumber}
          </span>
        </div>
      </div>

      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            setAuthModalOpen(true);
          }}
          className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          {isJa ? "ログイン / 新規登録（無料 0円）" : isVi ? "Đăng nhập / Đăng ký miễn phí (0đ)" : "Log In / Register for Free"}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-medium cursor-pointer"
          >
            {isJa ? "キャンセル" : isVi ? "Hủy bỏ" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );

  // Render Instant Domain OTP Verification Success
  const renderInstantVerifiedSuccess = () => (
    <div className="text-center py-6 sm:py-8 space-y-5">
      <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {isJa ? "公式企業オーナー認証が完了いたしました！" : isVi ? "Xác minh chính chủ doanh nghiệp thành công!" : "Company Claim Verified Successfully!"}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {isJa
            ? "WEBドメイン認証により、企業公式オーナー権限が有効化されました。ページ最上部に「公式認証企業」バッジが付与され、企業PRや採用情報の常時優先掲載がご利用いただけます。"
            : isVi
              ? "Quyền quản trị chính chủ đã được kích hoạt thành công qua xác thực tên miền. Huy hiệu Tích xanh và tính năng đăng PR / tuyển dụng đã sẵn sàng."
              : "Domain ownership verified. Official verification badge and PR features are now fully unlocked."}
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
        <div className="flex justify-between items-center text-slate-500">
          <span>{isJa ? "対象企業" : "Doanh nghiệp"}:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[240px]">
            {companyName}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>{isJa ? "認証ステータス" : "Trạng thái"}:</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {isJa ? "有効化済み（オーナー認証済）" : "Đã kích hoạt chính chủ"}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>{isJa ? "無料出力枠特典" : "Hạn ngạch xuất dữ liệu"}:</span>
          <span className="font-bold text-[#1B4F8A] dark:text-blue-400">
            50件 / 日（月間1,500件）
          </span>
        </div>
      </div>

      {onClose && (
        <div className="pt-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            {isJa ? "管理パネルへ進む / 閉じる" : isVi ? "Vào quản lý / Đóng" : "Proceed / Close"}
          </button>
        </div>
      )}
    </div>
  );

  // Render Document Manual Review Receipt
  const renderDocumentReceipt = () => (
    <div className="text-center py-6 sm:py-8 space-y-5">
      <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {isJa ? "企業公式認証の申請を受付いたしました" : isVi ? "Đã tiếp nhận yêu cầu xác minh doanh nghiệp" : "Verification Request Received"}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {isJa
            ? "ご入力いただきました情報を受領いたしました。担当スタッフによる最終確認の後、ご登録のメールアドレスへ審査結果をご連絡いたします。"
            : isVi
              ? "Hệ thống đã tiếp nhận thông tin yêu cầu. Ban quản trị sẽ thẩm định hồ sơ và gửi kết quả qua email cho bạn."
              : "Your request has been received. Our review team will verify the details and notify you by email."}
        </p>
      </div>

      {/* Receipt Summary Card */}
      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
        <div className="flex justify-between items-center text-slate-500">
          <span>{isJa ? "申請番号" : "Mã đơn"}:</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            #{assignedRequestId || "REQ-OK"}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>{isJa ? "対象企業" : "Doanh nghiệp"}:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[240px]">
            {companyName}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>{isJa ? "審査方式" : "Phương thức"}:</span>
          <span className="font-semibold text-[#1B4F8A] dark:text-blue-400">
            {isJa ? "書類・名刺審査" : isVi ? "Giấy tờ / Danh thiếp" : "Document Review"}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>{isJa ? "審査予定時間" : "Thời gian dự kiến"}:</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {isJa ? "通常1〜2営業日以内（原則24h以内）" : isVi ? "Trong 24h làm việc" : "Within 24 business hours"}
          </span>
        </div>
      </div>

      {onClose && (
        <div className="pt-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            {isJa ? "閉じる" : isVi ? "Đóng" : "Close"}
          </button>
        </div>
      )}
    </div>
  );

  // Main Form Component
  const renderMainForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4.5">
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* Target Company Banner */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-slate-900 dark:text-white truncate text-sm">
            {companyName}
          </span>
          <span className="font-mono text-slate-400 shrink-0 text-[11px]">
            #{corporateNumber}
          </span>
        </div>
        {cleanWebsiteDomain && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] truncate">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{cleanWebsiteDomain}</span>
          </div>
        )}
      </div>

      {/* Section 1: Applicant Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <User className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          <span>1. {isJa ? "申請者情報（ご担当者様）" : isVi ? "Thông tin người đại diện nộp đơn" : "Applicant Information"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isJa ? "ご担当者様 氏名" : isVi ? "Họ và tên" : "Full Name"} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder={isJa ? "例: 山田 太郎" : isVi ? "Nguyễn Văn A" : "Taro Yamada"}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isJa ? "部署・お役職" : isVi ? "Bộ phận / Chức vụ" : "Department / Title"}
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder={isJa ? "例: 広報総務部 / 代表取締役" : isVi ? "Phòng hành chính / Giám đốc" : "PR / CEO"}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isJa ? "会社メールアドレス" : isVi ? "Email liên hệ" : "Business Email"} <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setManualTrackOverride(null); // Reset manual override if user changes email
              }}
              placeholder={cleanWebsiteDomain ? `user@${cleanWebsiteDomain}` : "info@company.co.jp"}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isJa ? "連絡先電話番号" : isVi ? "Số điện thoại" : "Phone Number"}
            </label>
            <input
              type="tel"
              value={applicantPhone}
              onChange={(e) => setApplicantPhone(e.target.value)}
              placeholder={initialCompanyPhone || (isJa ? "例: 03-1234-5678" : "090-1234-5678")}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Smart Verification Track (Domain Match vs Document Review) */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Building className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>2. {isJa ? "認証方式の確認" : isVi ? "Phương thức xác thực" : "Verification Method"}</span>
          </div>

          {/* Quick toggle link if user wants to switch between methods */}
          {isMatchedDomain && (
            <button
              type="button"
              onClick={() => setManualTrackOverride(currentTrack === "domain" ? "document" : "domain")}
              className="text-[11px] font-semibold text-[#1B4F8A] hover:underline dark:text-blue-400 cursor-pointer"
            >
              {currentTrack === "domain"
                ? (isJa ? "名刺・書類審査に切り替える →" : "Chuyển sang nộp hồ sơ →")
                : (isJa ? "⚡ ドメイン即時認証に戻す →" : "⚡ Quay lại xác thực OTP →")}
            </button>
          )}
        </div>

        {currentTrack === "domain" ? (
          /* TRACK A: DOMAIN MATCH (Fast-Track, No Meishi needed!) */
          <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <strong className="font-bold">
                  {isJa ? "会社ドメインの一致を確認いたしました" : isVi ? "Đã nhận diện email domain trùng khớp website công ty" : "Corporate Domain Match Confirmed"}
                </strong>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
                  {isJa
                    ? `貴社公式ドメイン（@${cleanEmailDomain}）と一致しているため、名刺や登記簿謄本の書類提出は不要です。`
                    : isVi
                      ? `Email có cùng tên miền (@${cleanEmailDomain}) với website công ty. Bạn không cần tải lên danh thiếp hay giấy đăng ký kinh doanh!`
                      : `Email domain matches corporate website (@${cleanEmailDomain}). No business card or registry upload required!`}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isJa ? "メール本人確認（OTP認証）" : isVi ? "Xác thực sở hữu email (OTP)" : "Email Ownership Verification"}
                </span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || otpCountdown > 0}
                  className="px-3 py-1 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {sendingOtp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : otpCountdown > 0 ? (
                    `${isJa ? "再送信" : "Gửi lại"} (${otpCountdown}s)`
                  ) : otpSent ? (
                    isJa ? "コード再送信" : isVi ? "Gửi lại OTP" : "Resend OTP"
                  ) : (
                    isJa ? "認証コードを送信" : isVi ? "Gửi mã xác thực" : "Send Code"
                  )}
                </button>
              </div>

              {otpSent && (
                <div className="space-y-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder={isJa ? "メール記載の6桁コードを入力" : "Nhập mã 6 chữ số"}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono tracking-widest text-center font-bold focus:ring-1 focus:ring-[#1B4F8A] outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400">
                    {isJa
                      ? `※「${email}」宛てに送信された6桁の認証コードをご入力ください。`
                      : `Vui lòng nhập 6 chữ số OTP được gửi tới email ${email}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TRACK B: DOCUMENT REVIEW (When email domain does not match or free email like Gmail) */
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isFreeEmailDomain(email) ? (
                <span>
                  {isJa
                    ? "※フリーメール（Gmail・Yahoo等）をご利用の場合、なりすまし防止のため在籍を証明する書類（名刺または登記簿謄本）の添付が必要です。"
                    : isVi
                      ? "Bạn đang sử dụng email cá nhân (Gmail/Yahoo). Để chống mạo danh, vui lòng đính kèm ảnh Danh thiếp hoặc Giấy đăng ký kinh doanh."
                      : "Using a public email (Gmail, etc.) requires attaching proof (business card or registry document)."}
                </span>
              ) : (
                <span>
                  {isJa
                    ? "※会社ドメイン以外のメール、またはWebサイト未登録の企業様は、在籍または代表権を証明する書類の添付をお願いしております。"
                    : isVi
                      ? "Email không cùng tên miền website hoặc công ty chưa đăng ký web. Vui lòng đính kèm ảnh Danh thiếp hoặc Giấy đăng ký kinh doanh."
                      : "Email domain does not match company website. Please attach a business card or registry document."}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isJa ? "提出書類の種類" : isVi ? "Loại giấy tờ đính kèm" : "Document Type"} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "business_card", label: isJa ? "名刺・社員証" : isVi ? "Danh thiếp / Thẻ NV" : "Business Card" },
                  { id: "registry_doc", label: isJa ? "登記簿謄本" : isVi ? "Đăng ký KD" : "Registry Doc" },
                  { id: "other", label: isJa ? "その他公的書類" : isVi ? "Giấy tờ khác" : "Other Doc" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDocumentType(item.id as any)}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${documentType === item.id
                        ? "bg-blue-50 text-[#1B4F8A] border-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700"
                        : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-750 hover:bg-slate-50"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isJa ? "証明書類ファイルの添付（画像またはPDF）" : isVi ? "Tải lên tệp chứng nhận (Ảnh hoặc PDF)" : "Upload Proof File"} <span className="text-rose-500">*</span>
              </label>

              {docFileName ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {docFileName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {docFileSize}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 dark:border-slate-750 hover:border-[#1B4F8A] dark:hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                  <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isJa ? "クリックしてファイルを選択、またはドラッグ＆ドロップ" : isVi ? "Nhấp để chọn tệp hoặc kéo thả vào đây" : "Click to select or drag & drop"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    JPG, PNG, PDF (最大 8MB)
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* Image Thumbnail Preview */}
              {docPreviewUrl && (
                <div className="mt-2 text-center">
                  <img
                    src={docPreviewUrl}
                    alt="Preview"
                    className="max-h-32 rounded-lg mx-auto border border-slate-200 dark:border-slate-800 object-contain shadow-2xs"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isJa ? "備考・事務局への連絡事項（任意）" : isVi ? "Ghi chú thêm (Không bắt buộc)" : "Notes (Optional)"}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isJa ? "部署移転や代表者変更等、特記事項がある場合はご入力ください" : "Ghi chú bổ sung nếu có..."}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-[#1B4F8A] outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Official PR Message & Catchcopy (Optional - Can be set or updated anytime) */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>3. {isJa ? "公式PRメッセージ・キャッチコピー設定" : isVi ? "Cài đặt thông điệp PR & Catchcopy" : "Official PR Message & Catchcopy"}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-semibold shrink-0">
              {isJa ? "任意・後から変更可" : isVi ? "Tùy chọn" : "Optional"}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {isJa ? "※今すぐ入力しない場合でも、認証後にいつでも追加・変更可能です" : isVi ? "※Có thể cập nhật bất cứ lúc nào sau khi duyệt" : "※Can be edited anytime after verification"}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {isJa
            ? "事前にPR内容をご入力いただきますと、認証承認と同時に貴社ページ最上部へ「公式認証企業」バッジとともに即時公開されます。"
            : isVi
              ? "Nhập thông điệp PR ngay bây giờ để được tự động duyệt và hiển thị ưu tiên ngay khi xác minh chính chủ thành công."
              : "Enter your PR message now to have it published immediately upon verification approval."}
        </p>

        {/* Input 1: Catchcopy */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isJa ? "企業PR キャッチコピー" : "Tiêu đề PR doanh nghiệp"}
            </label>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">{prTitle.length} / 60文字</span>
          </div>
          <input
            type="text"
            maxLength={60}
            value={prTitle}
            onChange={(e) => setPrTitle(e.target.value)}
            placeholder={isJa ? "例: 創業50年の信頼と技術力で製造DXを加速" : "VD: Tăng tốc chuyển đổi số cho ngành sản xuất..."}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-hidden"
          />
        </div>

        {/* Input 2: PR Message */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isJa ? "公式PRメッセージ（アピール・採用・主軸サービス紹介）" : "Thông điệp PR chính thức"}
            </label>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">{prMessage.length} / 500文字</span>
          </div>
          <textarea
            rows={3}
            maxLength={500}
            value={prMessage}
            onChange={(e) => setPrMessage(e.target.value)}
            placeholder={isJa ? "貴社の事業の強みや取引先候補・求職者に向けたメッセージをご自由にご入力ください。認証承認と同時にページ上部に掲載されます。" : "Giới thiệu thế mạnh, đối tác và thông điệp gửi tới khách hàng..."}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-hidden"
          />
        </div>

        {/* Live Preview card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 space-y-2">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              {isJa ? "ページ掲載時プレビュー（イメージ）" : "Xem trước hiển thị trên trang doanh nghiệp"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              LIVE PREVIEW
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-emerald-800/80 rounded-lg p-3 space-y-1.5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                公式認証企業
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white break-words">
                {prTitle || (isJa ? "（ここにキャッチコピーが表示されます）" : "(Tiêu đề PR sẽ hiển thị tại đây)")}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words pl-0.5">
              {prMessage || (isJa ? "貴社のアピール文、事業内容、強み、採用情報などが企業ページ最上部に常時優先掲載されます。" : "Thông điệp PR chính thức của doanh nghiệp sẽ hiển thị ưu tiên tại đây.")}
            </p>
          </div>
        </div>

        {/* 4. Embed Tag Widget (Clean stacked preview, no broken inline wrapping) */}
        <div className="pt-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isJa ? "自社ホームページ用 認証バッジ埋め込みタグ（任意）" : isVi ? "Mã nhúng huy hiệu vào website (Tùy chọn)" : "Embed Badge for Website (Optional)"}</span>
            </label>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(embedSnippet);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? (isJa ? "コピー完了" : isVi ? "Đã sao chép" : "Copied") : (isJa ? "コードをコピー" : isVi ? "Sao chép mã" : "Copy Code")}</span>
            </button>
          </div>

          {/* Clean Badge Preview Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isJa ? "表示プレビュー:" : isVi ? "Xem trước hiển thị:" : "Preview:"}
              </span>
              <span className="text-[10px] text-slate-400">
                {isJa ? "※自社サイトのフッター等に設置いただけます" : isVi ? "※Có thể gắn vào footer website" : "※Can be placed in website footer"}
              </span>
            </div>

            <div className="inline-flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  {companyName}
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                  Kigyou-List公式認証企業
                </span>
              </div>
            </div>
          </div>

          <pre className="text-[11px] font-mono bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 p-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto leading-relaxed shadow-2xs">
            {embedSnippet}
          </pre>
        </div>
      </div>

      {/* 3 Free B2B Perks Banner */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
          {isJa ? "🎁 認証完了後の公式パートナー特典（完全無料）：" : isVi ? "Quyền lợi sau khi được xác minh chính chủ:" : "Official Partner Perks (100% Free):"}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isJa ? "公式認証マーク付与" : isVi ? "Huy hiệu tích xanh" : "Official Badge"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isJa ? "1日50件無料出力枠" : isVi ? "50 dòng CSV/ngày" : "50 CSV/day"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isJa ? "公式PR・採用情報掲載" : isVi ? "Đăng PR & Tuyển dụng" : "PR Publishing"}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isJa ? "申請処理を実行中..." : isVi ? "Đang gửi yêu cầu..." : "Submitting..."}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>
                {currentTrack === "domain"
                  ? isJa
                    ? "本人確認を完了し、公式認証を有効化する（即時30秒）"
                    : isVi
                      ? "Xác nhận OTP & Kích hoạt quyền chính chủ (30 giây)"
                      : "Verify OTP & Activate Ownership"
                  : isJa
                    ? "書類審査を申請する（原則24h以内）"
                    : isVi
                      ? "Gửi hồ sơ thẩm định (Trong 24h)"
                      : "Submit Document Review"}
              </span>
            </>
          )}
        </button>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          {isJa
            ? "※事務局スタッフによる手動確認後、メールにて結果をご連絡いたします。初期費用・月額利用料は一切不要です。"
            : isVi
              ? "Hồ sơ được thẩm định thủ công 100% bởi Ban quản trị. Hoàn toàn miễn phí."
              : "100% manual review by administration team. Zero fees."}
        </p>
      </div>
    </form>
  );

  // Render Inner Content
  const renderContent = () => {
    if (!isLoggedIn) {
      return renderLoginPrompt();
    }
    if (instantVerifiedSuccess) {
      return renderInstantVerifiedSuccess();
    }
    if (submittedSuccess) {
      return renderDocumentReceipt();
    }
    return renderMainForm();
  };

  // If embedded directly inside Tab 1, render seamlessly without backdrop or duplicate modal header
  if (isEmbedded) {
    return <div className="space-y-4">{renderContent()}</div>;
  }

  // Standalone Modal Wrapper (used in CompanyClaimModal)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4F8A] dark:text-blue-400">
                <span>{isJa ? "公式オーナー機能（完全無料）" : isVi ? "Chính chủ doanh nghiệp (Miễn phí 100%)" : "Official Owner Claim (100% Free)"}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {isJa ? "企業公式オーナー認証" : isVi ? "Xác minh Chính chủ Doanh nghiệp" : "Official Company Verification"}
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800 dark:text-slate-200">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
