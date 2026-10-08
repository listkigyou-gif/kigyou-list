"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Mail,
  Building,
  User,
  Phone,
  Printer,
  Globe,
  Sparkles,
  ArrowRight,
  Code,
  Copy,
  Check,
  AlertCircle,
  FileEdit,
  EyeOff,
  Lock,
  KeyRound,
  Upload,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";

interface CompanyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  corporateNumber: string;
  companyName: string;
  initialPhone?: string | null;
  initialWebsite?: string | null;
  initialEmail?: string | null;
  initialFax?: string | null;
  initialRepresentative?: string | null;
  initialPrTitle?: string | null;
  initialPrMessage?: string | null;
  isClaimed?: boolean;
  claimedByEmail?: string | null;
  onSuccess?: () => void;
}

export const CompanyManagementModal: React.FC<CompanyManagementModalProps> = ({
  isOpen,
  onClose,
  corporateNumber,
  companyName,
  initialPhone = "",
  initialWebsite = "",
  initialEmail = "",
  initialFax = "",
  initialRepresentative = "",
  initialPrTitle = "",
  initialPrMessage = "",
  isClaimed = false,
  claimedByEmail = null,
  onSuccess,
}) => {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, setAuthModalOpen, loginWithGoogle } = useAuth();

  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // Check if current logged-in user is an Administrator
  const isUserAdmin = Boolean(user?.email && isAdminEmail(user.email));

  // Check if current logged-in user is the verified owner of this company
  const isOwner = Boolean(
    isLoggedIn && 
    user?.email && 
    claimedByEmail && 
    user.email.toLowerCase() === claimedByEmail.toLowerCase()
  );

  // Check if this company is already claimed by someone else
  const isClaimedByOther = Boolean(
    isClaimed && 
    claimedByEmail && 
    (!user?.email || user.email.toLowerCase() !== claimedByEmail.toLowerCase()) && 
    !isUserAdmin
  );

  // Active sub-tab inside management modal
  const [activeTab, setActiveTab] = useState<"badge_pr" | "edit_info" | "unpublish">("badge_pr");

  // Authentication State: Direct access only if Admin, Verified Owner, or secure claim token in URL
  const tokenFromUrl = searchParams.get("claim_token") || "";
  const emailFromUrl = searchParams.get("email") || (isUserAdmin || isOwner ? user?.email : "") || initialEmail || "";

  const isDirectAuthorized = Boolean(isUserAdmin || isOwner || Boolean(tokenFromUrl));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isDirectAuthorized);
  const [personInCharge, setPersonInCharge] = useState(isUserAdmin ? (user?.name || "管理者") : (isOwner && user?.name) ? user.name : "");
  const [department, setDepartment] = useState(isUserAdmin ? "システム管理者" : "広報・総務部");
  const [email, setEmail] = useState(emailFromUrl);
  const [mobilePhone, setMobilePhone] = useState("");

  const maskEmail = (str?: string | null) => {
    if (!str || !str.includes("@")) return "***@***";
    const [local, domain] = str.split("@");
    const visible = local.length > 2 ? local.slice(0, 2) + "***" : "***";
    return `${visible}@${domain}`;
  };

  // Gatekeeper Mode: "domain" (Web domain + email OTP instant) vs "document" (Manual Business Card / Document Review)
  const [verifyMode, setVerifyMode] = useState<"domain" | "document">("domain");
  const [domainWebsite, setDomainWebsite] = useState(initialWebsite || "");

  // Document verification states
  const [docApplicantName, setDocApplicantName] = useState("");
  const [docApplicantPhone, setDocApplicantPhone] = useState("");
  const [docDepartment, setDocDepartment] = useState("広報・総務部");
  const [docType, setDocType] = useState<"business_card" | "registry" | "employee_id" | "other">("business_card");
  const [docBase64, setDocBase64] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState<string>("");
  const [docNotes, setDocNotes] = useState<string>("");
  const [submittingDoc, setSubmittingDoc] = useState<boolean>(false);
  const [docSubmittedSuccess, setDocSubmittedSuccess] = useState<boolean>(false);

  // OTP flow
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Tab 1: Badge & PR states
  const [prTitle, setPrTitle] = useState(initialPrTitle || "");
  const [prMessage, setPrMessage] = useState(initialPrMessage || "");
  const [savingPr, setSavingPr] = useState(false);

  // Tab 2: Edit Info states
  const [phone, setPhone] = useState(initialPhone || "");
  const [website, setWebsite] = useState(initialWebsite || "");
  const [contactEmail, setContactEmail] = useState(initialEmail || "");
  const [fax, setFax] = useState(initialFax || "");
  const [representative, setRepresentative] = useState(initialRepresentative || "");
  const [verifyWebsite, setVerifyWebsite] = useState(initialWebsite || "");
  const [savingInfo, setSavingInfo] = useState(false);

  // Tab 2: Email OTP states (Strictly required only when changing contact email)
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);

  // Tab 3: Delisting states
  const [hideReason, setHideReason] = useState("代表者・担当者からの要請");
  const [hideMessage, setHideMessage] = useState("");
  const [submittingHide, setSubmittingHide] = useState(false);

  // General messaging
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailOtpCountdown > 0) {
      timer = setTimeout(() => setEmailOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailOtpCountdown]);

  useEffect(() => {
    if (isOpen) {
      setStatusMsg(null);
      setEmailOtpCode("");
      setEmailOtpSent(false);
      setEmailOtpCountdown(0);
      setIsAuthenticated(isDirectAuthorized);
      if (isUserAdmin && user?.email) {
        setEmail(user.email);
        if (!personInCharge) setPersonInCharge(user.name || "管理者");
      } else if (isOwner && user?.email) {
        setEmail(user.email);
        if (!personInCharge && user.name) setPersonInCharge(user.name);
      } else if (user?.email) {
        setEmail(user.email);
      }
    }
  }, [isOpen, isDirectAuthorized, isUserAdmin, isOwner, user, personInCharge]);

  const getRequestHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (user?.email) {
      headers["x-admin-email"] = user.email;
    }
    const secret = typeof window !== "undefined" ? localStorage.getItem("kigyou_admin_secret") : null;
    if (secret) {
      headers["x-admin-secret"] = secret;
    }
    return headers;
  };

  if (!isOpen) return null;

  // Step 1-A: Send Domain OTP to verify enterprise ownership
  const handleSendDomainOtp = async () => {
    if (!email || !email.includes("@")) {
      setStatusMsg({ type: "error", text: isJa ? "有効なメールアドレスを入力してください。" : "Email không hợp lệ." });
      return;
    }
    setSendingOtp(true);
    setStatusMsg(null);
    try {
      // Use domain verification API if domain is provided, fallback to standard inquiry OTP
      const endpoint = domainWebsite ? "/api/companies/verify-domain" : "/api/inquiry/send-otp";
      const payload = domainWebsite
        ? { corporate_number: corporateNumber, website_url: domainWebsite.trim(), email: email.trim(), locale }
        : { email: email.trim(), locale };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpCountdown(60);
        setStatusMsg({
          type: "success",
          text: data.message || (isJa ? "認証コード（6桁）をご指定のメールへ送信しました。" : "Đã gửi mã OTP."),
        });
      } else {
        setStatusMsg({
          type: "error",
          text: data.error || (isJa ? "認証コードの送信に失敗しました。「名刺・書類審査」タブもお試しいただけます。" : "Gửi mã OTP thất bại."),
        });
      }
    } catch {
      setStatusMsg({ type: "error", text: isJa ? "通信エラーが発生しました。" : "Lỗi kết nối máy chủ." });
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 1-B: Handle File Upload for Document/Meishi
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setStatusMsg({ type: "error", text: isJa ? "ファイルサイズは8MB以下にしてください。" : "Kích thước tệp tối đa 8MB." });
      return;
    }
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setDocBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 1-C: Submit Document Claim Request
  const handleSubmitDocumentClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docApplicantName.trim()) {
      setStatusMsg({ type: "error", text: isJa ? "申請者のお名前をご入力ください。" : "Vui lòng nhập tên người xin xác thực." });
      return;
    }
    if (!email || !email.includes("@")) {
      setStatusMsg({ type: "error", text: isJa ? "ご連絡用メールアドレスを入力してください。" : "Vui lòng nhập email liên hệ." });
      return;
    }
    if (!docBase64) {
      setStatusMsg({ type: "error", text: isJa ? "名刺または登記簿謄本等の証明画像を選択してください。" : "Vui lòng đính kèm hình ảnh Danh thiếp hoặc giấy tờ." });
      return;
    }

    setSubmittingDoc(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/companies/claim-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate_number: corporateNumber,
          company_name: companyName,
          email: email.trim(),
          applicant_name: docApplicantName.trim(),
          applicant_phone: docApplicantPhone.trim(),
          department: docDepartment.trim(),
          document_url: docBase64,
          document_type: docType,
          notes: docNotes.trim(),
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDocSubmittedSuccess(true);
        setStatusMsg({
          type: "success",
          text: data.message || (isJa ? "書類審査の申請を受け付けました！" : "Yêu cầu đã được tiếp nhận!"),
        });
      } else {
        setStatusMsg({ type: "error", text: data.error || (isJa ? "申請に失敗しました。" : "Gửi yêu cầu thất bại.") });
      }
    } catch {
      setStatusMsg({ type: "error", text: isJa ? "通信エラーが発生しました。" : "Lỗi kết nối máy chủ." });
    } finally {
      setSubmittingDoc(false);
    }
  };

  // Step 2: Complete Gatekeeper Verification
  const handleVerifyGatekeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!personInCharge.trim()) {
      setStatusMsg({ type: "error", text: isJa ? "担当者名を入力してください。" : "Vui lòng nhập họ tên người phụ trách." });
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setStatusMsg({ type: "error", text: isJa ? "有効なメールアドレスを入力してください。" : "Email không hợp lệ." });
      return;
    }

    if (!tokenFromUrl && (!otpCode || otpCode.length !== 6)) {
      setStatusMsg({ type: "error", text: isJa ? "メールに届いた6桁の認証コードを入力してください。" : "Vui lòng nhập mã OTP 6 số." });
      return;
    }

    setSavingPr(true);
    try {
      const res = await fetch("/api/companies/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate_number: corporateNumber,
          email: email.trim(),
          person_in_charge: personInCharge.trim(),
          department: department.trim(),
          phone: mobilePhone.trim(),
          otp_code: otpCode.trim(),
          claim_token: tokenFromUrl || undefined,
          pr_title: prTitle.trim(),
          pr_message: prMessage.trim(),
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setStatusMsg({
          type: "success",
          text: isJa
            ? "公式オーナー認証が完了しました！管理パネルが利用可能です。"
            : "Xác minh chính chủ thành công! Bảng điều khiển quản trị đã mở khóa.",
        });
        if (onSuccess) onSuccess();
      } else {
        setStatusMsg({ type: "error", text: data.error || (isJa ? "認証に失敗しました。" : "Xác minh thất bại.") });
      }
    } catch {
      setStatusMsg({ type: "error", text: isJa ? "通信エラーが発生しました。" : "Lỗi kết nối máy chủ." });
    } finally {
      setSavingPr(false);
    }
  };

  // Action Tab 1: Save PR Message
  const handleSavePr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPr(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/companies/claim", {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({
          corporate_number: corporateNumber,
          email: user?.email || email.trim() || initialEmail || "admin@kigyoulist.com",
          person_in_charge: personInCharge.trim() || user?.name || "管理者 (Admin)",
          pr_title: prTitle.trim(),
          pr_message: prMessage.trim(),
          claim_token: tokenFromUrl || undefined,
          otp_code: isUserAdmin ? undefined : (otpCode || undefined),
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.auto_approved)) {
        setStatusMsg({ 
          type: "success", 
          text: data.message || (isJa ? "PRメッセージを保存しました！" : "Đã lưu thông điệp PR thành công!") 
        });
        if (onSuccess) onSuccess();
      } else {
        setStatusMsg({ type: "error", text: data.error || (isJa ? "保存に失敗しました。" : "Lưu thất bại.") });
      }
    } finally {
      setSavingPr(false);
    }
  };

  // Check if contact email is being modified
  const isEmailChanged = Boolean(
    contactEmail.trim() &&
    contactEmail.trim().toLowerCase() !== (initialEmail || "").trim().toLowerCase()
  );

  const handleSendEmailOtp = async () => {
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setStatusMsg({
        type: "error",
        text: isJa ? "有効なメールアドレスを入力してください。" : "Vui lòng nhập địa chỉ email hợp lệ.",
      });
      return;
    }
    setSendingEmailOtp(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/inquiry/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contactEmail.trim(), locale }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailOtpSent(true);
        setEmailOtpCountdown(60);
        setStatusMsg({
          type: "success",
          text: isJa
            ? `新しいメールアドレス（${contactEmail.trim()}）宛に認証コードを送信しました。受信トレイをご確認ください。`
            : `Đã gửi mã xác thực OTP 6 số đến email mới: ${contactEmail.trim()}`,
        });
      } else {
        setStatusMsg({
          type: "error",
          text: data.error || (isJa ? "認証コードの送信に失敗しました。" : "Không thể gửi mã OTP."),
        });
      }
    } catch {
      setStatusMsg({
        type: "error",
        text: isJa ? "通信エラーが発生しました。" : "Lỗi kết nối máy chủ.",
      });
    } finally {
      setSendingEmailOtp(false);
    }
  };

  // Action Tab 2: Update Company Basic Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    setStatusMsg(null);
    try {
      // RULE: Sửa email bắt buộc nhập OTP cho user thường (Admin được miễn trừ OTP)
      if (isEmailChanged && !isUserAdmin && (!emailOtpCode || emailOtpCode.trim().length < 6)) {
        setStatusMsg({
          type: "error",
          text: isJa
            ? "メールアドレスを変更する場合は、新しいメール宛に送信された認証コード（6桁）の入力が必須です。"
            : "Để sửa email, bạn bắt buộc phải nhập mã OTP 6 chữ số gửi về email mới.",
        });
        setSavingInfo(false);
        return;
      }

      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({
          corporate_number: corporateNumber,
          company_name: companyName,
          type: "update",
          requester_email: user?.email || email.trim() || initialEmail || "admin@kigyoulist.com",
          person_in_charge: personInCharge.trim() || user?.name || "管理者 (Admin)",
          mobile_number: mobilePhone.trim() || phone.trim() || "0300000000",
          phone_number: phone.trim(),
          website_url: website.trim(),
          email_address: contactEmail.trim(),
          fax_number: fax.trim(),
          representative_name: representative.trim(),
          pr_title: prTitle.trim(),
          pr_message: prMessage.trim(),
          verify_website_url: verifyWebsite.trim() || website.trim() || "https://kigyoulist.com",
          email_otp_code: isUserAdmin ? undefined : (isEmailChanged ? emailOtpCode.trim() : undefined),
          otp_code: isUserAdmin ? undefined : (isEmailChanged ? emailOtpCode.trim() : undefined),
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.auto_approved || data.autoApproved)) {
        setStatusMsg({
          type: "success",
          text: data.message || (isJa
            ? "企業情報が正常に更新・反映されました！"
            : "Thông tin doanh nghiệp đã được cập nhật thành công!"),
        });
        if (onSuccess) onSuccess();
      } else {
        setStatusMsg({ type: "error", text: data.error || (isJa ? "更新に失敗しました。" : "Cập nhật thất bại.") });
      }
    } finally {
      setSavingInfo(false);
    }
  };

  // Action Tab 3: Delisting Request
  const handleUnpublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(isJa ? "本当にこの企業ページの非公開（掲載停止）を申請しますか？" : "Bạn có chắc chắn muốn yêu cầu gỡ bỏ trang này?")) {
      return;
    }
    setSubmittingHide(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({
          corporate_number: corporateNumber,
          company_name: companyName,
          type: "hide",
          requester_email: user?.email || email.trim() || initialEmail || "admin@kigyoulist.com",
          person_in_charge: personInCharge.trim() || user?.name || "管理者 (Admin)",
          mobile_number: mobilePhone.trim() || "0300000000",
          message: `${hideReason} - ${hideMessage}`,
          otp_code: isUserAdmin ? undefined : (otpCode || "000000"),
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.auto_approved || data.autoApproved)) {
        setStatusMsg({
          type: "success",
          text: data.message || (isJa ? "掲載停止の申請を受け付けました。" : "Đã tiếp nhận yêu cầu gỡ bỏ trang."),
        });
        if (onSuccess) onSuccess();
      } else {
        setStatusMsg({ type: "error", text: data.error || (isJa ? "申請に失敗しました。" : "Yêu cầu thất bại.") });
      }
    } finally {
      setSubmittingHide(false);
    }
  };

  const embedSnippet = `<a href="https://kigyoulist.com/ja/company/${corporateNumber}" target="_blank" rel="noopener noreferrer">\n  <img src="https://kigyoulist.com/icon.svg" alt="${companyName} - Kigyou-List公式認証" width="120" height="36" />\n</a>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* B2B Deep Navy Header */}
        <div className="bg-[#1B4F8A] p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue-200" />
            </div>
            <div className="min-w-0 pr-8">
              {isUserAdmin ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-200 text-[10px] font-semibold border border-amber-300/30 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> {isJa ? "管理者特権モード（即時反映）" : "Chế độ Quản trị viên (Lưu trực tiếp)"}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/15 text-blue-100 text-[10px] font-semibold border border-white/20 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> {isJa ? "公式認証・情報管理" : "Quản trị chính chủ"}
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">{isJa ? "公式企業管理・認証センター" : "Trung tâm Quản lý Chính chủ Doanh nghiệp"}</h2>
            </div>
          </div>
          <p className="text-xs text-blue-100/90 mt-2 font-medium">
            {isJa ? "対象企業: " : "Doanh nghiệp: "}<strong>{companyName}</strong> <span className="font-mono">({isJa ? "法人番号: " : "Mã số: "}{corporateNumber})</span>
            {isUserAdmin && <span className="ml-2 font-semibold text-amber-200">{isJa ? "※管理者権限で直接編集可能" : "※Quyền Quản trị viên"}</span>}
          </p>
        </div>

        {/* Global Alert Message */}
        {statusMsg && (
          <div
            className={`px-6 py-3 text-xs font-medium flex items-center gap-2 border-b ${
              statusMsg.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-850"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-850"
            }`}
          >
            {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800 dark:text-slate-200">
          {!isLoggedIn ? (
            /* STEP 0: NOT LOGGED IN -> REQUIRE ACCOUNT LOGIN */
            <div className="py-6 px-2 sm:px-6 text-center space-y-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 mb-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  {isJa ? "ステップ 1 / 2: アカウント認証" : isVi ? "Bước 1 / 2: Xác thực tài khoản" : "Step 1 / 2: Account Authentication"}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {isJa ? "企業公式アカウントへのログインが必要です" : isVi ? "Yêu cầu đăng nhập tài khoản sở hữu doanh nghiệp" : "Company Account Login Required"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isJa
                    ? "貴社の公式PR掲載や登録情報の更新・管理を行うには、アカウントへのログイン（または新規無料登録）が必要です。企業担当者としてログイン後、所有権の認証または管理画面をご利用いただけます。"
                    : isVi
                    ? "Để đăng tải thông điệp PR chính thức và quản trị thông tin doanh nghiệp, bạn cần đăng nhập tài khoản sở hữu doanh nghiệp này (hoặc đăng ký miễn phí)."
                    : "Please sign in or create a free account to verify ownership and manage your company PR and official profile."}
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-1 max-w-sm mx-auto flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isJa ? "Googleでログイン / 新規登録 (1秒で完了)" : isVi ? "Đăng nhập nhanh với Google" : "Continue with Google"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-[#1B4F8A] hover:bg-[#163e6d] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <span>{isJa ? "メールアドレスでログイン / 無料登録" : isVi ? "Đăng nhập bằng Email / Mật khẩu" : "Sign in with Email"}</span>
                </button>
              </div>

              {/* Benefits badge */}
              <div className="pt-2 max-w-md mx-auto text-left bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {isJa ? "企業公式認証・PR掲載のメリット" : "Lợi ích khi xác thực và đăng PR"}
                </div>
                <ul className="space-y-1.5 pl-1 text-[11px] leading-relaxed">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{isJa ? "貴社ページ最上部に「公式認証企業」バッジとPR文を常時無料掲載" : "Hiển thị huy hiệu và thông điệp PR nổi bật"}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{isJa ? "電話番号・URL等の即時修正、不要情報の非公開申請に対応" : "Chủ động cập nhật liên hệ hoặc gỡ thông tin"}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{isJa ? "企業リストの無料ダウンロード枠が毎日 20件 → 50件/日 に永久拡大" : "Nhận 50 lượt tải danh bạ doanh nghiệp miễn phí mỗi ngày"}</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : isClaimedByOther ? (
            /* STEP 0B: LOGGED IN BUT CLAIMED BY ANOTHER PERSON */
            <div className="py-6 px-2 sm:px-6 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {isJa ? "この企業ページは既に他の公式担当者により認証済みです" : "Doanh nghiệp này đã được đại diện khác xác thực"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isJa
                    ? `この企業（法人番号: ${corporateNumber}）は、既に別の認証アカウント（${maskEmail(claimedByEmail)}）によって管理されています。現在のアカウント（${user?.email}）では直接編集できません。`
                    : `Doanh nghiệp này đã được xác thực bởi tài khoản (${maskEmail(claimedByEmail)}).`}
                </p>
                <div className="mt-4 p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-300 text-left">
                  {isJa
                    ? "※ 貴社ご本人様で担当者交代や管理者権限の譲渡をご希望の場合は、企業ドメインのメールアドレスより事務局サポートまでご連絡ください。"
                    : "Nếu bạn là đại diện mới cần tiếp quản quyền quản trị, vui lòng liên hệ bộ phận hỗ trợ."}
                </div>
              </div>
            </div>
          ) : !isAuthenticated ? (
            /* STEP 1: GATEKEEPER / STAKEHOLDER VERIFICATION */
            <div className="space-y-4">
              {/* Highlight Quota Upgrade Perk */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100 dark:border-blue-900/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {isJa ? "【公式認証パートナー限定特典】" : "Đặc quyền Đối tác Xác minh"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {isJa ? "1日50件無料" : "50 lượt tải/ngày"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {isJa
                      ? "企業の公式本人確認を行い、ページを公開維持していただくことで、毎日の企業リスト無料ダウンロード枠が 20件 → 50件/日（月間1,500件） に永久アップグレードされます。"
                      : "Xác minh chính chủ và duy trì hồ sơ công khai để nhận ngay 50 lượt tải danh bạ doanh nghiệp miễn phí mỗi ngày (thay vì 20 lượt)."}
                  </p>
                </div>
              </div>

              {tokenFromUrl && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>専用認証リンクを確認いたしました。ワンクリックで認証可能です。</span>
                </div>
              )}

              {/* Dual Mode Switcher (Domain vs Document) */}
              {!tokenFromUrl && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setVerifyMode("domain")}
                    className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      verifyMode === "domain"
                        ? "bg-white dark:bg-slate-700 text-[#1B4F8A] dark:text-blue-300 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>⚡ WEBドメイン認証（即時30秒）</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyMode("document")}
                    className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      verifyMode === "document"
                        ? "bg-white dark:bg-slate-700 text-[#1B4F8A] dark:text-blue-300 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📁 名刺・書類審査（24h以内）</span>
                  </button>
                </div>
              )}

              {verifyMode === "domain" || Boolean(tokenFromUrl) ? (
                /* OPTION A: INSTANT DOMAIN / EMAIL OTP VERIFICATION */
                <form onSubmit={handleVerifyGatekeeper} className="space-y-3.5">
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    企業WEBサイトのドメインと一致する公式メールアドレス宛に、即時認証コードを送信します。
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      企業公式サイトURL <span className="text-slate-400 font-normal">（ドメイン照合用）</span>
                    </label>
                    <input
                      type="url"
                      value={domainWebsite}
                      onChange={(e) => setDomainWebsite(e.target.value)}
                      placeholder="https://example.co.jp"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ご担当者様 氏名 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={personInCharge}
                        onChange={(e) => setPersonInCharge(e.target.value)}
                        placeholder="例: 山田 太郎"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        部署・役職
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="例: 広報部 / 代表取締役"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        連絡先電話番号
                      </label>
                      <input
                        type="tel"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value)}
                        placeholder="例: 03-1234-5678"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        公式企業メールアドレス <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@example.co.jp"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>

                  {!tokenFromUrl && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          メール認証コード確認
                        </span>
                        <button
                          type="button"
                          onClick={handleSendDomainOtp}
                          disabled={sendingOtp || otpCountdown > 0}
                          className="px-3 py-1.5 bg-[#1B4F8A] hover:bg-[#163e6d] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {sendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : otpCountdown > 0 ? `再送待機 (${otpCountdown}s)` : otpSent ? "コード再送" : "認証コードを送信"}
                        </button>
                      </div>

                      {otpSent && (
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="メール記載の6桁コードを入力"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                        />
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingPr}
                    className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#163e6d] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {savingPr ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    本人確認を完了し、管理パネルを開く
                  </button>
                </form>
              ) : (
                /* OPTION B: DOCUMENT / BUSINESS CARD MANUAL REVIEW */
                <div>
                  {docSubmittedSuccess ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-center space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">
                        審査申請を受付いたしました
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        ご提出いただきました書類をもとに、運営事務局にて本人確認を行います。通常<strong>24時間以内</strong>に審査結果をメールでお知らせいたします。
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-[#1B4F8A] hover:bg-[#163e6d] text-white text-xs font-semibold rounded-lg mt-1"
                      >
                        閉じる
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitDocumentClaim} className="space-y-3.5">
                      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        WEBサイトをお持ちでない場合や、Gmail等のメールをご利用の場合は、<strong>名刺</strong>または<strong>登記簿謄本</strong>の画像をアップロードして申請いただけます。
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            申請者様のお名前 <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={docApplicantName}
                            onChange={(e) => setDocApplicantName(e.target.value)}
                            placeholder="例: 佐藤 健一"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            部署・役職
                          </label>
                          <input
                            type="text"
                            value={docDepartment}
                            onChange={(e) => setDocDepartment(e.target.value)}
                            placeholder="例: 営業総括 / 代表取締役"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            連絡先電話番号
                          </label>
                          <input
                            type="tel"
                            value={docApplicantPhone}
                            onChange={(e) => setDocApplicantPhone(e.target.value)}
                            placeholder="例: 090-1234-5678"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            ご連絡用メールアドレス <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your-email@gmail.com"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          提出書類の種類 <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={docType}
                          onChange={(e: any) => setDocType(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                        >
                          <option value="business_card">名刺（氏名・会社名・電話番号記載）</option>
                          <option value="registry">履歴事項全部証明書・登記簿謄本</option>
                          <option value="employee_id">社員証・身分証明書</option>
                          <option value="other">その他公的証明書類</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          証明書類ファイル（画像 / PDF） <span className="text-rose-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                          <input
                            type="file"
                            required
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                            <Upload className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                            {docFileName ? (
                              <span className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400">
                                選択済み: {docFileName}
                              </span>
                            ) : (
                              <>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  ファイルを選択またはドラッグ＆ドロップ
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  PNG, JPG, PDF（最大8MB）
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          補足事項・連絡事項（任意）
                        </label>
                        <input
                          type="text"
                          value={docNotes}
                          onChange={(e) => setDocNotes(e.target.value)}
                          placeholder="例: 代表取締役に代わり総務部より申請いたします。"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingDoc || !docBase64}
                        className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#163e6d] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {submittingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        審査申請を送信する（通常24h以内に完了）
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: ALL-IN-ONE 3-TAB MANAGEMENT DASHBOARD */
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("badge_pr")}
                  className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeTab === "badge_pr"
                      ? "border-[#1B4F8A] text-[#1B4F8A] dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  1. 公式認証 & PR
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("edit_info")}
                  className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeTab === "edit_info"
                      ? "border-[#1B4F8A] text-[#1B4F8A] dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <FileEdit className="w-4 h-4" />
                  2. 連絡先・基本情報更新
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("unpublish")}
                  className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeTab === "unpublish"
                      ? "border-rose-600 text-rose-600 dark:text-rose-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                  3. 掲載停止（非公開）
                </button>
              </div>

              {/* SUBTAB 1: BADGE & PR */}
              {activeTab === "badge_pr" && (
                <form onSubmit={handleSavePr} className="space-y-5">
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          公式認証バッジ: 有効化済み
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          貴社ページ上部に「公式認証企業」バッジが常時表示されます。
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      企業PR キャッチコピー
                    </label>
                    <input
                      type="text"
                      value={prTitle}
                      onChange={(e) => setPrTitle(e.target.value)}
                      placeholder="例: 創業50年の信頼と技術力で製造DXを加速"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      公式PRメッセージ（アピール・採用・主軸サービス紹介）
                    </label>
                    <textarea
                      rows={4}
                      value={prMessage}
                      onChange={(e) => setPrMessage(e.target.value)}
                      placeholder="貴社の事業の強みや取引先候補・求職者に向けたメッセージをご自由にご入力ください。認証ページの上部に掲載されます。"
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-none"
                    />
                  </div>

                  {/* Embed Snippet */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Code className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                        自社ホームページ用 認証バッジ埋め込みタグ (任意)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(embedSnippet);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="text-xs text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? "コピー完了" : "コードをコピー"}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 overflow-x-auto text-slate-600 dark:text-slate-400">
                      {embedSnippet}
                    </pre>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPr}
                    className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#163e6d] text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                  >
                    {savingPr ? <Loader2 className="w-4 h-4 animate-spin" /> : "PRメッセージを保存する"}
                  </button>
                </form>
              )}

              {/* SUBTAB 2: EDIT INFO */}
              {activeTab === "edit_info" && (
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {isJa ? "電話番号（代表・問い合わせ先）" : "Số điện thoại (Đại diện/Liên hệ)"}
                        </label>
                        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {isJa ? "✓ 即時更新（OTP不要）" : "✓ Cập nhật ngay"}
                        </span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="03-1234-5678"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-none"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {isJa 
                          ? "※固定電話・代表ダイヤルは認証コード不要で即座に保存・反映されます。" 
                          : "※Số điện thoại cố định cập nhật ngay không cần mã xác thực OTP."}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        FAX番号
                      </label>
                      <input
                        type="tel"
                        value={fax}
                        onChange={(e) => setFax(e.target.value)}
                        placeholder="03-1234-5679"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        公式ウェブサイトURL
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {isJa ? "問い合わせ用メールアドレス" : "Email liên hệ chính thức"}
                        </label>
                        {isEmailChanged && (
                          isUserAdmin ? (
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              {isJa ? "✓ 管理者特権: OTP不要（即時反映）" : "✓ Quản trị viên: Không cần OTP"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                              {isJa ? "⚠️ 要OTP認証（なりすまし防止）" : "⚠️ Bắt buộc OTP xác thực"}
                            </span>
                          )
                        )}
                      </div>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@example.com"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-none"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {isUserAdmin
                          ? (isJa ? "※管理者アカウントのため、認証コード不要で直接保存されます。" : "※Được lưu trực tiếp bởi tài khoản Quản trị viên không cần OTP.")
                          : (isJa 
                              ? "※メールアドレス変更時は、なりすまし・偽装防止のため新メール宛のOTP認証が必須です。" 
                              : "※Khi đổi email, bắt buộc phải xác thực mã OTP gửi về email mới.")}
                      </p>
                    </div>
                  </div>

                  {/* OTP Verification Box for New Email Address (Non-Admin only) */}
                  {isEmailChanged && !isUserAdmin && (
                    <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>{isJa ? "新しいメールアドレスの本人確認（OTP認証）" : "Xác thực OTP cho email mới"}</span>
                        </div>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">{isJa ? "※必須項目" : "※Bắt buộc"}</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        {isJa
                          ? "不正なメールアドレス登録やなりすましを防ぐため、新しいメールアドレス宛に届く6桁の認証コードを入力してください。"
                          : "Để bảo vệ dữ liệu và tránh nhập email giả mạo, bạn cần xác thực mã OTP 6 chữ số gửi về địa chỉ email mới này."}
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtpCode}
                          onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder={isJa ? "6桁の認証コード" : "Mã OTP 6 số"}
                          className="w-36 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-mono tracking-widest text-center focus:ring-1 focus:ring-[#1B4F8A] font-bold outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={sendingEmailOtp || emailOtpCountdown > 0 || !contactEmail.includes("@")}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          {sendingEmailOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          <span>{emailOtpCountdown > 0 ? `${emailOtpCountdown}s` : emailOtpSent ? (isJa ? "再送信" : "Gửi lại") : (isJa ? "認証コードを送信" : "Gửi mã OTP")}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Admin Notice for Email Change */}
                  {isEmailChanged && isUserAdmin && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isJa 
                        ? "管理者アカウントとして操作中のため、新メール宛のOTP認証は免除され、即座に保存されます。" 
                        : "Thao tác bởi Quản trị viên: Miễn trừ xác thực OTP cho email mới, lưu trực tiếp vào cơ sở dữ liệu."}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      代表者 氏名
                    </label>
                    <input
                      type="text"
                      value={representative}
                      onChange={(e) => setRepresentative(e.target.value)}
                      placeholder="代表取締役 田中 太郎"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#163e6d] text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                  >
                    {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : "基本情報を即時更新する"}
                  </button>
                </form>
              )}

              {/* SUBTAB 3: UNPUBLISH */}
              {activeTab === "unpublish" && (
                <form onSubmit={handleUnpublish} className="space-y-4">
                  <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                      <EyeOff className="w-4 h-4 text-rose-600" />
                      <span>企業ページの非公開（掲載取り下げ）について</span>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                      公知データに基づく情報ですが、当事者様からのご要望に基づき直ちに非公開処理を実行いたします。
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      掲載停止の主な理由
                    </label>
                    <select
                      value={hideReason}
                      onChange={(e) => setHideReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    >
                      <option value="代表者・担当者からの要請">代表者・公式担当者からの要請</option>
                      <option value="廃業・解散済み">既に事業を廃止・解散しているため</option>
                      <option value="プライバシー・セキュリティ保護">プライバシー・セキュリティ保護のため</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      詳細な補足事項（任意）
                    </label>
                    <textarea
                      rows={3}
                      value={hideMessage}
                      onChange={(e) => setHideMessage(e.target.value)}
                      placeholder="補足の事情等があればご記入ください。"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingHide}
                    className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                  >
                    {submittingHide ? <Loader2 className="w-4 h-4 animate-spin" /> : "掲載停止（非公開）を実行する"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
