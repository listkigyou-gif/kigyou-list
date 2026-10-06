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
  onSuccess,
}) => {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();

  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // Active sub-tab inside management modal
  const [activeTab, setActiveTab] = useState<"badge_pr" | "edit_info" | "unpublish">("badge_pr");

  // Authentication State
  const tokenFromUrl = searchParams.get("claim_token") || "";
  const emailFromUrl = searchParams.get("email") || initialEmail || "";

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isClaimed || Boolean(tokenFromUrl));
  const [personInCharge, setPersonInCharge] = useState("");
  const [department, setDepartment] = useState("広報・総務部");
  const [email, setEmail] = useState(emailFromUrl);
  const [mobilePhone, setMobilePhone] = useState("");

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
      if (isClaimed || Boolean(tokenFromUrl)) {
        setIsAuthenticated(true);
      }
    }
  }, [isOpen, isClaimed, tokenFromUrl]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate_number: corporateNumber,
          email: email.trim() || initialEmail || "admin@kigyoulist.com",
          person_in_charge: personInCharge.trim() || "公式担当者",
          pr_title: prTitle.trim(),
          pr_message: prMessage.trim(),
          claim_token: tokenFromUrl || undefined,
          otp_code: otpCode || undefined,
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: "success", text: isJa ? "PRメッセージを保存しました！" : "Đã lưu thông điệp PR thành công!" });
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
      // RULE: Sửa email bắt buộc nhập OTP, còn sđt sửa ko cần thiết nhận OTP
      if (isEmailChanged && (!emailOtpCode || emailOtpCode.trim().length < 6)) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate_number: corporateNumber,
          company_name: companyName,
          type: "update",
          requester_email: email.trim() || initialEmail,
          person_in_charge: personInCharge.trim() || "公式担当者",
          mobile_number: mobilePhone.trim() || phone.trim() || "0300000000",
          phone_number: phone.trim(),
          website_url: website.trim(),
          email_address: contactEmail.trim(),
          fax_number: fax.trim(),
          representative_name: representative.trim(),
          verify_website_url: verifyWebsite.trim() || website.trim() || "https://kigyoulist.com",
          email_otp_code: isEmailChanged ? emailOtpCode.trim() : undefined,
          otp_code: isEmailChanged ? emailOtpCode.trim() : undefined,
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.auto_approved || data.autoApproved)) {
        setStatusMsg({
          type: "success",
          text: isJa
            ? "企業情報が正常に更新・反映されました！"
            : "Thông tin doanh nghiệp đã được cập nhật thành công!",
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate_number: corporateNumber,
          company_name: companyName,
          type: "hide",
          requester_email: email.trim() || initialEmail,
          person_in_charge: personInCharge.trim() || "公式担当者",
          mobile_number: mobilePhone.trim() || "0300000000",
          message: `${hideReason} - ${hideMessage}`,
          otp_code: otpCode || "000000",
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: "success",
          text: isJa ? "掲載停止の申請を受け付けました。" : "Đã tiếp nhận yêu cầu gỡ bỏ trang.",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase border border-white/20 mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> 完全無料・企業公式ポータル
              </div>
              <h2 className="text-xl font-black tracking-tight">{isJa ? "公式企業管理・認証センター" : "Trung tâm Quản lý Chính chủ Doanh nghiệp"}</h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 mt-2 font-medium">
            対象企業: <strong>{companyName}</strong> (法人番号: {corporateNumber})
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200">
          {!isAuthenticated ? (
            /* STEP 1: GATEKEEPER / STAKEHOLDER VERIFICATION */
            <div className="space-y-5">
              {/* Highlight Quota Upgrade Perk */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      {isJa ? "【公式認証パートナー限定特典】" : "Đặc quyền Đối tác Xác minh"}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      {isJa ? "1日50件無料" : "50 lượt tải/ngày"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {isJa
                      ? "企業の公式本人確認を行い、ページを公開維持していただくことで、毎日の企業リスト無料ダウンロード枠が 20件 → 50件/日（月間1,500件） に永久アップグレードされます。"
                      : "Xác minh chính chủ và duy trì hồ sơ công khai để nhận ngay 50 lượt tải danh bạ doanh nghiệp miễn phí mỗi ngày (thay vì 20 lượt)."}
                  </p>
                </div>
              </div>

              {tokenFromUrl && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>専用認証リンクを確認いたしました。ワンクリックで認証可能です。</span>
                </div>
              )}

              {/* Dual Mode Switcher (Domain vs Document) */}
              {!tokenFromUrl && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setVerifyMode("domain")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      verifyMode === "domain"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>⚡ WEBドメイン認証（即時30秒）</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyMode("document")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      verifyMode === "document"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📁 名刺・書類審査（24h以内）</span>
                  </button>
                </div>
              )}

              {verifyMode === "domain" || Boolean(tokenFromUrl) ? (
                /* OPTION A: INSTANT DOMAIN / EMAIL OTP VERIFICATION */
                <form onSubmit={handleVerifyGatekeeper} className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    企業WEBサイトのドメインと一致する公式メールアドレス宛に、即時認証コードを送信します。
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      企業公式サイトURL <span className="text-slate-400 font-normal">（ドメイン照合用）</span>
                    </label>
                    <input
                      type="url"
                      value={domainWebsite}
                      onChange={(e) => setDomainWebsite(e.target.value)}
                      placeholder="https://example.co.jp"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ご担当者様 氏名 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={personInCharge}
                        onChange={(e) => setPersonInCharge(e.target.value)}
                        placeholder="例: 山田 太郎"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        部署・役職
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="例: 広報部 / 代表取締役"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        連絡先電話番号
                      </label>
                      <input
                        type="tel"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value)}
                        placeholder="例: 03-1234-5678"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        公式企業メールアドレス <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@example.co.jp"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  {!tokenFromUrl && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          メール認証コード確認
                        </span>
                        <button
                          type="button"
                          onClick={handleSendDomainOtp}
                          disabled={sendingOtp || otpCountdown > 0}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
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
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono tracking-widest text-center font-bold focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingPr}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {savingPr ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    本人確認を完了し、管理パネルを開く
                  </button>
                </form>
              ) : (
                /* OPTION B: DOCUMENT / BUSINESS CARD MANUAL REVIEW */
                <div>
                  {docSubmittedSuccess ? (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        審査申請を受付いたしました
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        ご提出いただきました書類をもとに、運営事務局にて本人確認を行います。通常<strong>24時間以内</strong>に審査結果をメールでお知らせいたします。
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl mt-2"
                      >
                        閉じる
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitDocumentClaim} className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        WEBサイトをお持ちでない場合や、Gmail等のメールをご利用の場合は、<strong>名刺</strong>または<strong>登記簿謄本</strong>の画像をアップロードして申請いただけます。
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            申請者様のお名前 <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={docApplicantName}
                            onChange={(e) => setDocApplicantName(e.target.value)}
                            placeholder="例: 佐藤 健一"
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            部署・役職
                          </label>
                          <input
                            type="text"
                            value={docDepartment}
                            onChange={(e) => setDocDepartment(e.target.value)}
                            placeholder="例: 営業総括 / 代表取締役"
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            連絡先電話番号
                          </label>
                          <input
                            type="tel"
                            value={docApplicantPhone}
                            onChange={(e) => setDocApplicantPhone(e.target.value)}
                            placeholder="例: 090-1234-5678"
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            ご連絡用メールアドレス <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your-email@gmail.com"
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          提出書類の種類 <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={docType}
                          onChange={(e: any) => setDocType(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="business_card">名刺（氏名・会社名・電話番号記載）</option>
                          <option value="registry">履歴事項全部証明書・登記簿謄本</option>
                          <option value="employee_id">社員証・身分証明書</option>
                          <option value="other">その他公的証明書類</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          証明書類ファイル（画像 / PDF） <span className="text-rose-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                          <input
                            type="file"
                            required
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                            <Upload className="w-5 h-5 text-emerald-600" />
                            {docFileName ? (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                選択済み: {docFileName}
                              </span>
                            ) : (
                              <>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          補足事項・連絡事項（任意）
                        </label>
                        <input
                          type="text"
                          value={docNotes}
                          onChange={(e) => setDocNotes(e.target.value)}
                          placeholder="例: 代表取締役に代わり総務部より申請いたします。"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingDoc || !docBase64}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
                  className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeTab === "badge_pr"
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  1. 公式認証 & PR
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("edit_info")}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeTab === "edit_info"
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <FileEdit className="w-4 h-4" />
                  2. 連絡先・基本情報更新
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("unpublish")}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeTab === "unpublish"
                      ? "border-rose-500 text-rose-600 dark:text-rose-400"
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
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          公式認証バッジ: 有効化済み
                        </div>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                          貴社ページ上部に「公式認証企業」バッジが常時表示されます。
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      企業PR キャッチコピー
                    </label>
                    <input
                      type="text"
                      value={prTitle}
                      onChange={(e) => setPrTitle(e.target.value)}
                      placeholder="例: 創業50年の信頼と技術力で製造DXを加速"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      公式PRメッセージ（アピール・採用・主軸サービス紹介）
                    </label>
                    <textarea
                      rows={4}
                      value={prMessage}
                      onChange={(e) => setPrMessage(e.target.value)}
                      placeholder="貴社の事業の強みや取引先候補・求職者に向けたメッセージをご自由にご入力ください。認証ページの上部に掲載されます。"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Embed Snippet */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Code className="w-4 h-4 text-blue-500" />
                        自社ホームページ用 認証バッジ埋め込みタグ (任意)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(embedSnippet);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? "コピー完了" : "コードをコピー"}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto text-slate-600 dark:text-slate-400">
                      {embedSnippet}
                    </pre>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPr}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {savingPr ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "PRメッセージを保存する"}
                  </button>
                </form>
              )}

              {/* SUBTAB 2: EDIT INFO */}
              {activeTab === "edit_info" && (
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isJa ? "電話番号（代表・問い合わせ先）" : "Số điện thoại (Đại diện/Liên hệ)"}
                        </label>
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          {isJa ? "✓ 即時更新（OTP不要）" : "✓ Cập nhật ngay (Không cần OTP)"}
                        </span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="03-1234-5678"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {isJa 
                          ? "※固定電話・代表ダイヤルは認証コード不要で即座に保存・反映されます。" 
                          : "※Số điện thoại cố định cập nhật ngay không cần mã xác thực OTP."}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        FAX番号
                      </label>
                      <input
                        type="tel"
                        value={fax}
                        onChange={(e) => setFax(e.target.value)}
                        placeholder="03-1234-5679"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        公式ウェブサイトURL
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isJa ? "問い合わせ用メールアドレス" : "Email liên hệ chính thức"}
                        </label>
                        {isEmailChanged && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                            {isJa ? "⚠️ 要OTP認証（なりすまし防止）" : "⚠️ Bắt buộc OTP xác thực"}
                          </span>
                        )}
                      </div>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@example.com"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {isJa 
                          ? "※メールアドレス変更時は、なりすまし・偽装防止のため新メール宛のOTP認証が必須です。" 
                          : "※Khi đổi email, bắt buộc phải xác thực mã OTP gửi về email mới."}
                      </p>
                    </div>
                  </div>

                  {/* OTP Verification Box for New Email Address */}
                  {isEmailChanged && (
                    <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
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
                          className="w-36 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-mono tracking-widest text-center focus:ring-2 focus:ring-amber-500 font-bold"
                        />
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={sendingEmailOtp || emailOtpCountdown > 0 || !contactEmail.includes("@")}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          {sendingEmailOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          <span>{emailOtpCountdown > 0 ? `${emailOtpCountdown}s` : emailOtpSent ? (isJa ? "再送信" : "Gửi lại") : (isJa ? "認証コードを送信" : "Gửi mã OTP")}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      代表者 氏名
                    </label>
                    <input
                      type="text"
                      value={representative}
                      onChange={(e) => setRepresentative(e.target.value)}
                      placeholder="代表取締役 田中 太郎"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {savingInfo ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "基本情報を即時更新する"}
                  </button>
                </form>
              )}

              {/* SUBTAB 3: UNPUBLISH */}
              {activeTab === "unpublish" && (
                <form onSubmit={handleUnpublish} className="space-y-4">
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                      <EyeOff className="w-4 h-4 text-rose-600" />
                      <span>企業ページの非公開（掲載取り下げ）について</span>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                      公知データに基づく情報ですが、当事者様からのご要望に基づき直ちに非公開処理を実行いたします。
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      掲載停止の主な理由
                    </label>
                    <select
                      value={hideReason}
                      onChange={(e) => setHideReason(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="代表者・担当者からの要請">代表者・公式担当者からの要請</option>
                      <option value="廃業・解散済み">既に事業を廃止・解散しているため</option>
                      <option value="プライバシー・セキュリティ保護">プライバシー・セキュリティ保護のため</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      詳細な補足事項（任意）
                    </label>
                    <textarea
                      rows={3}
                      value={hideMessage}
                      onChange={(e) => setHideMessage(e.target.value)}
                      placeholder="補足の事情等があればご記入ください。"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingHide}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {submittingHide ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "掲載停止（非公開）を実行する"}
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
