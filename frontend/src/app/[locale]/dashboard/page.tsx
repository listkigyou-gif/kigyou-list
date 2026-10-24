"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth, KanbanStage } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { prefectureJaToEn, industryJaToEn } from "@/lib/locale-mapping";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import DashboardLoading from "./loading";
import { 
  Building2, Trash2, Download, ArrowRight, Kanban, ListFilter, 
  Sparkles, CheckCircle2, ChevronRight, Lock, Phone, MoveLeft, MoveRight,
  AlertTriangle, Settings, Loader2, X, ShieldAlert, Upload, Key, Terminal, Copy, Check,
  Search, FileText, ExternalLink, RefreshCw, Eye, ShieldCheck, Send,
  Clock, Info, Coins, Edit3, GripVertical, FileSpreadsheet, StickyNote, Play, Activity, Bell
} from "lucide-react";
import Link from "next/link";
import { parseUTCDate } from "@/lib/dateUtils";
import { CompaniesTab, CompaniesTabStats } from "@/components/dashboard/CompaniesTab";
import { FormCampaignsTab } from "@/components/dashboard/FormCampaignsTab";
import { DeveloperTab } from "@/components/dashboard/DeveloperTab";
import { WatchlistTab } from "@/components/dashboard/WatchlistTab";

interface DbCompany {
  corporate_number: string;
  company_name: string;
  postal_code: string | null;
  prefecture_name: string | null;
  phone_number: string | null;
  fax_number: string | null;
  email_address: string | null;
  website_url: string | null;
  employee_count: number | null;
  capital_amount: number | null;
  jigyo_shumoku: string | null;
  status?: string | null;
  has_hiring?: boolean;
  has_subsidy?: boolean;
  has_bidding?: boolean;
  has_patent?: boolean;
  has_award?: boolean;
  has_certification?: boolean;
}

const DEMO_COMPANIES: DbCompany[] = [
  {
    corporate_number: "9010001008844",
    company_name: "トヨタ自動車株式会社",
    postal_code: "471-8571",
    prefecture_name: "愛知県",
    phone_number: "0565-28-2121",
    fax_number: null,
    email_address: "contact@toyota.co.jp",
    website_url: "https://global.toyota",
    employee_count: 70710,
    capital_amount: 635401000000,
    jigyo_shumoku: "輸送用機械器具製造業",
  },
  {
    corporate_number: "5010401014023",
    company_name: "ソニーグループ株式会社",
    postal_code: "108-0075",
    prefecture_name: "東京都",
    phone_number: "03-6748-2111",
    fax_number: null,
    email_address: "info@sony.com",
    website_url: "https://www.sony.com",
    employee_count: 113000,
    capital_amount: 880365000000,
    jigyo_shumoku: "電気機器製造業・エンターテインメント",
  },
  {
    corporate_number: "7010701026082",
    company_name: "楽天グループ株式会社",
    postal_code: "158-0094",
    prefecture_name: "東京都",
    phone_number: "050-5581-6910",
    fax_number: null,
    email_address: "corp-info@rakuten.com",
    website_url: "https://corp.rakuten.co.jp",
    employee_count: 32000,
    capital_amount: 332400000000,
    jigyo_shumoku: "情報通信業・ECプラットフォーム",
  },
  {
    corporate_number: "7011001031023",
    company_name: "株式会社サイバーエージェント",
    postal_code: "150-0042",
    prefecture_name: "東京都",
    phone_number: "03-5459-0202",
    fax_number: null,
    email_address: "ir@cyberagent.co.jp",
    website_url: "https://www.cyberagent.co.jp",
    employee_count: 7500,
    capital_amount: 7200000000,
    jigyo_shumoku: "インターネット広告・メディア事業",
  },
  {
    corporate_number: "3010401108253",
    company_name: "株式会社メルカリ",
    postal_code: "106-6118",
    prefecture_name: "東京都",
    phone_number: "03-6804-6901",
    fax_number: null,
    email_address: "press@mercari.com",
    website_url: "https://about.mercari.com",
    employee_count: 2200,
    capital_amount: 4500000000,
    jigyo_shumoku: "フリマアプリ企画・開発・運営",
  },
];

const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context is null"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob returned null"));
            }
          },
          outputType,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function DashboardPage() {
  const { 
    isLoggedIn, isAuthLoading, user, quota: authQuota, refreshQuota, setAuthModalOpen,
    savedCompanies, toggleSaveCompany, kanbanStages, updateKanbanStage 
  } = useAuth();
  const { locale, t } = useLanguage();
  const stageLabels: Record<string, string> = locale === 'en' ? {
    "未連絡": "Uncontacted",
    "連絡済み": "Contacted",
    "商談中": "Discussing",
    "成約": "Closed Won"
  } : locale === 'vi' ? {
    "未連絡": "Chưa liên hệ",
    "連絡済み": "Đã tiếp cận",
    "商談中": "Đang thương thảo",
    "成約": "Chốt hợp đồng thành công"
  } : {
    "未連絡": "未連絡",
    "連絡済み": "連絡済み",
    "商談中": "商談中",
    "成約": "成約"
  };
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"watchlist" | "exports" | "payments" | "settings" | "developer" | "companies" | "formCampaigns">("watchlist");
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(["watchlist"]));
  const [watchlistEventsCount, setWatchlistEventsCount] = useState<number>(0);
  const [companies, setCompanies] = useState<DbCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // Demo mode for unauthenticated guest interactive preview
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoStages, setDemoStages] = useState<Record<string, KanbanStage>>({
    "9010001008844": "未連絡",
    "5010401014023": "連絡済み",
    "7010701026082": "商談中",
    "7011001031023": "成約",
    "3010401108253": "未連絡",
  });

  // Quick Sales Memo state (persisted to localStorage)
  const [companyMemos, setCompanyMemos] = useState<Record<string, string>>({
    "9010001008844": "10/18 購買部担当者様宛にソリューション概要送付済み",
    "7010701026082": "10/22 次回オンライン商談予定（提案書準備）",
  });
  const [editingMemoCorp, setEditingMemoCorp] = useState<string | null>(null);
  const [tempMemoText, setTempMemoText] = useState("");

  // Kanban Drag and Drop states
  const [draggingCorpNum, setDraggingCorpNum] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Bulk stage change modal/dropdown state
  const [bulkTargetStage, setBulkTargetStage] = useState<KanbanStage | "">("");

  // Load saved memos from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kigyou_dashboard_memos");
      if (saved) {
        setCompanyMemos(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.error("Failed to load memos", e);
    }
  }, []);

  const handleSaveMemo = (corpNum: string, text: string) => {
    const updated = { ...companyMemos, [corpNum]: text };
    setCompanyMemos(updated);
    setEditingMemoCorp(null);
    try {
      localStorage.setItem("kigyou_dashboard_memos", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save memo", e);
    }
  };

  // My List filters & Multi-select
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listFilterStage, setListFilterStage] = useState<string>("all");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [campaignInitialCompanies, setCampaignInitialCompanies] = useState<{ id: string; name: string }[] | null>(null);
  const [companiesStats, setCompaniesStats] = useState<CompaniesTabStats>({
    count: 0,
    prCount: 0,
    isVerified: false,
    allowance: 20,
    pendingCount: 0,
  });

  // Code snippet tab in developer console
  const [codeTab, setCodeTab] = useState<"curl" | "python" | "node">("curl");
  const [selectedEndpoint, setSelectedEndpoint] = useState<"companies" | "quota" | "signals">("companies");

  // API Key states
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // CSV Confirm Modal States
  const [showCSVConfirm, setShowCSVConfirm] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);
  const [csvQuota, setCsvQuota] = useState<{ remaining: number; plan: string } | null>(null);
  
  // Subscription Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [exportJobs, setExportJobs] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingExports, setLoadingExports] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [formCampaignsList, setFormCampaignsList] = useState<any[]>([]);
  const [loadingFormCampaigns, setLoadingFormCampaigns] = useState(false);
  const [formCredits, setFormCredits] = useState<{ balance: number; total_purchased: number; total_used: number }>({
    balance: 0,
    total_purchased: 0,
    total_used: 0
  });

  // Billing Info States
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingTaxId, setBillingTaxId] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Quota indicators state (shared from AuthContext to prevent duplicate queries)
  const [localQuota, setLocalQuota] = useState<{
    monthly_base_allowance: number;
    monthly_base_used: number;
    purchased_add_on_balance: number;
    plan: string;
    remaining: number;
    last_reset_date?: string;
    subscription_status?: string;
  } | null>(null);
  const quota = localQuota || authQuota;
  const setQuota = setLocalQuota;

  // Helper to get subscription contract or reset period text
  const getSubscriptionPeriodText = (lastResetStr: string | undefined, plan: string | undefined) => {
    if (!lastResetStr) return "";
    const parts = lastResetStr.split('-');
    if (parts.length !== 3) return "";
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1; // 0-indexed month
    const d = parseInt(parts[2]);
    
    // Start date in UTC JST mapping
    const startDate = new Date(Date.UTC(y, m, d));
    const nextDate = new Date(Date.UTC(y, m, d));
    
    if (plan === "free") {
      // Free plan resets daily
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    } else {
      // Paid plans reset monthly
      nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
    }
    
    const format = (date: Date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };
    
    if (plan === "free") {
      return locale === 'en' ? `Next reset: ${format(nextDate)}` : locale === 'vi' ? `Lần đặt lại tiếp theo: ${format(nextDate)}` : `次回リセット日: ${format(nextDate)}`;
    }
    return locale === 'en' ? `Period: ${format(startDate)} - ${format(nextDate)}` : locale === 'vi' ? `Chu kỳ: ${format(startDate)} - ${format(nextDate)}` : `契約期間: ${format(startDate)} 〜 ${format(nextDate)}`;
  };

  const fetchQuota = useCallback(async () => {
    if (!user?.email) return;
    try {
      await refreshQuota(user.email);
    } catch (e) {
      console.error("Failed to fetch quota", e);
    }
  }, [user?.email, refreshQuota]);

  const fetchExportJobs = useCallback(async () => {
    if (!user?.email) return;
    setLoadingExports(true);
    try {
      const response = await fetch(`/api/export/jobs?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      if (data.jobs) {
        setExportJobs(data.jobs);
      }
    } catch (e) {
      console.error("Failed to fetch export jobs", e);
    } finally {
      setLoadingExports(false);
    }
  }, [user]);

  const fetchPaymentHistory = useCallback(async () => {
    if (!user?.email) return;
    setLoadingPayments(true);
    try {
      const response = await fetch(`/api/stripe/history?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      if (data.history) {
        setPaymentHistory(data.history);
      }
    } catch (e) {
      console.error("Failed to fetch payments", e);
    } finally {
      setLoadingPayments(false);
    }
  }, [user]);

  const fetchBillingInfo = useCallback(async () => {
    if (!user?.email) return;
    setLoadingBilling(true);
    try {
      const response = await fetch("/api/user/billing-info");
      const data = await response.json();
      if (data.success && data.billingInfo) {
        setBillingName(data.billingInfo.billing_name || "");
        setBillingAddress(data.billingInfo.billing_address || "");
        setBillingTaxId(data.billingInfo.billing_tax_id || "");
        setBillingPhone(data.billingInfo.billing_phone || "");
        setLogoUrl(data.billingInfo.logo_url || "");
        setContactPerson(data.billingInfo.contact_person || "");
        setContactPhone(data.billingInfo.contact_phone || "");
      }
    } catch (e) {
      console.error("Failed to fetch billing info", e);
    } finally {
      setLoadingBilling(false);
    }
  }, [user]);

  const fetchFormCampaigns = useCallback(async () => {
    if (!user?.email) return;
    setLoadingFormCampaigns(true);
    try {
      const res = await fetch("/api/user/form-campaigns");
      if (res.ok) {
        const data = await res.json();
        setFormCampaignsList(data.campaigns || []);
      }
    } catch (e) {
      console.error("Failed to fetch form campaigns in dashboard", e);
    } finally {
      setLoadingFormCampaigns(false);
    }
  }, [user]);

  const fetchCredits = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch("/api/user/form-credits");
      if (res.ok) {
        const data = await res.json();
        if (data.credits) {
          setFormCredits(data.credits);
        }
      }
    } catch (e) {
      console.error("Failed to fetch form credits in dashboard", e);
    }
  }, [user]);

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setSavingBilling(true);
    try {
      const response = await fetch("/api/user/billing-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingName,
          billingAddress,
          billingTaxId,
          billingPhone,
          logoUrl,
          contactPerson,
          contactPhone,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(t.dashboard.saveReceiptSuccess);
      } else {
        alert(data.error || t.dashboard.saveReceiptFailed);
      }
    } catch (e) {
      console.error("Failed to save billing info", e);
      alert(locale === 'en' ? "A communication error occurred. Please try again." : locale === 'vi' ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau." : "通信エラーが発生しました。");
    } finally {
      setSavingBilling(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert(t.dashboard.fileSizeError);
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      alert(t.dashboard.fileTypeError);
      return;
    }

    setUploadingLogo(true);

    try {
      let uploadFile: File | Blob = file;
      
      // Compress PNG/JPG
      if (file.type !== "image/svg+xml") {
        try {
          const compressedBlob = await compressImage(file, 240, 80, 0.8);
          uploadFile = compressedBlob;
        } catch (err) {
          console.error("Compression failed, using original file", err);
        }
      }

      const formData = new FormData();
      formData.append("logo", uploadFile, file.name);

      const res = await fetch("/api/user/billing-info/upload-logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogoUrl(data.logoUrl);
        alert(t.dashboard.uploadLogoSuccess);
      } else {
        alert(data.error || (locale === 'en' ? "Upload failed." : locale === 'vi' ? "Tải lên thất bại." : "アップロードに失敗しました。"));
      }
    } catch (err) {
      console.error("Logo upload error:", err);
      alert(locale === 'en' ? "A communication error occurred. Please try again." : locale === 'vi' ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau." : "通信エラーが発生しました。");
    } finally {
      setUploadingLogo(false);
    }
  };

  const fetchApiKeys = useCallback(async () => {
    setLoadingApiKeys(true);
    try {
      const res = await fetch("/api/user/apikeys");
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch (e) {
      console.error("Failed to fetch API keys", e);
    } finally {
      setLoadingApiKeys(false);
    }
  }, []);

  const handleCreateApiKey = async () => {
    setGeneratingKey(true);
    setNewRawKey(null);
    try {
      const res = await fetch("/api/user/apikeys", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setNewRawKey(data.rawKey);
        fetchApiKeys();
      } else {
        alert(data.error || t.dashboard.apiKeyGenerateFailed);
      }
    } catch (e) {
      console.error("Failed to create API key", e);
      alert(locale === 'en' ? "A communication error occurred. Please try again." : locale === 'vi' ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau." : "通信エラーが発生しました。");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!window.confirm(t.dashboard.apiKeyRevokeConfirm)) return;
    try {
      const res = await fetch("/api/user/apikeys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(t.dashboard.apiKeyRevokeSuccess);
        fetchApiKeys();
      } else {
        alert(data.error || (locale === 'en' ? "Failed to deactivate API key." : locale === 'vi' ? "Vô hiệu hóa khóa API thất bại." : "APIキーの無効化に失敗しました。"));
      }
    } catch (e) {
      console.error("Failed to revoke API key", e);
      alert(locale === 'en' ? "A communication error occurred. Please try again." : locale === 'vi' ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau." : "通信エラーが発生しました。");
    }
  };

  useEffect(() => {
    if (activeTab === "exports" && exportJobs.length === 0) {
      fetchExportJobs();
    } else if (activeTab === "payments" && paymentHistory.length === 0) {
      fetchPaymentHistory();
    } else if (activeTab === "settings" && !billingName) {
      fetchBillingInfo();
    } else if (activeTab === "developer" && apiKeys.length === 0) {
      fetchApiKeys();
    } else if (activeTab === "formCampaigns" && formCampaignsList.length === 0) {
      fetchFormCampaigns();
    }
  }, [activeTab, fetchExportJobs, fetchPaymentHistory, fetchBillingInfo, fetchApiKeys, fetchFormCampaigns, exportJobs.length, paymentHistory.length, billingName, apiKeys.length, formCampaignsList.length]);

  // Sync saved list from API
  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["watchlist", "exports", "payments", "settings", "developer", "companies", "formCampaigns"].includes(tab)) {
      setActiveTab(tab as any);
      setVisitedTabs((prev) => new Set([...prev, tab]));
    }
  }, []);

  useEffect(() => {
    if (user?.email && !quota) {
      fetchQuota();
    }
  }, [user?.email, quota, fetchQuota]);

  useEffect(() => {
    const handleQuotaUpdated = () => {
      refreshQuota();
    };
    window.addEventListener("quotaUpdated", handleQuotaUpdated);
    return () => {
      window.removeEventListener("quotaUpdated", handleQuotaUpdated);
    };
  }, [refreshQuota]);

  useEffect(() => {
    const handleCampaignsUpdated = () => {
      fetchFormCampaigns();
    };
    window.addEventListener("formCampaignsUpdated", handleCampaignsUpdated);
    return () => {
      window.removeEventListener("formCampaignsUpdated", handleCampaignsUpdated);
    };
  }, [fetchFormCampaigns]);

  useEffect(() => {
    fetchCredits();
    const handleCreditsUpdated = () => {
      fetchCredits();
    };
    window.addEventListener("formCreditsUpdated", handleCreditsUpdated);
    window.addEventListener("formCampaignsUpdated", handleCreditsUpdated);
    return () => {
      window.removeEventListener("formCreditsUpdated", handleCreditsUpdated);
      window.removeEventListener("formCampaignsUpdated", handleCreditsUpdated);
    };
  }, [fetchCredits]);

  // Handle direct tab navigation via query parameter (e.g. ?tab=formCampaigns)
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["watchlist", "list", "kanban", "exports", "payments", "settings", "developer", "companies", "formCampaigns"].includes(tabParam)) {
      setActiveTab(tabParam as any);
      setVisitedTabs((prev) => new Set([...prev, tabParam]));
    }
  }, [mounted]);

  // Handle Stripe subscription success redirection & simulation
  useEffect(() => {
    if (!mounted || !user?.email) return;

    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("stripe_success") === "true";
    
    if (isSuccess) {
      const plan = params.get("plan");
      const pack = params.get("pack");
      const formPlanId = params.get("formPlanId");
      const email = params.get("email");
      const amountJpy = params.get("amount_jpy");
      const allowance = params.get("allowance");
      const amount = params.get("amount");
      
      if (formPlanId && email && allowance) {
        // Form Credits purchase trigger
        const triggerSimulatedFormWebhook = async () => {
          try {
            const res = await fetch("/api/stripe/webhook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                simulated: true,
                formPlanId,
                email,
                allowance: Number(allowance),
                amount_jpy: Number(amountJpy || 0)
              })
            });
            if (res.ok) {
              window.dispatchEvent(new Event("formCreditsUpdated"));
              window.dispatchEvent(new Event("formCampaignsUpdated"));
              alert(
                locale === 'ja'
                  ? `【購入完了】フォーム営業クレジット（+${Number(allowance).toLocaleString()}件）をチャージしました！`
                  : locale === 'vi'
                  ? `【Thành công】Đã nạp +${Number(allowance).toLocaleString()} lượt gửi Form vào ví của bạn!`
                  : `【Success】Added +${Number(allowance).toLocaleString()} Form Credits to your wallet!`
              );
              window.location.href = `/${locale}/dashboard?tab=formCampaigns`;
            }
          } catch (e) {
            console.error("Failed to trigger simulated webhook for form credits", e);
          }
        };
        triggerSimulatedFormWebhook();
      } else if (plan && email && amountJpy && allowance) {
        // Simulated subscription creation trigger
        const triggerSimulatedWebhook = async () => {
          try {
            const res = await fetch("/api/stripe/webhook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                simulated: true,
                type: "subscription_created",
                email,
                plan,
                amount_jpy: Number(amountJpy),
                allowance: Number(allowance)
              })
            });
            if (res.ok) {
              window.dispatchEvent(new Event("quotaUpdated"));
              alert(t.dashboard.subscriptionSuccess);
              window.location.href = "/dashboard";
            }
          } catch (e) {
            console.error("Failed to trigger simulated webhook", e);
          }
        };
        triggerSimulatedWebhook();
      } else if (pack && email && amount) {
        // Simulated spot package purchase trigger
        const triggerSimulatedPackWebhook = async () => {
          try {
            const res = await fetch("/api/stripe/webhook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                simulated: true,
                email,
                amount: Number(amount)
              })
            });
            if (res.ok) {
              window.dispatchEvent(new Event("quotaUpdated"));
              alert(t.dashboard.packBuySuccess.replace("{amount}", Number(amount).toLocaleString()));
              window.location.href = "/dashboard";
            }
          } catch (e) {
            console.error("Failed to trigger simulated webhook for pack", e);
          }
        };
        triggerSimulatedPackWebhook();
      } else {
        alert(t.dashboard.subscriptionPending);
        window.location.href = "/dashboard";
      }
    }
  }, [mounted, user?.email]);

  const handleCancelSubscription = async () => {
    if (!user?.email) return;
    setCancellingSub(true);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        alert(t.dashboard.cancelSubscriptionSuccess);
        setShowCancelModal(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || (locale === 'en' ? "Failed to cancel subscription." : locale === 'vi' ? "Hủy đăng ký thất bại." : "解約処理に失敗しました。"));
      }
    } catch (e) {
      console.error(e);
      alert(locale === 'en' ? "A communication error occurred. Please try again." : locale === 'vi' ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau." : "通信エラーが発生しました。");
    } finally {
      setCancellingSub(false);
    }
  };

  useEffect(() => {
    if (!mounted || isAuthLoading) return;
    
    const fetchSavedCompanies = async () => {
      if (savedCompanies.length === 0) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/companies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: savedCompanies }),
        });
        const data = await response.json();
        if (data.companies) {
          setCompanies(data.companies);
        }
      } catch (e) {
        console.error("Failed to fetch saved companies info", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedCompanies();
  }, [savedCompanies, mounted, isAuthLoading]);

  // While initializing or checking NextAuth session, display instant seamless skeleton matching layout
  if (!mounted || isAuthLoading) {
    return <DashboardLoading />;
  }

  // If not logged in and not in demo mode, show calm Japanese B2B registration & preview gate
  if (!isLoggedIn && !isDemoMode) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto gap-8 py-16 sm:py-24">
          {/* Executive Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 text-[#1B4F8A] dark:text-blue-400 text-xs font-semibold rounded-lg shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400" />
            <span>{locale === 'en' ? "ABM Corporate Workspace (Members Only)" : "【法人会員専用】ABM営業支援コンソール"}</span>
          </div>

          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug"
              style={{ fontFeatureSettings: '"palt"' }}
            >
              {locale === 'en' 
                ? "Manage corporate pipeline, saved target lists, and qualified invoice exports" 
                : "ターゲット企業の選定から商談・成約プロセスまでを一元管理"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {locale === 'en' 
                ? "Save your ideal accounts to My List, advance sales stages via Kanban pipeline, and export verified corporate data directly to CSV." 
                : "気になる企業を即時ブックマークする「マイリスト」や、案件化プロセスを前進させる「かんばん営業管理ボード」、インボイス制度対応のCSV一括出力を手軽にご利用いただけます。"}
            </p>
          </div>

          {/* 4 Feature Cards (Minimalist B2B Standard) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
            <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-xl shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60">
                <ListFilter className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">マイリスト保存・社内メモ</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  ターゲット企業を即時リスト化し、担当者名や進捗メモを一元管理
                </span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-xl shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/60">
                <Kanban className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">直感的なかんばん管理 (D&D)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  未連絡・連絡済み・商談中・成約をドラッグ＆ドロップで視覚的に管理
                </span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-xl shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/60">
                <Download className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">CSV一括ダウンロード</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  電話番号・所在地・役員・財務データをCSVで即時出力、自社SFAへ連携
                </span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-xl shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">適格請求書（インボイス制度対応）</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  T+13桁登録番号記載の公式PDF領収書を発行、経理処理も安心
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons including Demo Mode */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-lg justify-center">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex-1 px-5 py-2.5 font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#143D6C] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {locale === 'en' ? t.dashboard.registerFreeBtn : '無料会員登録 (10秒)'}
            </button>
            <button
              onClick={() => setIsDemoMode(true)}
              className="flex-1 px-4 py-2.5 font-bold text-xs sm:text-sm text-[#1B4F8A] bg-white border border-slate-300/90 hover:bg-slate-50 dark:bg-[#151B22] dark:border-slate-700 dark:text-blue-400 dark:hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="サンプル企業5社でかんばんやリスト操作を体験できます"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{locale === 'en' ? "Try Demo Mode" : "デモ画面を体験する"}</span>
            </button>
            <Link
              href={`/${locale}/search`}
              className="px-4 py-2.5 font-semibold text-xs sm:text-sm text-slate-600 bg-transparent hover:bg-slate-100/60 dark:text-slate-400 dark:hover:bg-slate-800/60 rounded-lg transition-colors text-center"
            >
              {locale === 'en' ? t.dashboard.backToSearch : '企業検索へ'}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isPro = user?.role === "pro" || user?.role === "business" || user?.role === "enterprise";

  // Quota plan metadata for display
  const PLAN_INFO = {
    free:       { label: locale === 'en' ? "FREE Plan" : "FREEプラン",       quota: locale === 'en' ? "20 rows/day" : "20行/日",    nextPlan: "pro",        nextPrice: "¥2,900", nextLabel: locale === 'en' ? "Upgrade to PRO" : "PROプランにアップグレード" },
    pro:        { label: locale === 'en' ? "PRO Plan" : "PROプラン",         quota: locale === 'en' ? "2,000 rows/month" : "2,000行/月", nextPlan: "business",   nextPrice: "¥9,800", nextLabel: locale === 'en' ? "Upgrade to BUSINESS" : "BUSINESSプランにアップグレード" },
    business:   { label: locale === 'en' ? "BUSINESS Plan" : "BUSINESSプラン",   quota: locale === 'en' ? "10,000 rows/month" : "10,000行/月",nextPlan: "enterprise", nextPrice: "¥29,000",nextLabel: locale === 'en' ? "Upgrade to ENTERPRISE" : "ENTERPRISEプランにアップグレード" },
    enterprise: { label: locale === 'en' ? "ENTERPRISE Plan" : "ENTERPRISEプラン", quota: locale === 'en' ? "40,000 rows/month" : "40,000行/月",nextPlan: null,         nextPrice: null,     nextLabel: null },
    trial:      { label: locale === 'en' ? "TRIAL Plan" : "TRIALプラン",      quota: locale === 'en' ? "10 rows" : "10行",      nextPlan: "pro",        nextPrice: "¥2,900", nextLabel: locale === 'en' ? "Upgrade to PRO" : "PROプランにアップグレード" },
  };
  const currentPlanInfo = PLAN_INFO[user?.role as keyof typeof PLAN_INFO] || PLAN_INFO.free;

  // CSV Exporter logic — quota-aware
  const handleCSVDownload = async () => {
    if (isDemoMode) {
      alert(locale === 'ja' ? "【デモモード】CSVダウンロード機能の本番利用には無料会員登録が必要です。" : "Demo mode: please register for full CSV exports.");
      setAuthModalOpen(true);
      return;
    }
    if (quota?.subscription_status === 'suspended') {
      alert(locale === 'en' ? "Your account is temporarily suspended, CSV export is disabled." : "アカウントが一時停止されているため、エクスポートを実行できません。");
      return;
    }
    if (effectiveCompanies.length === 0) {
      alert(locale === 'en' ? "Your My List is empty. Please search and save companies." : "マイリストが空です。企業を検索して保存してください。");
      return;
    }

    setCsvExporting(true);
    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(user?.email || "")}`);
      if (!res.ok) throw new Error("Quota check failed");
      const data = await res.json();
      const q = data.quota as { remaining: number; plan: string };
      setCsvQuota(q);

      if (q.remaining < effectiveCompanies.length) {
        // Not enough quota → show upsell modal
        setShowUpsellModal(true);
      } else {
        // Enough quota → show confirm modal
        setShowCSVConfirm(true);
      }
    } catch (e) {
      console.error("CSV quota check error", e);
      alert(locale === 'en' ? "Failed to verify download quota. Please try again." : "残容量の確認に失敗しました。再試行してください。");
    } finally {
      setCsvExporting(false);
    }
  };

  // Execute the actual CSV download + quota deduction
  const executeCSVDownload = async () => {
    if (quota?.subscription_status === 'suspended') {
      alert(locale === 'en' ? "Your account is temporarily suspended, CSV export is disabled." : "アカウントが一時停止されているため、エクスポートを実行できません。");
      return;
    }
    setShowCSVConfirm(false);
    setCsvExporting(true);

    try {
      // 1. Deduct quota first
      const deductRes = await fetch("/api/export/quota-deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: effectiveCompanies.length }),
      });

      if (!deductRes.ok) {
        const err = await deductRes.json();
        if (err.error === "insufficient_quota") {
          setShowUpsellModal(true);
          return;
        }
        throw new Error(err.error || "Quota deduction failed");
      }

      // 2. Build CSV columns (email only for Pro+)
      const headers = [
        "法人番号",
        "企業名",
        "郵便番号",
        "都道府県",
        "代表電話番号",
        "FAX番号",
        "ウェブサイトURL",
        "従業員数",
        "資本金",
        "事業種目",
        ...(isPro ? ["メールアドレス"] : []),
        "営業ステージ",
      ];

      const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

      const rows = effectiveCompanies.map(c => [
        c.corporate_number,
        c.company_name,
        c.postal_code || "",
        c.prefecture_name ? (locale === 'en' ? (prefectureJaToEn[c.prefecture_name] || c.prefecture_name) : c.prefecture_name) : "",
        c.phone_number || "",
        c.fax_number || "",
        c.website_url || "",
        c.employee_count ? (locale === 'en' ? `${c.employee_count} employees` : `${c.employee_count}名`) : "",
        c.capital_amount ? (locale === 'en' ? `¥${(c.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 1})}M JPY` : `${Math.round(c.capital_amount / 10000)}万円`) : "",
        c.jigyo_shumoku || "",
        ...(isPro ? [c.email_address || ""] : []),
        locale === 'en' ? (stageLabels[effectiveKanbanStages[c.corporate_number] || '未連絡'] || (effectiveKanbanStages[c.corporate_number] || 'Uncontacted')) : (effectiveKanbanStages[c.corporate_number] || '未連絡'),
      ].map(escapeCell));

      const csvContent = "\uFEFF" + [headers.map(escapeCell).join(","), ...rows.map(r => r.join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `kigyou_list_mylist_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 3. Refresh quota display
      window.dispatchEvent(new Event("quotaUpdated"));
    } catch (e: any) {
      console.error("CSV export error", e);
      alert(locale === 'en' ? `Export failed: ${e.message || "Please try again."}` : `エクスポートに失敗しました: ${e.message || "再試行してください。"}`);
    } finally {
      setCsvExporting(false);
    }
  };

  // Effective companies & stages considering demo mode
  const effectiveCompanies = isDemoMode ? DEMO_COMPANIES : companies;
  const effectiveKanbanStages = isDemoMode ? demoStages : kanbanStages;

  // Kanban logic
  const stages: KanbanStage[] = ["未連絡", "連絡済み", "商談中", "成約"];
  
  const getStageColor = (stage: KanbanStage) => {
    switch (stage) {
      case "未連絡": return "border-l-slate-400 bg-white dark:bg-slate-900/60";
      case "連絡済み": return "border-l-[#1B4F8A] bg-blue-50/20 dark:bg-blue-950/10";
      case "商談中": return "border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10";
      case "成約": return "border-l-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10";
    }
  };

  const handleUpdateStage = (corpNum: string, newStage: KanbanStage) => {
    if (isDemoMode) {
      setDemoStages(prev => ({ ...prev, [corpNum]: newStage }));
    } else {
      updateKanbanStage(corpNum, newStage);
    }
  };

  const moveCard = (corpNum: string, direction: "left" | "right") => {
    const currentStage = effectiveKanbanStages[corpNum] || "未連絡";
    const currentIndex = stages.indexOf(currentStage);
    let newIndex = currentIndex;
    
    if (direction === "left" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === "right" && currentIndex < stages.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      handleUpdateStage(corpNum, stages[newIndex]!);
    }
  };

  // Drag and drop handlers for Kanban
  const handleDragStart = (e: React.DragEvent, corpNum: string) => {
    e.dataTransfer.setData("text/plain", corpNum);
    setDraggingCorpNum(corpNum);
  };

  const handleDragOver = (e: React.DragEvent, stage: KanbanStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stage: KanbanStage) => {
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, stage: KanbanStage) => {
    e.preventDefault();
    setDragOverStage(null);
    setDraggingCorpNum(null);
    const corpNum = e.dataTransfer.getData("text/plain");
    if (corpNum) {
      handleUpdateStage(corpNum, stage);
    }
  };

  // Counts for KPI
  const dealsInProgressCount = effectiveCompanies.filter(
    (c) => (effectiveKanbanStages[c.corporate_number] === "商談中" || effectiveKanbanStages[c.corporate_number] === "成約")
  ).length;

  // Filtered companies for MyList
  const filteredCompanies = effectiveCompanies.filter((c) => {
    if (listFilterStage === "signals") {
      const hasAnySignal = Boolean(
        c.has_hiring || c.has_subsidy || c.has_bidding || c.has_patent || c.has_award || c.has_certification ||
        (c.status && c.status !== "活動中")
      );
      if (!hasAnySignal) return false;
    } else if (listFilterStage !== "all") {
      const stage = effectiveKanbanStages[c.corporate_number] || "未連絡";
      if (stage !== listFilterStage) return false;
    }

    if (listSearchQuery.trim()) {
      const q = listSearchQuery.toLowerCase();
      const matchName = c.company_name.toLowerCase().includes(q);
      const matchPref = c.prefecture_name?.toLowerCase().includes(q);
      const matchIndustry = c.jigyo_shumoku?.toLowerCase().includes(q);
      if (!matchName && !matchPref && !matchIndustry) return false;
    }
    return true;
  });

  const toggleSelectCompany = (corpNum: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(corpNum) ? prev.filter((x) => x !== corpNum) : [...prev, corpNum]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCompanyIds.length === filteredCompanies.length && filteredCompanies.length > 0) {
      setSelectedCompanyIds([]);
    } else {
      setSelectedCompanyIds(filteredCompanies.map((c) => c.corporate_number));
    }
  };

  // Bulk operations
  const handleBulkUpdateStage = (newStage: KanbanStage) => {
    if (selectedCompanyIds.length === 0) return;
    selectedCompanyIds.forEach(id => {
      handleUpdateStage(id, newStage);
    });
    alert(
      locale === 'ja'
        ? `選択した${selectedCompanyIds.length}社の営業ステージを「${stageLabels[newStage]}」に更新しました。`
        : `Updated stage to "${stageLabels[newStage]}" for ${selectedCompanyIds.length} companies.`
    );
  };

  const handleBulkRemoveFromList = () => {
    if (selectedCompanyIds.length === 0) return;
    if (isDemoMode) {
      alert(locale === 'ja' ? "【デモモード】企業の削除は本番アカウントでのみ保存されます。" : "Demo mode: actions are not persisted.");
      setSelectedCompanyIds([]);
      return;
    }
    if (!window.confirm(
      locale === 'ja' 
        ? `選択した${selectedCompanyIds.length}社をマイリストから解除しますか？` 
        : `Remove ${selectedCompanyIds.length} companies from My List?`
    )) return;

    selectedCompanyIds.forEach(id => {
      toggleSaveCompany(id);
    });
    setSelectedCompanyIds([]);
  };

  const handleCreateCampaignFromSelected = () => {
    const selectedList = effectiveCompanies
      .filter((c) => selectedCompanyIds.includes(c.corporate_number))
      .map((c) => ({ id: c.corporate_number, name: c.company_name }));
    if (selectedList.length === 0) return;
    if (selectedList.length < 100) {
      alert(
        locale === 'ja'
          ? `フォーム営業キャンペーンの作成は【最低100社以上】の選定が必要です。\n（現在選択中: ${selectedList.length}社）\n\n少数の過剰申請を防ぎ、アプローチ成約率を担保するため、100社以上を選択して作成してください。`
          : locale === 'vi'
          ? `Chiến dịch gửi Form yêu cầu tối thiểu từ 100 doanh nghiệp trở lên.\n(Hiện đang chọn: ${selectedList.length} công ty)\n\nVui lòng chọn tối thiểu 100 công ty để tạo chiến dịch hiệu quả.`
          : `Form outreach campaigns require at least 100 selected companies (Currently selected: ${selectedList.length}). Please select at least 100 companies.`
      );
      return;
    }
    setCampaignInitialCompanies(selectedList);
    setActiveTab("formCampaigns");
  };

  const getTabTitle = (tab: typeof activeTab) => {
    switch (tab) {
      case "watchlist": return locale === 'en' ? "Corporate Watchlist & Change Alerts" : locale === 'vi' ? "Danh sách theo dõi & Cảnh báo biến động" : "監視リスト・重要変動検知";
      case "exports": return locale === 'en' ? "CSV Export History" : "CSVダウンロード履歴";
      case "payments": return locale === 'en' ? "Billing & Receipts" : "購入履歴・インボイス領収書";
      case "settings": return locale === 'en' ? "Receipt & Profile Settings" : "領収書・企業情報設定";
      case "developer": return locale === 'en' ? "Developer Console & API" : "API連携・開発者コンソール";
      case "companies": return locale === 'en' ? "Verified Enterprise & Official Profile" : locale === 'vi' ? "Quản lý Doanh nghiệp & Xác thực Chính chủ" : "自社プロファイル管理 & 公式認証";
      case "formCampaigns": return locale === 'en' ? "Form DM Outreach Campaigns" : locale === 'vi' ? "Chiến dịch & Mẫu gửi Form Tiếp cận B2B" : "問い合わせフォーム営業・キャンペーン";
    }
  };

  const getTabDescription = (tab: typeof activeTab) => {
    switch (tab) {
      case "watchlist": return locale === 'en' ? "Track real-time legal changes, relocations, invoice registrations, and financial filings for your monitored companies." : locale === 'vi' ? "Theo dõi tự động các biến động pháp lý, thay đổi trụ sở, đăng ký hóa đơn và báo cáo tài chính của doanh nghiệp." : "監視対象企業の社名変更、本店移転、適格請求書(インボイス)登録、決算公表などの重要変動を自動追跡します。";
      case "exports": return locale === 'en' ? "Review past data exports, monitor generation status, and download CSV files." : "これまでに実行した企業データCSVエクスポートのジョブ状況とダウンロードリンクです。";
      case "payments": return locale === 'en' ? "View subscription records, credit card transactions, and download Qualified Invoice receipts." : "有料プランの定期契約および追加容量の決済記録、適格請求書（インボイス制度対応）のPDFを発行します。";
      case "settings": return locale === 'en' ? "Configure company billing details and Qualified Invoice Registration Number (T+13 digits)." : "インボイス領収書に記載する企業名、適格請求書発行事業者番号（T+13桁）、住所を設定します。";
      case "developer": return locale === 'en' ? "Integrate B2B company data with your internal CRM, ERP, and outreach tools via REST API." : "REST APIを利用した企業データのシステム間自動連携、APIキーの発行と接続テストを行います。";
      case "companies": return locale === 'en' ? "Manage verified company profiles, publish official PR announcements, and track document verification." : locale === 'vi' ? "Quản lý hồ sơ công ty chính chủ, thông điệp PR và tiến độ xét duyệt giấy tờ." : "自社の公式オーナー認証、PRメッセージ・採用案内の更新、および審査状況を一元管理できます。";
      case "formCampaigns": return locale === 'en' ? "Create custom pitch templates, configure outreach parameters, save campaign drafts, and track delivery reports." : locale === 'vi' ? "Tự tạo mẫu kịch bản tiếp cận, cấu hình bộ lọc mục tiêu, lưu chiến dịch và theo dõi tiến độ gửi tự động." : "独自の営業テンプレート作成、送信対象の絞り込み、キャンペーンの下書き保存および配信レポートの確認を行えます。";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />

      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1680px] mx-auto min-h-[calc(100vh-64px)]">
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-72 shrink-0 bg-white dark:bg-[#151B22] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-5">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#1B4F8A] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight truncate">
                    {user?.name ? `${user.name} ワークスペース` : "営業ワークスペース"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    {locale === 'en' ? "ABM Pipeline Management" : locale === 'vi' ? "Quản lý Bán hàng & Tiếp cận" : "ABM 営業パイプライン"}
                  </span>
                </div>
              </div>
              <Link
                href={`/${locale}/search`}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-[#1B4F8A] dark:hover:text-white cursor-pointer shrink-0"
                title="企業データ検索へ"
              >
                <Search className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Shortcut to Search */}
            <Link
              href={`/${locale}/search`}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 text-xs font-bold transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>企業データ検索</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-400" />
            </Link>

            {/* Categorized Navigation Groups */}
            <nav className="flex flex-col gap-4 text-xs font-semibold" aria-label="Dashboard Navigation">
              {/* Group 1: Corporate Intelligence & Outreach */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  {locale === 'en' ? "Monitoring & Outreach" : locale === 'vi' ? "Giám sát & Tiếp cận" : "企業監視・パイプライン"}
                </span>

                {/* Watchlist Tab */}
                <button
                  onClick={() => setActiveTab("watchlist")}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === "watchlist"
                      ? "bg-[#1B4F8A]/10 text-[#1B4F8A] font-bold border border-[#1B4F8A]/25 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className={`w-4 h-4 shrink-0 ${activeTab === "watchlist" ? "text-[#1B4F8A] dark:text-blue-300" : "text-slate-500"}`} />
                    <span>{locale === 'en' ? "Watchlist & Alerts" : locale === 'vi' ? "Theo dõi & Biến động" : "監視リスト・変動検知"}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    activeTab === "watchlist" ? "bg-white text-[#1B4F8A] border border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    {savedCompanies.length}
                  </span>
                </button>

                {/* Form Outreach Campaigns */}
                <button
                  onClick={() => setActiveTab("formCampaigns")}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === "formCampaigns"
                      ? "bg-[#1B4F8A]/10 text-[#1B4F8A] font-bold border border-[#1B4F8A]/25 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Send className={`w-4 h-4 shrink-0 ${activeTab === "formCampaigns" ? "text-[#1B4F8A] dark:text-blue-300" : "text-slate-500"}`} />
                    <span>{locale === 'en' ? "Form Outreach (DM)" : locale === 'vi' ? "Chiến dịch gửi Form DM" : "フォーム営業 (DM)"}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    activeTab === "formCampaigns" ? "bg-white text-[#1B4F8A] border border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    {formCampaignsList.length}
                  </span>
                </button>
              </div>

              {/* Group 2: Data & Developer */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  データ・連携 (Data & API)
                </span>

                {/* Exports */}
                <button
                  onClick={() => setActiveTab("exports")}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === "exports"
                      ? "bg-[#1B4F8A]/10 text-[#1B4F8A] font-bold border border-[#1B4F8A]/25 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Download className={`w-4 h-4 shrink-0 ${activeTab === "exports" ? "text-[#1B4F8A] dark:text-blue-300" : "text-slate-500"}`} />
                    <span>CSVエクスポート履歴</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    activeTab === "exports" ? "bg-white text-[#1B4F8A] border border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    {exportJobs.length}
                  </span>
                </button>

                {/* Developer */}
                <button
                  onClick={() => setActiveTab("developer")}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === "developer"
                      ? "bg-[#1B4F8A]/10 text-[#1B4F8A] font-bold border border-[#1B4F8A]/25 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal className={`w-4 h-4 shrink-0 ${activeTab === "developer" ? "text-[#1B4F8A] dark:text-blue-300" : "text-slate-500"}`} />
                    <span>{locale === 'en' ? "API Keys (REST)" : locale === 'vi' ? "Tích hợp API" : "API連携 (API Keys)"}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    activeTab === "developer" ? "bg-white text-[#1B4F8A] border border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    {apiKeys.length}
                  </span>
                </button>
              </div>

              {/* Group 3: Billing & Profile */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  請求・プラン (Billing)
                </span>

                {/* Payments */}
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === "payments"
                      ? "bg-[#1B4F8A]/10 text-[#1B4F8A] font-bold border border-[#1B4F8A]/25 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className={`w-4 h-4 shrink-0 ${activeTab === "payments" ? "text-[#1B4F8A] dark:text-blue-300" : "text-slate-500"}`} />
                    <span>購入履歴・インボイス</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    activeTab === "payments" ? "bg-white text-[#1B4F8A] border border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    {paymentHistory.length}
                  </span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === "settings"
                      ? "bg-[#1B4F8A]/10 text-[#1B4F8A] font-bold border border-[#1B4F8A]/25 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className={`w-4 h-4 shrink-0 ${activeTab === "settings" ? "text-[#1B4F8A] dark:text-blue-300" : "text-slate-500"}`} />
                    <span>領収書・企業情報設定</span>
                  </div>
                </button>
              </div>

              {/* Group 4: Company Profile & Claim Management */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  自社・公式認証 (Enterprise)
                </span>

                <button
                  onClick={() => setActiveTab("companies")}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === "companies"
                      ? "bg-[#1B4F8A]/10 text-[#1B4F8A] font-bold border border-[#1B4F8A]/25 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === "companies" ? "text-[#1B4F8A] dark:text-blue-300" : "text-slate-500"}`} />
                    <span>{locale === 'en' ? "Managed Profiles" : locale === 'vi' ? "Quản lý hồ sơ doanh nghiệp" : "自社プロファイル管理"}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    activeTab === "companies" ? "bg-white text-[#1B4F8A] border border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    企業認証
                  </span>
                </button>
              </div>
            </nav>

            {/* Sidebar Plan & Quota Card (ご利用枠・残高) */}
            <div className="flex flex-col gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs text-xs">
              {/* Header Title */}
              <div className="flex flex-col gap-1 pb-1.5 border-b border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {locale === 'en' ? "Quotas & Balances" : locale === 'vi' ? "Hạn mức & Số dư" : "ご利用枠・残高"}
                  </span>
                  <span className="font-extrabold text-[#1B4F8A] dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900">
                    {currentPlanInfo.label}
                  </span>
                </div>
                {quota?.last_reset_date && (
                  <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium">
                    {getSubscriptionPeriodText(quota.last_reset_date, quota.plan)}
                  </div>
                )}
              </div>

              {/* Resource 1: CSV Export Quota */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                    <span>{locale === 'en' ? "CSV Allowance" : locale === 'vi' ? "Hạn mức CSV" : "CSV出力枠"}</span>
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">
                    {quota ? `残 ${quota.remaining.toLocaleString()} 行` : `${currentPlanInfo.quota}`}
                  </span>
                </div>

                {quota && (
                  <div className="flex flex-col gap-1">
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#1B4F8A] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (quota.monthly_base_used / quota.monthly_base_allowance) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>使用量: {quota.monthly_base_used.toLocaleString()} / {quota.monthly_base_allowance.toLocaleString()} 行</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Resource 2: Form DM Outreach Credit Wallet */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>{locale === 'en' ? "Form Credits" : locale === 'vi' ? "Ví gửi Form" : "フォーム営業残高"}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {formCredits.balance.toLocaleString()} 件
                    </span>
                    <Link
                      href={`/${locale}/pricing?tab=form`}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700 transition-colors"
                      title={locale === 'vi' ? 'Nạp thêm Credits' : locale === 'en' ? 'Top up' : 'クレジットをチャージ'}
                    >
                      + チャージ
                    </Link>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400">
                  <span>{locale === 'en' ? "No expiry • Batch delivery" : locale === 'vi' ? "Không hết hạn • Chia nhỏ gửi tự do" : "有効期限なし・100件〜随時配信"}</span>
                </div>
              </div>

              {/* Action Buttons: Plan Change / Cancel */}
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                <Link
                  href={`/${locale}/pricing`}
                  className="flex-1 py-1.5 text-[11px] font-bold text-center text-slate-800 dark:text-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{isPro ? "プラン変更" : "アップグレード"}</span>
                </Link>
                {isPro && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="py-1.5 px-2 text-[10px] font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="解約手続き"
                  >
                    解約
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Footer: User profile info */}
          <div className="pt-3 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex flex-col truncate pr-2">
              <span className="text-[10px] text-slate-400 font-semibold">{user?.role ? user.role.toUpperCase() : "MEMBER"}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={user?.email || ""}>
                {user?.email}
              </span>
            </div>
            {user?.email?.toLowerCase().trim() === "trungkim8694@gmail.com" && (
              <Link
                href={`/${locale}/admin`}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
                title="Admin Consoleへ移動"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              </Link>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto">
          {/* Demo Mode Interactive Guidance Banner */}
          {isDemoMode && (
            <div className="p-4 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-[#1B4F8A]/30 dark:border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#1B4F8A] dark:bg-blue-400 shrink-0 animate-pulse" />
                <div className="flex flex-col">
                  <span className="font-bold text-[#1B4F8A] dark:text-blue-300">
                    【デモ体験モード稼働中】
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                    トヨタ・ソニーなど国内大手5社のサンプルデータを表示中。ドラッグ＆ドロップ、ステージ更新、社内メモ入力をお試しいただけます。
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  無料会員登録（本番保存）
                </button>
                <button
                  onClick={() => setIsDemoMode(false)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                >
                  デモ終了
                </button>
              </div>
            </div>
          )}

          {/* Section Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
            <div>
              {/* Kicker Eyebrow B2B */}
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold mb-1.5 tracking-wide shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400" />
                <span style={{ fontFeatureSettings: '"palt"' }}>
                  {activeTab === "companies"
                    ? (locale === 'en' ? "Verified Enterprise & Official Profile" : locale === 'vi' ? "Doanh nghiệp Chính chủ & Quản lý Hồ sơ" : "公式認証企業プログラム・自社プロファイル管理")
                    : activeTab === "formCampaigns"
                    ? (locale === 'en' ? "Form DM Outreach & Lead Generation" : locale === 'vi' ? "Chiến dịch Form DM Tiếp cận Khách hàng B2B" : "AIフォーム自動営業 × 反響獲得パイプライン")
                    : (locale === 'en' ? "ABM Corporate Intelligence & Sales Pipeline" : locale === 'vi' ? "Nền tảng Quản trị & Tiếp cận Khách hàng B2B" : "日本企業データベース × ABM営業パイプライン")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Link href={`/${locale}`} className="hover:text-slate-600 dark:hover:text-slate-200">ホーム</Link>
                <span>/</span>
                <span>営業管理ダッシュボード</span>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{getTabTitle(activeTab)}</span>
              </div>
              <h1 
                className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1.5"
                style={{ fontFeatureSettings: '"palt"' }}
              >
                {getTabTitle(activeTab)}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {getTabDescription(activeTab)}
              </p>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">

              {activeTab === "companies" && (
                <Link
                  href={`/${locale}/search`}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{locale === 'en' ? "Verify Company" : locale === 'vi' ? "Xác thực doanh nghiệp" : "自社企業を認証申請"}</span>
                </Link>
              )}
              <Link
                href={`/${locale}/search`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300/80 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>企業検索</span>
              </Link>
            </div>
          </div>

          {/* 4 Quick KPI Stat Cards */}
          {activeTab === "formCampaigns" ? (
            <div className="flex flex-col gap-3">
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-200">
                {/* Form KPI 1 */}
                <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {locale === 'en' ? "Total Campaigns" : locale === 'vi' ? "Tổng số chiến dịch" : "総キャンペーン数"}
                    </span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                      {formCampaignsList.length} <span className="text-xs font-sans font-semibold text-slate-400">件</span>
                    </span>
                  </div>
                </div>

                {/* Form KPI 2 */}
                <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {locale === 'en' ? "In Review / Sending" : locale === 'vi' ? "Đang duyệt / Đang gửi" : "審査中・配信中"}
                    </span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                      {formCampaignsList.filter((c: any) => c.status === "pending_review" || c.status === "approved" || c.status === "sending").length} <span className="text-xs font-sans font-semibold text-slate-400">件</span>
                    </span>
                  </div>
                </div>

                {/* Form KPI 3 */}
                <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {locale === 'en' ? "Delivered Forms" : locale === 'vi' ? "Form đã gửi thành công" : "送信完了フォーム数"}
                    </span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                      {formCampaignsList.reduce((acc: number, c: any) => acc + (c.success_count || 0), 0).toLocaleString()} <span className="text-xs font-sans font-semibold text-slate-400">通</span>
                    </span>
                  </div>
                </div>

                {/* Form KPI 4 */}
                <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {locale === 'en' ? "Delivery Method" : locale === 'vi' ? "Cơ chế phân bổ" : "配信方式"}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {locale === 'en' ? "Flexible Batches (100+)" : locale === 'vi' ? "Chia lẻ từ 100 lượt" : "100件〜 自由分割対応"}
                    </span>
                  </div>
                </div>
              </section>

              {/* Informative Guidance Notice */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                  <span>
                    {locale === 'vi' 
                      ? "問い合わせフォーム営業 là hệ thống gửi tiếp cận tự động qua Form liên hệ B2B, có thể chia nhỏ từ 100 lượt gửi và khấu trừ trực tiếp từ Ví Credits."
                      : locale === 'en'
                      ? "Contact Form Outreach automatically dispatches outreach pitches to verified corporate forms in flexible batches of 100+ forms."
                      : "※ 問い合わせフォーム営業は保有クレジットから100件単位で自由分割して配信可能です。ターゲット条件を指定して下書き保存または審査申請を行えます。"}
                  </span>
                </div>
                <Link
                  href={`/${locale}/form-marketing#pricing`}
                  className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline shrink-0 text-[11px] flex items-center gap-1"
                >
                  <span>{locale === 'vi' ? "Xem bảng giá chi tiết" : locale === 'en' ? "View Pricing" : "配信単価・料金表"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : activeTab === "companies" ? (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-200">
              {/* Companies KPI 1: 認証済み企業数 */}
              <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 truncate">
                    {locale === 'en' ? "Verified Companies" : locale === 'vi' ? "Doanh nghiệp đã xác thực" : "認証済み自社企業"}
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {companiesStats.count} <span className="text-xs font-sans font-semibold text-slate-400">{locale === 'en' ? "co." : locale === 'vi' ? "cty" : "社"}</span>
                  </span>
                </div>
              </div>

              {/* Companies KPI 2: 公式PR掲載数 */}
              <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 truncate">
                    {locale === 'en' ? "Published PR & Jobs" : locale === 'vi' ? "Thông điệp PR đã đăng" : "公式PR・採用情報"}
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {companiesStats.prCount} <span className="text-xs font-sans font-semibold text-slate-400">{locale === 'en' ? "items" : locale === 'vi' ? "mục" : "件"}</span>
                  </span>
                </div>
              </div>

              {/* Companies KPI 3: 毎日の無料CSV枠 */}
              <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 truncate">
                      {locale === 'en' ? "Daily CSV Allowance" : locale === 'vi' ? "Hạn mức CSV hàng ngày" : "無料CSV出力枠"}
                    </span>
                    {companiesStats.isVerified && (
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-1 rounded shrink-0">
                        +150% 適用
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {companiesStats.allowance} <span className="text-xs font-sans font-semibold text-slate-400">{locale === 'en' ? "/day" : locale === 'vi' ? "lượt/ngày" : "件/日"}</span>
                  </span>
                </div>
              </div>

              {/* Companies KPI 4: 審査ステータス */}
              <div className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  companiesStats.pendingCount > 0
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/60"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60"
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 truncate">
                    {locale === 'en' ? "Review Status" : locale === 'vi' ? "Tiến độ xét duyệt" : "認証・審査状況"}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {companiesStats.pendingCount > 0
                      ? (locale === 'en' ? `Reviewing (${companiesStats.pendingCount})` : locale === 'vi' ? `Đang duyệt (${companiesStats.pendingCount})` : `書類審査中 (${companiesStats.pendingCount}件)`)
                      : companiesStats.isVerified
                      ? (locale === 'en' ? "Verified Active" : locale === 'vi' ? "Đã xác thực chính chủ" : "公式認証完了 (有効)")
                      : (locale === 'en' ? "Ready to Claim" : locale === 'vi' ? "Chưa xác thực" : "未認証 (受付中)")}
                  </span>
                </div>
              </div>
            </section>
          ) : (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in duration-200">
              {/* Card 1: 監視対象企業 */}
              <div 
                onClick={() => setActiveTab("watchlist")}
                className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 rounded-xl shadow-2xs flex items-center justify-between gap-3.5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold text-slate-400 truncate">
                      {locale === 'en' ? "Monitored Companies" : locale === 'vi' ? "Doanh nghiệp theo dõi" : "監視対象企業"}
                    </span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                      {savedCompanies.length} <span className="text-xs font-sans font-semibold text-slate-400">/ 100 社</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: 検知された最新変動 */}
              <div 
                onClick={() => setActiveTab("watchlist")}
                className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 rounded-xl shadow-2xs flex items-center justify-between gap-3.5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 truncate">
                        {locale === 'en' ? "Detected Changes" : locale === 'vi' ? "Biến động đã phát hiện" : "検知された最新変動"}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-1 rounded shrink-0">
                        自動同期中
                      </span>
                    </div>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                      {watchlistEventsCount} <span className="text-xs font-sans font-semibold text-slate-400">件</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: 残CSV出力可能枠 */}
              <div 
                onClick={() => setActiveTab("exports")}
                className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 rounded-xl shadow-2xs flex items-center gap-3.5 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 truncate">
                    {locale === 'en' ? "CSV Allowance Remaining" : locale === 'vi' ? "Hạn mức CSV còn lại" : "残CSV出力可能枠"}
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {isDemoMode ? "20" : (quota?.remaining.toLocaleString() ?? "-")} <span className="text-xs font-sans font-semibold text-slate-400">行</span>
                  </span>
                </div>
              </div>

              {/* Card 4: フォーム営業残高 */}
              <div 
                onClick={() => setActiveTab("formCampaigns")}
                className="p-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 rounded-xl shadow-2xs flex items-center justify-between gap-3.5 transition-colors cursor-pointer group"
                title={locale === 'en' ? "Manage form campaigns and credits" : locale === 'vi' ? "Quản lý chiến dịch & credits gửi Form" : "フォーム営業キャンペーン画面へ"}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold text-slate-400 truncate">
                      {locale === 'en' ? "Form DM Credits" : locale === 'vi' ? "Ví tín dụng gửi Form" : "フォーム営業残高"}
                    </span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 truncate">
                      {formCredits.balance.toLocaleString()} <span className="text-xs font-sans font-semibold text-slate-400">件</span>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#1B4F8A] dark:text-blue-400 group-hover:underline shrink-0">
                  {locale === 'en' ? "Open →" : locale === 'vi' ? "Quản lý →" : "管理 →"}
                </span>
              </div>
            </section>
          )}

          {quota?.subscription_status === 'suspended' && (
            <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-xl p-4 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-300">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-extrabold text-[11px] uppercase tracking-wider block">{locale === 'en' ? "Account Suspended" : "アカウントが一時停止されています"}</span>
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                  {locale === 'en' ? 'This account has been temporarily suspended due to billing issues or policy violations. Search and download features are restricted. If you believe this is an error, please contact support at ' : 'お支払いの問題またはポリシー規約への違反が検出されたため、このアカウントは一時停止されています。データの検索やダウンロードなどの機能が制限されています。エラーと思われる場合は、サポート（'}<a href="mailto:trungkim8694@gmail.com" className="underline hover:text-rose-600 dark:hover:text-rose-400 font-bold">trungkim8694@gmail.com</a>{locale === 'en' ? ') for assistance.' : '）までご連絡ください。'}
                </p>
              </div>
            </div>
          )}

        {/* Tab 1 Contents: MyList */}
        {/* CSV Confirm Modal */}
        {showCSVConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200/90 dark:bg-[#1C2128] dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-250">
              <button
                onClick={() => setShowCSVConfirm(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6" />
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                  {locale === 'en' ? 'Confirm CSV Export' : 'マイリストCSVエクスポートの確認'}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 leading-relaxed">
                  {locale === 'en' ? <span>Export CSV data for <strong className="text-slate-800 dark:text-slate-200">{companies.length} companies</strong> from your My List.</span> : <span>マイリストの <strong className="text-slate-800 dark:text-slate-200">{companies.length} 社</strong> の企業データをCSVに出力します。</span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  {locale === 'en' ? <span>This will deduct <strong className="text-slate-800 dark:text-slate-200">{companies.length} rows</strong> of export quota from your account.</span> : <span>この操作により、アカウントから <strong className="text-slate-800 dark:text-slate-200">{companies.length} 行分</strong> のエクスポート容量が差し引かれます。</span>}
                </p>

                {csvQuota && (
                  <div className="mb-4 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2">
                    <span>
                      {locale === 'en' ? "Current remaining: " : "現在の残容量: "}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {csvQuota.remaining.toLocaleString()} {locale === 'en' ? "rows" : "行"}
                      </strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">→</span>
                    <span>
                      {locale === 'en' ? "After export: " : "出力後: "}
                      <strong className="text-[#1B4F8A] dark:text-blue-400">
                        {(csvQuota.remaining - companies.length).toLocaleString()} {locale === 'en' ? "rows" : "行"}
                      </strong>
                    </span>
                  </div>
                )}

                {!isPro && (
                  <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 rounded-lg text-[10px] text-amber-700 dark:text-amber-400 font-medium text-left">
                    {locale === 'en' ? '* Email addresses are not included in the FREE plan. Upgrade to PRO to export all columns.' : '※ FREEプランではメールアドレス列は含まれません。PROプランにアップグレードすると全列が出力されます。'}
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setShowCSVConfirm(false)}
                    className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {locale === 'en' ? 'Cancel' : 'キャンセル'}
                  </button>
                  <button
                    disabled={quota?.subscription_status === 'suspended'}
                    onClick={executeCSVDownload}
                    className="flex-1 px-4 py-2 text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {quota?.subscription_status === 'suspended' ? (locale === 'en' ? 'Blocked' : 'ブロック中') : (locale === 'en' ? 'Export CSV' : 'エクスポート実行')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3 Contents: Export History */}
        {visitedTabs.has("exports") && (
          <div className={`flex flex-col gap-4 ${activeTab === "exports" ? "flex" : "hidden"}`}>
            <div className="bg-slate-50 border border-slate-200/90 dark:bg-slate-900/40 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-500 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-900 dark:text-white block">ダウンロード有効期限に関するご注意</span>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  作成されたエクスポートファイル（ZIP）の<strong>保存期間は7日間</strong>です。7日を経過するとデータはサーバーから自動的に削除され、再ダウンロードできなくなりますので、お早めに端末へ保存してください。
                </p>
              </div>
            </div>
            
            <section className="bg-white border border-slate-200/90 dark:bg-[#1C2128] dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              {loadingExports ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1B4F8A] dark:text-blue-400" />
                  <span className="text-xs text-slate-400">履歴を読み込み中...</span>
                </div>
              ) : exportJobs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Download className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">エクスポート履歴はありません</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      企業検索からCSV出力を実行すると、ここにダウンロード履歴が追加されます。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-6">タスクID / 作成日時</th>
                        <th className="py-3 px-4">ダウンロード期限 (7日間)</th>
                        <th className="py-3 px-4">適用フィルター</th>
                        <th className="py-3 px-4">取得件数</th>
                        <th className="py-3 px-4">ステータス</th>
                        <th className="py-3 px-6 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {exportJobs.map((job) => {
                        const createdDate = parseUTCDate(job.created_at);
                        const expiryDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                        const now = new Date();
                        const isExpired = !job.file_path || now >= expiryDate;

                        const formattedDate = createdDate.toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        const formattedExpiry = expiryDate.toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <tr key={job.id} className="hover:bg-slate-50/60 dark:hover:bg-[#151B22] transition-colors">
                            <td className="py-3.5 px-6">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]" title={job.id}>{job.id}</span>
                                <span className="text-[10px] text-slate-400">{formattedDate}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                              <span className={`text-[10px] font-semibold ${isExpired ? "text-rose-500 font-bold" : "text-slate-500"}`}>
                                {isExpired ? "期限切れ (消去済)" : formattedExpiry}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {renderFilterBadges(job.filters, locale)}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                              {job.total_records ? `${job.total_records.toLocaleString()}行` : "-"}
                            </td>
                            <td className="py-3.5 px-4">
                              {job.status === "completed" ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-[9px] font-semibold">出力完了</span>
                              ) : job.status === "processing" ? (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200 text-[9px] font-semibold">生成中</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 text-[9px] font-semibold">失敗</span>
                              )}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              {job.status === "completed" && !isExpired && job.file_path ? (
                                <a
                                  href={`/api/export/download?jobId=${job.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8A] hover:bg-[#163e6d] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>ダウンロード</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400">利用不可</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 4 Contents: Purchase History */}
        {visitedTabs.has("payments") && (
          <section className={`bg-white border border-slate-200/90 dark:bg-[#1C2128] dark:border-slate-800 rounded-xl overflow-hidden shadow-xs ${activeTab === "payments" ? "block" : "hidden"}`}>
            {loadingPayments ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#1B4F8A] dark:text-blue-400" />
                <span className="text-xs text-slate-400">購入履歴を読み込み中...</span>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">購入履歴はありません</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Stripeで追加のCSVダウンロード容量またはプランをご購入いただくと、ここに履歴とインボイス領収書が表示されます。
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-6">取引ID / 決済日時</th>
                      <th className="py-3 px-4">購入プラン</th>
                      <th className="py-3 px-4">付与容量</th>
                      <th className="py-3 px-4">決済金額 (税込)</th>
                      <th className="py-3 px-6 text-right">インボイス領収書</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {paymentHistory.map((pay) => {
                      const formattedDate = parseUTCDate(pay.created_at).toLocaleString("ja-JP", {
                        timeZone: "Asia/Tokyo",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      
                      return (
                        <tr key={pay.id} className="hover:bg-slate-50/60 dark:hover:bg-[#151B22] transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px]" title={pay.id}>{pay.id}</span>
                              <span className="text-[10px] text-slate-400">{formattedDate} (JST)</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {pay.pack_id === "10k" ? "CSV 10k行追加パック" :
                             pay.pack_id === "50k" ? "CSV 50k行追加パック" :
                             pay.pack_id === "100k" ? "CSV 100k行追加パック" :
                             pay.pack_id === "pro" ? "PROプラン (月額)" :
                             pay.pack_id === "business" ? "BUSINESSプラン (月額)" :
                             pay.pack_id === "enterprise" ? "ENTERPRISEプラン (月額)" :
                             "カスタムパック"}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                            +{pay.lines_added.toLocaleString()} 行
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#1B4F8A] dark:text-blue-400 text-sm">
                            ¥{pay.amount_jpy.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            {pay.invoice_url ? (
                              <a
                                href={`/api/stripe/invoice?id=${pay.id}&email=${encodeURIComponent(user?.email || "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300/80 hover:bg-slate-50 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                                <span>領収書 (印刷)</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">未発行</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Tab 5 Contents: Settings with Live Preview */}
        {visitedTabs.has("settings") && (
          <section className={`bg-white border border-slate-200/90 dark:bg-[#1C2128] dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-xs w-full flex flex-col gap-6 ${activeTab === "settings" ? "flex" : "hidden"}`}>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-400 border border-blue-200/80 flex items-center justify-center shrink-0">
                <Settings className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  領収書・インボイス設定
                </h2>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  購入履歴からダウンロードする領収書に記載する宛名や適格請求書登録番号を設定します
                </span>
              </div>
            </div>

            {loadingBilling ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#1B4F8A] dark:text-blue-400" />
                <span className="text-xs text-slate-400">設定を読み込み中...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form fields */}
                <form onSubmit={handleSaveBilling} className="lg:col-span-7 flex flex-col gap-4 text-xs">
                  {/* Billing Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      宛名 / 会社名 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="例: 株式会社サンプル, ○○ 個人事業主"
                      className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] text-xs transition-colors"
                    />
                    <span className="text-[10px] text-slate-400">
                      空欄の場合はご登録メールアドレス（{user?.email}）が使用されます。
                    </span>
                  </div>

                  {/* Postal Code & Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      会社所在地 / 住所
                    </label>
                    <textarea
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="例: 〒100-0001 東京都千代田区千代田1-1 サンプルビル5F"
                      rows={2}
                      className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] text-xs transition-colors resize-none"
                    />
                  </div>

                  {/* Tax ID & Phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        インボイス登録番号 (T+13桁)
                      </label>
                      <input
                        type="text"
                        value={billingTaxId}
                        onChange={(e) => setBillingTaxId(e.target.value)}
                        placeholder="例: T1234567890123"
                        className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] text-xs transition-colors font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        電話番号
                      </label>
                      <input
                        type="text"
                        value={billingPhone}
                        onChange={(e) => setBillingPhone(e.target.value)}
                        placeholder="例: 03-1234-5678"
                        className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] text-xs transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      社判・会社ロゴ画像 (PNG / JPG / SVG, 最大500KB)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingLogo ? "アップロード中..." : "画像を選択"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="text-xs text-rose-500 hover:underline font-bold"
                        >
                          画像を削除
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-start">
                    <button
                      type="submit"
                      disabled={savingBilling}
                      className="px-6 py-2.5 font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {savingBilling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>保存中...</span>
                        </>
                      ) : (
                        <span>設定を保存する</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Right: Live Preview of Receipt */}
                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                      領収書プレビュー（印刷イメージ）
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">PREVIEW</span>
                  </div>

                  <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-4 flex flex-col gap-3 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">領 収 書</h4>
                        <span className="text-[9px] text-slate-400 block mt-0.5">（適格請求書等保存方式対応）</span>
                      </div>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-8 max-w-[100px] object-contain" />
                      ) : (
                        <div className="h-7 px-2 border border-dashed border-slate-200 dark:border-slate-700 rounded flex items-center text-[9px] text-slate-400">
                          ロゴ未登録
                        </div>
                      )}
                    </div>

                    <div className="border-t border-b border-slate-100 dark:border-slate-800 py-2.5 flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {billingName || user?.email || "宛名未入力"} 御中
                      </span>
                      {billingAddress && (
                        <span className="text-[10px] text-slate-500 line-clamp-1">{billingAddress}</span>
                      )}
                      {billingTaxId && (
                        <span className="text-[10px] text-slate-500 font-mono">登録番号: {billingTaxId}</span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 flex flex-col gap-0.5">
                      <div className="flex justify-between">
                        <span>発行者: Kigyou-list 運営事務局</span>
                        <span>登録番号: T4010401012345</span>
                      </div>
                      <span>※ 購入履歴画面よりPDF領収書をいつでも発行・印刷いただけます。</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab 0 Contents: Corporate Watchlist & Change Alerts */}
        {visitedTabs.has("watchlist") && (
          <div className={activeTab === "watchlist" ? "block" : "hidden"}>
            <WatchlistTab onEventsCountChange={setWatchlistEventsCount} />
          </div>
        )}

        {/* Tab 6 Contents: Developer & AI Sales Infrastructure */}
        {visitedTabs.has("developer") && (
          <div className={activeTab === "developer" ? "block" : "hidden"}>
            <DeveloperTab user={user} quota={quota} locale={locale} />
          </div>
        )}

        {/* Tab 7 Contents: Managed Companies */}
        {visitedTabs.has("companies") && (
          <div className={activeTab === "companies" ? "block" : "hidden"}>
            <CompaniesTab 
              userEmail={user?.email || ""} 
              locale={locale} 
              onStatsUpdate={setCompaniesStats}
            />
          </div>
        )}

        {/* Tab 8 Contents: Form Marketing Outreach Campaigns */}
        {visitedTabs.has("formCampaigns") && (
          <div className={activeTab === "formCampaigns" ? "block" : "hidden"}>
            <FormCampaignsTab 
              initialTargetCompanies={campaignInitialCompanies || undefined}
              onClearInitialTarget={() => setCampaignInitialCompanies(null)}
            />
          </div>
        )}

      </main>
      </div>

      <Footer />

      {/* Upgrade Upsell Modal */}
      {showUpsellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowUpsellModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xl z-10 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] rounded-xl flex items-center justify-center mx-auto shadow-xs border border-blue-200/80">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
                CSV出力容量の追加またはアップグレード
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                現在{currentPlanInfo.label}（{currentPlanInfo.quota}）です。プランアップグレードでCSV出力枠を拡張し、営業リストを大量入手できます。
              </p>
            </div>
            
            <div className="my-2 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-left text-xs border border-slate-200/90 dark:border-slate-800 flex flex-col gap-1.5">
              <div className="flex flex-col gap-1">
                {[
                  { plan: "PROプラン", quota: "2,000行/月", price: "¥2,900" },
                  { plan: "BUSINESSプラン", quota: "10,000行/月", price: "¥9,800" },
                  { plan: "ENTERPRISEプラン", quota: "40,000行/月", price: "¥29,000" },
                ].map((p) => (
                  <div key={p.plan} className="flex items-center justify-between font-bold py-1.5 border-b border-slate-200/60 dark:border-slate-800 last:border-0">
                    <span className="text-slate-800 dark:text-slate-200">{p.plan}</span>
                    <div className="text-right">
                      <span className="text-[#1B4F8A] dark:text-blue-400 font-extrabold">{p.price}/月</span>
                      <span className="text-[9px] text-slate-400 block">{p.quota}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/pricing"
                className="w-full py-3 text-xs font-bold text-center text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-lg shadow-xs transition-colors block cursor-pointer"
              >
                料金プランを見る
              </Link>
              <button
                onClick={() => setShowUpsellModal(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !cancellingSub && setShowCancelModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xl z-10 flex flex-col gap-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200/80 rounded-xl flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
                本当にプランを解約しますか？
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                解約すると、即時に {currentPlanInfo.label} から FREEプラン（20行/日）へダウングレードされます。
              </p>
            </div>

            {/* Quota Warning Message */}
            {quota && (
              <div className="bg-rose-50 border border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-xl p-4 text-left flex flex-col gap-2 animate-in fade-in duration-300">
                <div className="flex gap-2 items-start text-xs font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>重要：残りの容量に関する警告</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {Math.max(0, quota.monthly_base_allowance - quota.monthly_base_used) > 0 ? (
                    <span>今月の基本残容量 <strong className="text-rose-600 dark:text-rose-400">{(quota.monthly_base_allowance - quota.monthly_base_used).toLocaleString()} 行</strong> は<strong>即時にリセットされ消滅します</strong>。解約前にダウンロードを実行することをお勧めします。</span>
                  ) : (
                    '今月の基本枠はすべて消費されています。'
                  )}
                </p>
                {quota.purchased_add_on_balance > 0 && (
                  <p className="text-[10px] text-slate-500 border-t border-rose-200/60 dark:border-slate-800 pt-1.5 mt-0.5 leading-relaxed">
                    ※ 追加容量やスポット購入枠（残り {quota.purchased_add_on_balance.toLocaleString()} 行）は、解約しても消失しませんが、FREEプランの間は一時的に凍結（使用不可）されます。有料プランへ再契約することで、再び制限なしでご利用いただけるようになります。
                  </p>
                )}
              </div>
            )}
            
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleCancelSubscription}
                disabled={cancellingSub}
                className="w-full py-3 text-xs font-bold text-center text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {cancellingSub ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>解約処理中...</span>
                  </>
                ) : (
                  <span>解約を実行する</span>
                )}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancellingSub}
                className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PREFECTURE_MAP: Record<string, string> = {
  "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県",
  "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県",
  "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県",
  "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
  "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県",
  "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
  "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
  "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
  "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県",
  "46": "鹿児島県", "47": "沖縄県"
};

const INDUSTRY_MAP: Record<string, string> = {
  // Major
  "A": "農業・林業", "B": "漁業", "C": "鉱業・採石業・砂利採取業", "D": "建設業", "E": "製造業",
  "F": "電気・ガス・熱供給・水道業", "G": "情報通信業", "H": "運輸業・郵便業", "I": "卸売業・小売業",
  "J": "金融業・保険業", "K": "不動産業・物品賃貸業", "L": "学術研究・専門・技術サービス業",
  "M": "宿泊業・飲食サービス業", "N": "生活関連サービス業・娯楽業", "O": "教育・学習支援業",
  "P": "医療・福祉", "Q": "複合サービス事業", "R": "サービス業", "S": "公務", "T": "分類不能の産業",
  // Medium
  "01": "農業", "02": "林業", "03": "漁業", "04": "水産養殖業", "05": "鉱業・採石業・砂利採取業",
  "06": "総合工事業", "07": "職別工事業", "08": "設備工事業", "09": "食料品製造業", "10": "飲料・たばこ・飼料製造業",
  "11": "繊維工業", "12": "木材・木製品製造業", "13": "家具・装備品製造業", "14": "パルプ・紙・紙加工品製造業",
  "15": "印刷・同関連業", "16": "化学工業", "17": "石油製品・石炭製品製造業", "18": "プラスチック製品製造業",
  "19": "ゴム製品製造業", "20": "なめし革・同製品・毛皮製造業", "21": "窯業・土石製品製造業", "22": "鉄鋼業",
  "23": "非鉄金属製造業", "24": "金属製品製造業", "25": "はん用機械器具製造業", "26": "生産用機械器具製造業",
  "27": "業務用機械器具製造業", "28": "電子部品・デバイス・電子回路製造業", "29": "電気機械器具製造業",
  "30": "情報通信機械器具製造業", "31": "輸送用機械器具製造業", "32": "その他の製造業", "33": "電気業",
  "34": "ガス業", "35": "熱供給業", "36": "水道業", "37": "通信業", "38": "放送業", "39": "情報サービス業",
  "40": "インターネット附随サービス業", "41": "映像・音声・文字情報制作業", "42": "鉄道業", "43": "道路旅客運送業",
  "44": "道路貨物運送業", "45": "水運業", "46": "航空運輸業", "47": "倉庫業", "48": "運輸に附帯するサービス業",
  "49": "郵便業", "50": "各種商品卸売業", "51": "繊維・衣服等卸売業", "52": "飲食料品卸売業", "53": "建築材料，鉱物・金属材料等卸売業",
  "54": "機械器具卸売業", "55": "その他の卸売業", "56": "各種商品小売業", "57": "織物・衣服・身の回り品小売業",
  "58": "飲食料品小売業", "59": "機械器具小売業", "60": "その他の小売業", "61": "無店舗小売業", "62": "銀行業",
  "63": "協同組織金融業", "64": "貸金業，クレジットカード業等非預金信用機関", "65": "金融商品取引業，商品先物取引業",
  "66": "補助的金融業等", "67": "保険業", "68": "不動産取引業", "69": "不動産賃貸業・管理業", "70": "物品賃貸業",
  "71": "学術・開発研究機関", "72": "専門サービス業", "73": "広告業", "74": "技術サービス業", "75": "宿泊業",
  "76": "飲食店", "77": "持ち帰り・配達飲食サービス業", "78": "洗濯・理容・美容・浴場業", "79": "その他の生活関連サービス業",
  "80": "娯楽業", "81": "学校教育", "82": "その他の教育，学習支援業", "83": "医療業", "84": "保健衛生",
  "85": "社会保険・社会福祉・介護事業", "86": "郵便局", "87": "協同組合", "88": "廃棄物処理業", "89": "自動車整備業",
  "90": "機械等修理業", "91": "職業紹介・労働者派遣業", "92": "その他の事業サービス業", "93": "政治・経済・文化団体",
  "94": "宗教", "95": "その他のサービス業", "96": "外国公務", "97": "国家公務", "98": "地方公務", "99": "分類不能の産業"
};

function renderFilterBadges(filtersJson: string | null, locale: string = "ja") {
  if (!filtersJson) return null;
  try {
    const filters = JSON.parse(filtersJson);
    const badges: { text: string; type: "keyword" | "location" | "industry" | "scale" | "signal" }[] = [];

    // Keyword
    if (filters.keyword) {
      badges.push({ text: locale === 'en' ? `Keyword: ${filters.keyword}` : `キーワード: ${filters.keyword}`, type: "keyword" });
    }

    // Prefecture & City
    if (filters.prefecture_code) {
      const prefJa = PREFECTURE_MAP[filters.prefecture_code] || filters.prefecture_code; const prefName = locale === 'en' ? (prefectureJaToEn[prefJa] || prefJa) : prefJa;
      if (filters.city_name) {
        badges.push({ text: `${prefName} ${filters.city_name}`, type: "location" });
      } else {
        badges.push({ text: prefName, type: "location" });
      }
    } else if (filters.city_name) {
      badges.push({ text: filters.city_name, type: "location" });
    }

    // Industry
    if (filters.industry_code) {
      const indJa = INDUSTRY_MAP[filters.industry_code] || filters.industry_code; const indName = locale === 'en' ? (industryJaToEn[indJa] || indJa) : indJa;
      badges.push({ text: indName, type: "industry" });
    }

    // Employees
    if (filters.min_employees !== undefined || filters.max_employees !== undefined) {
      let text = locale === 'en' ? "Employees: " : "従業員数: ";
      if (filters.min_employees !== undefined && filters.max_employees !== undefined) {
        text += locale === 'en' ? `${filters.min_employees} - ${filters.max_employees} employees` : `${filters.min_employees}〜${filters.max_employees}名`;
      } else if (filters.min_employees !== undefined) {
        text += locale === 'en' ? `${filters.min_employees}+ employees` : `${filters.min_employees}名以上`;
      } else {
        text += locale === 'en' ? `Up to ${filters.max_employees} employees` : `${filters.max_employees}名以下`;
      }
      badges.push({ text, type: "scale" });
    }

    // Capital
    if (filters.min_capital !== undefined || filters.max_capital !== undefined) {
      let text = locale === 'en' ? "Capital: " : "資本金: ";
      if (filters.min_capital !== undefined && filters.max_capital !== undefined) {
        text += locale === 'en' ? `¥${(filters.min_capital * 10000 / 1000000).toLocaleString()}M - ¥${(filters.max_capital * 10000 / 1000000).toLocaleString()}M JPY` : `${filters.min_capital}〜${filters.max_capital}万円`;
      } else if (filters.min_capital !== undefined) {
        text += locale === 'en' ? `¥${(filters.min_capital * 10000 / 1000000).toLocaleString()}M+ JPY` : `${filters.min_capital}万円以上`;
      } else {
        text += locale === 'en' ? `Up to ¥${(filters.max_capital * 10000 / 1000000).toLocaleString()}M JPY` : `${filters.max_capital}万円以下`;
      }
      badges.push({ text, type: "scale" });
    }

    // Signals
    if (filters.has_hiring) badges.push({ text: locale === 'en' ? "Hiring Active" : "求人あり", type: "signal" });
    if (filters.has_subsidy) badges.push({ text: locale === 'en' ? "Subsidies Received" : "助成金あり", type: "signal" });
    if (filters.has_bidding) badges.push({ text: locale === 'en' ? "Tenders Awarded" : "入札あり", type: "signal" });
    if (filters.has_award) badges.push({ text: locale === 'en' ? "Awards" : "表彰あり", type: "signal" });
    if (filters.has_certification) badges.push({ text: locale === 'en' ? "Certifications" : "認証あり", type: "signal" });
    if (filters.has_patent) badges.push({ text: locale === 'en' ? "Patents/Trademarks" : "特許・商標あり", type: "signal" });

    // Contact channels
    if (filters.has_email) badges.push({ text: locale === 'en' ? "Email Available" : "Emailあり", type: "signal" });
    if (filters.has_phone) badges.push({ text: locale === 'en' ? "Phone Available" : "電話番号あり", type: "signal" });
    if (filters.has_website) badges.push({ text: locale === 'en' ? "Website Available" : "Websiteあり", type: "signal" });
    if (filters.has_fax) badges.push({ text: locale === 'en' ? "FAX Available" : "FAXあり", type: "signal" });

    if (badges.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1.5 max-w-[320px]">
        {badges.map((badge, idx) => {
          let colorClass = "";
          switch (badge.type) {
            case "keyword":
              colorClass = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900";
              break;
            case "location":
              colorClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
              break;
            case "industry":
              colorClass = "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900";
              break;
            case "scale":
              colorClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
              break;
            case "signal":
              colorClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900";
              break;
          }
          return (
            <span key={idx} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colorClass}`}>
              {badge.text}
            </span>
          );
        })}
      </div>
    );
  } catch {
    return null;
  }
}
