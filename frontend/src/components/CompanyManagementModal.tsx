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
  Save,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  ArrowRight,
  Code,
  Copy,
  Check,
  AlertCircle,
  FileEdit,
  EyeOff,
  Eye,
  Lock,
  KeyRound,
  Upload,
  FileText,
  Image as ImageIcon,
  Sparkles,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import { CompanyOwnershipClaimForm } from "./CompanyOwnershipClaimForm";

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
  initialRepresentativePosition?: string | null;
  initialPrTitle?: string | null;
  initialPrMessage?: string | null;
  initialContactFormUrl?: string | null;
  initialRecruitUrl?: string | null;
  initialKana?: string | null;
  initialEn?: string | null;
  initialPostalCode?: string | null;
  initialAddress?: string | null;
  initialCapital?: number | string | null;
  initialEmployees?: number | string | null;
  initialSales?: number | string | null;
  initialFiscalMonth?: string | null;
  initialDescription?: string | null;
  initialMainClients?: string | null;
  initialMainBanks?: string | null;
  initialSnsLinks?: string | null;
  isClaimed?: boolean;
  claimedByEmail?: string | null;
  initialGuestMode?: boolean;
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
  initialRepresentativePosition = "",
  initialPrTitle = "",
  initialPrMessage = "",
  initialContactFormUrl = "",
  initialRecruitUrl = "",
  initialKana = "",
  initialEn = "",
  initialPostalCode = "",
  initialAddress = "",
  initialCapital = "",
  initialEmployees = "",
  initialSales = "",
  initialFiscalMonth = "",
  initialDescription = "",
  initialMainClients = "",
  initialMainBanks = "",
  initialSnsLinks = "",
  isClaimed = false,
  claimedByEmail = null,
  initialGuestMode = false,
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

  // Guest Direct Inquiry State (No login required - APPI Compliance)
  const [isGuestInquiryMode, setIsGuestInquiryMode] = useState<boolean>(Boolean(initialGuestMode));
  const [guestInquiryType, setGuestInquiryType] = useState<"update" | "hide">("update");
  const [guestName, setGuestName] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestMessage, setGuestMessage] = useState<string>("");
  const [guestAgree, setGuestAgree] = useState<boolean>(true);
  const [guestSubmitting, setGuestSubmitting] = useState<boolean>(false);
  const [guestSubmitted, setGuestSubmitted] = useState<boolean>(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  // Unified Field Validation Errors (Red Border + Inline Message)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 2-Tier JSIC Industry Hierarchy State (大分類 -> 中分類)
  interface MediumIndustryOption {
    code: string;
    name: string;
    count?: number;
  }
  interface MajorIndustryOption {
    code: string;
    name: string;
    totalCount?: number;
    children: MediumIndustryOption[];
  }
  const [industriesHierarchy, setIndustriesHierarchy] = useState<MajorIndustryOption[]>([]);
  const [selectedMajorCode, setSelectedMajorCode] = useState<string>("");
  const [selectedMediumName, setSelectedMediumName] = useState<string>("");

  // Normalization Helpers (全角 -> 半角, ひらがな -> カタカナ, 円単位プレビュー)
  const toHalfWidth = (str: string): string => {
    return str
      .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[ー−―‐]/g, "-")
      .replace(/　/g, " ");
  };

  const toDigitsOnly = (str: string): string => {
    return toHalfWidth(str).replace(/[^0-9]/g, "");
  };

  const hiraganaToKatakana = (str: string): string => {
    return str.replace(/[\u3041-\u3096]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
  };

  const formatJpyPreview = (rawDigits: string): string | null => {
    const clean = rawDigits.replace(/[^0-9]/g, "");
    if (!clean) return null;
    const num = Number(clean);
    if (!Number.isFinite(num) || num <= 0) return null;
    const oku = Math.floor(num / 100_000_000);
    const man = Math.floor((num % 100_000_000) / 10_000);
    const rest = num % 10_000;
    const parts: string[] = [];
    if (oku > 0) parts.push(`${oku.toLocaleString()}億`);
    if (man > 0) parts.push(`${man.toLocaleString()}万`);
    if (rest > 0 || parts.length === 0) parts.push(`${rest.toLocaleString()}`);
    return `${parts.join("")}円 (${num.toLocaleString()}円)`;
  };

  const validateSingleField = (fieldKey: string, val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return null; // Empty optional fields are valid unless required check fails

    switch (fieldKey) {
      case "guestEmail":
      case "contactEmail":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return isJa
            ? "正しいメールアドレス形式（半角英数字、例: info@example.co.jp）で入力してください。"
            : "Vui lòng nhập đúng định dạng email (VD: info@example.co.jp).";
        }
        return null;
      case "guestPhone":
      case "phone":
      case "fax":
        if (!/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(trimmed)) {
          return isJa
            ? "正しい日本の電話番号・FAX形式（半角数字とハイフン、例: 03-1234-5678）で入力してください。"
            : "Vui lòng nhập số điện thoại/FAX chuẩn Nhật Bản (bắt đầu bằng số 0, VD: 03-1234-5678).";
        }
        return null;
      case "website":
        if (!/^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/\S*)?$/.test(trimmed)) {
          return isJa
            ? "「https://」または「http://」から始まる正しいURLを入力してください。"
            : "Vui lòng nhập URL hợp lệ bắt đầu bằng https:// hoặc http://.";
        }
        return null;
      case "nameKana":
        if (!/^[ァ-ヶー・\s　A-Za-z0-9＆．・]+$/.test(trimmed)) {
          return isJa
            ? "会社名（フリガナ）は全角カタカナで入力してください（例: カブシキガイシャサンプル）。"
            : "Tên Furigana phải được nhập bằng chữ Katakana (VD: カブシキガイシャサンプル).";
        }
        return null;
      case "nameEn":
        if (!/^[a-zA-Z0-9\s.,&'()\-/]+$/.test(trimmed)) {
          return isJa
            ? "英語社名表記は半角英数字・記号のみで入力してください（例: Sample Inc.）。"
            : "Tên tiếng Anh chỉ được chứa ký tự chữ cái Latinh, số và ký hiệu chuẩn (VD: Sample Inc.).";
        }
        return null;
      case "capitalAmount":
        if (!/^\d+$/.test(trimmed) || Number(trimmed) > 100_000_000_000_000) {
          return isJa
            ? "資本金は半角数字（円単位の整数）のみで入力してください。"
            : "Vốn điều lệ chỉ được nhập số nguyên (đơn vị Yên).";
        }
        return null;
      case "employeeCount":
        if (!/^\d+$/.test(trimmed) || Number(trimmed) > 5_000_000) {
          return isJa
            ? "従業員数は半角数字（名単位の整数）のみで入力してください。"
            : "Số lượng nhân viên chỉ được nhập số nguyên.";
        }
        return null;
      case "salesAmount":
        if (!/^\d+$/.test(trimmed) || Number(trimmed) > 1_000_000_000_000_000) {
          return isJa
            ? "最新売上高は半角数字（円単位の整数）のみで入力してください。"
            : "Doanh thu chỉ được nhập số nguyên (đơn vị Yên).";
        }
        return null;
      default:
        return null;
    }
  };

  const updateFieldError = (fieldKey: string, val: string) => {
    const err = validateSingleField(fieldKey, val);
    setFieldErrors((prev) => {
      if (!err && !prev[fieldKey]) return prev;
      const next = { ...prev };
      if (err) {
        next[fieldKey] = err;
      } else {
        delete next[fieldKey];
      }
      return next;
    });
  };

  const getInputClass = (fieldKey: string, extraClasses = "") => {
    const hasErr = Boolean(fieldErrors[fieldKey]);
    return `w-full px-3 py-1.5 text-xs rounded-lg border transition-colors focus:outline-none ${hasErr
        ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 text-slate-900 dark:text-white ring-1 ring-rose-500 focus:ring-rose-600"
        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
      } ${extraClasses}`;
  };

  const renderFieldError = (fieldKey: string) => {
    if (!fieldErrors[fieldKey]) return null;
    return (
      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        <span>{fieldErrors[fieldKey]}</span>
      </p>
    );
  };

  // Sync mode & load JSIC industries hierarchy when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialGuestMode) {
        setActiveTab("edit_info");
        setGuestInquiryType("update");
      } else {
        setActiveTab("badge_pr");
      }
      setIsGuestInquiryMode(Boolean(initialGuestMode));
      setGuestSubmitted(false);
      setGuestError(null);
      setFieldErrors({});

      if (industriesHierarchy.length === 0) {
        fetch("/api/metadata/industries")
          .then((r) => r.json())
          .then((res) => {
            if (Array.isArray(res)) {
              setIndustriesHierarchy(res);
            } else if (res?.success && Array.isArray(res.data)) {
              setIndustriesHierarchy(res.data);
            }
          })
          .catch(() => { });
      }
    }
  }, [isOpen, initialGuestMode, industriesHierarchy.length]);

  const validateAllFormFields = (mode: "guest" | "owner"): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (mode === "guest") {
      if (!guestName.trim()) {
        errs.guestName = isJa ? "申請者のお名前・部署役職をご入力ください。" : "Vui lòng nhập họ tên & chức vụ.";
      }
      if (!guestEmail.trim()) {
        errs.guestEmail = isJa ? "ご連絡先メールアドレスをご入力ください。" : "Vui lòng nhập email liên hệ.";
      } else {
        const eErr = validateSingleField("guestEmail", guestEmail);
        if (eErr) errs.guestEmail = eErr;
      }
      const gpErr = validateSingleField("guestPhone", guestPhone);
      if (gpErr) errs.guestPhone = gpErr;
    }

    const keysToValidate: Array<[string, string]> = [
      ["phone", phone],
      ["fax", fax],
      ["website", website],
      ["contactEmail", contactEmail],
      ["nameKana", nameKana],
      ["nameEn", nameEn],
      ["capitalAmount", capitalAmount],
      ["employeeCount", employeeCount],
      ["salesAmount", salesAmount],
    ];

    for (const [k, v] of keysToValidate) {
      const err = validateSingleField(k, v);
      if (err) errs[k] = err;
    }

    return errs;
  };

  const handleGuestInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError(null);

    if (!guestAgree) {
      setGuestError(
        isJa
          ? "個人情報の取り扱いおよび利用規約への同意が必要です。"
          : isVi
            ? "Vui lòng đồng ý với Điều khoản và Chính sách bảo mật."
            : "Please agree to the privacy policy."
      );
      return;
    }

    if (guestInquiryType === "update") {
      const validationErrors = validateAllFormFields("guest");
      setFieldErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        setGuestError(
          isJa
            ? "入力内容に誤りがあります。赤枠で表示された項目をご確認の上、正しい形式で入力してください。"
            : isVi
              ? "Có trường thông tin nhập chưa đúng định dạng. Vui lòng kiểm tra các ô tô đỏ bên dưới."
              : "Please fix the highlighted validation errors before submitting."
        );
        return;
      }

      const candidateFields: Record<string, [string, string]> = {
        phone_number: [phone, initialPhone || ""],
        fax_number: [fax, initialFax || ""],
        website_url: [website, initialWebsite || ""],
        email_address: [contactEmail, initialEmail || ""],
        representative_position: [representativePosition, initialRepresentativePosition || ""],
        representative_name: [representative, initialRepresentative || ""],
        company_name_kana: [nameKana, initialKana || ""],
        company_name_en: [nameEn, initialEn || ""],
        full_address: [address, initialAddress || ""],
        capital_amount: [capitalAmount, initialCapital ? String(initialCapital) : ""],
        employee_count: [employeeCount, initialEmployees ? String(initialEmployees) : ""],
        sales_amount: [salesAmount, initialSales ? String(initialSales) : ""],
        fiscal_month: [fiscalMonth, initialFiscalMonth || ""],
        jigyo_shumoku: [description, initialDescription || ""],
        main_clients: [mainClients, initialMainClients || ""],
        main_banks: [mainBanks, initialMainBanks || ""],
        sns_links: [snsLinks, initialSnsLinks || ""],
      };

      const changedUpdates: Record<string, string> = {};
      for (const [key, [currVal, initVal]] of Object.entries(candidateFields)) {
        if (currVal.trim() !== String(initVal).trim() && currVal.trim() !== "") {
          changedUpdates[key] = currVal.trim();
        }
      }

      if (Object.keys(changedUpdates).length === 0 && !guestMessage.trim()) {
        setGuestError(
          isJa
            ? "修正したい項目を少なくとも1つ書き換えるか、補足事項欄に修正内容をご入力ください。"
            : isVi
              ? "Vui lòng chỉnh sửa ít nhất 1 trường thông tin hoặc nhập nội dung cần sửa."
              : "Please modify at least one field or enter details."
        );
        return;
      }

      setGuestSubmitting(true);
      try {
        const payload = Object.keys(changedUpdates).length > 0
          ? {
            type: "update",
            is_guest_submission: true,
            corporate_number: corporateNumber,
            company_name: companyName,
            person_in_charge: guestName.trim(),
            requester_email: guestEmail.trim(),
            mobile_number: guestPhone.trim(),
            updates: changedUpdates,
            website_url: website.trim(),
            message: guestMessage.trim(),
            locale,
          }
          : {
            type: "company_manage",
            corporate_number: corporateNumber,
            company_name: companyName,
            person_in_charge: guestName.trim(),
            requester_email: guestEmail.trim(),
            mobile_number: guestPhone.trim(),
            message: [
              "【掲載情報の修正依頼（一般受付・アカウント不要）】",
              `【対象企業】${companyName} (${corporateNumber})`,
              guestPhone.trim() ? `【連絡先電話番号】${guestPhone.trim()}` : "",
              `\n【修正希望内容】\n${guestMessage.trim()}`
            ].filter(Boolean).join("\n"),
            locale,
          };

        const res = await fetch("/api/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setGuestSubmitted(true);
        } else {
          setGuestError(data.error || (isJa ? "申請の送信に失敗しました。時間をおいて再度お試しください。" : "Gửi yêu cầu thất bại."));
        }
      } catch (err: any) {
        setGuestError(err?.message || (isJa ? "エラーが発生しました。" : "Có lỗi xảy ra."));
      } finally {
        setGuestSubmitting(false);
      }
      return;
    }

    // Hide / Opt-out submission: validate applicant info first
    const hideErrs: Record<string, string> = {};
    if (!guestName.trim()) {
      hideErrs.guestName = isJa ? "申請者のお名前・部署役職をご入力ください。" : "Vui lòng nhập họ tên.";
    }
    const emailErr = validateSingleField("guestEmail", guestEmail);
    if (!guestEmail.trim() || emailErr) {
      hideErrs.guestEmail = emailErr || (isJa ? "ご連絡先メールアドレスをご入力ください。" : "Vui lòng nhập email.");
    }
    const phoneErr = validateSingleField("guestPhone", guestPhone);
    if (phoneErr) hideErrs.guestPhone = phoneErr;
    setFieldErrors(hideErrs);
    if (Object.keys(hideErrs).length > 0) {
      setGuestError(
        isJa
          ? "申請者情報に誤りがあります。赤枠の項目をご確認ください。"
          : "Vui lòng kiểm tra lại thông tin người yêu cầu."
      );
      return;
    }

    if (!guestMessage.trim() && !hideReason) {
      setGuestError(
        isJa ? "掲載停止の理由をご入力ください。" : "Vui lòng chọn hoặc nhập lý do gỡ bỏ."
      );
      return;
    }

    setGuestSubmitting(true);
    try {
      const compiledHideMsg = [
        `【掲載停止の主な理由】${hideReason}`,
        guestPhone.trim() ? `【連絡先電話番号】${guestPhone.trim()}` : "",
        guestMessage.trim() ? `【詳細・補足事項】\n${guestMessage.trim()}` : "",
      ].filter(Boolean).join("\n");

      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hide",
          is_guest_submission: true,
          corporate_number: corporateNumber,
          company_name: companyName,
          person_in_charge: guestName.trim(),
          requester_email: guestEmail.trim(),
          mobile_number: guestPhone.trim(),
          message: compiledHideMsg,
          locale,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGuestSubmitted(true);
      } else {
        setGuestError(data.error || (isJa ? "申請の送信に失敗しました。時間をおいて再度お試しください。" : "Gửi yêu cầu thất bại."));
      }
    } catch (err: any) {
      setGuestError(err?.message || (isJa ? "エラーが発生しました。" : "Có lỗi xảy ra."));
    } finally {
      setGuestSubmitting(false);
    }
  };

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

  // Tab 2: Edit Info states (Expanded B2B fields)
  const [phone, setPhone] = useState(initialPhone || "");
  const [website, setWebsite] = useState(initialWebsite || "");
  const [contactEmail, setContactEmail] = useState(initialEmail || "");
  const [fax, setFax] = useState(initialFax || "");
  const [contactFormUrl, setContactFormUrl] = useState(initialContactFormUrl || "");
  const [recruitUrl, setRecruitUrl] = useState(initialRecruitUrl || "");
  const [branchPhone, setBranchPhone] = useState("");

  const [nameKana, setNameKana] = useState(initialKana || "");
  const [nameEn, setNameEn] = useState(initialEn || "");
  const [postalCode, setPostalCode] = useState(initialPostalCode || "");
  const [address, setAddress] = useState(initialAddress || "");

  const [representativePosition, setRepresentativePosition] = useState(initialRepresentativePosition || "");
  const [representative, setRepresentative] = useState(initialRepresentative || "");
  const [establishmentDate, setEstablishmentDate] = useState("");

  const [capitalAmount, setCapitalAmount] = useState(initialCapital ? String(initialCapital) : "");
  const [employeeCount, setEmployeeCount] = useState(initialEmployees ? String(initialEmployees) : "");
  const [salesAmount, setSalesAmount] = useState(initialSales ? String(initialSales) : "");
  const [fiscalMonth, setFiscalMonth] = useState(initialFiscalMonth || "");

  const [description, setDescription] = useState(initialDescription || "");
  const [mainClients, setMainClients] = useState(initialMainClients || "");
  const [mainBanks, setMainBanks] = useState(initialMainBanks || "");
  const [snsLinks, setSnsLinks] = useState(initialSnsLinks || "");

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
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [submittingHide, setSubmittingHide] = useState(false);

  // General messaging
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCorpNum, setCopiedCorpNum] = useState(false);

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
      if (user?.email) {
        setEmail(user.email);
        setGuestEmail((prev) => prev || user.email || "");
      }
      if (user?.name) {
        setGuestName((prev) => prev || user.name || "");
      }
      if (isUserAdmin && user?.email) {
        if (!personInCharge) setPersonInCharge(user.name || "管理者");
      } else if (isOwner && user?.email) {
        if (!personInCharge && user.name) setPersonInCharge(user.name);
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

  // Action Tab 1: Save PR Message (100% Admin Moderation for non-admins)
  const handleSavePr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPr(true);
    setStatusMsg(null);
    try {
      if (!isUserAdmin) {
        const res = await fetch("/api/inquiry", {
          method: "POST",
          headers: getRequestHeaders(),
          body: JSON.stringify({
            corporate_number: corporateNumber,
            company_name: companyName,
            type: "update",
            requester_email: user?.email || email.trim() || initialEmail || "",
            person_in_charge: personInCharge.trim() || user?.name || "公式オーナー",
            mobile_number: mobilePhone.trim() || phone.trim() || "03-0000-0000",
            updates: {
              pr_title: prTitle.trim(),
              pr_message: prMessage.trim(),
            },
            pr_title: prTitle.trim(),
            pr_message: prMessage.trim(),
            locale,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatusMsg({
            type: "success",
            text:
              data.message ||
              (isJa
                ? "PRメッセージの更新申請を受け付けました。運営事務局の審査・承認後に公式ページへ反映されます。"
                : "Đã gửi yêu cầu cập nhật thông điệp PR. Nội dung sẽ hiển thị sau khi Quản trị viên duyệt."),
          });
          if (onSuccess) onSuccess();
        } else {
          setStatusMsg({ type: "error", text: data.error || (isJa ? "申請に失敗しました。" : "Gửi yêu cầu thất bại.") });
        }
        return;
      }

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
    setStatusMsg(null);

    const validationErrors = validateAllFormFields("owner");
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setStatusMsg({
        type: "error",
        text: isJa
          ? "入力内容に誤りがあります。赤枠で表示された項目をご確認の上、正しい形式で入力してください。"
          : isVi
            ? "Có trường thông tin nhập chưa đúng định dạng. Vui lòng kiểm tra các ô tô đỏ bên dưới."
            : "Please fix the highlighted validation errors before submitting.",
      });
      return;
    }

    setSavingInfo(true);
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
          mobile_number: mobilePhone.trim() || phone.trim() || "03-0000-0000",
          phone_number: phone.trim(),
          website_url: website.trim(),
          email_address: contactEmail.trim(),
          fax_number: fax.trim(),
          branch_phone_numbers: branchPhone.trim(),
          company_name_kana: nameKana.trim(),
          company_name_en: nameEn.trim(),
          postal_code: postalCode.trim(),
          street_address: address.trim(),
          full_address: address.trim(),
          representative_position: representativePosition.trim(),
          representative_name: representative.trim(),
          establishment_date: establishmentDate.trim(),
          capital_amount: capitalAmount.trim(),
          employee_count: employeeCount.trim(),
          sales_amount: salesAmount.trim(),
          fiscal_month: fiscalMonth.trim(),
          jigyo_shumoku: description.trim(),
          business_summary: description.trim(),
          main_clients: mainClients.trim(),
          main_banks: mainBanks.trim(),
          sns_links: snsLinks.trim(),
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
            ? "企業情報の更新申請を受け付けました。運営事務局の審査・承認後に公式反映されます。"
            : "Đã tiếp nhận yêu cầu cập nhật thông tin doanh nghiệp!"),
        });
        if (onSuccess) onSuccess();
      } else {
        setStatusMsg({ type: "error", text: data.error || (isJa ? "更新申請に失敗しました。" : "Cập nhật thất bại.") });
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
          mobile_number: mobilePhone.trim() || "03-0000-0000",
          message: `${hideReason} - ${hideMessage}`,
          otp_code: isUserAdmin ? undefined : (otpCode || "000000"),
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.auto_approved || data.autoApproved)) {
        setStatusMsg({
          type: "success",
          text: data.message || (isJa ? "掲載停止の申請を受け付けました。運営事務局の審査後に非公開化されます。" : "Đã tiếp nhận yêu cầu gỡ bỏ trang."),
        });
        if (onSuccess) onSuccess();
      } else {
        setStatusMsg({ type: "error", text: data.error || (isJa ? "申請に失敗しました。" : "Yêu cầu thất bại.") });
      }
    } finally {
      setSubmittingHide(false);
    }
  };

  // Standardized 2-Tier JSIC Industry Tag Selector Logic
  const selectedIndustryTags = description
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const currentMajorObj = industriesHierarchy.find(
    (m) => m.code === selectedMajorCode
  );
  const availableMediumOptions = currentMajorObj ? currentMajorObj.children : [];

  const handleMajorCategoryChange = (majorCode: string) => {
    setSelectedMajorCode(majorCode);
    const major = industriesHierarchy.find((m) => m.code === majorCode);
    if (major && major.children.length > 0) {
      setSelectedMediumName(major.children[0].name);
    } else {
      setSelectedMediumName("");
    }
  };

  const handleAddIndustryTag = () => {
    if (!selectedMediumName) return;
    if (selectedIndustryTags.includes(selectedMediumName)) return;
    if (selectedIndustryTags.length >= 10) return;
    const nextTags = [...selectedIndustryTags, selectedMediumName];
    setDescription(nextTags.join(", "));
  };

  const handleRemoveIndustryTag = (tagToRemove: string) => {
    const nextTags = selectedIndustryTags.filter((t) => t !== tagToRemove);
    setDescription(nextTags.join(", "));
  };

  const renderIndustrySelector = () => (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
          {isJa
            ? "事業内容・主要サービス（日本標準産業分類 大分類・中分類）"
            : isVi
              ? "Ngành nghề kinh doanh chính (Chuẩn phân ngành Nhật Bản)"
              : "Business Categories (Standard JSIC Classification)"}
        </label>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          {selectedIndustryTags.length} / 10
        </span>
      </div>

      {/* Currently Selected Industry Tags */}
      <div className="min-h-[42px] p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex flex-wrap items-center gap-1.5">
        {selectedIndustryTags.length > 0 ? (
          selectedIndustryTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 border border-[#1B4F8A]/25 dark:border-blue-800"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveIndustryTag(tag)}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-bold leading-none cursor-pointer px-0.5"
                title={isJa ? "この業種を削除" : "Xóa ngành này"}
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {isJa
              ? "現在登録されている業種はありません。下のプルダウンから大分類・中分類を選択して追加してください。"
              : "Chưa có ngành nghề nào được chọn. Hãy chọn Ngành lớn và Ngành nhỏ bên dưới để thêm."}
          </span>
        )}
      </div>

      {/* 2-Tier Dropdown Add Control */}
      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 space-y-2">
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          {isJa
            ? "＋ 標準業種マスターから追加（選択するとデータベースの業種コードと自動同期されます）"
            : "＋ Thêm ngành nghề theo chuẩn hệ thống:"}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-5">
            <select
              value={selectedMajorCode}
              onChange={(e) => handleMajorCategoryChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
            >
              <option value="">
                {isJa ? "1. 大分類を選択..." : "1. Chọn ngành lớn..."}
              </option>
              {industriesHierarchy.map((major) => (
                <option key={major.code} value={major.code}>
                  [{major.code}] {major.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-5">
            <select
              value={selectedMediumName}
              onChange={(e) => setSelectedMediumName(e.target.value)}
              disabled={!selectedMajorCode}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
            >
              <option value="">
                {selectedMajorCode
                  ? isJa
                    ? "2. 中分類を選択..."
                    : "2. Chọn ngành nhỏ..."
                  : isJa
                    ? "先に大分類を選択してください"
                    : "Chọn ngành lớn trước"}
              </option>
              {availableMediumOptions.map((med) => (
                <option key={med.code} value={med.name}>
                  [{med.code}] {med.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddIndustryTag}
              disabled={!selectedMediumName || selectedIndustryTags.includes(selectedMediumName) || selectedIndustryTags.length >= 10}
              className="w-full h-full py-1.5 px-2.5 bg-[#1B4F8A] hover:bg-[#163e6d] disabled:opacity-40 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
            >
              {isJa ? "＋ 追加" : "＋ Thêm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const fiscalMonthOptions = [
    "",
    "1月決算",
    "2月決算",
    "3月決算",
    "4月決算",
    "5月決算",
    "6月決算",
    "7月決算",
    "8月決算",
    "9月決算",
    "10月決算",
    "11月決算",
    "12月決算",
  ];

  const embedSnippet = `<a href="https://kigyoulist.com/ja/company/${corporateNumber}" target="_blank" rel="noopener noreferrer">\n  <img src="https://kigyoulist.com/icon.svg" alt="${companyName} - Kigyou-List公式認証" width="120" height="36" />\n</a>`;


  // Sub-renderers for different tabs and states
  const renderClaimedByOther = () => (
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

  );

  const renderGatekeeper = () => (
    <CompanyOwnershipClaimForm
      isEmbedded={true}
      corporateNumber={corporateNumber}
      companyName={companyName}
      websiteUrl={initialWebsite || domainWebsite}
      phone={initialPhone || phone}
      initialPrTitle={prTitle || initialPrTitle}
      initialPrMessage={prMessage || initialPrMessage}
      claimToken={tokenFromUrl}
      onInstantVerified={() => {
        setIsAuthenticated(true);
        setStatusMsg({
          type: "success",
          text: isJa
            ? "公式オーナー認証が完了しました！管理パネルが利用可能です。"
            : "Xác minh chính chủ thành công! Bảng điều khiển quản trị đã mở khóa.",
        });
      }}
      onSuccess={(reqId) => {
        setStatusMsg({
          type: "success",
          text: isJa
            ? `審査申請を受付いたしました（申請番号 #${reqId || "OK"}）。`
            : "Đã tiếp nhận hồ sơ xác minh chính chủ.",
        });
      }}
    />
  );

  const renderGuestSubmittedSuccess = () => (
    <div className="py-8 px-4 text-center space-y-5">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {isJa ? "申請を受け付けました（一般受付完了）" : isVi ? "Yêu cầu đã được tiếp nhận thành công" : "Request Submitted Successfully"}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {isJa
            ? "ご入力いただいたメールアドレス宛に受付完了メールをお送りいたしました。日本国個人情報保護法（APPI）および当社の情報管理方針に基づき、運営事務局にて内容を確認の上、通常1〜2営業日以内に対応・ご連絡いたします。"
            : isVi
              ? "Chúng tôi đã gửi email xác nhận. Đơn vị quản trị sẽ kiểm tra và phản hồi trong vòng 1-2 ngày làm việc."
              : "A confirmation email has been sent. Our team will review and process your request within 1-2 business days."}
        </p>
      </div>
      <div className="pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
        >
          {isJa ? "閉じる" : isVi ? "Đóng cửa sổ" : "Close"}
        </button>
      </div>
    </div>

  );

  const renderGuestPrShowcase = () => (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Badge Status Banner (Refined B2B layout, no awkward line-breaks) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100 dark:border-blue-900/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isJa ? "公式認証バッジ: 未有効化（オーナー未登録）" : isVi ? "Huy hiệu xác minh: Chưa kích hoạt" : "Official Badge: Not Activated"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-750">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                Verified by https://kigyoulist.com/
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isJa
                ? "貴社公式アカウントで認証を完了すると、企業ページ最上部に「公式認証企業」バッジとPRメッセージが常時優先表示されます。"
                : isVi
                  ? "Sau khi xác thực chính chủ, huy hiệu 'Doanh nghiệp chính thức' và thông điệp PR sẽ hiển thị ưu tiên trên trang doanh nghiệp."
                  : "Once verified, an Official Badge and your customized PR message will appear prominently at the top of your company profile."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive PR message preview fields (Guest can type to test live) */}
      <div className="space-y-4 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xs">
        {/* Section Header: Stacked cleanly to prevent title & hint squeezing */}
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {isJa ? "公式PRメッセージ・キャッチコピー設定" : "Cài đặt thông điệp PR & Catchcopy"}
              </h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-semibold shrink-0">
                {isJa ? "お試し入力" : "Xem thử"}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isJa ? "リアルタイム反映中" : "Xem trước trực tiếp"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {isJa
              ? "以下の項目を入力すると、下の「掲載時プレビュー」に即時反映されます（認証完了後に本番公開可能）。"
              : "Nội dung nhập bên dưới sẽ tự động hiển thị ở khung xem trước theo thời gian thực."}
          </p>
        </div>

        {/* Input 1: Catchcopy */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
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
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
          />
        </div>

        {/* Input 2: PR Message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
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
            placeholder={isJa ? "貴社の事業の強みや取引先候補・求職者に向けたメッセージをご自由にご入力ください。認証ページの上部に掲載されます。" : "Giới thiệu thế mạnh, đối tác và thông điệp gửi tới khách hàng..."}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
          />
        </div>

        {/* 3. Live Preview Card on Company Page */}
        <div className="mt-2 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              {isJa ? "ページ掲載時プレビュー（イメージ）" : "Xem trước hiển thị trên trang doanh nghiệp"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              LIVE PREVIEW
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-emerald-800/80 rounded-lg p-3.5 space-y-2 shadow-2xs">
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
              <span>{isJa ? "自社ホームページ用 認証バッジ埋め込みタグ（任意）" : "Mã nhúng huy hiệu vào website"}</span>
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
              <span>{copiedCode ? (isJa ? "コピー完了" : "Đã chép") : (isJa ? "コードをコピー" : "Chép mã")}</span>
            </button>
          </div>

          {/* Clean Badge Preview Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isJa ? "表示プレビュー:" : "Xem trước hiển thị:"}
              </span>
              <span className="text-[10px] text-slate-400">
                {isJa ? "※自社サイトのフッター等に設置いただけます" : "※Có thể đặt ở footer website"}
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

      {/* High-Conversion B2B Login CTA Box */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-blue-50/70 to-slate-50/80 dark:from-blue-950/20 dark:to-slate-900/60 border border-blue-200/80 dark:border-blue-900/50 rounded-xl space-y-3.5 text-center">
        <div className="w-10 h-10 mx-auto rounded-xl bg-[#1B4F8A] text-white flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {isJa ? "公式アカウントでログインして認証を有効化" : "Đăng nhập tài khoản đại diện để kích hoạt"}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {isJa
              ? "公式認証を完了すると、上記で入力したPRメッセージが本番ページへ即時反映され、毎日の企業リスト無料ダウンロード枠が 50件/日（月間1,500件） に永久拡大されます。"
              : "Đăng nhập và xác thực đại diện doanh nghiệp để lưu thông điệp PR lên trang chính thức và nhận 50 lượt tải danh bạ miễn phí mỗi ngày."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="max-w-xs mx-auto flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => loginWithGoogle()}
            className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isJa ? "Googleでログイン・認証 (即時)" : "Đăng nhập nhanh với Google"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              setAuthModalOpen(true);
            }}
            className="w-full py-2.5 px-3 bg-[#1B4F8A] hover:bg-[#163e6d] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>{isJa ? "メールアドレスでログイン / 無料登録" : "Đăng nhập bằng Email"}</span>
          </button>

        </div>

        {/* Footer switch to Tab 2 */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{isJa ? "アカウント登録を行わずに修正を申請される場合: " : "Gửi yêu cầu không cần đăng nhập: "}</span>
          <button
            type="button"
            onClick={() => {
              setActiveTab("edit_info");
              setGuestInquiryType("update");
            }}
            className="text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            {isJa ? "「2. 掲載情報の修正（ログイン不要）」へ" : "Sang mục Sửa thông tin (Không cần login)"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderGuestEditForm = () => (
    <form onSubmit={handleGuestInquirySubmit} className="space-y-5">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
          <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          {isLoggedIn
            ? (isJa ? "掲載情報の修正・申請受付（本人確認書類不要）" : isVi ? "Đề nghị đính chính thông tin (Miễn nộp giấy tờ)" : "Information Update Request")
            : (isJa ? "ログイン不要・一般受付" : isVi ? "Tiếp nhận trực tiếp (Không cần đăng nhập)" : "Direct Request (No Login)")}
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2">
          {isJa ? "掲載情報の修正・更新申請" : isVi ? "Đề nghị đính chính thông tin" : "Request Information Update"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {isJa
            ? "日本国個人情報保護法（APPI）に基づき、アカウント登録を行わずに企業情報の修正・更新を事務局へ直接申請いただけます。"
            : isVi
              ? "Tuân thủ Luật APPI Nhật Bản: bạn có thể yêu cầu sửa đổi thông tin doanh nghiệp mà không cần tạo tài khoản."
              : "In compliance with APPI, you may request corrections directly without creating an account."}
        </p>
      </div>

      {!isAuthenticated && (
        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              {isJa
                ? "※ 本人確認書類の提出なしで直接申請いただけます。公式認証バッジの獲得や優先PRメッセージ掲載をご希望の場合は「1. 企業認証 & PR」タブより認証いただけます。"
                : isVi
                  ? "※ Bạn có thể gửi yêu cầu đính chính ngay mà không cần xác minh. Nếu muốn nhận huy hiệu chính thức, hãy sang tab 1."
                  : "※ You may submit updates directly without identity documents. To claim your Official Verified Badge, please visit Tab 1."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("badge_pr")}
            className="px-2.5 py-1 rounded bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-[11px] font-semibold shrink-0 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
          >
            {isJa ? "公式認証を見る" : "Xem xác minh"}
          </button>
        </div>
      )}

      {guestError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{guestError}</span>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
            <User className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{isJa ? "申請者・ご担当者様情報" : isVi ? "Thông tin người yêu cầu" : "Applicant Information"}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isJa ? "お名前・部署役職 *" : isVi ? "Họ tên & chức vụ *" : "Your Name & Title *"}
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (e.target.value.trim()) {
                    setFieldErrors((p) => {
                      const n = { ...p };
                      delete n.guestName;
                      return n;
                    });
                  }
                }}
                placeholder={isJa ? "山田 太郎（広報部）" : "Nguyễn Văn A"}
                className={getInputClass("guestName")}
              />
              {renderFieldError("guestName")}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isJa ? "ご連絡先メールアドレス *" : isVi ? "Email liên hệ *" : "Contact Email *"}
              </label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => {
                  const val = toHalfWidth(e.target.value).trim();
                  setGuestEmail(val);
                  updateFieldError("guestEmail", val);
                }}
                placeholder="name@company.co.jp"
                className={getInputClass("guestEmail")}
              />
              {renderFieldError("guestEmail")}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isJa ? "お電話番号（任意）" : isVi ? "Số điện thoại (tùy chọn)" : "Phone Number (Optional)"}
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => {
                  const val = toHalfWidth(e.target.value).replace(/\s+/g, "");
                  setGuestPhone(val);
                  updateFieldError("guestPhone", val);
                }}
                placeholder="03-1234-5678"
                className={getInputClass("guestPhone")}
              />
              {renderFieldError("guestPhone")}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="px-3 py-2 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
            {isJa
              ? "現在の登録情報が入力されています。修正・追加したい項目のみ直接書き換えて「申請を送信する」を押してください（運営事務局の審査・承認後に公式データベースへ反映されます）。"
              : isVi
                ? "Thông tin hiện tại đã được điền sẵn. Hãy sửa trực tiếp các ô bạn muốn cập nhật và nhấn Gửi yêu cầu (Sẽ cập nhật sau khi Quản trị viên duyệt)."
                : "Current values are pre-filled below. Edit any fields you wish to update and click Submit."}
          </div>

          {/* Section 1: 連絡先・Web情報 */}
          <div className="p-3.5 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-3 bg-white dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Globe className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isJa ? "1. 連絡先・公式ウェブサイト情報" : isVi ? "1. Liên hệ & Website chính thức" : "1. Contact & Website Details"}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "代表電話番号" : isVi ? "Số điện thoại đại diện" : "Main Phone Number"}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const val = toHalfWidth(e.target.value).replace(/\s+/g, "");
                    setPhone(val);
                    updateFieldError("phone", val);
                  }}
                  placeholder="03-1234-5678"
                  className={getInputClass("phone", "font-mono tabular-nums")}
                />
                {renderFieldError("phone")}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "FAX番号" : isVi ? "Số FAX" : "FAX Number"}
                </label>
                <input
                  type="tel"
                  value={fax}
                  onChange={(e) => {
                    const val = toHalfWidth(e.target.value).replace(/\s+/g, "");
                    setFax(val);
                    updateFieldError("fax", val);
                  }}
                  placeholder="03-1234-5679"
                  className={getInputClass("fax", "font-mono tabular-nums")}
                />
                {renderFieldError("fax")}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "公式ウェブサイトURL" : isVi ? "URL Website chính thức" : "Official Website URL"}
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => {
                    const val = toHalfWidth(e.target.value).trim();
                    setWebsite(val);
                    updateFieldError("website", val);
                  }}
                  placeholder="https://example.co.jp"
                  className={getInputClass("website", "font-mono")}
                />
                {renderFieldError("website")}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  {isJa
                    ? "※公式URLの登録・承認後、システムが自動でお問い合わせ窓口等を定期取得いたします。"
                    : "※Sau khi duyệt URL chính thức, hệ thống sẽ tự động thu thập form liên hệ."}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "代表メールアドレス（公開用）" : isVi ? "Email đại diện (công khai)" : "Public Contact Email"}
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => {
                    const val = toHalfWidth(e.target.value).trim();
                    setContactEmail(val);
                    updateFieldError("contactEmail", val);
                  }}
                  placeholder="info@example.co.jp"
                  className={getInputClass("contactEmail", "font-mono")}
                />
                {renderFieldError("contactEmail")}
              </div>
            </div>
          </div>

          {/* Section 2: 代表者・所在地・基本情報 */}
          <div className="p-3.5 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-3 bg-white dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Building className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isJa ? "2. 代表者・所在地・企業規模" : isVi ? "2. Người đại diện, Địa chỉ & Quy mô" : "2. Representative, Location & Scale"}</span>
            </div>
            <datalist id="rep-position-list">
              <option value="代表取締役" />
              <option value="代表取締役社長" />
              <option value="代表社員" />
              <option value="代表理事" />
              <option value="理事長" />
              <option value="執行役社長" />
              <option value="会長" />
            </datalist>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "代表者 役職" : isVi ? "Chức danh người đại diện" : "Representative Title"}
                </label>
                <input
                  type="text"
                  list="rep-position-list"
                  value={representativePosition}
                  onChange={(e) => setRepresentativePosition(e.target.value)}
                  placeholder={isJa ? "代表取締役" : "CEO"}
                  className={getInputClass("representativePosition")}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "代表者 氏名" : isVi ? "Họ tên người đại diện" : "Representative Name"}
                </label>
                <input
                  type="text"
                  value={representative}
                  onChange={(e) => setRepresentative(e.target.value)}
                  placeholder={isJa ? "山田 太郎" : "Taro Yamada"}
                  className={getInputClass("representative")}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "会社名（フリガナ・全角カタカナ）" : isVi ? "Tên công ty (Furigana Katakana)" : "Company Name (Kana)"}
                </label>
                <input
                  type="text"
                  value={nameKana}
                  onChange={(e) => {
                    const val = hiraganaToKatakana(e.target.value);
                    setNameKana(val);
                    updateFieldError("nameKana", val);
                  }}
                  placeholder={isJa ? "カブシキガイシャサンプル" : "カブシキガイシャ..."}
                  className={getInputClass("nameKana")}
                />
                {renderFieldError("nameKana")}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "英語社名表記（半角英数字）" : isVi ? "Tên tiếng Anh" : "English Company Name"}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => {
                    const val = toHalfWidth(e.target.value);
                    setNameEn(val);
                    updateFieldError("nameEn", val);
                  }}
                  placeholder="Sample Inc."
                  className={getInputClass("nameEn", "font-mono")}
                />
                {renderFieldError("nameEn")}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "所在地（本社・実働オフィス住所）" : isVi ? "Địa chỉ trụ sở / văn phòng" : "Headquarters / Office Address"}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isJa ? "東京都千代田区..." : "Tokyo..."}
                  className={getInputClass("address")}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "資本金（円・半角数字のみ）" : isVi ? "Vốn điều lệ (JPY)" : "Capital (JPY)"}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={capitalAmount}
                  onChange={(e) => {
                    const val = toHalfWidth(e.target.value).replace(/,/g, "").trim();
                    setCapitalAmount(val);
                    updateFieldError("capitalAmount", val);
                  }}
                  placeholder="10000000"
                  className={getInputClass("capitalAmount", "font-mono tabular-nums")}
                />
                {renderFieldError("capitalAmount")}
                {formatJpyPreview(capitalAmount) && !fieldErrors.capitalAmount && (
                  <p className="text-[10px] text-[#1B4F8A] dark:text-blue-400 font-medium mt-0.5">
                    ≈ {formatJpyPreview(capitalAmount)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "従業員数（名・半角数字のみ）" : isVi ? "Số lượng nhân viên" : "Employees"}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={employeeCount}
                  onChange={(e) => {
                    const val = toHalfWidth(e.target.value).replace(/,/g, "").trim();
                    setEmployeeCount(val);
                    updateFieldError("employeeCount", val);
                  }}
                  placeholder="50"
                  className={getInputClass("employeeCount", "font-mono tabular-nums")}
                />
                {renderFieldError("employeeCount")}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "最新売上高（円・半角数字のみ）" : isVi ? "Doanh thu gần nhất (JPY)" : "Latest Revenue (JPY)"}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={salesAmount}
                  onChange={(e) => {
                    const val = toHalfWidth(e.target.value).replace(/,/g, "").trim();
                    setSalesAmount(val);
                    updateFieldError("salesAmount", val);
                  }}
                  placeholder="500000000"
                  className={getInputClass("salesAmount", "font-mono tabular-nums")}
                />
                {renderFieldError("salesAmount")}
                {formatJpyPreview(salesAmount) && !fieldErrors.salesAmount && (
                  <p className="text-[10px] text-[#1B4F8A] dark:text-blue-400 font-medium mt-0.5">
                    ≈ {formatJpyPreview(salesAmount)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "決算期（決算月）" : isVi ? "Tháng quyết toán" : "Fiscal Month"}
                </label>
                <select
                  value={fiscalMonth}
                  onChange={(e) => setFiscalMonth(e.target.value)}
                  className={getInputClass("fiscalMonth")}
                >
                  <option value="">{isJa ? "未設定" : "Chưa thiết lập"}</option>
                  {fiscalMonth &&
                    !fiscalMonthOptions.includes(fiscalMonth) && (
                      <option value={fiscalMonth}>{fiscalMonth}</option>
                    )}
                  {fiscalMonthOptions.filter(Boolean).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: 事業内容・取引先・補足 */}
          <div className="p-3.5 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-3 bg-white dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <FileEdit className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isJa ? "3. 事業内容・取引先・補足連絡事項" : isVi ? "3. Ngành nghề kinh doanh & Ghi chú bổ sung" : "3. Business Categories & Additional Notes"}</span>
            </div>

            {/* Standardized 2-Tier JSIC Industry Tag Selector */}
            {renderIndustrySelector()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "主要取引先" : isVi ? "Khách hàng / Đối tác chính" : "Main Clients"}
                </label>
                <input
                  type="text"
                  value={mainClients}
                  onChange={(e) => setMainClients(e.target.value)}
                  placeholder={isJa ? "〇〇株式会社、△△株式会社" : "Đối tác chính..."}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "主要取引銀行" : isVi ? "Ngân hàng giao dịch chính" : "Main Banks"}
                </label>
                <input
                  type="text"
                  value={mainBanks}
                  onChange={(e) => setMainBanks(e.target.value)}
                  placeholder={isJa ? "三菱UFJ銀行、三井住友銀行" : "Ngân hàng..."}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isJa ? "その他・事務局への補足事項（任意）" : isVi ? "Ghi chú bổ sung cho Ban quản trị (tùy chọn)" : "Additional Notes for Admin (Optional)"}
              </label>
              <textarea
                rows={2}
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                placeholder={isJa ? "上記以外の修正希望や、事務局への連絡事項があればご記入ください。" : "Ghi chú thêm nếu có..."}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
              />
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={guestAgree}
            onChange={(e) => setGuestAgree(e.target.checked)}
            className="mt-0.5 rounded text-[#1B4F8A] focus:ring-[#1B4F8A]"
          />
          <span>
            {isJa
              ? "個人情報の取り扱いおよび利用規約に同意の上で送信します。"
              : "Đồng ý với Điều khoản sử dụng và Chính sách bảo mật."}
          </span>
        </label>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          {isJa ? "閉じる" : isVi ? "Đóng" : "Close"}
        </button>
        <button
          type="submit"
          disabled={guestSubmitting}
          className="w-full sm:flex-1 py-2.5 px-4 bg-[#1B4F8A] hover:bg-[#163e6d] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {guestSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isJa ? "送信中..." : isVi ? "Đang gửi..." : "Sending..."}</span>
            </>
          ) : (
            <span>{isJa ? "申請を送信する（無料）" : isVi ? "Gửi yêu cầu" : "Submit Request"}</span>
          )}
        </button>
      </div>
    </form>
  );

  const renderGuestUnpublishForm = () => (
    <form onSubmit={handleGuestInquirySubmit} className="space-y-4">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800">
          <EyeOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          {isLoggedIn
            ? (isJa ? "掲載停止・非公開受付（本人確認書類不要）" : isVi ? "Yêu cầu gỡ bỏ trang (Miễn nộp giấy tờ)" : "Profile Delisting Request")
            : (isJa ? "ログイン不要・オプトアウト" : isVi ? "Gỡ bỏ trực tiếp (Không cần đăng nhập)" : "Direct Delisting (No Login)")}
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2">
          {isJa ? "掲載停止・非公開（オプトアウト）申請" : isVi ? "Đề nghị gỡ bỏ thông tin doanh nghiệp" : "Request Profile Delisting"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {isJa
            ? "日本国個人情報保護法（APPI）に基づき、アカウント登録を行わずに企業情報の掲載取り下げ（オプトアウト）を事務局へ直接申請いただけます。"
            : isVi
              ? "Tuân thủ Luật APPI Nhật Bản: bạn có thể yêu cầu gỡ bỏ trang thông tin doanh nghiệp mà không cần tạo tài khoản."
              : "In compliance with APPI, you may request profile delisting directly without creating an account."}
        </p>
      </div>

      {guestError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{guestError}</span>
        </div>
      )}

      {/* Detailed Impact Warning Box */}
      <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{isJa ? "企業ページの非公開（掲載取り下げ）に関する注意事項" : "Lưu ý quan trọng khi yêu cầu gỡ bỏ trang"}</span>
        </div>
        <ul className="space-y-1 text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed list-disc list-inside">
          <li>{isJa ? "検索エンジン（Google・Bing等）のインデックス除外対象となります。" : "Trang doanh nghiệp sẽ được gửi yêu cầu gỡ bỏ khỏi Google & Bing."}</li>
          <li>{isJa ? "他社からの問い合わせ窓口や商談機会が閉鎖されます。" : "Mọi kênh liên hệ và thông điệp PR sẽ không còn hiển thị."}</li>
        </ul>
      </div>

      {/* Alternative Soft Solution Box */}
      <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-lg flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
          {isJa
            ? "※ 全体を非公開にせず、電話番号やメールアドレスのみを修正・非表示にすることも可能です。"
            : "※ Bạn có thể lựa chọn chỉ sửa số điện thoại/email thay vì gỡ bỏ toàn bộ trang."}
        </span>
        <button
          type="button"
          onClick={() => {
            setActiveTab("edit_info");
            setGuestInquiryType("update");
          }}
          className="px-2.5 py-1 rounded bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-[11px] font-semibold shrink-0 transition-colors shadow-2xs cursor-pointer"
        >
          {isJa ? "基本情報を編集" : "Chỉnh sửa thông tin"}
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
            <User className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{isJa ? "申請者・ご担当者様情報" : isVi ? "Thông tin người yêu cầu" : "Applicant Information"}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isJa ? "お名前・部署役職 *" : isVi ? "Họ tên & chức vụ *" : "Your Name & Title *"}
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (e.target.value.trim()) {
                    setFieldErrors((p) => {
                      const n = { ...p };
                      delete n.guestName;
                      return n;
                    });
                  }
                }}
                placeholder={isJa ? "山田 太郎（広報部）" : "Nguyễn Văn A"}
                className={getInputClass("guestName")}
              />
              {renderFieldError("guestName")}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isJa ? "ご連絡先メールアドレス *" : isVi ? "Email liên hệ *" : "Contact Email *"}
              </label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => {
                  const val = toHalfWidth(e.target.value).trim();
                  setGuestEmail(val);
                  updateFieldError("guestEmail", val);
                }}
                placeholder="name@company.co.jp"
                className={getInputClass("guestEmail")}
              />
              {renderFieldError("guestEmail")}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isJa ? "お電話番号（任意）" : isVi ? "Số điện thoại (tùy chọn)" : "Phone Number (Optional)"}
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => {
                  const val = toHalfWidth(e.target.value).replace(/\s+/g, "");
                  setGuestPhone(val);
                  updateFieldError("guestPhone", val);
                }}
                placeholder="03-1234-5678"
                className={getInputClass("guestPhone")}
              />
              {renderFieldError("guestPhone")}
            </div>
          </div>
        </div>

        <div className="p-3.5 border border-rose-200 dark:border-rose-800/60 rounded-lg space-y-3 bg-rose-50/20 dark:bg-rose-950/10">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isJa ? "掲載停止・非公開を希望される主な理由 *" : isVi ? "Lý do yêu cầu ẩn / gỡ bỏ *" : "Primary Reason for Delisting *"}
            </label>
            <select
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-600"
            >
              <option value="閉鎖・廃業・解散のため">{isJa ? "閉鎖・廃業・解散のため" : "Doanh nghiệp đã giải thể / ngừng hoạt động"}</option>
              <option value="営業電話・スパム連絡の防止（APPIオプトアウト）">{isJa ? "営業電話・スパム連絡の防止（APPIオプトアウト）" : "Ngăn chặn cuộc gọi/spam (Opt-out theo APPI)"}</option>
              <option value="代表者個人のプライバシー保護のため">{isJa ? "代表者個人のプライバシー保護のため" : "Bảo vệ quyền riêng tư cá nhân người đại diện"}</option>
              <option value="その他（詳細欄に記入）">{isJa ? "その他（詳細欄に記入）" : "Lý do khác (ghi rõ bên dưới)"}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isJa ? "詳細な理由・補足事項 *" : isVi ? "Chi tiết lý do yêu cầu gỡ bỏ *" : "Detailed Reason *"}
            </label>
            <textarea
              rows={4}
              required
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              placeholder={isJa ? "掲載停止をご希望される具体的な理由や背景をご記入ください。" : "Vui lòng ghi rõ lý do yêu cầu gỡ bỏ trang..."}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-600"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={guestAgree}
            onChange={(e) => setGuestAgree(e.target.checked)}
            className="mt-0.5 rounded text-[#1B4F8A] focus:ring-[#1B4F8A]"
          />
          <span>
            {isJa
              ? "個人情報の取り扱いおよび利用規約に同意の上で送信します。"
              : "Đồng ý với Điều khoản sử dụng và Chính sách bảo mật."}
          </span>
        </label>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          {isJa ? "閉じる" : isVi ? "Đóng" : "Close"}
        </button>
        <button
          type="submit"
          disabled={guestSubmitting}
          className="w-full sm:flex-1 py-2.5 px-4 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {guestSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isJa ? "送信中..." : isVi ? "Đang gửi..." : "Sending..."}</span>
            </>
          ) : (
            <span>{isJa ? "掲載停止（オプトアウト）を申請する（無料）" : isVi ? "Gửi yêu cầu gỡ bỏ" : "Submit Delisting Request"}</span>
          )}
        </button>
      </div>
    </form>
  );

  const renderAuthenticatedPrForm = () => (
    <form onSubmit={handleSavePr} className="space-y-5">
      {isClaimed ? (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800 rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span>{isJa ? "公式認証バッジ: 有効化済み" : "Huy hiệu xác minh: Đã kích hoạt"}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Verified by https://kigyoulist.com/
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                {isUserAdmin
                  ? isJa
                    ? `当企業は公式オーナー認証済みです（認証担当者: ${claimedByEmail || "公式登録済み"}）。ページ上部に「公式認証企業」バッジとPRメッセージが優先表示されています。`
                    : `Doanh nghiệp đã được xác minh chính chủ (${claimedByEmail || ""}). Huy hiệu và PR đang hiển thị ưu tiên.`
                  : isJa
                    ? "貴社ページ上部に「公式認証企業」バッジとPRメッセージが常時優先表示されます。"
                    : "Huy hiệu chính chủ và thông điệp PR của quý công ty đang hiển thị ưu tiên trên đầu trang."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span>{isJa ? "公式認証バッジ: 未有効化（オーナー未登録）" : "Huy hiệu xác minh: Chưa kích hoạt"}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Verified by https://kigyoulist.com/
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isUserAdmin
                  ? isJa
                    ? "※管理者モード: 当企業は現在公式オーナー未認証です。管理者は公式PRメッセージを直接代理編集・掲載できます。"
                    : "※Chế độ Quản trị viên: Doanh nghiệp này chưa có chủ sở hữu xác thực. Quản trị viên có thể trực tiếp soạn thông điệp PR."
                  : isJa
                    ? "企業公式オーナー認証（本人確認）を完了すると、ページ上部に「公式認証企業」バッジとPRメッセージが常時優先表示されます。"
                    : "Sau khi hoàn tất xác thực chủ sở hữu doanh nghiệp, huy hiệu chính chủ và PR sẽ hiển thị ưu tiên trên trang."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>企業PR キャッチコピー</span>
            <span className="text-[10px] text-slate-400 font-normal">【推奨】</span>
          </label>
          <span className={`text-[11px] font-mono tabular-nums ${prTitle.length > 60 ? "text-rose-500 font-bold" : "text-slate-400"}`}>
            {prTitle.length} / 60文字
          </span>
        </div>
        <input
          type="text"
          maxLength={60}
          value={prTitle}
          onChange={(e) => setPrTitle(e.target.value)}
          placeholder="例: 創業50年の信頼と技術力で製造DXを加速"
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>公式PRメッセージ（アピール・採用・主軸サービス紹介）</span>
            <span className="text-[10px] text-[#1B4F8A] dark:text-blue-400 font-normal">【任意】</span>
          </label>
          <span className={`text-[11px] font-mono tabular-nums ${prMessage.length > 500 ? "text-rose-500 font-bold" : "text-slate-400"}`}>
            {prMessage.length} / 500文字
          </span>
        </div>
        <textarea
          rows={4}
          maxLength={500}
          value={prMessage}
          onChange={(e) => setPrMessage(e.target.value)}
          placeholder="貴社の事業の強みや取引先候補・求職者に向けたメッセージをご自由にご入力ください。認証ページの上部に掲載されます。"
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] outline-none"
        />
      </div>

      {/* Embed Snippet + Live Preview Box */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 space-y-3">
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
            className="text-xs text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? "コピー完了" : "コードをコピー"}
          </button>
        </div>

        {/* Live Badge Preview Widget */}
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-md">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0 font-medium">
            {isJa ? "表示プレビュー:" : "Preview:"}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#1B4F8A]/30 bg-blue-50/50 dark:bg-blue-950/30 text-xs shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <div className="leading-tight">
              <span className="block font-bold text-slate-900 dark:text-white text-[11px]">{companyName}</span>
              <span className="text-[9px] text-[#1B4F8A] dark:text-blue-300 font-medium">Kigyou-List 公式認証企業</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            {isJa ? "※自社サイトのフッター等に設置いただけます" : "※Có thể đặt ở footer trang web"}
          </span>
        </div>

        <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 overflow-x-auto text-slate-600 dark:text-slate-400">
          {embedSnippet}
        </pre>
      </div>

      <button
        type="submit"
        disabled={savingPr}
        className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-semibold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
      >
        {savingPr ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>{isJa ? "PRメッセージを保存する" : isVi ? "Lưu thông điệp PR" : "Save PR Message"}</span>
      </button>
    </form>

  );

  const renderAuthenticatedEditForm = () => (
    <form onSubmit={handleSaveInfo} className="space-y-5">
      {/* Data Integrity Notice */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700/80 rounded-lg flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
        <Building className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px]">
          {isUserAdmin
            ? isJa
              ? "管理者特権モードのため、保存するとデータベースへ即時反映され、キャッシュ削除およびGoogle/Bingインデックス送信が自動実行されます。"
              : "Chế độ Quản trị viên: Lưu trực tiếp vào DB, xóa cache và bắn API Index ngay lập tức."
            : isJa
              ? "申請された更新内容は、国税庁法人番号公表サイトおよび公知データとの整合性を運営事務局にて審査・承認した後、公式データベースへ反映されます。"
              : isVi
                ? "Thông tin cập nhật sẽ được Ban quản trị kiểm duyệt trước khi cập nhật chính thức vào cơ sở dữ liệu."
                : "Submitted updates are reviewed by our administration team before official publication."}
        </div>
      </div>

      {/* Section A: Contact Channels */}
      <div className="space-y-3.5">
        <div className="text-xs font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          <span>{isJa ? "1. 連絡先窓口・公式窓口情報" : isVi ? "1. Kênh liên hệ chính thức" : "1. Official Contact Channels"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isJa ? "電話番号（代表・問い合わせ先）" : "Số điện thoại đại diện"}
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {isUserAdmin ? (isJa ? "即時反映" : "Lưu ngay") : (isJa ? "審査後反映" : "Duyệt thủ công")}
              </span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = toHalfWidth(e.target.value).replace(/\s+/g, "");
                  setPhone(val);
                  updateFieldError("phone", val);
                }}
                placeholder="03-1234-5678"
                className={getInputClass("phone", "pl-9 pr-3 py-2 font-mono tabular-nums")}
              />
            </div>
            {renderFieldError("phone")}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              FAX番号
            </label>
            <div className="relative">
              <Printer className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              <input
                type="tel"
                value={fax}
                onChange={(e) => {
                  const val = toHalfWidth(e.target.value).replace(/\s+/g, "");
                  setFax(val);
                  updateFieldError("fax", val);
                }}
                placeholder="03-1234-5679"
                className={getInputClass("fax", "pl-9 pr-3 py-2 font-mono tabular-nums")}
              />
            </div>
            {renderFieldError("fax")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              公式ウェブサイトURL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              <input
                type="url"
                value={website}
                onChange={(e) => {
                  const val = toHalfWidth(e.target.value).trim();
                  setWebsite(val);
                  updateFieldError("website", val);
                }}
                placeholder="https://example.co.jp"
                className={getInputClass("website", "pl-9 pr-3 py-2 font-mono")}
              />
            </div>
            {renderFieldError("website")}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {isJa
                ? "※公式URLの登録・承認後、システムが自動でお問い合わせ窓口等を定期取得いたします。"
                : "※Sau khi duyệt URL chính thức, hệ thống sẽ tự động thu thập form liên hệ."}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isJa ? "問い合わせ用メールアドレス" : "Email liên hệ chính thức"}
              </label>
              {isEmailChanged && (
                isUserAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {isJa ? "管理者特権: OTP不要" : "Quản trị viên: Miễn OTP"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {isJa ? "要OTP認証" : "Bắt buộc OTP"}
                  </span>
                )
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  const val = toHalfWidth(e.target.value).trim();
                  setContactEmail(val);
                  updateFieldError("contactEmail", val);
                }}
                placeholder="contact@example.co.jp"
                className={getInputClass("contactEmail", "pl-9 pr-3 py-2 font-mono")}
              />
            </div>
            {renderFieldError("contactEmail")}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {isUserAdmin
                ? (isJa ? "※管理者アカウントのため、認証コード不要で直接保存されます。" : "※Được lưu trực tiếp bởi tài khoản Quản trị viên.")
                : (isJa
                  ? "※メール変更時はなりすまし防止のため新メール宛のOTP認証が必須です。"
                  : "※Khi đổi email, bắt buộc phải xác thực mã OTP.")}
            </p>
          </div>
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
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
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

      {/* Section B: Executive & Location Info */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          <span>{isJa ? "2. 代表者・所在地・基本情報" : isVi ? "2. Ban điều hành & Trụ sở" : "2. Executive & Location"}</span>
        </div>
        <datalist id="rep-position-list-owner">
          <option value="代表取締役" />
          <option value="代表取締役社長" />
          <option value="代表社員" />
          <option value="代表理事" />
          <option value="理事長" />
          <option value="執行役社長" />
          <option value="会長" />
        </datalist>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              代表者 役職
            </label>
            <input
              type="text"
              list="rep-position-list-owner"
              value={representativePosition}
              onChange={(e) => setRepresentativePosition(e.target.value)}
              placeholder="例: 代表取締役社長"
              className={getInputClass("representativePosition", "py-2")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              代表者 氏名
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={representative}
                onChange={(e) => setRepresentative(e.target.value)}
                placeholder="例: 田中 太郎"
                className={getInputClass("representative", "pl-9 pr-3 py-2")}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              会社名（フリガナ・全角カタカナ）
            </label>
            <input
              type="text"
              value={nameKana}
              onChange={(e) => {
                const val = hiraganaToKatakana(e.target.value);
                setNameKana(val);
                updateFieldError("nameKana", val);
              }}
              placeholder="例: カブシキガイシャティーキューシー"
              className={getInputClass("nameKana", "py-2")}
            />
            {renderFieldError("nameKana")}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              英語社名表記（半角英数字）
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => {
                const val = toHalfWidth(e.target.value);
                setNameEn(val);
                updateFieldError("nameEn", val);
              }}
              placeholder="例: TQC Inc."
              className={getInputClass("nameEn", "py-2 font-mono")}
            />
            {renderFieldError("nameEn")}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              実働オフィス所在地（ビル名・フロア階数）
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例: 東京都千代田区大手町1-2-3 ○○ビル 8F"
              className={getInputClass("address", "py-2")}
            />
          </div>
        </div>
      </div>

      {/* Section C: Scale & Financials */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          <span>{isJa ? "3. 企業規模・決算期情報" : isVi ? "3. Quy mô & Quyết toán tài chính" : "3. Scale & Financials"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              資本金（円・半角数字のみ）
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={capitalAmount}
              onChange={(e) => {
                const val = toHalfWidth(e.target.value).replace(/,/g, "").trim();
                setCapitalAmount(val);
                updateFieldError("capitalAmount", val);
              }}
              placeholder="例: 10000000"
              className={getInputClass("capitalAmount", "py-2 font-mono tabular-nums")}
            />
            {renderFieldError("capitalAmount")}
            {formatJpyPreview(capitalAmount) && !fieldErrors.capitalAmount && (
              <p className="text-[10px] text-[#1B4F8A] dark:text-blue-400 font-medium mt-0.5">
                ≈ {formatJpyPreview(capitalAmount)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              従業員数（名・半角数字のみ）
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={employeeCount}
              onChange={(e) => {
                const val = toHalfWidth(e.target.value).replace(/,/g, "").trim();
                setEmployeeCount(val);
                updateFieldError("employeeCount", val);
              }}
              placeholder="例: 50"
              className={getInputClass("employeeCount", "py-2 font-mono tabular-nums")}
            />
            {renderFieldError("employeeCount")}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              最新売上高（円・半角数字のみ）
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={salesAmount}
              onChange={(e) => {
                const val = toHalfWidth(e.target.value).replace(/,/g, "").trim();
                setSalesAmount(val);
                updateFieldError("salesAmount", val);
              }}
              placeholder="例: 500000000"
              className={getInputClass("salesAmount", "py-2 font-mono tabular-nums")}
            />
            {renderFieldError("salesAmount")}
            {formatJpyPreview(salesAmount) && !fieldErrors.salesAmount && (
              <p className="text-[10px] text-[#1B4F8A] dark:text-blue-400 font-medium mt-0.5">
                ≈ {formatJpyPreview(salesAmount)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              決算期（決算月）
            </label>
            <select
              value={fiscalMonth}
              onChange={(e) => setFiscalMonth(e.target.value)}
              className={getInputClass("fiscalMonth", "py-2")}
            >
              <option value="">{isJa ? "未設定" : "Chưa thiết lập"}</option>
              {fiscalMonth &&
                !fiscalMonthOptions.includes(fiscalMonth) && (
                  <option value={fiscalMonth}>{fiscalMonth}</option>
                )}
              {fiscalMonthOptions.filter(Boolean).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section D: Business, Partners & SNS */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          <span>{isJa ? "4. 事業内容・主要取引先・取引銀行・公式SNS" : isVi ? "4. Ngành nghề, Đối tác & Mạng xã hội SNS" : "4. Business & Network"}</span>
        </div>

        <div className="space-y-3">
          {/* Standardized 2-Tier JSIC Industry Tag Selector */}
          {renderIndustrySelector()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                主要取引先
              </label>
              <input
                type="text"
                value={mainClients}
                onChange={(e) => setMainClients(e.target.value)}
                placeholder="例: トヨタ自動車、ソニーグループ"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                主要取引銀行
              </label>
              <input
                type="text"
                value={mainBanks}
                onChange={(e) => setMainBanks(e.target.value)}
                placeholder="例: 三菱UFJ銀行、三井住友銀行"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              公式SNSリンク (X/Twitter, LinkedIn, note, Wantedly等)
            </label>
            <input
              type="text"
              value={snsLinks}
              onChange={(e) => setSnsLinks(toHalfWidth(e.target.value))}
              placeholder="例: https://x.com/company, https://note.com/company"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={savingInfo}
        className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-semibold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
      >
        {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>
          {isUserAdmin
            ? isJa
              ? "基本情報を即時保存・反映する（管理者）"
              : "Lưu và cập nhật ngay (Quản trị viên)"
            : isJa
              ? "基本情報の更新を申請する（事務局審査後に反映）"
              : isVi
                ? "Gửi yêu cầu cập nhật thông tin (Chờ duyệt)"
                : "Submit Information Update Request"}
        </span>
      </button>
    </form>

  );

  const renderAuthenticatedUnpublishForm = () => (
    <form onSubmit={handleUnpublish} className="space-y-4">
      {/* Detailed Impact Warning Box */}
      <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900 rounded-lg space-y-2.5">
        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{isJa ? "企業ページの非公開（掲載取り下げ）に関する重要事項" : "Lưu ý quan trọng khi yêu cầu gỡ bỏ trang"}</span>
        </div>
        <ul className="space-y-1.5 text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed list-disc list-inside">
          <li>{isJa ? "検索エンジン（Google・Bing等）のインデックスから除外され、企業検索に表示されなくなります。" : "Trang doanh nghiệp sẽ bị gỡ bỏ khỏi kết quả tìm kiếm Google & Bing."}</li>
          <li>{isJa ? "公式認証バッジ・PR情報が無効化され、他社からの問い合わせ・商談窓口が閉鎖されます。" : "Mọi huy hiệu xác thực và thông điệp PR sẽ bị hủy bỏ."}</li>
          <li>{isJa ? "公知データ（国税庁・経済産業省gBizINFO公表情報）に基づく再掲載には再審査が必要です。" : "Yêu cầu khôi phục sau này sẽ cần xác minh lại từ đầu."}</li>
        </ul>
      </div>

      {/* Alternative Soft Solution Box */}
      <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-lg flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
          {isJa
            ? "※ 全体を非公開にせず、電話番号やメールアドレスのみを修正・非表示にすることも可能です。"
            : "※ Bạn có thể lựa chọn chỉ ẩn số điện thoại hoặc email thay vì gỡ bỏ toàn bộ trang."}
        </span>
        <button
          type="button"
          onClick={() => setActiveTab("edit_info")}
          className="px-2.5 py-1 rounded bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-[11px] font-semibold shrink-0 transition-colors shadow-2xs cursor-pointer"
        >
          {isJa ? "基本情報を編集" : "Chỉnh sửa thông tin"}
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          掲載停止の主な理由 <span className="text-rose-500">*</span>
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
          placeholder={isJa ? "補足の事情やご要望があればご記入ください。" : "Nhập thêm thông tin bổ sung nếu có..."}
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none"
        />
      </div>

      {/* Two-step Legal Confirmation Checkbox */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg">
        <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={confirmUnpublish}
            onChange={(e) => setConfirmUnpublish(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
          />
          <span className="leading-relaxed text-[11px]">
            {isJa
              ? "私は本企業の正当な権限者であり、掲載停止による検索エンジン等の影響および利用規約に同意した上で非公開を申請します。"
              : isVi
                ? "Tôi xác nhận là người có thẩm quyền của doanh nghiệp và đồng ý với các hệ quả gỡ bỏ trang thông tin."
                : "I confirm that I am authorized and accept the consequences of delisting this corporate profile."}
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={!confirmUnpublish || submittingHide}
        className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white font-semibold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
      >
        {submittingHide ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
        <span>{isJa ? "同意して掲載停止（非公開）を実行する" : isVi ? "Xác nhận gỡ bỏ trang" : "Confirm and Delist Profile"}</span>
      </button>
    </form>

  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden" style={{ fontFeatureSettings: '"palt"' }}>
        {/* B2B Deep Navy Header */}
        <div className="bg-[#1B4F8A] p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  <ShieldAlert className="w-3 h-3 text-amber-300" />
                  <span>{isJa ? "管理者特権モード（即時反映）" : "Chế độ Quản trị viên (Lưu trực tiếp)"}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/15 text-blue-100 text-[10px] font-semibold border border-white/20 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                  <ShieldCheck className="w-3 h-3 text-blue-200" />
                  <span>{isJa ? "公式認証・情報管理" : "Quản trị chính chủ"}</span>
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">{isJa ? "公式企業管理・認証センター" : "Trung tâm Quản lý Chính chủ Doanh nghiệp"}</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-blue-100/90 mt-2 font-medium">
            <span>{isJa ? "対象企業: " : "Doanh nghiệp: "}<strong>{companyName}</strong></span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/20 font-mono tabular-nums text-[11px] text-blue-100">
              <span>{isJa ? "法人番号: " : "Mã số: "}{corporateNumber}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(corporateNumber);
                  setCopiedCorpNum(true);
                  setTimeout(() => setCopiedCorpNum(false), 2000);
                }}
                className="hover:text-white p-0.5 transition-colors cursor-pointer"
                title={isJa ? "法人番号をコピー" : "Sao chép mã số"}
              >
                {copiedCorpNum ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3 text-blue-200" />}
              </button>
            </span>
            {isUserAdmin && <span className="font-semibold text-amber-200 text-[11px]">{isJa ? "※管理者権限で直接編集可能" : "※Quyền Quản trị viên"}</span>}
          </div>
        </div>

        {/* Global Alert Message */}
        {statusMsg && (
          <div
            className={`px-6 py-3 text-xs font-medium flex items-center gap-2 border-b ${statusMsg.type === "success"
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

          {/* Top-Level 3 Unified Tabs (Balanced typography, sleek B2B style) */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 px-3 sm:px-6 pt-2 gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            {/* Tab 1: 1. 公式認証 & PR */}
            <button
              type="button"
              onClick={() => setActiveTab("badge_pr")}
              className={`pb-2 px-2.5 sm:px-3 text-xs sm:text-[13px] font-semibold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${activeTab === "badge_pr"
                  ? "border-[#1B4F8A] text-[#1B4F8A] dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-800 rounded-t-lg shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#1B4F8A] dark:text-blue-400" />
              <span>1. 企業認証 &amp; PR</span>
              {!isLoggedIn ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                  {isJa ? "要認証" : "Yêu cầu xác minh"}
                </span>
              ) : isClaimed ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                  {isJa ? "有効化済み" : "Đã kích hoạt"}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                  {isJa ? "要本人確認" : "Cần xác thực"}
                </span>
              )}
            </button>

            {/* Tab 2: 2. 掲載情報の修正 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("edit_info");
                setGuestInquiryType("update");
              }}
              className={`pb-2 px-2.5 sm:px-3 text-xs sm:text-[13px] font-semibold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${activeTab === "edit_info"
                  ? "border-[#1B4F8A] text-[#1B4F8A] dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-800 rounded-t-lg shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              <FileEdit className="w-3.5 h-3.5 shrink-0 text-[#1B4F8A] dark:text-blue-400" />
              <span>2. 掲載情報の修正</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
                {isJa ? "審査制" : "Duyệt thủ công"}
              </span>
            </button>

            {/* Tab 3: 3. 掲載停止 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("unpublish");
                setGuestInquiryType("hide");
              }}
              className={`pb-2 px-2.5 sm:px-3 text-xs sm:text-[13px] font-semibold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${activeTab === "unpublish"
                  ? "border-rose-600 text-rose-600 dark:text-rose-400 dark:border-rose-400 bg-white dark:bg-slate-800 rounded-t-lg shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                }`}
            >
              <EyeOff className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>3. 掲載停止</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                {isJa ? "オプトアウト" : "Opt-out"}
              </span>
            </button>
          </div>

          {/* TAB 1: 1. 企業認証 & PR (Requires Login & Identity Verification for Official Owner) */}
          {activeTab === "badge_pr" && (
            !isLoggedIn ? (
              renderGuestPrShowcase()
            ) : isClaimedByOther ? (
              renderClaimedByOther()
            ) : !isAuthenticated ? (
              renderGatekeeper()
            ) : (
              renderAuthenticatedPrForm()
            )
          )}

          {/* TAB 2: EDIT INFO CONTENT (No 本人確認 required - Direct structured form, 100% manual review) */}
          {activeTab === "edit_info" && (
            isUserAdmin ? (
              renderAuthenticatedEditForm()
            ) : guestSubmitted ? (
              renderGuestSubmittedSuccess()
            ) : (
              renderGuestEditForm()
            )
          )}

          {/* TAB 3: UNPUBLISH CONTENT (No 本人確認 required - APPI Opt-out compliant, 100% manual review) */}
          {activeTab === "unpublish" && (
            isUserAdmin ? (
              renderAuthenticatedUnpublishForm()
            ) : guestSubmitted ? (
              renderGuestSubmittedSuccess()
            ) : (
              renderGuestUnpublishForm()
            )
          )}
        </div>
      </div>
    </div>
  );
};
