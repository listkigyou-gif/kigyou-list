"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Plus, Check, ShieldCheck, CheckCircle2, Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { CompanyManagementModal } from "./CompanyManagementModal";
import { CompanyCorrectionModal } from "./CompanyCorrectionModal";
import { isAdminEmail } from "@/lib/adminAuth";

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
}) => {
  const { isLoggedIn, user, isCompanySaved, toggleSaveCompany, setAuthModalOpen } = useAuth();
  const { locale } = useLanguage();
  const searchParams = useSearchParams();

  const isEn = locale === "en";
  const isVi = locale === "vi";
  const isUserAdmin = Boolean(user?.email && isAdminEmail(user.email));
  const [mounted, setMounted] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-open management modal if claim=1 or manage=1 in query params
    const claimParam = searchParams.get("claim") || searchParams.get("manage");
    if (claimParam === "1" || claimParam === "true") {
      setManageModalOpen(true);
    }
    const editParam = searchParams.get("edit") || searchParams.get("correction");
    if (editParam === "1" || editParam === "true") {
      setCorrectionModalOpen(true);
    }

    const handleOpenModal = () => setManageModalOpen(true);
    const handleOpenCorrection = () => setCorrectionModalOpen(true);

    window.addEventListener("open-company-claim-modal", handleOpenModal);
    window.addEventListener("open-company-correction-modal", handleOpenCorrection);
    return () => {
      window.removeEventListener("open-company-claim-modal", handleOpenModal);
      window.removeEventListener("open-company-correction-modal", handleOpenCorrection);
    };
  }, [searchParams]);

  if (!mounted) {
    return (
      <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
        <button
          disabled
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          {isEn ? "Save to My List" : "マイリストに保存"}
        </button>
      </div>
    );
  }

  const isSaved = isCompanySaved(corporateNumber);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full sm:w-auto">
        {/* UNIFIED SINGLE ENTRY POINT: Official Management & Claim Button */}
        {isUserAdmin ? (
          <button
            onClick={() => setManageModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-lg shadow-xs transition-all active:scale-[0.98] w-full sm:w-auto"
            title={isEn ? "Super Admin Direct Edit (No OTP)" : "管理者特権編集（OTP不要・即時保存）"}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{isEn ? "Admin Direct Edit" : "管理者・情報編集（即時保存）"}</span>
          </button>
        ) : isClaimed ? (
          <button
            onClick={() => setManageModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg shadow-xs transition-all active:scale-[0.98] w-full sm:w-auto"
            title={isEn ? "Official Verified Business - Click to manage info" : "公式認証企業（クリックして情報管理）"}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isEn ? "Verified (Manage)" : "公式認証済（企業管理）"}</span>
          </button>
        ) : (
          <button
            onClick={() => setManageModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/80 rounded-lg shadow-xs transition-all active:scale-[0.98] w-full sm:w-auto group"
            title={isEn ? "Official Business Claim & Info Management (Free)" : "公式オーナー認証・情報管理（無料）"}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>{isEn ? "Claim & Manage" : "公式オーナー認証・情報管理"}</span>
          </button>
        )}

        {/* MyList Save/Remove Button */}
        <button
          onClick={() => {
            if (!isLoggedIn) {
              setAuthModalOpen(true);
            } else {
              toggleSaveCompany(corporateNumber);
            }
          }}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 w-full sm:w-auto ${
            isSaved
              ? "bg-amber-50 hover:bg-amber-100/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60"
              : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-[#1C2128] dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
          } shadow-xs active:scale-[0.98]`}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-amber-600" />
              <span>{isEn ? "Saved to My List" : "マイリスト登録済み"}</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>{isEn ? "Save to My List" : "マイリストに保存"}</span>
            </>
          )}
        </button>

        {/* Print / Save PDF Button (Enterprise Due Diligence & Internal Review) */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.print();
            }
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 dark:bg-[#161B22] dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-2xs transition-colors duration-150 cursor-pointer w-full sm:w-auto"
          title={isEn ? "Print or Export PDF (Internal Review)" : isVi ? "In hoặc Xuất PDF" : "印刷・PDF保存（社内稟議・検討用）"}
        >
          <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{isEn ? "Print / PDF" : isVi ? "In / PDF" : "印刷・PDF"}</span>
        </button>
      </div>

      {/* Unified Enterprise Management & Claim Modal */}
      <CompanyManagementModal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        corporateNumber={corporateNumber}
        companyName={companyName}
        initialPhone={phone}
        initialWebsite={websiteUrl}
        initialEmail={email}
        initialFax={fax}
        initialRepresentative={representativeName}
        initialPrTitle={prTitle}
        initialPrMessage={prMessage}
        isClaimed={isClaimed}
        claimedByEmail={claimedByEmail}
        onSuccess={() => {
          setTimeout(() => window.location.reload(), 1500);
        }}
      />

      {/* Community / Employee Correction & Addition Modal */}
      <CompanyCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        corporateNumber={corporateNumber}
        companyName={companyName}
        initialWebsiteUrl={websiteUrl}
        initialPhone={phone}
        initialFax={fax}
        initialEmail={email}
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
      />
    </>
  );
};
