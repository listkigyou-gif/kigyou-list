"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Plus, Check, ShieldCheck, CheckCircle2, Printer, Activity, FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { CompanyManagementModal } from "./CompanyManagementModal";
import { CompanyClaimModal } from "./CompanyClaimModal";
import { CompanyQuickAuditModal } from "./company/CompanyQuickAuditModal";
import { isAdminEmail } from "@/lib/adminAuth";
import { CompanyLicense } from "@/lib/db";

interface CompanyActionsProps {
  corporateNumber: string;
  companyName?: string;
  websiteUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  fax?: string | null;
  representativeName?: string | null;
  representativePosition?: string | null;
  companyNameKana?: string | null;
  companyNameEn?: string | null;
  postalCode?: string | null;
  fullAddress?: string | null;
  capitalAmount?: number | string | null;
  employeeCount?: number | string | null;
  salesAmount?: number | string | null;
  fiscalMonth?: string | null;
  contactFormUrl?: string | null;
  recruitUrl?: string | null;
  jigyoShumoku?: string | null;
  mainClients?: string | null;
  mainBanks?: string | null;
  snsLinks?: string | null;
  prTitle?: string | null;
  prMessage?: string | null;
  isClaimed?: boolean;
  claimedAt?: string | null;
  claimedByEmail?: string | null;
  licenses?: CompanyLicense[];
}

export const CompanyActions: React.FC<CompanyActionsProps> = ({
  corporateNumber,
  companyName = "",
  websiteUrl = "",
  phone = "",
  email = "",
  fax = "",
  representativeName = "",
  representativePosition = "",
  companyNameKana = "",
  companyNameEn = "",
  postalCode = "",
  fullAddress = "",
  capitalAmount = "",
  employeeCount = "",
  salesAmount = "",
  fiscalMonth = "",
  contactFormUrl = "",
  recruitUrl = "",
  jigyoShumoku = "",
  mainClients = "",
  mainBanks = "",
  snsLinks = "",
  prTitle = "",
  prMessage = "",
  isClaimed = false,
  claimedAt = null,
  claimedByEmail = null,
  licenses = [],
}) => {
  const { isLoggedIn, user, isCompanySaved, toggleSaveCompany, setAuthModalOpen } = useAuth();
  const { locale } = useLanguage();
  const searchParams = useSearchParams();

  const isEn = locale === "en";
  const isVi = locale === "vi";
  const isUserAdmin = Boolean(user?.email && isAdminEmail(user.email));
  const [mounted, setMounted] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [modalGuestMode, setModalGuestMode] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-open claim modal if action=claim or claim=1 in query params
    const action = searchParams.get("action");
    const isClaimAction = action === "claim" || searchParams.get("claim") === "1" || searchParams.get("claim") === "true";
    if (isClaimAction) {
      setModalGuestMode(false);
      setManageModalOpen(true);
    }

    // Auto-open unified portal if manage/edit/correction in query params
    const isCorrection = searchParams.get("correction") === "1" || searchParams.get("correction") === "true";
    const openParam = searchParams.get("manage") || searchParams.get("edit");
    if (openParam === "1" || openParam === "true" || isCorrection) {
      setModalGuestMode(isCorrection);
      setManageModalOpen(true);
    }

    const handleOpenClaim = () => {
      setModalGuestMode(false);
      setManageModalOpen(true);
    };

    const handleOpenCorrection = () => {
      setModalGuestMode(true);
      setManageModalOpen(true);
    };

    window.addEventListener("open-company-claim-modal", handleOpenClaim);
    window.addEventListener("open-company-correction-modal", handleOpenCorrection);
    return () => {
      window.removeEventListener("open-company-claim-modal", handleOpenClaim);
      window.removeEventListener("open-company-correction-modal", handleOpenCorrection);
    };
  }, [searchParams]);

  if (!mounted) {
    return (
      <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full sm:w-auto">
        <button
          disabled
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[#1B4F8A] text-white w-full sm:w-auto opacity-95"
        >
          <Activity className="w-3.5 h-3.5 text-blue-200" />
          <span>{isEn ? "Watch Company" : isVi ? "Theo dõi biến động" : "企業変動をウォッチ"}</span>
        </button>
        <button
          disabled
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700/80 rounded-lg w-full sm:w-auto"
        >
          <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          <span>{isEn ? "Quick Audit" : isVi ? "Đánh giá nhanh" : "企業クイック診断"}</span>
        </button>
        {isClaimed && (
          <button
            disabled
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg whitespace-nowrap shrink-0 w-full sm:w-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isEn ? "Verified" : isVi ? "Đã xác minh" : "公式認証済"}</span>
          </button>
        )}
      </div>
    );
  }

  const isSaved = isCompanySaved(corporateNumber);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full sm:w-auto">
        {/* BUTTON 1: Primary Action - Company Monitoring / Watchlist (企業変動をウォッチ) */}
        <button
          onClick={() => {
            if (!isLoggedIn) {
              setAuthModalOpen(true);
            } else {
              toggleSaveCompany(corporateNumber);
            }
          }}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-150 w-full sm:w-auto shadow-xs active:scale-[0.98] ${
            isSaved
              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
              : "bg-[#1B4F8A] hover:bg-[#143D6C] text-white border border-[#1B4F8A]"
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEn ? "Watching Signals" : isVi ? "Đang theo dõi biến động" : "変動ウォッチ中"}</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 text-blue-200" />
              <span>{isEn ? "Watch Company" : isVi ? "Theo dõi biến động" : "企業変動をウォッチ"}</span>
            </>
          )}
        </button>

        {/* BUTTON 2: Quick Audit & Risk Assessment (企業クイック診断) */}
        <button
          type="button"
          onClick={() => setAuditModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-[#161B22] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg shadow-2xs transition-all active:scale-[0.98] cursor-pointer w-full sm:w-auto"
          title={isEn ? "Company Quick Risk Audit" : isVi ? "Đánh giá nhanh doanh nghiệp & rủi ro" : "企業クイック診断・リスク判定レポート"}
        >
          <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          <span>{isEn ? "Quick Audit" : isVi ? "Đánh giá nhanh" : "企業クイック診断"}</span>
        </button>

        {/* BUTTON 3: Verified Badge (公式認証済) only when company is claimed */}
        {isClaimed && (
          <button
            type="button"
            onClick={() => {
              setModalGuestMode(false);
              setManageModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 rounded-lg shadow-2xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto"
            title={isEn ? "Verified Official Company (Manage Profile)" : isVi ? "Doanh nghiệp đã xác minh (Bảng quản trị)" : "公式認証済企業（自社管理パネル）"}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isEn ? "Verified" : isVi ? "Đã xác minh" : "公式認証済"}</span>
          </button>
        )}
      </div>

      {/* Official Company Claim Modal (企業認証モーダル) */}
      <CompanyClaimModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        corporateNumber={corporateNumber}
        companyName={companyName}
        websiteUrl={websiteUrl}
        phone={phone}
        claimToken={searchParams?.get("claim_token") || null}
        onSuccess={() => {
          // Success handled in modal
        }}
      />

      {/* Quick Audit & Risk Report Modal */}
      <CompanyQuickAuditModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        corporateNumber={corporateNumber}
        companyName={companyName}
        representativeName={representativeName}
        fullAddress={fullAddress}
        capitalAmount={capitalAmount}
        employeeCount={employeeCount}
        salesAmount={salesAmount}
        establishmentDate={fiscalMonth}
        phone={phone}
        websiteUrl={websiteUrl}
        licenses={licenses}
      />

      {/* Unified Enterprise Management & Claim Modal */}
      <CompanyManagementModal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        initialGuestMode={modalGuestMode}
        corporateNumber={corporateNumber}
        companyName={companyName}
        initialPhone={phone}
        initialWebsite={websiteUrl}
        initialEmail={email}
        initialFax={fax}
        initialRepresentative={representativeName}
        initialRepresentativePosition={representativePosition}
        initialKana={companyNameKana}
        initialEn={companyNameEn}
        initialPostalCode={postalCode}
        initialAddress={fullAddress}
        initialCapital={capitalAmount}
        initialEmployees={employeeCount}
        initialSales={salesAmount}
        initialFiscalMonth={fiscalMonth}
        initialContactFormUrl={contactFormUrl}
        initialRecruitUrl={recruitUrl}
        initialDescription={jigyoShumoku}
        initialMainClients={mainClients}
        initialMainBanks={mainBanks}
        initialSnsLinks={snsLinks}
        initialPrTitle={prTitle}
        initialPrMessage={prMessage}
        isClaimed={isClaimed}
        claimedByEmail={claimedByEmail}
        onSuccess={() => {
          setTimeout(() => window.location.reload(), 1500);
        }}
      />
    </>
  );
};
