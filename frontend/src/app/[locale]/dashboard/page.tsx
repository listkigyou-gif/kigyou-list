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
  Clock, Info
} from "lucide-react";
import Link from "next/link";
import { parseUTCDate } from "@/lib/dateUtils";
import { CompaniesTab } from "@/components/dashboard/CompaniesTab";
import { FormCampaignsTab } from "@/components/dashboard/FormCampaignsTab";

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
}

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
  const [activeTab, setActiveTab] = useState<"list" | "kanban" | "exports" | "payments" | "settings" | "developer" | "companies" | "formCampaigns">("list");
  const [companies, setCompanies] = useState<DbCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  // My List filters
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listFilterStage, setListFilterStage] = useState<string>("all");

  // Code snippet tab in developer console
  const [codeTab, setCodeTab] = useState<"curl" | "python" | "node">("curl");

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
    if (activeTab === "exports") {
      fetchExportJobs();
    } else if (activeTab === "payments") {
      fetchPaymentHistory();
    } else if (activeTab === "settings") {
      fetchBillingInfo();
    } else if (activeTab === "developer") {
      fetchApiKeys();
    } else if (activeTab === "formCampaigns") {
      fetchFormCampaigns();
    }
  }, [activeTab, fetchExportJobs, fetchPaymentHistory, fetchBillingInfo, fetchApiKeys, fetchFormCampaigns]);

  // Sync saved list from API
  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "exports" || tab === "list" || tab === "kanban" || tab === "payments" || tab === "settings" || tab === "developer" || tab === "companies" || tab === "formCampaigns") {
      setActiveTab(tab as any);
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

  // Handle Stripe subscription success redirection & simulation
  useEffect(() => {
    if (!mounted || !user?.email) return;

    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("stripe_success") === "true";
    
    if (isSuccess) {
      const plan = params.get("plan");
      const pack = params.get("pack");
      const email = params.get("email");
      const amountJpy = params.get("amount_jpy");
      const allowance = params.get("allowance");
      const amount = params.get("amount");
      
      if (plan && email && amountJpy && allowance) {
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

  // If not logged in, show calm registration preview gate
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto gap-8 py-16 sm:py-24">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-100 dark:border-blue-900 flex items-center justify-center shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider rounded-full shadow-2xs mx-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              {locale === 'en' ? "MEMBER WORKSPACE ONLY" : "会員専用営業管理ボード"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {locale === 'en' ? t.dashboard.memberOnlyTitle : 'ABMダッシュボードは会員専用機能です'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
              {locale === 'en' ? t.dashboard.memberOnlyDesc : '無料会員登録をしていただくと、気になる企業をブックマークする「マイリスト」や、案件化プロセスを管理する「かんばん営業管理ボード」をご利用いただけます。'}
            </p>
          </div>

          {/* 4 Feature Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
            <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ListFilter className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">マイリスト保存・分類</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ターゲット企業を即時ブックマークし、営業進捗を一元管理</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Kanban className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">かんばんパイプライン</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">未連絡から商談中、成約までアプローチ進捗を可視化</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">CSV一括ダウンロード</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">電話番号・メール・財務データをCSVで即時出力</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">インボイス領収書対応</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">適格請求書番号T+13桁記載のPDF領収書を発行</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex-1 px-6 py-3 font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {locale === 'en' ? t.dashboard.registerFreeBtn : '無料会員登録 (10秒)'}
            </button>
            <Link
              href="/search"
              className="flex-1 px-6 py-3 font-bold text-xs sm:text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-center"
            >
              {locale === 'en' ? t.dashboard.backToSearch : '企業検索に戻る'}
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
    if (quota?.subscription_status === 'suspended') {
      alert(locale === 'en' ? "Your account is temporarily suspended, CSV export is disabled." : "アカウントが一時停止されているため、エクスポートを実行できません。");
      return;
    }
    if (companies.length === 0) {
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

      if (q.remaining < companies.length) {
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
        body: JSON.stringify({ count: companies.length }),
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

      const rows = companies.map(c => [
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
        locale === 'en' ? (stageLabels[kanbanStages[c.corporate_number] || '未連絡'] || (kanbanStages[c.corporate_number] || 'Uncontacted')) : (kanbanStages[c.corporate_number] || '未連絡'),
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

  // Kanban logic
  const stages: KanbanStage[] = ["未連絡", "連絡済み", "商談中", "成約"];
  
  const getStageColor = (stage: KanbanStage) => {
    switch (stage) {
      case "未連絡": return "border-l-slate-400 bg-white dark:bg-slate-900/60";
      case "連絡済み": return "border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10";
      case "商談中": return "border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10";
      case "成約": return "border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10";
    }
  };

  const moveCard = (corpNum: string, direction: "left" | "right") => {
    const currentStage = kanbanStages[corpNum] || "未連絡";
    const currentIndex = stages.indexOf(currentStage);
    let newIndex = currentIndex;
    
    if (direction === "left" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === "right" && currentIndex < stages.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      updateKanbanStage(corpNum, stages[newIndex]!);
    }
  };

  // Counts for KPI
  const dealsInProgressCount = companies.filter(
    (c) => (kanbanStages[c.corporate_number] === "商談中" || kanbanStages[c.corporate_number] === "成約")
  ).length;

  // Filtered companies for MyList
  const filteredCompanies = companies.filter((c) => {
    const stage = kanbanStages[c.corporate_number] || "未連絡";
    if (listFilterStage !== "all" && stage !== listFilterStage) return false;
    if (listSearchQuery.trim()) {
      const q = listSearchQuery.toLowerCase();
      const matchName = c.company_name.toLowerCase().includes(q);
      const matchPref = c.prefecture_name?.toLowerCase().includes(q);
      const matchIndustry = c.jigyo_shumoku?.toLowerCase().includes(q);
      if (!matchName && !matchPref && !matchIndustry) return false;
    }
    return true;
  });

  const getTabTitle = (tab: typeof activeTab) => {
    switch (tab) {
      case "list": return locale === 'en' ? "My Saved Companies" : "マイリスト・保存企業一覧";
      case "kanban": return locale === 'en' ? "Sales Kanban Pipeline" : "かんばん営業管理ボード";
      case "exports": return locale === 'en' ? "CSV Export History" : "CSVダウンロード履歴";
      case "payments": return locale === 'en' ? "Billing & Receipts" : "購入履歴・インボイス領収書";
      case "settings": return locale === 'en' ? "Receipt & Profile Settings" : "領収書・企業情報設定";
      case "developer": return locale === 'en' ? "Developer Console & API" : "API連携・開発者コンソール";
      case "companies": return locale === 'en' ? "Managed Companies" : locale === 'vi' ? "Quản lý Doanh nghiệp" : "自社プロファイル管理";
      case "formCampaigns": return locale === 'en' ? "Form DM Outreach Campaigns" : locale === 'vi' ? "Chiến dịch & Mẫu gửi Form Tiếp cận B2B" : "問い合わせフォーム営業・キャンペーン";
    }
  };

  const getTabDescription = (tab: typeof activeTab) => {
    switch (tab) {
      case "list": return locale === 'en' ? "Manage your target companies, sales stages, and export them directly to CSV." : "ターゲット企業の連絡先、規模、営業進捗を一元管理し、CSVで即時出力できます。";
      case "kanban": return locale === 'en' ? "Visualize and advance your sales deals from uncontacted to closed won." : "未連絡から商談中、成約までアプローチ進捗を可視化し、パイプラインを前進させます。";
      case "exports": return locale === 'en' ? "Review past data exports, monitor generation status, and download CSV files." : "これまでに実行した企業データCSVエクスポートのジョブ状況とダウンロードリンクです。";
      case "payments": return locale === 'en' ? "View subscription records, credit card transactions, and download Qualified Invoice receipts." : "有料プランの定期契約および追加容量の決済記録、適格請求書（インボイス制度対応）のPDFを発行します。";
      case "settings": return locale === 'en' ? "Configure company billing details and Qualified Invoice Registration Number (T+13 digits)." : "インボイス領収書に記載する企業名、適格請求書発行事業者番号（T+13桁）、住所を設定します。";
      case "developer": return locale === 'en' ? "Integrate B2B company data with your internal CRM, ERP, and outreach tools via REST API." : "REST APIを利用した企業データのシステム間自動連携、APIキーの発行と接続テストを行います。";
      case "companies": return locale === 'en' ? "Manage verified company profiles, update PR details, and track document reviews." : locale === 'vi' ? "Quản lý hồ sơ công ty chính chủ, thông điệp PR và tiến độ xét duyệt." : "公式オーナー認証済み企業の管理、PRメッセージの更新、および審査状況を確認できます。";
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
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200/60 flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">Sales Workspace</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.name || "ABM 営業ボード"}</span>
                </div>
              </div>
              <Link
                href={`/${locale}/search`}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                title="企業データ検索へ"
              >
                <Search className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Shortcut to Search */}
            <Link
              href={`/${locale}/search`}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>企業データ検索</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-400" />
            </Link>

            {/* Categorized Navigation Groups */}
            <nav className="flex flex-col gap-4 text-xs font-semibold" aria-label="Dashboard Navigation">
              {/* Group 1: Sales & Pipeline */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                  営業・パイプライン (Sales)
                </span>

                {/* My List */}
                <button
                  onClick={() => setActiveTab("list")}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === "list"
                      ? "bg-slate-100 text-slate-900 font-bold border border-slate-200/90 dark:bg-slate-800 dark:text-white dark:border-slate-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ListFilter className={`w-4 h-4 shrink-0 ${activeTab === "list" ? "text-slate-900 dark:text-white" : "text-slate-500"}`} />
                    <span>マイリスト</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "list" ? "bg-white text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    {companies.length}
                  </span>
                </button>

                {/* Kanban */}
                <button
                  onClick={() => setActiveTab("kanban")}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === "kanban"
                      ? "bg-slate-100 text-slate-900 font-bold border border-slate-200/90 dark:bg-slate-800 dark:text-white dark:border-slate-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Kanban className={`w-4 h-4 shrink-0 ${activeTab === "kanban" ? "text-slate-900 dark:text-white" : "text-slate-500"}`} />
                    <span>かんばん営業管理</span>
                  </div>
                  {dealsInProgressCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === "kanban" ? "bg-white text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900" : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}>
                      {dealsInProgressCount}
                    </span>
                  )}
                </button>

                {/* Form Outreach Campaigns */}
                <button
                  onClick={() => setActiveTab("formCampaigns")}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === "formCampaigns"
                      ? "bg-indigo-50 text-indigo-950 font-bold border border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Send className={`w-4 h-4 shrink-0 ${activeTab === "formCampaigns" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`} />
                    <span>フォーム営業・下書き</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                    NEW
                  </span>
                </button>
              </div>

              {/* Group 2: Data & Developer */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                  データ・連携 (Data & API)
                </span>

                {/* Exports */}
                <button
                  onClick={() => setActiveTab("exports")}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === "exports"
                      ? "bg-slate-100 text-slate-900 font-bold border border-slate-200/90 dark:bg-slate-800 dark:text-white dark:border-slate-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Download className={`w-4 h-4 shrink-0 ${activeTab === "exports" ? "text-slate-900 dark:text-white" : "text-slate-500"}`} />
                    <span>CSVエクスポート履歴</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "exports" ? "bg-white text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    {exportJobs.length}
                  </span>
                </button>

                {/* Developer */}
                <button
                  onClick={() => setActiveTab("developer")}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === "developer"
                      ? "bg-slate-100 text-slate-900 font-bold border border-slate-200/90 dark:bg-slate-800 dark:text-white dark:border-slate-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal className={`w-4 h-4 shrink-0 ${activeTab === "developer" ? "text-slate-900 dark:text-white" : "text-slate-500"}`} />
                    <span>API連携 (API Keys)</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "developer" ? "bg-white text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    {apiKeys.length}
                  </span>
                </button>
              </div>

              {/* Group 3: Billing & Profile */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                  請求・プラン (Billing)
                </span>

                {/* Payments */}
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === "payments"
                      ? "bg-slate-100 text-slate-900 font-bold border border-slate-200/90 dark:bg-slate-800 dark:text-white dark:border-slate-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className={`w-4 h-4 shrink-0 ${activeTab === "payments" ? "text-slate-900 dark:text-white" : "text-slate-500"}`} />
                    <span>購入履歴・インボイス</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "payments" ? "bg-white text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    {paymentHistory.length}
                  </span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === "settings"
                      ? "bg-slate-100 text-slate-900 font-bold border border-slate-200/90 dark:bg-slate-800 dark:text-white dark:border-slate-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className={`w-4 h-4 shrink-0 ${activeTab === "settings" ? "text-slate-900 dark:text-white" : "text-slate-500"}`} />
                    <span>領収書・企業情報設定</span>
                  </div>
                </button>
              </div>

              {/* Group 4: Company Profile & Claim Management */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                  自社・公式認証 (Enterprise)
                </span>

                <button
                  onClick={() => setActiveTab("companies")}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === "companies"
                      ? "bg-emerald-50 text-emerald-950 font-bold border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === "companies" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`} />
                    <span>自社プロファイル管理</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    50件/日
                  </span>
                </button>
              </div>
            </nav>

            {/* Sidebar Plan & Quota Card */}
            <div className="flex flex-col gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  {currentPlanInfo.label}
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                  {quota ? `残り ${quota.remaining.toLocaleString()} 行` : `${currentPlanInfo.quota}`}
                </span>
              </div>

              {quota && (
                <div className="flex flex-col gap-1.5">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (quota.monthly_base_used / quota.monthly_base_allowance) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>使用量: {quota.monthly_base_used.toLocaleString()} / {quota.monthly_base_allowance.toLocaleString()} 行</span>
                  </div>
                  {quota.last_reset_date && (
                    <div className="text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-slate-800 pt-1.5 flex justify-between items-center">
                      <span className="truncate">{getSubscriptionPeriodText(quota.last_reset_date, quota.plan)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <Link
                  href={`/${locale}/pricing`}
                  className="flex-1 py-1.5 text-[11px] font-bold text-center text-slate-800 dark:text-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{isPro ? "プラン変更" : "アップグレード"}</span>
                </Link>
                {isPro && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="py-1.5 px-2 text-[10px] font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="解約手続き"
                  >
                    解約
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Footer: User profile info */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
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
          {/* Section Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Link href={`/${locale}`} className="hover:text-slate-600 dark:hover:text-slate-200">ホーム</Link>
                <span>/</span>
                <span>営業管理ダッシュボード</span>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{getTabTitle(activeTab)}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {getTabTitle(activeTab)}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {getTabDescription(activeTab)}
              </p>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {activeTab === "list" && (
                <button
                  onClick={handleCSVDownload}
                  disabled={csvExporting || companies.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {csvExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" /> : <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
                  <span>マイリスト出力 (CSV)</span>
                </button>
              )}
              <Link
                href={`/${locale}/search`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>企業検索</span>
              </Link>
            </div>
          </div>

          {/* 4 Quick KPI Stat Cards */}
          {activeTab === "formCampaigns" ? (
            <div className="flex flex-col gap-3">
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
                {/* Form KPI 1 */}
                <div className="p-4 bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shrink-0">
                    <Send className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {locale === 'en' ? "Total Campaigns" : locale === 'vi' ? "Tổng số chiến dịch" : "総キャンペーン数"}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {formCampaignsList.length} <span className="text-xs font-bold text-slate-400">件</span>
                    </span>
                  </div>
                </div>

                {/* Form KPI 2 */}
                <div className="p-4 bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-100 dark:border-amber-900 flex items-center justify-center shrink-0">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {locale === 'en' ? "In Review / Sending" : locale === 'vi' ? "Đang duyệt / Đang gửi" : "審査中・配信中"}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {formCampaignsList.filter((c: any) => c.status === "pending_review" || c.status === "approved" || c.status === "sending").length} <span className="text-xs font-bold text-slate-400">件</span>
                    </span>
                  </div>
                </div>

                {/* Form KPI 3 */}
                <div className="p-4 bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {locale === 'en' ? "Delivered Forms" : locale === 'vi' ? "Form đã gửi thành công" : "送信完了フォーム数"}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {formCampaignsList.reduce((acc: number, c: any) => acc + (c.success_count || 0), 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">通</span>
                    </span>
                  </div>
                </div>

                {/* Form KPI 4 */}
                <div className="p-4 bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 border border-purple-100 dark:border-purple-900 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {locale === 'en' ? "Billing Model" : locale === 'vi' ? "Cơ chế tính phí" : "配信課金モデル"}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-1">
                      {locale === 'en' ? "Pay-per-campaign" : locale === 'vi' ? "Theo chiến dịch (từ 20円)" : "都度購入 (1件20円〜)"}
                    </span>
                  </div>
                </div>
              </section>

              {/* Informative Guidance Notice */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950 dark:text-indigo-200 animate-in fade-in duration-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    {locale === 'vi' 
                      ? "問い合わせフォーム営業 là dịch vụ thanh toán theo từng chiến dịch (từ 500 đến 5.000 form). Hạn mức này tách biệt hoàn toàn với hạn mức tải 20 dòng CSV miễn phí của tài khoản."
                      : locale === 'en'
                      ? "Contact Form Outreach operates on a pay-per-campaign basis (from 500 to 5,000 forms), separate from your account's daily CSV export allowance."
                      : "※ 問い合わせフォーム営業はキャンペーン単位（500件〜）の都度購入・従量課金制です。アカウントの無料CSV出力枠（20行）とは別枠となります。"}
                  </span>
                </div>
                <Link
                  href={`/${locale}/form-marketing#pricing`}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 text-[11px] flex items-center gap-1"
                >
                  <span>{locale === 'vi' ? "Xem bảng giá chiến dịch" : locale === 'en' ? "View Campaign Pricing" : "配信単価・料金表"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
              <div className="p-4 bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400">マイリスト保存数</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{companies.length} <span className="text-xs font-bold text-slate-400">社</span></span>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-100 dark:border-amber-900 flex items-center justify-center shrink-0">
                  <Kanban className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400">商談中・成約案件</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{dealsInProgressCount} <span className="text-xs font-bold text-slate-400">件</span></span>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center shrink-0">
                  <Download className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400">残CSV出力可能枠</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{quota?.remaining.toLocaleString() ?? "-"} <span className="text-xs font-bold text-slate-400">行</span></span>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 border border-purple-100 dark:border-purple-900 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400">契約プラン</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white mt-1 uppercase">{currentPlanInfo.label}</span>
                </div>
              </div>
            </section>
          )}

          {quota?.subscription_status === 'suspended' && (
            <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-2xl p-4 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-300">
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
            <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-250">
              <button
                onClick={() => setShowCSVConfirm(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200/60 flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6" />
                </div>

                <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">
                  {locale === 'en' ? 'Confirm CSV Export' : 'マイリストCSVエクスポートの確認'}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 leading-relaxed">
                  {locale === 'en' ? <span>Export CSV data for <strong className="text-slate-800 dark:text-slate-200">{companies.length} companies</strong> from your My List.</span> : <span>マイリストの <strong className="text-slate-800 dark:text-slate-200">{companies.length} 社</strong> の企業データをCSVに出力します。</span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  {locale === 'en' ? <span>This will deduct <strong className="text-slate-800 dark:text-slate-200">{companies.length} rows</strong> of export quota from your account.</span> : <span>この操作により、アカウントから <strong className="text-slate-800 dark:text-slate-200">{companies.length} 行分</strong> のエクスポート容量が差し引かれます。</span>}
                </p>

                {csvQuota && (
                  <div className="mb-4 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2">
                    <span>
                      {locale === 'en' ? "Current remaining: " : "現在の残容量: "}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {csvQuota.remaining.toLocaleString()} {locale === 'en' ? "rows" : "行"}
                      </strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">→</span>
                    <span>
                      {locale === 'en' ? "After export: " : "出力後: "}
                      <strong className="text-blue-600 dark:text-blue-400">
                        {(csvQuota.remaining - companies.length).toLocaleString()} {locale === 'en' ? "rows" : "行"}
                      </strong>
                    </span>
                  </div>
                )}

                {!isPro && (
                  <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 font-medium text-left">
                    {locale === 'en' ? '* Email addresses are not included in the FREE plan. Upgrade to PRO to export all columns.' : '※ FREEプランではメールアドレス列は含まれません。PROプランにアップグレードすると全列が出力されます。'}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCSVConfirm(false)}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  >
                    {locale === 'en' ? 'Cancel' : 'キャンセル'}
                  </button>
                  <button
                    disabled={quota?.subscription_status === 'suspended'}
                    onClick={executeCSVDownload}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {quota?.subscription_status === 'suspended' ? (locale === 'en' ? 'Blocked' : 'ブロック中') : (locale === 'en' ? 'Export CSV' : 'エクスポート実行')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                <span className="text-xs text-slate-400">{locale === 'en' ? "Syncing list..." : "リストを同期中..."}</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">{locale === 'en' ? 'No Saved Companies' : '保存された企業はありません'}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {locale === 'en' ? 'Use search to find companies you want to approach, then click "Save to My List".' : 'データベース検索を利用してアプローチしたい企業を探し、「マイリストに保存」ボタンを押してください。'}
                  </p>
                </div>
                <Link
                  href={`/${locale}/search`}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 rounded-xl shadow-2xs transition-all"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>{locale === 'en' ? 'Search Companies' : '企業を検索する'}</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Search & Action Bar on top of table */}
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                    {/* Filter by stage */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: "all", label: "すべて" },
                        { id: "未連絡", label: "未連絡" },
                        { id: "連絡済み", label: "連絡済み" },
                        { id: "商談中", label: "商談中" },
                        { id: "成約", label: "成約" }
                      ].map(st => (
                        <button
                          key={st.id}
                          onClick={() => setListFilterStage(st.id)}
                          className={`px-3 py-1 text-2xs font-bold rounded-lg transition-all cursor-pointer ${
                            listFilterStage === st.id
                              ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 shadow-2xs"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {/* Quick search input */}
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={listSearchQuery}
                        onChange={(e) => setListSearchQuery(e.target.value)}
                        placeholder="マイリスト内を検索..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCSVDownload}
                    disabled={csvExporting || companies.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap self-start sm:self-auto"
                  >
                    {csvExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    ) : (
                      <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    )}
                    <span>{csvExporting ? (locale === 'en' ? "Checking..." : "確認中...") : (locale === 'en' ? "Export CSV" : "マイリスト出力 (CSV)")}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-6">{locale === 'en' ? "Company Name" : "企業名"}</th>
                      <th className="py-3.5 px-4">{locale === 'en' ? "Phone / Location" : "代表電話 / 所在地"}</th>
                      <th className="py-3.5 px-4">{locale === 'en' ? "Scale (Employees / Capital)" : "規模 (従業員数 / 資本金)"}</th>
                      <th className="py-3.5 px-4">{locale === 'en' ? "Sales Stage" : "営業進捗ステータス"}</th>
                      <th className="py-3.5 px-6 text-right">{locale === 'en' ? "Actions" : "操作"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                          該当する企業は見つかりませんでした。
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((comp) => {
                        const stage = kanbanStages[comp.corporate_number] || "未連絡";
                        return (
                          <tr 
                            key={comp.corporate_number}
                            className="hover:bg-slate-50/60 dark:hover:bg-[#151B22] transition-colors"
                          >
                            {/* Name & JSIC */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1 max-w-[280px]">
                                <Link 
                                  href={`/company/${comp.corporate_number}`}
                                  className="font-bold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 text-sm transition-colors truncate block"
                                >
                                  {comp.company_name}
                                </Link>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {comp.jigyo_shumoku?.split(",")[0].replace(' (AI確認済)', '') || (locale === 'en' ? "Services" : "サービス")}
                                </span>
                              </div>
                            </td>

                            {/* Phone / Location */}
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  {comp.phone_number || (locale === 'en' ? "Unregistered" : "未登録")}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {comp.prefecture_name || ""}
                                </span>
                              </div>
                            </td>

                            {/* Scale */}
                            <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                              <div className="flex flex-col gap-1 font-mono">
                                <span>
                                  {comp.employee_count ? (locale === 'en' ? `${comp.employee_count.toLocaleString()} employees` : `${comp.employee_count.toLocaleString()}名`) : (locale === 'en' ? "Unregistered" : "未登録")}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {comp.capital_amount ? (locale === 'en' ? `¥${(comp.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 1})}M JPY` : `${Math.round(comp.capital_amount / 10000).toLocaleString()}万円`) : (locale === 'en' ? "Unregistered" : "未登録")}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              <select
                                value={stage}
                                onChange={(e) => updateKanbanStage(comp.corporate_number, e.target.value as KanbanStage)}
                                className={`text-[10px] font-bold px-2.5 py-1.5 border rounded-lg focus:outline-none cursor-pointer ${
                                  stage === "未連絡" 
                                    ? "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                    : stage === "連絡済み"
                                    ? "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300"
                                    : stage === "商談中"
                                    ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300"
                                }`}
                              >
                                {stages.map((st) => (
                                  <option key={st} value={st}>{stageLabels[st] || st}</option>
                                ))}
                              </select>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/company/${comp.corporate_number}`}
                                  className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:text-blue-600 dark:border-slate-800 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 transition-all active:scale-95"
                                  title={locale === 'en' ? "View Profile" : "企業プロフィール詳細"}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => toggleSaveCompany(comp.corporate_number)}
                                  className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:hover:bg-rose-950/20 dark:hover:border-rose-900/40 dark:hover:text-rose-400 text-slate-400 transition-all active:scale-95 cursor-pointer"
                                  title={locale === 'en' ? "Remove from My List" : "マイリストから削除"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
            )}
          </section>
        )}

        {/* Tab 2 Contents: Kanban Board */}
        {activeTab === "kanban" && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
            {stages.map((stage) => {
              const stageCompanies = companies.filter(
                (comp) => (kanbanStages[comp.corporate_number] || "未連絡") === stage
              );

              return (
                <div 
                  key={stage}
                  className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        stage === "未連絡" 
                          ? "bg-slate-400" 
                          : stage === "連絡済み" 
                          ? "bg-blue-500" 
                          : stage === "商談中" 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                      }`} />
                      {stageLabels[stage] || stage}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {stageCompanies.length} {locale === 'en' ? "companies" : "社"}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div className="flex flex-col gap-3 min-h-[160px]">
                    {stageCompanies.length === 0 ? (
                      <div className="py-12 text-center text-[11px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1">
                        <span>対象企業はありません</span>
                      </div>
                    ) : (
                      stageCompanies.map((comp) => (
                        <div
                          key={comp.corporate_number}
                          className={`p-4 rounded-2xl border-l-4 border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 transition-all shadow-2xs ${getStageColor(stage)} flex flex-col gap-3 group`}
                        >
                          <div className="flex flex-col gap-1">
                            <Link 
                              href={`/company/${comp.corporate_number}`}
                              className="font-bold text-xs text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400 tracking-tight line-clamp-2 leading-relaxed transition-colors block"
                            >
                              {comp.company_name}
                            </Link>
                            <span className="text-[10px] text-slate-400 line-clamp-1">
                              {comp.jigyo_shumoku?.split(",")[0].replace(' (AI確認済)', '') || "サービス"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] border-t border-slate-100 dark:border-slate-800/80 pt-2 text-slate-500">
                            <span className="font-semibold text-slate-400">
                              {comp.prefecture_name || "地域未設定"}
                            </span>
                            
                            {/* Fast Column Navigation Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveCard(comp.corporate_number, "left")}
                                disabled={stage === "未連絡"}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                title="左に移動"
                              >
                                <MoveLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveCard(comp.corporate_number, "right")}
                                disabled={stage === "成約"}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                title="右に移動"
                              >
                                <MoveRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Tab 3 Contents: Export History */}
        {activeTab === "exports" && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-500 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900 dark:text-white block">ダウンロード有効期限に関するご注意</span>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  作成されたエクスポートファイル（ZIP）の<strong>保存期間は7日間</strong>です。7日を経過するとデータはサーバーから自動的に削除され、再ダウンロードできなくなりますので、お早めに端末へ保存してください。
                </p>
              </div>
            </div>
            
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              {loadingExports ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                  <span className="text-xs text-slate-400">履歴を読み込み中...</span>
                </div>
              ) : exportJobs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Download className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">エクスポート履歴はありません</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      企業検索からCSV出力を実行すると、ここにダウンロード履歴が追加されます。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-6">タスクID / 作成日時</th>
                        <th className="py-3.5 px-4">ダウンロード期限 (7日間)</th>
                        <th className="py-3.5 px-4">適用フィルター</th>
                        <th className="py-3.5 px-4">取得件数</th>
                        <th className="py-3.5 px-4">ステータス</th>
                        <th className="py-3.5 px-6 text-right">操作</th>
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
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]" title={job.id}>{job.id}</span>
                                <span className="text-[10px] text-slate-400">{formattedDate}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                              <span className={`text-[10px] font-semibold ${isExpired ? "text-rose-500 font-bold" : "text-slate-500"}`}>
                                {isExpired ? "期限切れ (消去済)" : formattedExpiry}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {renderFilterBadges(job.filters, locale)}
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white">
                              {job.total_records ? `${job.total_records.toLocaleString()}行` : "-"}
                            </td>
                            <td className="py-4 px-4">
                              {job.status === "completed" ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-[9px] font-bold">出力完了</span>
                              ) : job.status === "processing" ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 text-[9px] font-bold">生成中</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 text-[9px] font-bold">失敗</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              {job.status === "completed" && !isExpired && job.file_path ? (
                                <a
                                  href={`/api/export/download?jobId=${job.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
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
        {activeTab === "payments" && (
          <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            {loadingPayments ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                <span className="text-xs text-slate-400">購入履歴を読み込み中...</span>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">購入履歴はありません</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Stripeで追加のCSVダウンロード容量またはプランをご購入いただくと、ここに履歴とインボイス領収書が表示されます。
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-6">取引ID / 決済日時</th>
                      <th className="py-3.5 px-4">購入プラン</th>
                      <th className="py-3.5 px-4">付与容量</th>
                      <th className="py-3.5 px-4">決済金額 (税込)</th>
                      <th className="py-3.5 px-6 text-right">インボイス領収書</th>
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
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px]" title={pay.id}>{pay.id}</span>
                              <span className="text-[10px] text-slate-400">{formattedDate} (JST)</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {pay.pack_id === "10k" ? "CSV 10k行追加パック" :
                             pay.pack_id === "50k" ? "CSV 50k行追加パック" :
                             pay.pack_id === "100k" ? "CSV 100k行追加パック" :
                             pay.pack_id === "pro" ? "PROプラン (月額)" :
                             pay.pack_id === "business" ? "BUSINESSプラン (月額)" :
                             pay.pack_id === "enterprise" ? "ENTERPRISEプラン (月額)" :
                             "カスタムパック"}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                            +{pay.lines_added.toLocaleString()} 行
                          </td>
                          <td className="py-4 px-4 font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                            ¥{pay.amount_jpy.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {pay.invoice_url ? (
                              <a
                                href={`/api/stripe/invoice?id=${pay.id}&email=${encodeURIComponent(user?.email || "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
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
        {activeTab === "settings" && (
          <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs w-full flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-100 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  領収書・インボイス設定
                </h2>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  購入履歴からダウンロードする領収書に記載する宛名や適格請求書登録番号を設定します
                </span>
              </div>
            </div>

            {loadingBilling ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                <span className="text-xs text-slate-400">設定を読み込み中...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form fields */}
                <form onSubmit={handleSaveBilling} className="lg:col-span-7 flex flex-col gap-5 text-xs">
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
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:outline-none focus:border-blue-500 text-xs transition-all"
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
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:outline-none focus:border-blue-500 text-xs transition-all resize-none"
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
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:outline-none focus:border-blue-500 text-xs transition-all font-mono"
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
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:outline-none focus:border-blue-500 text-xs transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      社判・会社ロゴ画像 (PNG / JPG / SVG, 最大500KB)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5">
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
                      className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      領収書プレビュー（印刷イメージ）
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">PREVIEW</span>
                  </div>

                  <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white">領 収 書</h4>
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

        {/* Tab 6 Contents: Developer API Settings */}
        {activeTab === "developer" && (
          <section className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-100 flex items-center justify-center shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    API連携・APIキー設定
                  </h2>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    外部システム（CRM、SFA、社内データベース等）と連携するためのAPIキーの生成と管理を行います
                  </span>
                </div>
              </div>

              {/* Check Permissions */}
              {user?.role !== "business" && user?.role !== "enterprise" ? (
                // Premium CTA for Free/Pro
                <div className="py-8 flex flex-col items-center max-w-xl mx-auto text-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center shadow-xs border border-blue-200/60">
                    <Key className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
                      API連携機能はBUSINESSプラン以上でご利用いただけます
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      APIを導入することで、会社データベースの検索や購買シグナルの取得を完全自動化できます。
                      HubSpotやSalesforceなどのCRMにリアルタイムにデータをインポートし、営業効率を最大化しましょう。
                    </p>
                  </div>

                  {/* Feature highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mt-2">
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">① リアルタイム同期</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">CSVの手動ダウンロードとインポート作業が不要になり、完全に自動化されます。</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">② 開発者向けリファレンス</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">cURL、Python、Node.jsのコード例があり、数行のコードですぐに接続可能です。</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">③ 柔軟なAPIクエリ</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">都道府県、資本金、従業員数、企業シグナルなど、多彩な条件で絞り込めます。</p>
                    </div>
                  </div>

                  <Link
                    href="/pricing"
                    className="px-8 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs active:scale-95 transition-all text-xs flex items-center gap-2 mt-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>BUSINESSプランにアップグレード</span>
                  </Link>
                </div>
              ) : (
                // Business/Enterprise UI
                <div className="flex flex-col gap-6">
                  {/* Create Key Control */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/25 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">APIキーの新規発行</span>
                      <p className="text-[10px] text-slate-400">外部プログラムからの認証に使用するAPIキーを発行します。</p>
                    </div>
                    <button
                      onClick={handleCreateApiKey}
                      disabled={generatingKey}
                      className="px-5 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      {generatingKey ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>生成中...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          <span>APIキーを発行する</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Display New Raw Key Modal / Alert */}
                  {newRawKey && (
                    <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-2xl p-5 flex flex-col gap-3 animate-in slide-in-from-top duration-300">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-black text-amber-800 dark:text-amber-400 block mb-1">【重要】APIキーが生成されました。必ずコピーしてください</span>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            セキュリティ上の理由から、このAPIキーは画面を閉じると二度と表示されません。安全な場所にコピーして保存してください。
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                        <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 break-all flex-1 select-all">
                          {newRawKey}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(newRawKey);
                            setCopiedKeyId("new");
                            setTimeout(() => setCopiedKeyId(null), 2000);
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
                          title="クリップボードにコピー"
                        >
                          {copiedKeyId === "new" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => setNewRawKey(null)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold w-fit self-end transition-colors cursor-pointer"
                      >
                        コピー完了を確認して閉じる
                      </button>
                    </div>
                  )}

                  {/* API Key List Table */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      アクティブなAPIキー一覧
                    </span>

                    {loadingApiKeys ? (
                      <div className="py-8 text-center flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/10">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-[10px] text-slate-400">APIキーを読み込み中...</span>
                      </div>
                    ) : apiKeys.length === 0 ? (
                      <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/5 text-slate-400 text-xs">
                        発行済みのAPIキーはありません。「APIキーを発行する」ボタンをクリックして開始してください。
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/10">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">キー (プレビュー)</th>
                              <th className="px-4 py-3">ステータス</th>
                              <th className="px-4 py-3">作成日時 (JST)</th>
                              <th className="px-4 py-3">最終利用日時 (JST)</th>
                              <th className="px-4 py-3">最終接続元 IP</th>
                              <th className="px-4 py-3 text-right">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {apiKeys.map((key) => {
                              const createdJst = new Date(key.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
                              const usedJst = key.last_used_at 
                                ? new Date(key.last_used_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                                : "未使用";

                              return (
                                <tr key={key.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                  <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                    kigyou_live_...{key.api_key_preview.replace(/^\.\.\./, '')}
                                  </td>
                                  <td className="px-4 py-3">
                                    {key.status === "active" ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-[9px] font-bold">有効</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 text-[9px] font-bold">無効化済</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-slate-400 font-mono">{createdJst}</td>
                                  <td className="px-4 py-3 text-slate-400 font-mono">{usedJst}</td>
                                  <td className="px-4 py-3 text-slate-400 font-mono">{key.last_ip || "-"}</td>
                                  <td className="px-4 py-3 text-right">
                                    {key.status === "active" && (
                                      <button
                                        onClick={() => handleRevokeApiKey(key.id)}
                                        className="px-2.5 py-1 text-[10px] font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                                      >
                                        無効化
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* API Quick Reference Documentation with interactive tabs */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 flex flex-col gap-4">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      API クイックリファレンス & コードサンプル
                    </span>

                    <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 font-mono text-xs flex flex-col gap-4 overflow-x-auto shadow-inner">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">API Base URL</span>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-blue-400 font-bold font-mono">
                          {typeof window !== "undefined" ? window.location.origin : "https://kigyoulist.com"}
                        </div>
                      </div>

                      {/* Code Sample Tabs */}
                      <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {[
                            { id: "curl", label: "cURL" },
                            { id: "python", label: "Python" },
                            { id: "node", label: "Node.js" }
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setCodeTab(t.id as any)}
                              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                codeTab === t.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] select-all font-mono leading-relaxed text-slate-200 overflow-x-auto">
                          {codeTab === "curl" ? (
`curl -X GET "${typeof window !== "undefined" ? window.location.origin : "https://kigyoulist.com"}/api/v1/companies?prefecture_code=13&limit=10" \\
  -H "Authorization: Bearer <YOUR_API_KEY>"`
                          ) : codeTab === "python" ? (
`import requests

url = "${typeof window !== "undefined" ? window.location.origin : "https://kigyoulist.com"}/api/v1/companies"
headers = {"Authorization": "Bearer <YOUR_API_KEY>"}
params = {"prefecture_code": "13", "limit": 10}

response = requests.get(url, headers=headers, params=params)
print(response.json())`
                          ) : (
`const response = await fetch("${typeof window !== "undefined" ? window.location.origin : "https://kigyoulist.com"}/api/v1/companies?prefecture_code=13&limit=10", {
  headers: { "Authorization": "Bearer <YOUR_API_KEY>" }
});
const data = await response.json();
console.log(data);`
                          )}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 7 Contents: Managed Companies */}
        {activeTab === "companies" && (
          <CompaniesTab userEmail={user?.email || ""} locale={locale} />
        )}

        {/* Tab 8 Contents: Form Marketing Outreach Campaigns */}
        {activeTab === "formCampaigns" && (
          <FormCampaignsTab />
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
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-blue-200/60">
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
            
            <div className="my-2 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-left text-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5">
              <div className="flex flex-col gap-1">
                {[
                  { plan: "PROプラン", quota: "2,000行/月", price: "¥2,900" },
                  { plan: "BUSINESSプラン", quota: "10,000行/月", price: "¥9,800" },
                  { plan: "ENTERPRISEプラン", quota: "40,000行/月", price: "¥29,000" },
                ].map((p) => (
                  <div key={p.plan} className="flex items-center justify-between font-bold py-1.5 border-b border-slate-200/60 dark:border-slate-800 last:border-0">
                    <span className="text-slate-800 dark:text-slate-200">{p.plan}</span>
                    <div className="text-right">
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold">{p.price}/月</span>
                      <span className="text-[9px] text-slate-400 block">{p.quota}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/pricing"
                className="w-full py-3 text-xs font-bold text-center text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors block cursor-pointer"
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
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 flex flex-col gap-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200/80 rounded-full flex items-center justify-center mx-auto shadow-xs">
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
              <div className="bg-rose-50 border border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-2xl p-4 text-left flex flex-col gap-2 animate-in fade-in duration-300">
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
                className="w-full py-3 text-xs font-bold text-center text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
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
