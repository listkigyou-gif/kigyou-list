"use client";

import React, { useState, useEffect } from "react";
import { 
  X, CheckCircle2, ShieldAlert, Loader2, Mail, KeyRound, 
  Globe, Building2, FileEdit, EyeOff, Phone, Printer, User, FileText,
  MessageSquare, Briefcase, MapPin, Users, TrendingUp, Calendar, Landmark, Share2, Sparkles
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface CompanyCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  corporateNumber: string;
  companyName: string;
  initialWebsiteUrl?: string | null;
  initialPhone?: string | null;
  initialFax?: string | null;
  initialEmail?: string | null;
  initialRepresentative?: string | null;
  initialRepresentativePosition?: string | null;
  initialKana?: string | null;
  initialEn?: string | null;
  initialPostalCode?: string | null;
  initialAddress?: string | null;
  initialCapital?: number | string | null;
  initialEmployees?: number | string | null;
  initialSales?: number | string | null;
  initialFiscalMonth?: string | null;
  initialContactFormUrl?: string | null;
  initialRecruitUrl?: string | null;
  initialDescription?: string | null;
  initialMainClients?: string | null;
  initialMainBanks?: string | null;
  initialSnsLinks?: string | null;
}

type EditCategory = "contact" | "basic" | "exec" | "finance" | "business";

export const CompanyCorrectionModal: React.FC<CompanyCorrectionModalProps> = ({
  isOpen,
  onClose,
  corporateNumber,
  companyName,
  initialWebsiteUrl = "",
  initialPhone = "",
  initialFax = "",
  initialEmail = "",
  initialRepresentative = "",
  initialRepresentativePosition = "",
  initialKana = "",
  initialEn = "",
  initialPostalCode = "",
  initialAddress = "",
  initialCapital = "",
  initialEmployees = "",
  initialSales = "",
  initialFiscalMonth = "",
  initialContactFormUrl = "",
  initialRecruitUrl = "",
  initialDescription = "",
  initialMainClients = "",
  initialMainBanks = "",
  initialSnsLinks = ""
}) => {
  const { locale } = useLanguage();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const [activeTab, setActiveTab] = useState<"update" | "hide">("update");
  const [activeCategory, setActiveCategory] = useState<EditCategory>("contact");

  // Group 1: 連絡先・Web窓口 (Contact & Digital Channels)
  const [phone, setPhone] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [fax, setFax] = useState<string>("");
  const [contactFormUrl, setContactFormUrl] = useState<string>("");
  const [recruitUrl, setRecruitUrl] = useState<string>("");
  const [branchPhone, setBranchPhone] = useState<string>("");

  // Group 2: 基本・所在地 (Identity & Location)
  const [nameKana, setNameKana] = useState<string>("");
  const [nameEn, setNameEn] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  // Group 3: 代表者・役員 (Executive & Governance)
  const [representativePosition, setRepresentativePosition] = useState<string>("");
  const [representative, setRepresentative] = useState<string>("");
  const [establishmentDate, setEstablishmentDate] = useState<string>("");

  // Group 4: 規模・財務 (Scale & Financials)
  const [capitalAmount, setCapitalAmount] = useState<string>("");
  const [employeeCount, setEmployeeCount] = useState<string>("");
  const [salesAmount, setSalesAmount] = useState<string>("");
  const [fiscalMonth, setFiscalMonth] = useState<string>("");

  // Group 5: 事業内容・取引先・SNS (Business & Network)
  const [description, setDescription] = useState<string>("");
  const [mainClients, setMainClients] = useState<string>("");
  const [mainBanks, setMainBanks] = useState<string>("");
  const [snsLinks, setSnsLinks] = useState<string>("");

  // Verification Website (Bắt buộc đối chiếu)
  const [verifyWebsite, setVerifyWebsite] = useState<string>("");

  // Hide tab states
  const [hideReason, setHideReason] = useState<string>("代表者・担当者からの要請");
  const [customMessage, setCustomMessage] = useState<string>("");

  // Requester contact & OTP
  const [personInCharge, setPersonInCharge] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
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
      setActiveCategory("contact");

      // Populate or reset
      setPhone(initialPhone || "");
      setWebsite(initialWebsiteUrl || "");
      setEmailAddress(initialEmail || "");
      setFax(initialFax || "");
      setContactFormUrl(initialContactFormUrl || "");
      setRecruitUrl(initialRecruitUrl || "");
      setBranchPhone("");

      setNameKana(initialKana || "");
      setNameEn(initialEn || "");
      setPostalCode(initialPostalCode || "");
      setAddress(initialAddress || "");

      setRepresentativePosition(initialRepresentativePosition || "");
      setRepresentative(initialRepresentative || "");
      setEstablishmentDate("");

      setCapitalAmount(initialCapital ? String(initialCapital) : "");
      setEmployeeCount(initialEmployees ? String(initialEmployees) : "");
      setSalesAmount(initialSales ? String(initialSales) : "");
      setFiscalMonth(initialFiscalMonth || "");

      setDescription(initialDescription || "");
      setMainClients(initialMainClients || "");
      setMainBanks(initialMainBanks || "");
      setSnsLinks(initialSnsLinks || "");

      setPersonInCharge("");
      setMobileNumber("");
      setCustomMessage("");
      setVerifyWebsite(initialWebsiteUrl || "");
    }
  }, [isOpen, initialWebsiteUrl, initialPhone, initialFax, initialEmail, initialRepresentative, initialRepresentativePosition, initialKana, initialEn, initialPostalCode, initialAddress, initialCapital, initialEmployees, initialSales, initialFiscalMonth, initialContactFormUrl, initialRecruitUrl, initialDescription, initialMainClients, initialMainBanks, initialSnsLinks]);

  if (!isOpen) return null;

  // Counts of filled fields in each category for visual feedback
  const countCategory = (cat: EditCategory): number => {
    let count = 0;
    if (cat === "contact") {
      if (phone.trim()) count++;
      if (website.trim()) count++;
      if (emailAddress.trim()) count++;
      if (fax.trim()) count++;
      if (contactFormUrl.trim()) count++;
      if (recruitUrl.trim()) count++;
      if (branchPhone.trim()) count++;
    } else if (cat === "basic") {
      if (nameKana.trim()) count++;
      if (nameEn.trim()) count++;
      if (postalCode.trim()) count++;
      if (address.trim()) count++;
    } else if (cat === "exec") {
      if (representativePosition.trim()) count++;
      if (representative.trim()) count++;
      if (establishmentDate.trim()) count++;
    } else if (cat === "finance") {
      if (capitalAmount.trim()) count++;
      if (employeeCount.trim()) count++;
      if (salesAmount.trim()) count++;
      if (fiscalMonth.trim()) count++;
    } else if (cat === "business") {
      if (description.trim()) count++;
      if (mainClients.trim()) count++;
      if (mainBanks.trim()) count++;
      if (snsLinks.trim()) count++;
    }
    return count;
  };

  const totalFilledFields = 
    countCategory("contact") + 
    countCategory("basic") + 
    countCategory("exec") + 
    countCategory("finance") + 
    countCategory("business");

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
      if (totalFilledFields === 0) {
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

      // Group 1: Contacts
      if (phone.trim()) updates.phone_number = phone.trim();
      if (website.trim()) updates.website_url = website.trim();
      if (emailAddress.trim()) updates.email_address = emailAddress.trim();
      if (fax.trim()) updates.fax_number = fax.trim();
      if (contactFormUrl.trim()) updates.contact_form_url = contactFormUrl.trim();
      if (recruitUrl.trim()) updates.recruit_url = recruitUrl.trim();
      if (branchPhone.trim()) updates.branch_phone_numbers = branchPhone.trim();

      // Group 2: Basic & Location
      if (nameKana.trim()) updates.company_name_kana = nameKana.trim();
      if (nameEn.trim()) updates.company_name_en = nameEn.trim();
      if (postalCode.trim()) updates.postal_code = postalCode.trim();
      if (address.trim()) {
        updates.street_address = address.trim();
        updates.full_address = address.trim();
      }

      // Group 3: Executives
      if (representativePosition.trim()) updates.representative_position = representativePosition.trim();
      if (representative.trim()) updates.representative_name = representative.trim();
      if (establishmentDate.trim()) updates.establishment_date = establishmentDate.trim();

      // Group 4: Finance & Scale
      if (capitalAmount.trim()) updates.capital_amount = capitalAmount.trim();
      if (employeeCount.trim()) updates.employee_count = employeeCount.trim();
      if (salesAmount.trim()) updates.sales_amount = salesAmount.trim();
      if (fiscalMonth.trim()) updates.fiscal_month = fiscalMonth.trim();

      // Group 5: Business & Ecosystem
      if (description.trim()) {
        updates.jigyo_shumoku = description.trim();
        updates.business_summary = description.trim();
      }
      if (mainClients.trim()) updates.main_clients = mainClients.trim();
      if (mainBanks.trim()) updates.main_banks = mainBanks.trim();
      if (snsLinks.trim()) updates.sns_links = snsLinks.trim();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isVi ? "Yêu cầu chỉnh sửa / Bổ sung thông tin doanh nghiệp" : "掲載情報の修正・追加・取り下げ申請"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isVi ? "Quy trình xác thực nhanh 60 giây • Chuẩn B2B Nhật Bản" : "企業公式照合・ワンタイム認証（約60秒で完了）"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Company Info Card */}
        <div className="px-5 py-2.5 bg-slate-100/60 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-bold text-slate-850 dark:text-slate-200 truncate">{companyName}</span>
          </div>
          <span className="font-mono text-[11px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
            #{corporateNumber}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {result ? (
            /* Result Success Screen */
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                result.autoApproved 
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" 
                  : "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
              }`}>
                {result.autoApproved ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <ClockIcon className="w-7 h-7" />
                )}
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {result.autoApproved 
                    ? (isVi ? "Đã duyệt và cập nhật thành công!" : "公式照合完了・データベースに反映されました") 
                    : (isVi ? "Yêu cầu đã được tiếp nhận" : "申請を受け付けました")}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {result.message}
                </p>
              </div>

              <div className="pt-2 w-full max-w-xs">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-bold rounded-lg text-xs transition-colors"
                >
                  {isVi ? "Đóng cửa sổ" : "閉じる"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg flex items-start gap-2 text-xs text-rose-700 dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Tabs: Update vs Hide */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-bold border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab("update")}
                  className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === "update"
                      ? "bg-white dark:bg-slate-700 text-[#1B4F8A] dark:text-blue-300 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>{isVi ? "Chỉnh sửa / Bổ sung thông tin" : "情報の修正・追加"}</span>
                  {totalFilledFields > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-[#1B4F8A] text-white rounded-full text-[10px] font-mono">
                      {totalFilledFields}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("hide")}
                  className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === "hide"
                      ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{isVi ? "Ẩn / Gỡ bỏ trang công ty" : "掲載の取り下げ（非公開）"}</span>
                </button>
              </div>

              {/* Tab 1: Update fields with 5 Structured B2B Categories */}
              {activeTab === "update" && (
                <div className="space-y-3">
                  {/* Category Nav Ribbon */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {[
                      { id: "contact" as EditCategory, label: isJa ? "1. 連絡先・Web窓口" : "1. Kênh liên hệ", icon: Phone },
                      { id: "basic" as EditCategory, label: isJa ? "2. 所在地・基本" : "2. Định danh & Trụ sở", icon: MapPin },
                      { id: "exec" as EditCategory, label: isJa ? "3. 代表者・役員" : "3. Đại diện & Ban lãnh đạo", icon: User },
                      { id: "finance" as EditCategory, label: isJa ? "4. 規模・決算" : "4. Quy mô & Tài chính", icon: TrendingUp },
                      { id: "business" as EditCategory, label: isJa ? "5. 事業・取引先・SNS" : "5. Ngành nghề & Đối tác", icon: Briefcase },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const filledCount = countCategory(tab.id);
                      const isSelected = activeCategory === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveCategory(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 border transition-all ${
                            isSelected
                              ? "bg-[#1B4F8A] text-white border-[#1B4F8A] shadow-2xs"
                              : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                          {filledCount > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                              isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                            }`}>
                              {filledCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Category Content Box */}
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    
                    {/* CATEGORY 1: CONTACT CHANNELS */}
                    {activeCategory === "contact" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                            {isJa ? "1. 連絡先窓口・Webフォーム・採用情報" : "1. Kênh liên hệ, Biểu mẫu & Tuyển dụng"}
                          </span>
                          <span className="text-[10px] text-slate-500">{isJa ? "変更のある項目のみ入力" : "Chỉ nhập mục cần sửa"}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {isJa ? "電話番号（代表）" : "Số điện thoại đại diện"}
                            </label>
                            <input
                              type="tel"
                              placeholder="例：03-1234-5678"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Printer className="w-3 h-3 text-slate-400" />
                              {isJa ? "FAX番号" : "Số FAX"}
                            </label>
                            <input
                              type="tel"
                              placeholder="例：03-1234-5679"
                              value={fax}
                              onChange={(e) => setFax(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-slate-400" />
                              {isJa ? "公式ウェブサイトURL" : "Website chính thức"}
                            </label>
                            <input
                              type="url"
                              placeholder="https://example.co.jp"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {isJa ? "代表・問い合わせメール" : "Email liên hệ đại diện"}
                            </label>
                            <input
                              type="email"
                              placeholder="contact@example.co.jp"
                              value={emailAddress}
                              onChange={(e) => setEmailAddress(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          {/* Contact Form URL (Cực kỳ giá trị B2B) */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
                              {isJa ? "お問い合わせフォームURL" : "URL Form liên hệ trực tuyến"}
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">（フォーム営業・問い合わせ対応用）</span>
                            </label>
                            <input
                              type="url"
                              placeholder="例：https://example.co.jp/contact"
                              value={contactFormUrl}
                              onChange={(e) => setContactFormUrl(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          {/* Recruit Page URL */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Users className="w-3 h-3 text-indigo-500" />
                              {isJa ? "採用・求人情報ページURL" : "URL Trang tuyển dụng chính thức"}
                            </label>
                            <input
                              type="url"
                              placeholder="例：https://example.co.jp/recruit"
                              value={recruitUrl}
                              onChange={(e) => setRecruitUrl(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          {/* Branch Phone Numbers */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {isJa ? "支店・営業所電話番号（複数ある場合はカンマ区切り）" : "Số điện thoại chi nhánh / văn phòng đại diện"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：大阪支店: 06-1234-5678, 名古屋営業所: 052-123-4567"
                              value={branchPhone}
                              onChange={(e) => setBranchPhone(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CATEGORY 2: BASIC IDENTITY & LOCATION */}
                    {activeCategory === "basic" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                            {isJa ? "2. 会社名カナ・英語表記・所在地詳細" : "2. Tên Furigana, Tên tiếng Anh & Địa chỉ chi tiết"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "会社名（フリガナ）" : "Tên Furigana (Katakana)"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：カブシキガイシャティーキューシー"
                              value={nameKana}
                              onChange={(e) => setNameKana(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "英語社名表記" : "Tên tiếng Anh quốc tế"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：TQC Inc."
                              value={nameEn}
                              onChange={(e) => setNameEn(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "郵便番号" : "Mã bưu điện (Postal Code)"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：100-0001"
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "本社所在地・ビル名・階数（実稼働オフィス住所）" : "Địa chỉ trụ sở / Tên tòa nhà & Tầng"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：東京都千代田区大手町1-2-3 ○○ビル 8F"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                            <span className="text-[9px] text-slate-400 block">{isJa ? "※国税庁登記住所と異なる営業所・ビル名等をご記入いただけます。" : "※Có thể nhập địa chỉ văn phòng thực tế kèm tên tòa nhà."}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CATEGORY 3: EXECUTIVE & GOVERNANCE */}
                    {activeCategory === "exec" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                            {isJa ? "3. 代表者役職・代表者氏名・設立年月" : "3. Chức vụ, Người đại diện & Ngày thành lập"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "代表者 役職" : "Chức vụ người đại diện"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：代表取締役社長 / CEO / 代表執行役"
                              value={representativePosition}
                              onChange={(e) => setRepresentativePosition(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "代表者 氏名" : "Họ và tên người đại diện"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：山田 太郎"
                              value={representative}
                              onChange={(e) => setRepresentative(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "設立年月 / 創業年月" : "Ngày thành lập / Khởi nghiệp"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：2010年4月 または 2010-04-01"
                              value={establishmentDate}
                              onChange={(e) => setEstablishmentDate(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CATEGORY 4: SCALE & FINANCIALS */}
                    {activeCategory === "finance" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                            {isJa ? "4. 資本金・従業員数・売上高・決算期" : "4. Vốn, Nhân sự, Doanh thu & Tháng quyết toán"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "資本金（円）" : "Vốn điều lệ (Yên)"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：10000000 (1,000万円)"
                              value={capitalAmount}
                              onChange={(e) => setCapitalAmount(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "従業員数（名）" : "Số lượng nhân sự"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：50"
                              value={employeeCount}
                              onChange={(e) => setEmployeeCount(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "最新売上高（円）" : "Doanh thu năm gần nhất (Yên)"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：500000000 (5億円)"
                              value={salesAmount}
                              onChange={(e) => setSalesAmount(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "決算期（決算月）" : "Tháng quyết toán tài chính"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：3月決算 または 12月"
                              value={fiscalMonth}
                              onChange={(e) => setFiscalMonth(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CATEGORY 5: BUSINESS, CLIENTS & SNS */}
                    {activeCategory === "business" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                            {isJa ? "5. 事業内容・主要取引先・取引銀行・公式SNS" : "5. Ngành nghề, Đối tác chính & Mạng xã hội SNS"}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isJa ? "事業内容・主要サービス・製品説明" : "Mô tả ngành nghề, sản phẩm / dịch vụ chính"}
                            </label>
                            <textarea
                              rows={2}
                              placeholder="例：クラウドSaaSの開発・運営、Webマーケティング支援、B2Bデータ基盤構築"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-[#1B4F8A] outline-none resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {isJa ? "主要取引先（取引実績企業）" : "Khách hàng / Đối tác chính"}
                              </label>
                              <input
                                type="text"
                                placeholder="例：トヨタ自動車、ソニーグループ、NTTデータ"
                                value={mainClients}
                                onChange={(e) => setMainClients(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {isJa ? "主要取引銀行" : "Ngân hàng giao dịch chính"}
                              </label>
                              <input
                                type="text"
                                placeholder="例：三菱UFJ銀行、三井住友銀行、みずほ銀行"
                                value={mainBanks}
                                onChange={(e) => setMainBanks(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Share2 className="w-3 h-3 text-[#1B4F8A]" />
                              {isJa ? "公式SNSリンク (X/Twitter, LinkedIn, Wantedly, note, Facebook等)" : "Liên kết mạng xã hội (SNS)"}
                            </label>
                            <input
                              type="text"
                              placeholder="例：https://x.com/username, https://note.com/company"
                              value={snsLinks}
                              onChange={(e) => setSnsLinks(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* 照合用公式ウェブサイト URL (BẮT BUỘC) */}
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                        <span>{isJa ? "照合用公式ウェブサイト URL" : "Website công ty để đối chiếu xác thực"}</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {isJa ? "AI自動照合（必須）" : "Bắt buộc đối chiếu"}
                      </span>
                    </div>
                    <input
                      type="url"
                      required
                      value={verifyWebsite}
                      onChange={(e) => setVerifyWebsite(e.target.value)}
                      placeholder="例：https://www.example.co.jp"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {isJa 
                        ? "※入力内容の確認およびAIによる照合のため、貴社の公式WEBサイトまたはプレスリリースURLを必ずご入力ください。" 
                        : "※Vui lòng nhập URL website chính thức hoặc thông cáo báo chí để đối chiếu xác thực dữ liệu."}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Hide fields */}
              {activeTab === "hide" && (
                <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isVi ? "Lý do yêu cầu ẩn thông tin" : "掲載取り下げ（非公開）の理由"} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={hideReason}
                      onChange={(e) => setHideReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-rose-500 outline-none"
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
              <div className="pt-2 border-t border-slate-150 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isVi ? "Họ tên người phụ trách" : "ご担当者様 氏名"}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={personInCharge}
                      onChange={(e) => setPersonInCharge(e.target.value)}
                      placeholder={isVi ? "Ví dụ: Nguyễn Văn A" : "例：山田 太郎"}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
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
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                    />
                  </div>
                </div>

                {/* Additional Note / Message */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isVi ? "Ghi chú bổ sung (tùy chọn)" : "その他ご要望・補足理由（任意）"}</span>
                  </label>
                  <textarea
                    rows={1}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={isVi ? "Nhập chi tiết nội dung hoặc ghi chú..." : "修正箇所や取り下げの補足理由をご記入ください..."}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none resize-none"
                  />
                </div>

                {/* OTP Verification Box */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                      <span>{isVi ? "Xác thực Email (Gmail/Yahoo/Doanh nghiệp)" : "メールアドレス認証（OTP）"}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500">{isVi ? "Mã 6 chữ số" : "6桁認証コード"}</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com または gmail.com"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || otpCountdown > 0 || !email.includes("@")}
                      className="px-3 py-1.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors shrink-0"
                    >
                      {sendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : otpCountdown > 0 ? `${otpCountdown}s` : otpSent ? (isJa ? "再送" : "Gửi lại") : (isJa ? "コード送信" : "Gửi OTP")}
                    </button>
                  </div>

                  {otpSent && (
                    <div className="pt-1">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder={isJa ? "メール記載の6桁認証コードを入力" : "Nhập mã OTP 6 số"}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-mono font-bold tracking-widest text-center focus:ring-1 focus:ring-[#1B4F8A] outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>
                    {activeTab === "update" 
                      ? (isVi ? `Gửi yêu cầu chỉnh sửa (${totalFilledFields} mục)` : `修正・追加申請を送信する（${totalFilledFields}項目）`) 
                      : (isVi ? "Gửi yêu cầu ẩn công ty" : "掲載取り下げ申請を送信する")}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
