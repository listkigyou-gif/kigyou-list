"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, CreditCard, ShieldCheck, MessageSquareWarning, 
  Send, Download, Ticket, Database, CheckCircle2, 
  AlertCircle, ArrowUpRight, Clock, RefreshCcw, Sparkles 
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

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const headers = getAdminHeaders();

      // Fetch key datasets concurrently with resilience (each handles its own error)
      const [resUsers, resInquiries, resClaims, resCampaigns, resPayments, resCoupons, resExports, resBackups, resLogs] = await Promise.allSettled([
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/inquiries", { headers }),
        fetch("/api/admin/claims?status=pending", { headers }),
        fetch("/api/admin/form-campaigns?status=pending_approval", { headers }),
        fetch("/api/admin/payments", { headers }),
        fetch("/api/coupon/admin", { headers }),
        fetch("/api/admin/exports", { headers }),
        fetch("/api/admin/backups", { headers }),
        fetch("/api/admin/logs", { headers }),
      ]);

      let usersList: any[] = [];
      let inquiriesList: any[] = [];
      let pendingClaimsList: any[] = [];
      let pendingCampaignsList: any[] = [];
      let paymentsList: any[] = [];
      let couponsList: any[] = [];
      let exportsList: any[] = [];
      let backupsList: any[] = [];
      let logsList: any[] = [];

      if (resUsers.status === "fulfilled" && resUsers.value.ok) {
        const d = await resUsers.value.json();
        usersList = d.users || [];
      }
      if (resInquiries.status === "fulfilled" && resInquiries.value.ok) {
        const d = await resInquiries.value.json();
        inquiriesList = d.inquiries || [];
      }
      if (resClaims.status === "fulfilled" && resClaims.value.ok) {
        const d = await resClaims.value.json();
        pendingClaimsList = d.claims || [];
      }
      if (resCampaigns.status === "fulfilled" && resCampaigns.value.ok) {
        const d = await resCampaigns.value.json();
        pendingCampaignsList = d.campaigns || [];
      }
      if (resPayments.status === "fulfilled" && resPayments.value.ok) {
        const d = await resPayments.value.json();
        paymentsList = d.payments || [];
      }
      if (resCoupons.status === "fulfilled" && resCoupons.value.ok) {
        const d = await resCoupons.value.json();
        couponsList = d.coupons || [];
      }
      if (resExports.status === "fulfilled" && resExports.value.ok) {
        const d = await resExports.value.json();
        exportsList = d.jobs || [];
      }
      if (resBackups.status === "fulfilled" && resBackups.value.ok) {
        const d = await resBackups.value.json();
        backupsList = d.backups || [];
      }
      if (resLogs.status === "fulfilled" && resLogs.value.ok) {
        const d = await resLogs.value.json();
        logsList = d.logs || [];
      }

      // Calculate breakdowns
      const plans = { free: 0, pro: 0, business: 0, enterprise: 0 };
      usersList.forEach((u) => {
        const p = (u.plan || "free").toLowerCase();
        if (p in plans) plans[p as keyof typeof plans]++;
        else plans.free++;
      });

      const totalRev = paymentsList
        .filter((p) => p.status === "succeeded" || p.status === "completed")
        .reduce((sum, p) => sum + (Number(p.amount_jpy) || 0), 0);

      const pendingInq = inquiriesList.filter((i) => i.status === "pending").length;

      const activeCpn = couponsList.filter((c) => {
        const isExp = new Date(c.expires_at) < new Date();
        return c.is_active && !isExp && c.used_count < c.max_uses;
      }).length;

      const totalFormBalance = usersList.reduce((sum, u) => sum + (Number(u.form_credits_balance) || 0), 0);
      const totalFormUsed = usersList.reduce((sum, u) => sum + (Number(u.form_credits_used) || 0), 0);

      setStats({
        usersCount: usersList.length,
        planBreakdown: plans,
        totalRevenueJpy: totalRev,
        paymentsCount: paymentsList.length,
        pendingInquiriesCount: pendingInq,
        pendingClaimsCount: pendingClaimsList.length,
        pendingFormCampaignsCount: pendingCampaignsList.length,
        totalInquiriesCount: inquiriesList.length,
        exportJobsCount: exportsList.length,
        activeCouponsCount: activeCpn,
        totalFormCreditsBalance: totalFormBalance,
        totalFormCreditsUsed: totalFormUsed,
        latestBackup: backupsList.length > 0 ? backupsList[0] : null,
        recentLogs: logsList.slice(0, 5),
        recentInquiries: inquiriesList.filter((i) => i.status === "pending").slice(0, 4),
      });
    } catch (e) {
      console.error("Failed to load overview data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome with Trust Navy Gradient */}
      <div className="bg-gradient-to-r from-[#1B4F8A] via-[#143D6C] to-[#0E2A4E] text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#1B4F8A]/40 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`, backgroundSize: "24px 24px" }}
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/95 text-[11px] font-bold backdrop-blur-md mb-2.5 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Kigyou List Executive Operations Console</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            システム概要 & 運用ステータス
          </h2>
          <p className="text-xs text-white/85 mt-1 max-w-xl leading-relaxed">
            管理者 <span className="font-bold underline text-white">{adminEmail}</span> としてログイン中。
            現在の審査待ちリクエスト、ユーザー利用状況、および収益指標のサマリーです。
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-stretch md:self-auto justify-end">
          <button
            onClick={fetchOverviewData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all backdrop-blur-md flex items-center gap-2 cursor-pointer disabled:opacity-50 border border-white/20"
            title="データを更新"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            データ更新
          </button>
        </div>
      </div>

      {/* Action Required Alert Cards (Inquiries, Claims, Form Campaigns) */}
      <div className="flex flex-col gap-3">
        {stats.pendingInquiriesCount > 0 && (
          <div className="bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <MessageSquareWarning className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  未対応の企業修正・非公開申請が {stats.pendingInquiriesCount} 件あります
                </h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5">
                  企業オーナーや関係者からの情報変更・掲載取り下げ申請を確認し、審査を実行してください。
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("inquiries")}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>申請一覧を確認</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {stats.pendingClaimsCount > 0 && (
          <div className="bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  審査待ちの企業公式オーナー認証が {stats.pendingClaimsCount} 件あります
                </h4>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                  名刺または登記簿謄本等の書類確認を行い、承認または却下の処理を実行してください。
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("claims")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>認証審査を開く</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {stats.pendingFormCampaignsCount > 0 && (
          <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Send className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  審査待ちのフォーム営業キャンペーンが {stats.pendingFormCampaignsCount} 件あります
                </h4>
                <p className="text-xs text-amber-700/80 dark:text-amber-400 mt-0.5">
                  文面の特定商取引法遵守、オプトアウト表記、送信元情報の妥当性を確認し、配信承認を行ってください。
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("formCampaigns")}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>文面審査を開く</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 5 Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Metric 1: Users */}
        <div 
          onClick={() => onNavigateTab("users")}
          className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-400/80 dark:hover:border-blue-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">登録ユーザー数</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.usersCount.toLocaleString()} <span className="text-xs font-semibold text-slate-400">アカウント</span>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Pro: {stats.planBreakdown.pro}</span>
            <span>•</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">Biz: {stats.planBreakdown.business}</span>
            <span>•</span>
            <span className="font-semibold text-slate-500">Free: {stats.planBreakdown.free}</span>
          </div>
        </div>

        {/* Metric 2: Revenue */}
        <div 
          onClick={() => onNavigateTab("payments")}
          className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-emerald-400/80 dark:hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">累計決済売上 (Stripe)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
            ¥{stats.totalRevenueJpy.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>成功トランザクション</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{stats.paymentsCount} 件</span>
          </div>
        </div>

        {/* Metric 3: Form Outreach Credits */}
        <div 
          onClick={() => onNavigateTab("users")}
          className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-indigo-400/80 dark:hover:border-indigo-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">フォーム営業 配信枠</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight font-mono">
            {stats.totalFormCreditsBalance.toLocaleString()} <span className="text-xs font-semibold text-slate-400">件残高</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>累計送信実績</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{stats.totalFormCreditsUsed.toLocaleString()} 件</span>
          </div>
        </div>

        {/* Metric 4: Exports */}
        <div 
          onClick={() => onNavigateTab("exports")}
          className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-cyan-400/80 dark:hover:border-cyan-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">CSVエクスポート実績</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.exportJobsCount.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ジョブ</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>データ抽出処理</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">キュー正常</span>
          </div>
        </div>

        {/* Metric 5: Active Coupons */}
        <div 
          onClick={() => onNavigateTab("coupons")}
          className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-amber-400/80 dark:hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">有効なクーポン</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.activeCouponsCount} <span className="text-xs font-semibold text-slate-400">コード</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>割引プロモーション</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">適用中</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Quick Nav Shortcuts + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions & Operations */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>クイック操作・ショートカット</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigateTab("claims")}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">企業認証審査</div>
                <div className="text-[10px] text-slate-400 mt-0.5">名刺・謄本の確認</div>
              </button>

              <button
                onClick={() => onNavigateTab("formCampaigns")}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Send className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">フォーム営業審査</div>
                <div className="text-[10px] text-slate-400 mt-0.5">文面・特商法の検査</div>
              </button>

              <button
                onClick={() => onNavigateTab("users")}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">ユーザー・容量管理</div>
                <div className="text-[10px] text-slate-400 mt-0.5">プラン・クォータ調整</div>
              </button>

              <button
                onClick={() => onNavigateTab("coupons")}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">新規クーポン発行</div>
                <div className="text-[10px] text-slate-400 mt-0.5">割引コードの登録</div>
              </button>

              <button
                onClick={() => onNavigateTab("backups")}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Database className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">DBバックアップ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">スナップショットログ</div>
              </button>

              <button
                onClick={() => onNavigateTab("logs")}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">監査ログ確認</div>
                <div className="text-[10px] text-slate-400 mt-0.5">特権アクション履歴</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right: System & Infrastructure Health */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>システム健全性 (Health)</span>
            </h3>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500">PostgreSQL データベース</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 稼働中 (Healthy)
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500">最新バックアップ</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                  {stats.latestBackup ? (
                    parseUTCDate(stats.latestBackup.backup_time).toLocaleDateString("ja-JP", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  ) : (
                    "取得済み"
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500">Stripe Webhook 連携</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 接続完了
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Next.js Edge API</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                  Latency: Normal
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500">
            定期バックアップ cron およびクローラーの実行状態は正常です。
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Log activity preview */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>最近の管理者操作ログ</span>
          </h3>
          <button
            onClick={() => onNavigateTab("logs")}
            className="text-xs font-bold text-primary hover:text-primary-hover dark:text-secondary flex items-center gap-1 cursor-pointer"
          >
            <span>すべてのログを表示</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            直近の操作ログはありません。
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {stats.recentLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {parseUTCDate(log.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                    {log.action_type}
                  </span>
                  <span className="text-slate-500 truncate max-w-sm">
                    {log.target_identifier}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {log.admin_email}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
