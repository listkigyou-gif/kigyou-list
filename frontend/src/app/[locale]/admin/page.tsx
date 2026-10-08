"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { 
  ShieldAlert, ShieldCheck, RefreshCcw, Users, MessageSquareWarning, 
  CreditCard, History, Building2, Terminal, Database, Mail, 
  Send, Ticket, Download, LayoutDashboard, KeyRound, Loader2, Sparkles, ExternalLink
} from "lucide-react";

// Toast Provider
import { ToastProvider, useAdminToast } from "@/components/admin/AdminToast";
import { AdminPasscodeModal } from "@/components/admin/AdminPasscodeModal";

// Modular Tabs
import { OverviewTab } from "@/components/admin/tabs/OverviewTab";
import { InquiriesTab } from "@/components/admin/tabs/InquiriesTab";
import { UsersTab } from "@/components/admin/tabs/UsersTab";
import { AuditLogsTab } from "@/components/admin/tabs/AuditLogsTab";
import { PaymentsTab } from "@/components/admin/tabs/PaymentsTab";
import { CouponsTab } from "@/components/admin/tabs/CouponsTab";
import { ExportsTab } from "@/components/admin/tabs/ExportsTab";
import { ApiKeysTab } from "@/components/admin/tabs/ApiKeysTab";
import { BackupsTab } from "@/components/admin/tabs/BackupsTab";
import { PartnersTab } from "@/components/admin/tabs/PartnersTab";

// Existing Admin Tabs
import { MarketingTab } from "@/components/admin/MarketingTab";
import { ClaimsReviewTab } from "@/components/admin/ClaimsReviewTab";
import { FormCampaignsAdminTab } from "@/components/admin/FormCampaignsAdminTab";

export type AdminTab = 
  | "overview"
  | "inquiries"
  | "claims"
  | "formCampaigns"
  | "users"
  | "payments"
  | "coupons"
  | "marketing"
  | "exports"
  | "logs"
  | "apiKeys"
  | "backups"
  | "partners";

function AdminContent() {
  const { isLoggedIn, user, setAuthModalOpen } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useAdminToast();

  const [mounted, setMounted] = useState(false);
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Tab state synced with URL search params (?tab=overview)
  const tabFromQuery = (searchParams.get("tab") as AdminTab) || "overview";
  const [activeTab, setActiveTab] = useState<AdminTab>(tabFromQuery);

  // Pending counts for navigation badges
  const [pendingInquiries, setPendingInquiries] = useState<number>(0);
  const [pendingClaims, setPendingClaims] = useState<number>(0);
  const [pendingFormCampaigns, setPendingFormCampaigns] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const qTab = searchParams.get("tab") as AdminTab;
    if (qTab && qTab !== activeTab) {
      setActiveTab(qTab);
    }
  }, [searchParams]);

  const switchTab = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const getAdminHeaders = useCallback(() => {
    const secret = typeof window !== "undefined" ? localStorage.getItem("kigyou_admin_secret") || "" : "";
    return {
      "x-admin-email": user?.email || "",
      "x-admin-secret": secret,
    };
  }, [user?.email]);

  // Fetch pending badge counters across system
  const fetchBadgeCounts = useCallback(async () => {
    try {
      const headers = getAdminHeaders();
      const [resInq, resClaims, resCampaigns, resUsers] = await Promise.allSettled([
        fetch("/api/admin/inquiries", { headers }),
        fetch("/api/admin/claims?status=pending", { headers }),
        fetch("/api/admin/form-campaigns?status=pending_approval", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);

      if (resInq.status === "fulfilled" && resInq.value.ok) {
        const d = await resInq.value.json();
        const pending = (d.inquiries || []).filter((i: any) => i.status === "pending").length;
        setPendingInquiries(pending);
      }
      if (resClaims.status === "fulfilled" && resClaims.value.ok) {
        const d = await resClaims.value.json();
        setPendingClaims((d.claims || []).length);
      }
      if (resCampaigns.status === "fulfilled" && resCampaigns.value.ok) {
        const d = await resCampaigns.value.json();
        setPendingFormCampaigns((d.campaigns || []).length);
      }
      if (resUsers.status === "fulfilled" && resUsers.value.ok) {
        const d = await resUsers.value.json();
        setTotalUsers((d.users || []).length);
      }
    } catch {
      // Background count fetch
    }
  }, [getAdminHeaders]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchBadgeCounts();
    }
  }, [isLoggedIn, fetchBadgeCounts]);

  const handlePasscodeSubmit = async (passcode: string) => {
    localStorage.setItem("kigyou_admin_secret", passcode);
    setPasscodeError(null);
    setPasscodeModalOpen(false);
    toast.success("管理者パスコードを保存しました。画面を再検証します。");
    // Reload active tab state
    window.location.reload();
  };

  const getTabTitle = (tab: AdminTab) => {
    switch (tab) {
      case "overview": return "システム概要 & 運用ステータス";
      case "inquiries": return "非公開・修正依頼一覧";
      case "claims": return "企業公式オーナー認証 審査管理";
      case "formCampaigns": return "フォーム営業審査・管理";
      case "users": return "ユーザー・プラン管理";
      case "payments": return "決済・インボイス履歴";
      case "coupons": return "クーポン発行・管理";
      case "marketing": return "Email Marketing キャンペーン";
      case "exports": return "CSV出力履歴・ジョブ管理";
      case "logs": return "管理者操作ログ (Audit Logs)";
      case "apiKeys": return "B2B APIキー管理";
      case "backups": return "データベース・バックアップ履歴";
      case "partners": return "パートナーロゴ管理";
    }
  };

  const getTabDescription = (tab: AdminTab) => {
    switch (tab) {
      case "overview": return "審査待ちリクエスト、ユーザー利用状況、売上指標の総合ダッシュボードです。";
      case "inquiries": return "企業からの掲載取り下げ・情報修正の申請を確認・審査します。";
      case "claims": return "名刺・登記簿等の書類審査申請の確認、承認、および却下処理を行います。";
      case "formCampaigns": return "顧客が自作した問い合わせフォーム営業文面の審査、特商法遵守チェックを行います。";
      case "users": return "登録ユーザーのプラン変更、月間CSV枠や追加容量の直接調整を行います。";
      case "payments": return "Stripe経由でのプラン契約およびスポット容量購入の決済記録と領収書です。";
      case "coupons": return "プロモーション用割引クーポンの新規発行および利用実績の監視を行います。";
      case "marketing": return "特定ターゲット層へのメール配信キャンペーンを作成・管理します。";
      case "exports": return "ユーザーが実行したCSVエクスポートの生成状況およびダウンロード期限を管理します。";
      case "logs": return "システム内で実行された全管理操作の監査ログ（IP、日時、詳細）です。";
      case "apiKeys": return "外部連携用APIキーのアクティブ状態および接続ログの管理を行います。";
      case "backups": return "PostgreSQLユーザー・決済データの日次自動バックアップおよびCloudflare R2オフサイト保全状況を管理します。";
      case "partners": return "トップページに掲載するパートナー企業ロゴの審査・公開設定を行います。";
    }
  };

  const getTabClass = (tab: AdminTab) => {
    const isActive = activeTab === tab;
    return `w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer text-xs font-bold ${
      isActive
        ? "bg-[#1B4F8A] text-white shadow-xs border border-[#1B4F8A]"
        : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent"
    }`;
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1B4F8A]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-[#1B4F8A]/30 dark:text-blue-300 flex items-center justify-center mx-auto mb-4 border border-[#1B4F8A]/20">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold mb-3">
              <span>管理者セキュリティ認証</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              システム統括管理コンソール
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              本画面は Kigyou-List の権限保有者専用ポータルです。アクセスには特権管理者権限（メールアドレス認証および管理者シークレット）が必要です。
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              管理者アカウントでログイン
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />

      <AdminPasscodeModal
        isOpen={passcodeModalOpen}
        onClose={() => setPasscodeModalOpen(false)}
        onSubmit={handlePasscodeSubmit}
        errorMessage={passcodeError}
      />

      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1680px] mx-auto min-h-[calc(100vh-64px)]">
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-72 shrink-0 bg-white dark:bg-[#151B22] border-b lg:border-b-0 lg:border-r border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-5">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B4F8A] text-white border border-[#1B4F8A]/40 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">統括管理コンソール</span>
                  <span className="text-[10px] text-[#1B4F8A] dark:text-blue-400 font-extrabold uppercase tracking-wider">Super Administrator</span>
                </div>
              </div>
              <button
                onClick={() => setPasscodeModalOpen(true)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-white"
                title="パスコード設定"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Groups */}
            <nav className="flex flex-col gap-4 text-xs font-semibold" aria-label="Admin Navigation">
              {/* Group 0: Overview */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => switchTab("overview")}
                  className={getTabClass("overview")}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === "overview" ? "text-white" : "text-slate-500"}`} />
                    <span>ダッシュボード概要</span>
                  </div>
                  <Sparkles className={`w-3.5 h-3.5 ${activeTab === "overview" ? "text-amber-300" : "text-slate-400"}`} />
                </button>
              </div>

              {/* Group 1: Operations & Support */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                  審査・運用 (Operations)
                </span>

                {/* Inquiries */}
                <button
                  onClick={() => switchTab("inquiries")}
                  className={getTabClass("inquiries")}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquareWarning className={`w-4 h-4 shrink-0 ${activeTab === "inquiries" ? "text-white" : "text-slate-500"}`} />
                    <span>非公開・修正依頼</span>
                  </div>
                  {pendingInquiries > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] px-2 py-0.2 rounded-full font-bold animate-pulse">
                      {pendingInquiries}
                    </span>
                  )}
                </button>

                {/* Company Claims Review */}
                <button
                  onClick={() => switchTab("claims")}
                  className={getTabClass("claims")}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === "claims" ? "text-white" : "text-emerald-600"}`} />
                    <span>企業認証審査</span>
                  </div>
                  {pendingClaims > 0 ? (
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-500 text-white animate-pulse">
                      {pendingClaims}件
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      審査
                    </span>
                  )}
                </button>

                {/* Form Outreach Moderation */}
                <button
                  onClick={() => switchTab("formCampaigns")}
                  className={getTabClass("formCampaigns")}
                >
                  <div className="flex items-center gap-2.5">
                    <Send className={`w-4 h-4 shrink-0 ${activeTab === "formCampaigns" ? "text-white" : "text-indigo-500"}`} />
                    <span>フォーム営業審査</span>
                  </div>
                  {pendingFormCampaigns > 0 ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-white animate-pulse">
                      {pendingFormCampaigns}件
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      要審査
                    </span>
                  )}
                </button>

                {/* Users */}
                <button
                  onClick={() => switchTab("users")}
                  className={getTabClass("users")}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className={`w-4 h-4 shrink-0 ${activeTab === "users" ? "text-white" : "text-slate-500"}`} />
                    <span>ユーザー管理</span>
                  </div>
                  {totalUsers > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === "users" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}>
                      {totalUsers}
                    </span>
                  )}
                </button>
              </div>

              {/* Group 2: Commerce & Growth */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                  ビジネス・収益 (Commerce)
                </span>

                {/* Payments */}
                <button
                  onClick={() => switchTab("payments")}
                  className={getTabClass("payments")}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === "payments" ? "text-white" : "text-slate-500"}`} />
                    <span>決済・インボイス履歴</span>
                  </div>
                </button>

                {/* Coupons */}
                <button
                  onClick={() => switchTab("coupons")}
                  className={getTabClass("coupons")}
                >
                  <div className="flex items-center gap-2.5">
                    <Ticket className={`w-4 h-4 shrink-0 ${activeTab === "coupons" ? "text-white" : "text-slate-500"}`} />
                    <span>クーポン管理</span>
                  </div>
                </button>

                {/* Marketing */}
                <button
                  onClick={() => switchTab("marketing")}
                  className={getTabClass("marketing")}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className={`w-4 h-4 shrink-0 ${activeTab === "marketing" ? "text-white" : "text-slate-500"}`} />
                    <span>Email Marketing</span>
                  </div>
                </button>

                {/* Partners */}
                <button
                  onClick={() => switchTab("partners")}
                  className={getTabClass("partners")}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className={`w-4 h-4 shrink-0 ${activeTab === "partners" ? "text-white" : "text-slate-500"}`} />
                    <span>パートナーロゴ管理</span>
                  </div>
                </button>
              </div>

              {/* Group 3: Technical & Data */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                  データ・監査 (Technical)
                </span>

                {/* Exports */}
                <button
                  onClick={() => switchTab("exports")}
                  className={getTabClass("exports")}
                >
                  <div className="flex items-center gap-2.5">
                    <Download className={`w-4 h-4 shrink-0 ${activeTab === "exports" ? "text-white" : "text-slate-500"}`} />
                    <span>CSV出力履歴</span>
                  </div>
                </button>

                {/* API Keys */}
                <button
                  onClick={() => switchTab("apiKeys")}
                  className={getTabClass("apiKeys")}
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal className={`w-4 h-4 shrink-0 ${activeTab === "apiKeys" ? "text-white" : "text-slate-500"}`} />
                    <span>B2B APIキー管理</span>
                  </div>
                </button>

                {/* Backups */}
                <button
                  onClick={() => switchTab("backups")}
                  className={getTabClass("backups")}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className={`w-4 h-4 shrink-0 ${activeTab === "backups" ? "text-white" : "text-slate-500"}`} />
                    <span>DBバックアップ履歴</span>
                  </div>
                </button>

                {/* Logs */}
                <button
                  onClick={() => switchTab("logs")}
                  className={getTabClass("logs")}
                >
                  <div className="flex items-center gap-2.5">
                    <History className={`w-4 h-4 shrink-0 ${activeTab === "logs" ? "text-white" : "text-slate-500"}`} />
                    <span>操作監査ログ</span>
                  </div>
                </button>
              </div>
            </nav>
          </div>

          {/* Sidebar Footer User Info */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {user?.email}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> セッション有効
              </span>
            </div>
            <button
              onClick={() => setPasscodeModalOpen(true)}
              className="text-[11px] text-[#1B4F8A] hover:underline font-bold"
              title="パスコード再入力"
            >
              再認証
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 min-w-0 overflow-y-auto">
          {/* Top Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200/90 dark:border-slate-800/90">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-[#1B4F8A]/30 dark:text-blue-300 text-[11px] font-bold tracking-wider uppercase mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] animate-pulse"></span>
                Kigyou-List システム統括基盤 (Executive Console)
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1">
                <span>管理者ポータル</span>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{getTabTitle(activeTab)}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {getTabTitle(activeTab)}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {getTabDescription(activeTab)}
              </p>
            </div>

            {/* Quick toolbar */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/ja"
                target="_blank"
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                title="別タブでサイトトップを開く"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>公開サイトを開く</span>
              </Link>
              <button
                onClick={() => {
                  fetchBadgeCounts();
                  window.location.reload();
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="管理画面を最新化"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>再読み込み</span>
              </button>
              <button
                onClick={() => setPasscodeModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-[#1B4F8A]/10 hover:bg-[#1B4F8A]/20 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="パスコード設定"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>認証設定</span>
              </button>
            </div>
          </div>

          {/* Tab Renderers */}
          {activeTab === "overview" && (
            <OverviewTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
              onNavigateTab={(tab) => switchTab(tab)}
            />
          )}

          {activeTab === "inquiries" && (
            <InquiriesTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
              onCountUpdate={(cnt) => setPendingInquiries(cnt)}
            />
          )}

          {activeTab === "claims" && (
            <ClaimsReviewTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}

          {activeTab === "formCampaigns" && (
            <FormCampaignsAdminTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}

          {activeTab === "users" && (
            <UsersTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
              onCountUpdate={(cnt) => setTotalUsers(cnt)}
            />
          )}

          {activeTab === "payments" && (
            <PaymentsTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}

          {activeTab === "coupons" && (
            <CouponsTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}

          {activeTab === "marketing" && (
            <MarketingTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}

          {activeTab === "exports" && (
            <ExportsTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}

          {activeTab === "logs" && (
            <AuditLogsTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}

          {activeTab === "apiKeys" && (
            <ApiKeysTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}

          {activeTab === "backups" && (
            <BackupsTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}

          {activeTab === "partners" && (
            <PartnersTab
              adminEmail={user?.email || ""}
              getAdminHeaders={getAdminHeaders}
            />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <AdminContent />
      </Suspense>
    </ToastProvider>
  );
}
