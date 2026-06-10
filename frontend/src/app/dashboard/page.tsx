"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth, KanbanStage } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Building2, Trash2, Download, ArrowRight, Kanban, ListFilter, 
  Sparkles, CheckCircle2, ChevronRight, Lock, Phone, MoveLeft, MoveRight,
  AlertTriangle, Settings, Loader2, X, ShieldAlert, Upload, Key, Terminal, Copy, Check
} from "lucide-react";
import Link from "next/link";
import { parseUTCDate } from "@/lib/dateUtils";

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
    isLoggedIn, user, setAuthModalOpen,
    savedCompanies, toggleSaveCompany, kanbanStages, updateKanbanStage 
  } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "kanban" | "exports" | "payments" | "settings" | "developer">("list");
  const [companies, setCompanies] = useState<DbCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpsellModal, setShowUpsellModal] = useState(false);

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

  // Billing Info States
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingTaxId, setBillingTaxId] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);

  // Quota indicators state
  const [quota, setQuota] = useState<{
    monthly_base_allowance: number;
    monthly_base_used: number;
    purchased_add_on_balance: number;
    plan: string;
    remaining: number;
    last_reset_date?: string;
    subscription_status?: string;
  } | null>(null);

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
      return `次回リセット日: ${format(nextDate)}`;
    }
    return `契約期間: ${format(startDate)} 〜 ${format(nextDate)}`;
  };

  const fetchQuota = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setQuota(data.quota);
      }
    } catch (e) {
      console.error("Failed to fetch quota", e);
    }
  }, [user]);

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
      }
    } catch (e) {
      console.error("Failed to fetch billing info", e);
    } finally {
      setLoadingBilling(false);
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
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert("領収書情報を保存しました。");
      } else {
        alert(data.error || "保存に失敗しました。");
      }
    } catch (e) {
      console.error("Failed to save billing info", e);
      alert("通信エラーが発生しました。");
    } finally {
      setSavingBilling(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("ファイルサイズは500KB以下にしてください。");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      alert("PNG, JPG, SVG形式の画像のみアップロード可能です。");
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
        alert("ロゴ画像をアップロードしました。");
      } else {
        alert(data.error || "アップロードに失敗しました。");
      }
    } catch (err) {
      console.error("Logo upload error:", err);
      alert("通信エラーが発生しました。");
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
        alert(data.error || "APIキーの生成に失敗しました。");
      }
    } catch (e) {
      console.error("Failed to create API key", e);
      alert("通信エラーが発生しました。");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!window.confirm("このAPIキーを無効化しますか？この操作は取り消せません。外部連携システムが動作しなくなります。")) return;
    try {
      const res = await fetch("/api/user/apikeys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("APIキーを無効化しました。");
        fetchApiKeys();
      } else {
        alert(data.error || "APIキーの無効化に失敗しました。");
      }
    } catch (e) {
      console.error("Failed to revoke API key", e);
      alert("通信エラーが発生しました。");
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
    }
  }, [activeTab, fetchExportJobs, fetchPaymentHistory, fetchBillingInfo, fetchApiKeys]);

  // Sync saved list from API
  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "exports" || tab === "list" || tab === "kanban" || tab === "payments" || tab === "settings" || tab === "developer") {
      setActiveTab(tab as any);
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      fetchQuota();
    }
  }, [user?.email, fetchQuota]);

  useEffect(() => {
    const handleQuotaUpdated = () => {
      fetchQuota();
    };
    window.addEventListener("quotaUpdated", handleQuotaUpdated);
    return () => {
      window.removeEventListener("quotaUpdated", handleQuotaUpdated);
    };
  }, [fetchQuota]);

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
              alert(`${plan.toUpperCase()}プランのご購読手続きが完了しました（シミュレーション）`);
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
              alert(`追加ダウンロード容量（${Number(amount).toLocaleString()}行）の購入が完了しました（シミュレーション）`);
              window.location.href = "/dashboard";
            }
          } catch (e) {
            console.error("Failed to trigger simulated webhook for pack", e);
          }
        };
        triggerSimulatedPackWebhook();
      } else {
        alert("ご購読手続きを受け付けました。ダッシュボードに反映されるまで最大数分かかる場合があります。");
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
        alert("サブスクリプションを解約しました。FREEプランにダウングレードされました。");
        setShowCancelModal(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "解約処理に失敗しました。");
      }
    } catch (e) {
      console.error(e);
      alert("通信エラーが発生しました。");
    } finally {
      setCancellingSub(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
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
  }, [savedCompanies, mounted]);

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // If not logged in, show beautiful registration required gate
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto gap-6 py-20">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight mb-2">
              ABMダッシュボードは会員専用機能です
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              無料会員登録をしていただくと、気になる企業をブックマークする「マイリスト」や、案件化プロセスを管理する「かんばん営業管理ボード」をご利用いただけます。
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3 font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg shadow-primary/15 transition-all"
            >
              無料会員登録 (10秒)
            </button>
            <Link
              href="/search"
              className="px-6 py-3 font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              企業検索に戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isPro = user?.role === "pro" || user?.role === "business" || user?.role === "enterprise";

  // Quota plan metadata for display
  const PLAN_INFO = {
    free:       { label: "FREEプラン",       quota: "20行/日",    nextPlan: "pro",        nextPrice: "¥2,900", nextLabel: "PROプランにアップグレード" },
    pro:        { label: "PROプラン",         quota: "2,000行/月", nextPlan: "business",   nextPrice: "¥9,800", nextLabel: "BUSINESSプランにアップグレード" },
    business:   { label: "BUSINESSプラン",   quota: "10,000行/月",nextPlan: "enterprise", nextPrice: "¥29,000",nextLabel: "ENTERPRISEプランにアップグレード" },
    enterprise: { label: "ENTERPRISEプラン", quota: "40,000行/月",nextPlan: null,         nextPrice: null,     nextLabel: null },
    trial:      { label: "TRIALプラン",      quota: "10行",      nextPlan: "pro",        nextPrice: "¥2,900", nextLabel: "PROプランにアップグレード" },
  };
  const currentPlanInfo = PLAN_INFO[user?.role as keyof typeof PLAN_INFO] || PLAN_INFO.free;

  // CSV Exporter logic — quota-aware
  const handleCSVDownload = async () => {
    if (quota?.subscription_status === 'suspended') {
      alert("アカウントが一時停止されているため、エクスポートを実行できません。");
      return;
    }
    if (companies.length === 0) {
      alert("マイリストが空です。企業を検索して保存してください。");
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
      alert("残容量の確認に失敗しました。再試行してください。");
    } finally {
      setCsvExporting(false);
    }
  };

  // Execute the actual CSV download + quota deduction
  const executeCSVDownload = async () => {
    if (quota?.subscription_status === 'suspended') {
      alert("アカウントが一時停止されているため、エクスポートを実行できません。");
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
        "法人番号", "企業名", "郵便番号", "都道府県", "電話番号",
        "FAX番号", "ホームページ", "従業員数", "資本金", "事業概要",
        ...(isPro ? ["メールアドレス"] : []),
        "営業ステージ",
      ];

      const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

      const rows = companies.map(c => [
        c.corporate_number,
        c.company_name,
        c.postal_code || "",
        c.prefecture_name || "",
        c.phone_number || "",
        c.fax_number || "",
        c.website_url || "",
        c.employee_count ? `${c.employee_count}名` : "",
        c.capital_amount ? `${Math.round(c.capital_amount / 10000)}万円` : "",
        c.jigyo_shumoku || "",
        ...(isPro ? [c.email_address || ""] : []),
        kanbanStages[c.corporate_number] || "未連絡",
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
      alert(`エクスポートに失敗しました: ${e.message || "再試行してください。"}`);
    } finally {
      setCsvExporting(false);
    }
  };

  // Kanban logic
  const stages: KanbanStage[] = ["未連絡", "連絡済み", "商談中", "成約"];
  
  const getStageColor = (stage: KanbanStage) => {
    switch (stage) {
      case "未連絡": return "border-l-slate-400 bg-slate-50/50 dark:bg-slate-800/10";
      case "連絡済み": return "border-l-blue-400 bg-blue-50/20 dark:bg-blue-950/5";
      case "商談中": return "border-l-amber-400 bg-amber-50/20 dark:bg-amber-950/5";
      case "成約": return "border-l-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/5";
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />

      {/* Main ABM Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        

        {/* Dashboard Status Banner */}
        <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />
          
          <div className="flex flex-col gap-2 relative">
            <span className="text-[10px] font-bold text-primary dark:text-secondary uppercase tracking-wider block">
              ABM SALES DASHBOARD
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {user?.name} 様の営業管理ボード
            </h1>
            <p className="text-xs text-slate-400">
              マイリスト保存件数: <strong className="text-slate-850 dark:text-slate-200 font-bold">{savedCompanies.length}社</strong>
            </p>
          </div>

          {/* Right Section: Quota & Download Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 relative shrink-0 w-full sm:w-auto">
            {/* Subscription & Quota Group */}
            <div className="flex flex-col gap-2 w-full sm:w-[290px] shrink-0">
              {quota ? (
                <div className="flex flex-col gap-2.5 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/50 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {currentPlanInfo.label}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                      残り {quota.remaining.toLocaleString()} 行
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (quota.monthly_base_used / quota.monthly_base_allowance) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>
                        {quota.plan === "free" ? "本日使用量" : "月間枠使用量"}: {quota.monthly_base_used.toLocaleString()} / {quota.monthly_base_allowance.toLocaleString()} 行
                      </span>
                      {quota.purchased_add_on_balance > 0 && (
                        <span className="text-secondary font-bold">
                          追加容量: +{quota.purchased_add_on_balance.toLocaleString()} 行
                          {quota.plan === "free" && " (凍結中)"}
                        </span>
                      )}
                    </div>
                  </div>

                  {quota.last_reset_date && (
                    <div className="border-t border-emerald-250/30 dark:border-emerald-900/30 pt-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium flex justify-between items-center tracking-tight">
                      <span>{getSubscriptionPeriodText(quota.last_reset_date, quota.plan)}</span>
                      {quota.plan !== "free" && (
                        quota.subscription_status === "active" ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-extrabold tracking-wider">自動更新</span>
                        ) : quota.subscription_status === "canceled" ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[8px] font-extrabold tracking-wider">解約予定</span>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/50 rounded-2xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <div className="text-left">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase block">{currentPlanInfo.label} 有効</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">CSV出力枠: {currentPlanInfo.quota}</span>
                  </div>
                </div>
              )}

              {/* Plan Action Buttons (Equal width block) */}
              {isPro ? (
                <div className="flex items-center gap-2 w-full">
                  <Link
                    href="/pricing"
                    className="flex-1 py-2 text-[10px] font-extrabold text-center text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-md shadow-amber-600/10 flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap"
                  >
                    <Sparkles className="w-3 h-3" />
                    プランを変更
                  </Link>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 py-2 text-[10px] font-extrabold text-center border border-rose-200 hover:bg-rose-600 hover:text-white dark:border-rose-900/40 dark:hover:bg-rose-900/30 text-rose-600 rounded-xl transition-all active:scale-95 whitespace-nowrap"
                  >
                    プランを解約
                  </button>
                </div>
              ) : (
                <Link
                  href="/pricing"
                  className="w-full py-2 text-[10px] font-extrabold text-center text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-md shadow-amber-600/10 flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3" />
                  プランをアップグレード
                </Link>
              )}
            </div>



          </div>
        </section>

        {quota?.subscription_status === 'suspended' && (
          <div className="bg-rose-50 border border-rose-200/60 dark:bg-rose-955/20 dark:border-rose-900/30 rounded-2xl p-4 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 animate-in fade-in duration-300">
            <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-extrabold text-[11px] uppercase tracking-wider block">アカウントが一時停止されています</span>
              <p className="leading-relaxed">
                お支払いの問題またはポリシー規約への違反が検出されたため、このアカウントは一時停止されています。データの検索やダウンロードなどの機能が制限されています。エラーと思われる場合は、サポート（<a href="mailto:trungkim8694@gmail.com" className="underline hover:text-rose-600 dark:hover:text-rose-400 font-bold">trungkim8694@gmail.com</a>）までご連絡ください。
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Tabs Selector */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 text-sm font-bold gap-y-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-3 px-6 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "list"
                ? "border-primary text-primary dark:border-secondary dark:text-secondary"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <ListFilter className="w-4.5 h-4.5" />
            マイリスト ({companies.length})
          </button>
          <button
            onClick={() => setActiveTab("kanban")}
            className={`pb-3 px-6 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "kanban"
                ? "border-primary text-primary dark:border-secondary dark:text-secondary"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Kanban className="w-4.5 h-4.5" />
            かんばんボード営業管理
          </button>
          <button
            onClick={() => setActiveTab("exports")}
            className={`pb-3 px-6 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "exports"
                ? "border-primary text-primary dark:border-secondary dark:text-secondary"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Download className="w-4.5 h-4.5" />
            エクスポート履歴
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-3 px-6 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "payments"
                ? "border-primary text-primary dark:border-secondary dark:text-secondary"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            購入履歴・領収書
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-6 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "settings"
                ? "border-primary text-primary dark:border-secondary dark:text-secondary"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            領収書情報設定
          </button>
          <button
            onClick={() => setActiveTab("developer")}
            className={`pb-3 px-6 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "developer"
                ? "border-primary text-primary dark:border-secondary dark:text-secondary"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Terminal className="w-4.5 h-4.5" />
            API連携 (API Keys)
          </button>
        </div>

        {/* Tab Contents: MyList */}
        {/* CSV Confirm Modal */}
        {showCSVConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-250">
              <button
                onClick={() => setShowCSVConfirm(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-primary" />
                </div>

                <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">
                  マイリストCSVエクスポートの確認
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 leading-relaxed">
                  マイリストの <strong className="text-slate-800 dark:text-slate-200">{companies.length}社</strong> の企業データをCSVに出力します。
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  この操作により、アカウントから <strong className="text-slate-800 dark:text-slate-200">{companies.length}行分</strong> のエクスポート容量が差し引かれます。
                </p>

                {csvQuota && (
                  <div className="mb-4 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2">
                    <span>現在の残容量: <strong className="text-slate-800 dark:text-slate-200">{csvQuota.remaining.toLocaleString()}行</strong></span>
                    <span className="text-slate-300 dark:text-slate-600">→</span>
                    <span>エクスポート後: <strong className="text-primary dark:text-secondary">{(csvQuota.remaining - companies.length).toLocaleString()}行</strong></span>
                  </div>
                )}

                {!isPro && (
                  <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 font-medium text-left">
                    ※ FREEプランではメールアドレス列は含まれません。Proプランにアップグレードすると全列が出力されます。
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCSVConfirm(false)}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:border-slate-700 rounded-xl transition-all"
                  >
                    キャンセル
                  </button>
                  <button
                    disabled={quota?.subscription_status === 'suspended'}
                    onClick={executeCSVDownload}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md shadow-primary/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quota?.subscription_status === 'suspended' ? "ブロック中" : "エクスポート実行"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <span className="text-xs text-slate-400">リストを同期中...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <Building2 className="w-12 h-12 text-slate-300" />
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">保存された企業はありません</h4>
                  <p className="text-xs max-w-sm mx-auto leading-relaxed">
                    データベース検索を利用してアプローチしたい企業を探し, 「マイリストに保存」ボタンを押してください。
                  </p>
                </div>
                <Link
                  href="/search"
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm"
                >
                  企業を検索する
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                {/* Action Header at the top of the My List card */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-800/10">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">マイリスト</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 px-2.5 py-1 rounded-full font-mono">
                      {companies.length}社
                    </span>
                  </div>
                  
                  <button
                    onClick={handleCSVDownload}
                    disabled={csvExporting || companies.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap"
                  >
                    {csvExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{csvExporting ? "確認中..." : "マイリストダウンロード"}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                      <th className="py-4 px-6">企業名</th>
                      <th className="py-4 px-4">代表電話 / 所在地</th>
                      <th className="py-4 px-4">規模 (従業員数 / 資本金)</th>
                      <th className="py-4 px-4">営業進捗ステータス</th>
                      <th className="py-4 px-6 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {companies.map((comp) => {
                      const stage = kanbanStages[comp.corporate_number] || "未連絡";
                      return (
                        <tr 
                          key={comp.corporate_number}
                          className="hover:bg-slate-50/50 dark:hover:bg-[#151B22] transition-colors"
                        >
                          {/* Name & JSIC */}
                          <td className="py-4.5 px-6">
                            <div className="flex flex-col gap-1 max-w-[280px]">
                              <Link 
                                href={`/company/${comp.corporate_number}`}
                                className="font-bold text-slate-900 hover:text-primary dark:text-white dark:hover:text-secondary text-sm transition-colors truncate block"
                              >
                                {comp.company_name}
                              </Link>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {comp.jigyo_shumoku?.split(",")[0].replace(' (AI確認済)', '') || "サービス"}
                              </span>
                            </div>
                          </td>

                          {/* Phone / Location */}
                          <td className="py-4.5 px-4 text-slate-600 dark:text-slate-300">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold flex items-center gap-1">
                                <Phone className="w-3 h-3 text-primary shrink-0" />
                                {comp.phone_number || "未登録"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {comp.prefecture_name || ""}
                              </span>
                            </div>
                          </td>

                          {/* Scale */}
                          <td className="py-4.5 px-4 text-slate-700 dark:text-slate-300">
                            <div className="flex flex-col gap-1 font-mono">
                              <span>
                                {comp.employee_count ? `${comp.employee_count}名` : "未登録"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {comp.capital_amount ? `${Math.round(comp.capital_amount / 10000).toLocaleString()}万円` : "未登録"}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4.5 px-4">
                            <select
                              value={stage}
                              onChange={(e) => updateKanbanStage(comp.corporate_number, e.target.value as KanbanStage)}
                              className={`text-[10px] font-bold px-2.5 py-1.5 border rounded-lg focus:outline-none ${
                                stage === "未連絡" 
                                  ? "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                  : stage === "連絡済み"
                                  ? "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300"
                                  : stage === "商談中"
                                  ? "bg-amber-50 border-amber-250 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300"
                              }`}
                            >
                              {stages.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-4.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <Link
                                href={`/company/${comp.corporate_number}`}
                                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all active:scale-95"
                                title="プロフィール詳細"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => toggleSaveCompany(comp.corporate_number)}
                                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:hover:bg-rose-955/20 dark:hover:border-rose-900/40 dark:hover:text-rose-400 text-slate-400 transition-all active:scale-95"
                                title="マイリストから削除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
            )}
          </section>
        )}

        {/* Tab Contents: Export History */}
        {activeTab === "exports" && (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-200/60 dark:bg-amber-955/20 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-in fade-in duration-300">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-500 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-extrabold text-[11px] uppercase tracking-wider block">ダウンロード有効期限に関するご注意</span>
                <p className="leading-relaxed">
                  作成されたエクスポートファイル（ZIP）の<strong>保存期間は7日間</strong>です。7日を経過するとデータはサーバーから自動的に削除され、ダウンロードできなくなりますので、お早めにローカルのパソコン等へ保存してください。
                </p>
              </div>
            </div>
            
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {loadingExports ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  <span className="text-xs text-slate-400">履歴を読み込み中...</span>
                </div>
              ) : exportJobs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Download className="w-12 h-12 text-slate-300" />
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">エクスポート履歴はありません</h4>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed">
                      企業検索からCSV出力を実行すると、ここにダウンロード履歴が追加されます。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                        <th className="py-4 px-6">タスクID / 作成日時</th>
                        <th className="py-4 px-4">ダウンロード期限 (7日間)</th>
                        <th className="py-4 px-4">適用フィルター</th>
                        <th className="py-4 px-4">取得件数</th>
                        <th className="py-4 px-4">ステータス</th>
                        <th className="py-4 px-6 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
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

                        const formattedExpiryDate = expiryDate.toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        const diffMs = expiryDate.getTime() - now.getTime();
                        const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                        
                        return (
                          <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-[#151B22] transition-colors">
                            <td className="py-4.5 px-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{job.id}</span>
                                <span className="text-[10px] text-slate-400">{formattedDate} (JST)</span>
                              </div>
                            </td>
                            <td className="py-4.5 px-4 text-xs">
                              {job.status === "completed" ? (
                                isExpired ? (
                                  <span className="text-rose-500 font-semibold">期限切れ (削除済み)</span>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {formattedExpiryDate}
                                    </span>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                      残り {remainingDays} 日
                                    </span>
                                  </div>
                                )
                              ) : (
                                <span className="text-slate-400">---</span>
                              )}
                            </td>
                            <td className="py-4.5 px-4 max-w-[280px]">
                              {renderFilterBadges(job.filters_json) || (
                                <span className="text-[10px] text-slate-400 italic">なし</span>
                              )}
                            </td>
                            <td className="py-4.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {job.records_count.toLocaleString()} 行
                            </td>
                            <td className="py-4.5 px-4">
                              <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${
                                job.status === "completed"
                                  ? isExpired
                                    ? "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800/20 dark:border-slate-800"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300"
                                  : job.status === "processing"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300"
                                  : job.status === "pending"
                                  ? "bg-slate-50 text-slate-655 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                  : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-955/20 dark:border-rose-900/40 dark:text-rose-400"
                              }`}>
                                {job.status === "completed"
                                  ? isExpired
                                    ? "有効期限切れ (削除済み)"
                                    : "完了"
                                  : job.status === "processing"
                                  ? "処理中..."
                                  : job.status === "pending"
                                  ? "待機中"
                                  : "失敗"}
                              </span>
                            </td>
                            <td className="py-4.5 px-6 text-right">
                              {job.status === "completed" ? (
                                isExpired ? (
                                  <span className="text-[10px] text-slate-400 italic font-medium">
                                    7日経過したため削除されました
                                  </span>
                                ) : (
                                  <a
                                    href={`/api/export/download?id=${job.id}&email=${encodeURIComponent(user?.email || "")}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>ZIPをダウンロード</span>
                                  </a>
                                )
                              ) : job.status === "failed" ? (
                                <span className="text-[10px] text-rose-500 font-medium max-w-[200px] truncate block" title={job.error_message || ""}>
                                  {job.error_message || "エラーが発生しました"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  自動で更新されます
                                </span>
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

        {/* Tab Contents: Purchase History */}
        {activeTab === "payments" && (
          <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {loadingPayments ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <span className="text-xs text-slate-400">購入履歴を読み込み中...</span>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-12 h-12 text-slate-300 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">購入履歴はありません</h4>
                  <p className="text-xs max-w-sm mx-auto leading-relaxed">
                    Stripeで追加 of CSVダウンロード容量をご購入いただくと、ここに履歴とインボイス領収書が表示されます。
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                      <th className="py-4 px-6">取引ID / 決済日時</th>
                      <th className="py-4 px-4">購入プラン</th>
                      <th className="py-4 px-4">付与容量</th>
                      <th className="py-4 px-4">決済金額 (税込)</th>
                      <th className="py-4 px-6 text-right">インボイス領収書</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
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
                        <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-[#151B22] transition-colors">
                          <td className="py-4.5 px-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px]" title={pay.id}>{pay.id}</span>
                              <span className="text-[10px] text-slate-400">{formattedDate} (JST)</span>
                            </div>
                          </td>
                          <td className="py-4.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {pay.pack_id === "10k" ? "CSV 10k行追加パック" :
                             pay.pack_id === "50k" ? "CSV 50k行追加パック" :
                             pay.pack_id === "100k" ? "CSV 100k行追加パック" :
                             pay.pack_id === "pro" ? "PROプラン (月額)" :
                             pay.pack_id === "business" ? "BUSINESSプラン (月額)" :
                             pay.pack_id === "enterprise" ? "ENTERPRISEプラン (月額)" :
                             "カスタムパック"}
                          </td>
                          <td className="py-4.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                            +{pay.lines_added.toLocaleString()} 行
                          </td>
                          <td className="py-4.5 px-4 font-mono font-black text-primary dark:text-secondary text-sm">
                            ¥{pay.amount_jpy.toLocaleString()}
                          </td>
                          <td className="py-4.5 px-6 text-right">
                            {pay.invoice_url ? (
                              <a
                                href={`/api/stripe/invoice?id=${pay.id}&email=${encodeURIComponent(user?.email || "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition-colors shadow-sm"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>領収書を表示・印刷</span>
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

        {/* Tab Contents: Kanban Board */}
        {activeTab === "kanban" && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {stages.map((stage) => {
              // Filter companies belonging to this stage
              const stageCompanies = companies.filter(
                (comp) => (kanbanStages[comp.corporate_number] || "未連絡") === stage
              );

              return (
                <div 
                  key={stage}
                  className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        stage === "未連絡" 
                          ? "bg-slate-400" 
                          : stage === "連絡済み" 
                          ? "bg-blue-400" 
                          : stage === "商談中" 
                          ? "bg-amber-400" 
                          : "bg-emerald-400"
                      }`} />
                      {stage}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450 px-2 py-0.5 rounded-full">
                      {stageCompanies.length}社
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div className="flex flex-col gap-3 min-h-[150px]">
                    {stageCompanies.length === 0 ? (
                      <div className="py-10 text-center text-[10px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                        対象企業はありません
                      </div>
                    ) : (
                      stageCompanies.map((comp) => (
                        <div
                          key={comp.corporate_number}
                          className={`p-4 rounded-2xl border-l-3 border border-slate-200 hover:border-slate-300 dark:border-slate-800/80 dark:hover:border-slate-700 transition-all shadow-sm ${getStageColor(stage)} flex flex-col gap-3 group`}
                        >
                          <div className="flex flex-col gap-1.5">
                            <Link 
                              href={`/company/${comp.corporate_number}`}
                              className="font-black text-xs text-slate-800 hover:text-primary dark:text-slate-100 dark:hover:text-secondary tracking-tight line-clamp-2 leading-relaxed transition-colors block"
                            >
                              {comp.company_name}
                            </Link>
                            <span className="text-[9px] text-slate-400 line-clamp-1">
                              {comp.jigyo_shumoku?.split(",")[0].replace(' (AI確認済)', '') || "サービス"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] border-t border-slate-100/50 dark:border-slate-800/40 pt-2 text-slate-500">
                            <span className="font-semibold text-slate-400">
                              {comp.prefecture_name || "地域未設定"}
                            </span>
                            
                            {/* Fast Column Navigation Buttons */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => moveCard(comp.corporate_number, "left")}
                                disabled={stage === "未連絡"}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="左に移動"
                              >
                                <MoveLeft className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => moveCard(comp.corporate_number, "right")}
                                disabled={stage === "成約"}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="右に移動"
                              >
                                <MoveRight className="w-3 h-3" />
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

        {/* Tab Contents: Settings */}
        {activeTab === "settings" && (
          <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm w-full flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/3 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Settings className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  領収書・インボイス設定
                </h2>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  購入履歴からダウンロードする領収書に記載する宛先情報を設定します
                </span>
              </div>
            </div>

            {loadingBilling ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <span className="text-xs text-slate-400">設定を読み込み中...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveBilling} className="flex flex-col gap-5 text-xs">
                {/* Billing Name */}
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-700 dark:text-slate-350">
                    宛名 / 会社名
                  </label>
                  <input
                    type="text"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    placeholder="例: TQC株式会社, ○○ 個人事業主"
                    className="px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:outline-none focus:border-primary dark:focus:border-secondary transition-all"
                  />
                  <span className="text-[10px] text-slate-400">
                    空欄の場合はご登録のメールアドレス（{user?.email}）が宛名として使用されます。
                  </span>
                </div>

                {/* Postal Code & Address */}
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-700 dark:text-slate-350">
                    会社所在地 / 住所
                  </label>
                  <textarea
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="例: 〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F"
                    rows={3}
                    className="px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:outline-none focus:border-primary dark:focus:border-secondary transition-all resize-none"
                  />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-700 dark:text-slate-350">
                    電話番号
                  </label>
                  <input
                    type="text"
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    placeholder="例: 03-6907-1219"
                    className="px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:outline-none focus:border-primary dark:focus:border-secondary transition-all"
                  />
                </div>

                {/* Tax ID */}
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-700 dark:text-slate-350">
                    適格請求書発行事業者登録番号 (インボイス登録番号)
                  </label>
                  <input
                    type="text"
                    value={billingTaxId}
                    onChange={(e) => setBillingTaxId(e.target.value)}
                    placeholder="例: T1234567890123"
                    className="px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:outline-none focus:border-primary dark:focus:border-secondary transition-all font-mono"
                  />
                </div>

                {/* Company Logo Upload */}
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                    会社ロゴ (任意)
                  </label>
                  <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl">
                    {logoUrl ? (
                      <div className="relative w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 shrink-0 animate-in fade-in zoom-in duration-200">
                        <img
                          src={logoUrl}
                          alt="Company Logo Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 shadow-md transition-all hover:scale-110"
                          title="ロゴを削除"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                    
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors w-fit ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="w-3.5 h-3.5 animate-bounce" />
                        {uploadingLogo ? "アップロード中..." : "ロゴを選択"}
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">
                        ※ PNG, JPG, SVG形式 (推奨: 500KB以下, 背景透過PNG/SVG)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingBilling}
                    className="px-6 py-3 font-bold text-white bg-primary hover:bg-primary-hover disabled:bg-slate-350 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    {savingBilling ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                        <span>保存中...</span>
                      </>
                    ) : (
                      "設定を保存する"
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Tab Contents: Developer API Settings */}
        {activeTab === "developer" && (
          <section className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
            {/* Tab Header */}
            <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/3 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Terminal className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    API連携・APIキー設定
                  </h2>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    外部システム（CRM、SFA、社内データベース等）と連携するためのAPIキーの生成と管理を行います
                  </span>
                </div>
              </div>

              {/* Check Permissions */}
              {user?.role !== "business" && user?.role !== "enterprise" ? (
                // Premium CTA for Free/Pro
                <div className="py-8 flex flex-col items-center max-w-xl mx-auto text-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shadow-md">
                    <Sparkles className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
                      API連携機能はBUSINESSプラン以上でご利用いただけます
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                      APIを導入することで、会社データベースの検索やシグナル（intent data）の取得を自動化できます。
                      HubSpotやSalesforceなどのCRMにリアルタイムにデータをインポートし、営業効率を最大化しましょう。
                    </p>
                  </div>

                  {/* Feature highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mt-2">
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">① リアルタイム同期</span>
                      <p className="text-[10px] text-slate-400">CSVの手動ダウンロードとインポート作業が不要になり、完全に自動化されます。</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">② 開発者向けリファレンス</span>
                      <p className="text-[10px] text-slate-400">cURL、Python、Node.jsのコード例があり、数行のコードですぐに接続可能です。</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">③ 柔軟なAPIクエリ</span>
                      <p className="text-[10px] text-slate-400">都道府県、資本金、従業員数、企業シグナルなど、多彩な条件で絞り込めます。</p>
                    </div>
                  </div>

                  <Link
                    href="/pricing"
                    className="px-8 py-3 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-600/10 hover:shadow-amber-600/20 active:scale-95 transition-all text-xs flex items-center gap-2 mt-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    BUSINESSプランにアップグレード
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
                      className="px-5 py-2.5 font-bold text-white bg-primary hover:bg-primary-hover disabled:bg-slate-350 rounded-xl text-xs shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
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
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <span className="text-xs font-black text-amber-800 dark:text-amber-400 block mb-1">【重要】APIキーが生成されました。必ずコピーしてください</span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            セキュリティ上の理由から、このAPIキーは**今この画面を離れるuと二度と表示されません**。
                            安全な場所にコピーして保存してください。
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                        <code className="text-xs font-mono font-bold text-primary dark:text-secondary break-all flex-1 select-all">
                          {newRawKey}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(newRawKey);
                            setCopiedKeyId("new");
                            setTimeout(() => setCopiedKeyId(null), 2000);
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
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
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold w-fit self-end transition-colors"
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
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-[10px] text-slate-400">APIキーを読み込み中...</span>
                      </div>
                    ) : apiKeys.length === 0 ? (
                      <div className="py-8 text-center border border-dashed border-slate-350 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/5 text-slate-400 text-xs">
                        発行済みのAPIキーはありません。「APIキーを発行する」ボタンをクリックして開始してください。
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/10">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
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
                                  <td className="px-4 py-3 font-mono font-bold text-slate-850 dark:text-slate-200">
                                    kigyou_live_...{key.api_key_preview.replace(/^\.\.\./, '')}
                                  </td>
                                  <td className="px-4 py-3">
                                    {key.status === "active" ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-extrabold uppercase">有効</span>
                                    ) : (
                                      <div className="flex flex-col gap-0.5 items-start">
                                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[8px] font-extrabold uppercase">無効化済み</span>
                                        {key.revoked_reason && (
                                          <span className="text-[9px] text-rose-500 font-bold max-w-[150px] truncate block" title={key.revoked_reason}>
                                            理由: {key.revoked_reason}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-slate-400 font-mono">{createdJst}</td>
                                  <td className="px-4 py-3 text-slate-400 font-mono">{usedJst}</td>
                                  <td className="px-4 py-3 text-slate-400 font-mono">{key.last_ip || "-"}</td>
                                  <td className="px-4 py-3 text-right">
                                    {key.status === "active" && (
                                      <button
                                        onClick={() => handleRevokeApiKey(key.id)}
                                        className="px-2.5 py-1 text-[10px] font-bold text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white dark:border-rose-900/40 dark:hover:bg-rose-900/30 rounded-lg transition-all active:scale-95"
                                      >
                                        無効化 (Revoke)
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

                  {/* API Quick Reference Documentation */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 flex flex-col gap-4">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-primary" />
                      API クイックリファレンス
                    </span>

                    <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 font-mono text-xs flex flex-col gap-4 overflow-x-auto shadow-inner">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">API Base URL</span>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-primary dark:text-secondary font-bold font-mono">
                          {typeof window !== "undefined" ? window.location.origin : "https://kigyou-list.jp"}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">Authorization Header</span>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-350">
                          Authorization: Bearer <span className="text-primary">&lt;YOUR_API_KEY&gt;</span>
                        </div>
                      </div>

                      {/* API Endpoints */}
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Endpoints</span>

                        {/* Quota */}
                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-900/60 border border-blue-800 text-blue-300 text-[8px] font-black rounded uppercase">GET</span>
                            <span className="font-bold font-mono text-[11px]">/api/v1/quota</span>
                            <span className="text-[10px] text-slate-400 font-sans ml-auto">残りクォータの確認</span>
                          </div>
                        </div>

                        {/* Companies */}
                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-900/60 border border-blue-800 text-blue-300 text-[8px] font-black rounded uppercase">GET</span>
                            <span className="font-bold font-mono text-[11px]">/api/v1/companies</span>
                            <span className="text-[10px] text-slate-400 font-sans ml-auto">企業情報の条件検索 (1回の取得上限: 100件)</span>
                          </div>
                          <div className="text-[10px] text-slate-400 border-t border-slate-900 pt-2 font-sans flex flex-col gap-1.5 leading-relaxed">
                            <span className="font-bold text-slate-300">利用可能なクエリパラメータ:</span>
                            <ul className="list-disc pl-4 flex flex-col gap-0.5">
                              <li><code>keyword</code>: 企業名や事業内容のあいまい検索</li>
                              <li><code>prefecture_code</code>: 都道府県コード (例: 13=東京都)</li>
                              <li><code>industry_code</code>: 産業分類コード</li>
                              <li><code>has_email</code>, <code>has_phone</code>, <code>has_website</code>: &quot;true&quot; で絞り込み</li>
                              <li><code>has_hiring</code>, <code>has_subsidy</code>, <code>has_bidding</code>: &quot;true&quot; でシグナルありに絞り込み</li>
                              <li><code>limit</code>: 取得件数 (1〜100, デフォルト20)</li>
                              <li><code>offset</code>: 取得オフセット値 (ページネーション用)</li>
                            </ul>
                          </div>
                        </div>

                        {/* Signals */}
                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-900/60 border border-blue-800 text-blue-300 text-[8px] font-black rounded uppercase">GET</span>
                            <span className="font-bold font-mono text-[11px]">/api/v1/signals</span>
                            <span className="text-[10px] text-slate-400 font-sans ml-auto">企業シグナル（補助金、求人など）の検索</span>
                          </div>
                          <div className="text-[10px] text-slate-400 border-t border-slate-900 pt-2 font-sans flex flex-col gap-1.5 leading-relaxed">
                            <span className="font-bold text-slate-300">利用可能なクエリパラメータ:</span>
                            <ul className="list-disc pl-4 flex flex-col gap-0.5">
                              <li><code>corporate_number</code>: 特定企業(13桁法人番号)のシグナル取得</li>
                              <li><code>signal_type</code>: シグナル種別（求人中, 補助金, 特許, 調達, 表彰, 届出・認定）</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Code Sample */}
                      <div className="border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">cURL 接続例</span>
                        <pre className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] select-all font-mono leading-relaxed text-emerald-400">
                          {`curl -X GET "${typeof window !== "undefined" ? window.location.origin : "https://kigyou-list.jp"}/api/v1/companies?prefecture_code=13&limit=5" \\
  -H "Authorization: Bearer <YOUR_API_KEY>"`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      <Footer />

      {/* Upgrade Upsell Modal - shows when free user clicks CSV download */}
      {showUpsellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowUpsellModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                CSV出力は有料プラン限定です
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                現在{currentPlanInfo.label}（{currentPlanInfo.quota}）です。プランアップグレードでCSV出力枠を拡張し、営業リストを大量入手できます。
              </p>
            </div>
            
            <div className="my-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-left text-xs border border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
              <div className="flex flex-col gap-1">
                {[
                  { plan: "PROプラン",        quota: "2,000行/月", price: "¥2,900" },
                  { plan: "BUSINESSプラン",    quota: "10,000行/月",price: "¥9,800" },
                  { plan: "ENTERPRISEプラン", quota: "40,000行/月",price: "¥29,000" },
                ].map((p) => (
                  <div key={p.plan} className="flex items-center justify-between font-bold py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-700 dark:text-slate-300">{p.plan}</span>
                    <div className="text-right">
                      <span className="text-primary dark:text-secondary">{p.price}/月</span>
                      <span className="text-[9px] text-slate-400 block">{p.quota}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                ※ キャンペーン期間中はご解約まで割引価格が継続適用されます。
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/pricing"
                className="w-full py-3 text-xs font-bold text-center text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-colors block"
              >
                料金プランを見る
              </Link>
              <button
                onClick={() => setShowUpsellModal(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/40 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                本当にプランを解約しますか？
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                解約すると、即時に {currentPlanInfo.label} から FREEプラン（20行/日）へダウングレードされます。
              </p>
            </div>

            {/* Quota Warning Message */}
            {quota && (
              <div className="bg-rose-50 border border-rose-100 dark:bg-rose-955/20 dark:border-rose-900/30 rounded-2xl p-4 text-left flex flex-col gap-2 animate-in fade-in duration-300">
                <div className="flex gap-2 items-start text-xs font-bold text-rose-600 dark:text-rose-455">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>重要：残りの容量に関する警告</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {Math.max(0, quota.monthly_base_allowance - quota.monthly_base_used) > 0 ? (
                    <>
                      今月の基本残容量 <strong className="text-rose-600 dark:text-rose-400">{(quota.monthly_base_allowance - quota.monthly_base_used).toLocaleString()} 行</strong> は<strong>即時にリセットされ消滅します</strong>。解約前にダウンロードを実行することをお勧めします。
                    </>
                  ) : (
                    "今月の基本枠はすべて消費されています。"
                  )}
                </p>
                {quota.purchased_add_on_balance > 0 && (
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-1.5 mt-0.5 leading-relaxed">
                    ※ 追加容量やスポット購入枠（残り {quota.purchased_add_on_balance.toLocaleString()} 行）は、解約しても消失しませんが、FREEプランの間は一時的に凍結（使用不可）されます。有料プランへ再契約することで、再び制限なしでご利用いただけるようになります。
                  </p>
                )}
              </div>
            )}
            
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleCancelSubscription}
                disabled={cancellingSub}
                className="w-full py-3 text-xs font-bold text-center text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-450 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                {cancellingSub ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    解約処理中...
                  </>
                ) : (
                  "解約する"
                )}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancellingSub}
                className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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

function renderFilterBadges(filtersJson: string | null) {
  if (!filtersJson) return null;
  try {
    const filters = JSON.parse(filtersJson);
    const badges: { text: string; type: "keyword" | "location" | "industry" | "scale" | "signal" }[] = [];

    // Keyword
    if (filters.keyword) {
      badges.push({ text: `キーワード: ${filters.keyword}`, type: "keyword" });
    }

    // Prefecture & City
    if (filters.prefecture_code) {
      const prefName = PREFECTURE_MAP[filters.prefecture_code] || filters.prefecture_code;
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
      const indName = INDUSTRY_MAP[filters.industry_code] || filters.industry_code;
      badges.push({ text: indName, type: "industry" });
    }

    // Employees
    if (filters.min_employees !== undefined || filters.max_employees !== undefined) {
      let text = "従業員数: ";
      if (filters.min_employees !== undefined && filters.max_employees !== undefined) {
        text += `${filters.min_employees}〜${filters.max_employees}名`;
      } else if (filters.min_employees !== undefined) {
        text += `${filters.min_employees}名以上`;
      } else {
        text += `${filters.max_employees}名以下`;
      }
      badges.push({ text, type: "scale" });
    }

    // Capital
    if (filters.min_capital !== undefined || filters.max_capital !== undefined) {
      let text = "資本金: ";
      if (filters.min_capital !== undefined && filters.max_capital !== undefined) {
        text += `${filters.min_capital}〜${filters.max_capital}万円`;
      } else if (filters.min_capital !== undefined) {
        text += `${filters.min_capital}万円以上`;
      } else {
        text += `${filters.max_capital}万円以下`;
      }
      badges.push({ text, type: "scale" });
    }

    // Sales
    if (filters.min_sales !== undefined || filters.max_sales !== undefined) {
      let text = "売上高: ";
      if (filters.min_sales !== undefined && filters.max_sales !== undefined) {
        text += `${filters.min_sales}〜${filters.max_sales}億円`;
      } else if (filters.min_sales !== undefined) {
        text += `${filters.min_sales}億円以上`;
      } else {
        text += `${filters.max_sales}億円以下`;
      }
      badges.push({ text, type: "scale" });
    }

    // Signals
    if (filters.has_hiring) badges.push({ text: "求人あり", type: "signal" });
    if (filters.has_subsidy) badges.push({ text: "助成金あり", type: "signal" });
    if (filters.has_bidding) badges.push({ text: "入札あり", type: "signal" });
    if (filters.has_award) badges.push({ text: "表彰あり", type: "signal" });
    if (filters.has_certification) badges.push({ text: "認証あり", type: "signal" });
    if (filters.has_patent) badges.push({ text: "特許・商標あり", type: "signal" });

    // Contact channels
    if (filters.has_email) badges.push({ text: "Emailあり", type: "signal" });
    if (filters.has_phone) badges.push({ text: "電話番号あり", type: "signal" });
    if (filters.has_website) badges.push({ text: "Websiteあり", type: "signal" });
    if (filters.has_fax) badges.push({ text: "FAXあり", type: "signal" });

    if (badges.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1.5 max-w-[320px]">
        {badges.map((badge, idx) => {
          let colorClass = "";
          switch (badge.type) {
            case "keyword":
              colorClass = "bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30";
              break;
            case "location":
              colorClass = "bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-200/50 dark:border-emerald-900/30";
              break;
            case "industry":
              colorClass = "bg-purple-50/50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30";
              break;
            case "scale":
              colorClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/50 dark:border-slate-850";
              break;
            case "signal":
              colorClass = "bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-250/50 dark:border-amber-900/30";
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
