"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, CreditCard, ShieldCheck, MessageSquareWarning, 
  Send, Download, Ticket, Database, CheckCircle2, 
  AlertCircle, ArrowUpRight, Clock, RefreshCcw, FileText,
  Building2, Activity, Server, Check
} from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";

interface OverviewTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
  onNavigateTab: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  adminEmail,
  getAdminHeaders,
  onNavigateTab,
}) => {
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [stats, setStats] = useState({
    usersCount: 0,
    planBreakdown: { free: 0, pro: 0, business: 0, enterprise: 0 } as Record<string, number>,
    totalRevenueJpy: 0,
    paymentsCount: 0,
    pendingInquiriesCount: 0,
    pendingClaimsCount: 0,
    pendingFormCampaignsCount: 0,
    totalInquiriesCount: 0,
    exportJobsCount: 0,
    activeCouponsCount: 0,
    totalFormCreditsBalance: 0,
    totalFormCreditsUsed: 0,
    latestBackup: null as any,
    recentLogs: [] as any[],
    recentInquiries: [] as any[],
  });

  const fetchOverviewData = async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      const headers = getAdminHeaders();
      const url = forceRefresh ? "/api/admin/overview-summary?refresh=1" : "/api/admin/overview-summary";
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (res.ok && data.success && data.stats) {
        setStats(data.stats);
        const now = new Date();
        setLastSyncTime(
          now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      }
    } catch (e) {
      console.error("Failed to load overview summary data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminEmail) {
      fetchOverviewData();
    }
  }, [adminEmail]);

  const totalPending = stats.pendingInquiriesCount + stats.pendingClaimsCount + stats.pendingFormCampaignsCount;
  const paidUsersCount = (stats.planBreakdown.pro || 0) + (stats.planBreakdown.business || 0) + (stats.planBreakdown.enterprise || 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-150">
      {/* 1. Executive Operations Header (Kachi-iro Corporate Minimalist) */}
      <div className="bg-[#1B4F8A] text-white rounded-xl p-5 sm:p-6 shadow-xs border border-[#143D6C] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/10 text-white text-[11px] font-medium mb-2 border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>KIGYOU-LIST 統括管理コンソール</span>
            <span className="text-white/40">|</span>
            <span className="font-mono text-emerald-300 text-[10px]">稼働中 (Normal)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white [font-feature-settings:'palt']">
            システム概要 & 運用ステータス
          </h2>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            管理者: <span className="font-medium text-white underline underline-offset-2">{adminEmail}</span>
            {lastSyncTime && (
              <span className="ml-3 text-slate-300 font-mono text-[11px] tabular-nums">
                (最終同期: {lastSyncTime})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
          <button
            onClick={() => fetchOverviewData(true)}
            disabled={loading}
            className="h-8.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 border border-white/20 shadow-xs"
            title="最新データを即時再取得"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>データ最新化</span>
          </button>
        </div>
      </div>

      {/* 2. Approval & Task Command Hub (審査・要対応センター) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 [font-feature-settings:'palt']">
            <Activity className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>要対応タスク & 審査センター</span>
          </h3>
          <span className="text-[11px] text-slate-500 tabular-nums">
            未対応計: <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPending} 件</span>
          </span>
        </div>

        {totalPending > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Inquiry Task */}
            <div 
              onClick={() => onNavigateTab("inquiries")}
              className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                stats.pendingInquiriesCount > 0 
                  ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/90 dark:border-rose-900/50 hover:border-rose-400" 
                  : "bg-white dark:bg-[#151B22] border-slate-200/90 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  stats.pendingInquiriesCount > 0 
                    ? "bg-rose-600 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  <MessageSquareWarning className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate [font-feature-settings:'palt']">
                    企業修正・非公開申請
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    掲載停止・情報変更の審査
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-base font-bold tabular-nums ${
                  stats.pendingInquiriesCount > 0 
                    ? "text-rose-600 dark:text-rose-400" 
                    : "text-slate-400"
                }`}>
                  {stats.pendingInquiriesCount} <span className="text-[10px] font-normal text-slate-500">件</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Claims Task */}
            <div 
              onClick={() => onNavigateTab("claims")}
              className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                stats.pendingClaimsCount > 0 
                  ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/90 dark:border-emerald-900/50 hover:border-emerald-400" 
                  : "bg-white dark:bg-[#151B22] border-slate-200/90 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  stats.pendingClaimsCount > 0 
                    ? "bg-emerald-600 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate [font-feature-settings:'palt']">
                    公式オーナー認証審査
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    名刺・登記簿書類の照合
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-base font-bold tabular-nums ${
                  stats.pendingClaimsCount > 0 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-slate-400"
                }`}>
                  {stats.pendingClaimsCount} <span className="text-[10px] font-normal text-slate-500">件</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Form Campaigns Task */}
            <div 
              onClick={() => onNavigateTab("formCampaigns")}
              className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                stats.pendingFormCampaignsCount > 0 
                  ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-900/50 hover:border-amber-400" 
                  : "bg-white dark:bg-[#151B22] border-slate-200/90 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  stats.pendingFormCampaignsCount > 0 
                    ? "bg-amber-600 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  <Send className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate [font-feature-settings:'palt']">
                    フォーム営業配信審査
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    特商法遵守・送信文面検査
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-base font-bold tabular-nums ${
                  stats.pendingFormCampaignsCount > 0 
                    ? "text-amber-600 dark:text-amber-400" 
                    : "text-slate-400"
                }`}>
                  {stats.pendingFormCampaignsCount} <span className="text-[10px] font-normal text-slate-500">件</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-3.5 px-4 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-medium [font-feature-settings:'palt']">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>現在、未対応の審査・申請リクエストはありません。すべてのタスクが正常に完了しています。</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700/80 dark:text-emerald-400/80 shrink-0">
              Status: All Clear
            </span>
          </div>
        )}
      </div>

      {/* 3. Core B2B Business KPI Cards (4 Balanced Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div 
          onClick={() => onNavigateTab("users")}
          className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-[#1B4F8A]/60 dark:hover:border-blue-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 [font-feature-settings:'palt']">
              登録ユーザー総数
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center border border-[#1B4F8A]/15">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {stats.usersCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">アカウント</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400"></span>
              有料: {paidUsersCount}社
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-500">無料: {stats.planBreakdown.free || 0}社</span>
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div 
          onClick={() => onNavigateTab("payments")}
          className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-emerald-600/60 dark:hover:border-emerald-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 [font-feature-settings:'palt']">
              累計決済売上 (Stripe)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/50">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight tabular-nums font-mono">
            ¥{stats.totalRevenueJpy.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 tabular-nums">
            <span>成約トランザクション</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.paymentsCount} 件</span>
          </div>
        </div>

        {/* Card 3: Form Outreach */}
        <div 
          onClick={() => onNavigateTab("users")}
          className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-indigo-600/60 dark:hover:border-indigo-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 [font-feature-settings:'palt']">
              フォーム営業 配信実績
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center justify-center border border-indigo-200/50">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {stats.totalFormCreditsUsed.toLocaleString()} <span className="text-xs font-normal text-slate-500">送信済</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 tabular-nums">
            <span>顧客保有クレジット残高</span>
            <span className="font-semibold text-indigo-700 dark:text-indigo-300 font-mono">
              {stats.totalFormCreditsBalance.toLocaleString()} 件
            </span>
          </div>
        </div>

        {/* Card 4: Exports & Marketing */}
        <div 
          onClick={() => onNavigateTab("exports")}
          className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 [font-feature-settings:'palt']">
              CSV出力 & クーポン
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Download className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {stats.exportJobsCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">抽出完了</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 tabular-nums">
            <span>有効な割引クーポン</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {stats.activeCouponsCount} コード稼働
            </span>
          </div>
        </div>
      </div>

      {/* 4. Middle Section: Quick Operations Workflows + Cloud Health Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Actions (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 [font-feature-settings:'palt']">
                <Building2 className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>クイック操作・業務ナビゲーション</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Direct Workflows</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => onNavigateTab("claims")}
                className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A]/40 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-[#1B4F8A]/5 dark:hover:bg-blue-950/20 text-left transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                  企業認証審査
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">名刺・登記簿の確認</div>
              </button>

              <button
                onClick={() => onNavigateTab("formCampaigns")}
                className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A]/40 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-[#1B4F8A]/5 dark:hover:bg-blue-950/20 text-left transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-2">
                  <Send className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                  フォーム営業審査
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">特商法・文面の検閲</div>
              </button>

              <button
                onClick={() => onNavigateTab("users")}
                className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A]/40 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-[#1B4F8A]/5 dark:hover:bg-blue-950/20 text-left transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                  ユーザー・容量管理
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">プラン・クォータ調整</div>
              </button>

              <button
                onClick={() => onNavigateTab("coupons")}
                className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A]/40 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-[#1B4F8A]/5 dark:hover:bg-blue-950/20 text-left transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-2">
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                  新規クーポン発行
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">割引コードの即時登録</div>
              </button>

              <button
                onClick={() => onNavigateTab("backups")}
                className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A]/40 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-[#1B4F8A]/5 dark:hover:bg-blue-950/20 text-left transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-2">
                  <Database className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                  DBバックアップ
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">R2オフサイト保全</div>
              </button>

              <button
                onClick={() => onNavigateTab("logs")}
                className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A]/40 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-[#1B4F8A]/5 dark:hover:bg-blue-950/20 text-left transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                  監査ログ確認
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">特権アクション履歴</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right: System & Infrastructure Health (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 [font-feature-settings:'palt']">
                <Server className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>インフラ稼働ステータス</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">PostgreSQL DB (500万社)</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  正常稼働
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Cloudflare R2 ストレージ</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  同期完了
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Stripe Webhook 連携</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  接続正常
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">最新DBバックアップ</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold tabular-nums text-[11px]">
                  {stats.latestBackup ? (
                    parseUTCDate(stats.latestBackup.backup_time).toLocaleDateString("ja-JP", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  ) : (
                    "定期保全中"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed [font-feature-settings:'palt']">
            ※定期バックアップcronおよび自動クローラーは正常にスケジューリングされています。
          </div>
        </div>
      </div>

      {/* 5. Dual Operational Real-Time Feeds (Inquiries & Audit Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Inquiries & Opt-out Requests */}
        <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 [font-feature-settings:'palt']">
              <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>直近のお問い合わせ・申請 (Recent Inquiries)</span>
            </h3>
            <button
              onClick={() => onNavigateTab("inquiries")}
              className="text-xs font-semibold text-[#1B4F8A] hover:underline dark:text-blue-400 flex items-center gap-1 cursor-pointer"
            >
              <span>すべて表示</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.recentInquiries && stats.recentInquiries.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {stats.recentInquiries.map((inq: any) => (
                <div 
                  key={inq.id} 
                  onClick={() => onNavigateTab("inquiries")}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 px-1 rounded transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                      {parseUTCDate(inq.created_at).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px] sm:max-w-xs">
                      {inq.company_name || inq.corporate_number || "未指定企業"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      {inq.type === "opt_out" || inq.type === "hide" ? "非公開申請" : "情報修正"}
                    </span>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                    inq.status === "pending"
                      ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                      : "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${inq.status === "pending" ? "bg-rose-500" : "bg-slate-400"}`}></span>
                    {inq.status === "pending" ? "未対応" : "処理済"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              直近のお問い合わせや修正申請はありません。
            </div>
          )}
        </div>

        {/* Right Column: Recent Admin Audit Logs */}
        <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 [font-feature-settings:'palt']">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>直近の特権操作ログ (Recent Audit Logs)</span>
            </h3>
            <button
              onClick={() => onNavigateTab("logs")}
              className="text-xs font-semibold text-[#1B4F8A] hover:underline dark:text-blue-400 flex items-center gap-1 cursor-pointer"
            >
              <span>すべて表示</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.recentLogs && stats.recentLogs.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {stats.recentLogs.map((log: any) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                      {parseUTCDate(log.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0 text-[11px] font-mono">
                      {log.action_type}
                    </span>
                    <span className="text-slate-500 truncate max-w-[140px] sm:max-w-xs text-[11px]">
                      {log.target_identifier || "-"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 truncate max-w-[120px]">
                    {log.admin_email?.split("@")[0]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              直近の操作ログはありません。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
