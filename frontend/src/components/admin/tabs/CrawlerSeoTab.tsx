"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  RefreshCw,
  Play,
  Square,
  RotateCw,
  Database,
  Globe,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ExternalLink,
  Trash2,
  Zap,
  Shield,
  Layers,
  Search,
} from "lucide-react";
import { useAdminToast } from "@/components/admin/AdminToast";

interface CrawlerSeoTabProps {
  getAdminHeaders: () => Record<string, string>;
}

export default function CrawlerSeoTab({ getAdminHeaders }: CrawlerSeoTabProps) {
  const toast = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto refresh interval (0 = off, 15, 30 seconds)
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(30);

  // Action execution state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ title: string; output: string } | null>(null);

  // Single company cache purge input
  const [targetCorpNum, setTargetCorpNum] = useState<string>("");

  // Log active tab
  const [activeLogTab, setActiveLogTab] = useState<"hellowork" | "indexnow" | "google">("hellowork");

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout safeguard
    try {
      const headers = getAdminHeaders();
      const url = isSilent ? "/api/admin/crawler-seo" : "/api/admin/crawler-seo?refresh=1";
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: データの取得に失敗しました`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        setError("データ取得がタイムアウトしました。再試行してください。");
      } else {
        setError(err.message || "エラーが発生しました");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAdminHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshSec <= 0) return;
    const interval = setInterval(() => {
      fetchData(true);
    }, autoRefreshSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshSec, fetchData]);

  const handleAction = async (action: string, extra: Record<string, any> = {}) => {
    setActionLoading(action);
    setActionResult(null);
    try {
      const headers = {
        ...getAdminHeaders(),
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/admin/crawler-seo", {
        method: "POST",
        headers,
        body: JSON.stringify({ action, ...extra }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "アクションの実行に失敗しました");
      }
      toast.success(result.message || "正常に実行されました");
      if (result.output) {
        setActionResult({
          title: result.message,
          output: result.output,
        });
      }
      // Reload stats after action
      fetchData(true);
    } catch (err: any) {
      toast.error(err.message || "エラーが発生しました");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurgeSingleCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = targetCorpNum.trim();
    if (!/^\d{13}$/.test(cleanNum)) {
      toast.error("13桁の半角数字（法人番号）を入力してください。");
      return;
    }
    await handleAction("purge_company_cache", { corporateNumber: cleanNum });
    setTargetCorpNum("");
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-[#1B4F8A]" />
        <span className="text-xs font-medium">クローラー & SEOインデックス稼働状況を取得中...</span>
      </div>
    );
  }

  const hwDaemon = (data?.pm2 || []).find((p: any) => p.name === "hellowork-drip-daemon") || {
    status: "stopped",
    cpu: 0,
    memory_mb: 0,
    uptime_seconds: 0,
    restarts: 0,
  };
  const isHwOnline = hwDaemon.status === "online";

  const stats = data?.stats || {};
  const maintenance = data?.maintenance || {};
  const googleQuota = data?.googleQuota || {};
  const recentEvents = data?.recentEvents || [];
  const logs = data?.logs || {};

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-[#1B4F8A]/30 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white [font-feature-settings:'palt']">
              データ収集 & SEOインデックス統括管理コンソール
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed ml-10.5">
            ハローワーク常駐クローラー (24/7)、Bing IndexNow (5,000件/夜)、Google VIP Indexing API (5-Key Pool)、および 2層キャッシュの稼働状況を監視・制御します。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {/* Auto Refresh Select */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium">自動更新:</span>
            <select
              value={autoRefreshSec}
              onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
              aria-label="自動更新インターバル"
              className="bg-transparent border-none text-[11px] font-semibold text-slate-850 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value={0}>停止</option>
              <option value={15}>15秒</option>
              <option value={30}>30秒</option>
              <option value={60}>60秒</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-[#1C2128] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#1B4F8A]" : ""}`} />
            <span>更新</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: 4 Core Engine KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. HelloWork 24/7 Drip Crawler */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">HelloWork クローラー</span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  isHwOnline
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60"
                    : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/60"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isHwOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                {isHwOnline ? "常時稼働中 (Online)" : "停止中 (Stopped)"}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {(stats.totalHiringSignals || 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">件</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              内、紹介期限日あり: <strong className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{(stats.hiringWithExpiry || 0).toLocaleString()}</strong> 件
            </span>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">メモリ/CPU:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
              {hwDaemon.memory_mb} MB / {hwDaemon.cpu}%
            </span>
          </div>
        </div>

        {/* 2. Bing IndexNow Engine */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bing IndexNow</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60">
                <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                HTTP 200 OK
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {(stats.totalIndexNowSubmitted || 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">URLs</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              夜間自動バッチ: <strong className="text-blue-600 dark:text-blue-400 font-mono tabular-nums">5,000 URLs/夜</strong>
            </span>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">次回定期送信:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
              毎夜 02:00 JST
            </span>
          </div>
        </div>

        {/* 3. Google VIP Indexing API */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Google VIP Indexing</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60">
                5 Keys 連携中
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {(googleQuota.used || 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">/ 1,000 Quota</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              対象: <strong className="text-slate-700 dark:text-slate-300">48h以内変動 + 点数≧3</strong>
            </span>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">次回定期送信:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
              毎夜 02:15 JST
            </span>
          </div>
        </div>

        {/* 4. Two-Tier Cache System */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">2層キャッシュ (CDN/VPS)</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900/60">
                Cloudflare + Nginx
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {(stats.updatedLast24h || 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">社更新 (24h)</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              求人保有企業: <strong className="text-slate-700 dark:text-slate-300 font-mono tabular-nums">{(stats.companiesWithHiring || 0).toLocaleString()}</strong> 社
            </span>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">パージ速度目安:</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
              ~1.2秒 (30 URLs/回)
            </span>
          </div>
        </div>
      </div>

      {/* Control Actions & Targeted Purge Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Actions 1: Process Control */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white [font-feature-settings:'palt']">
              クローラー・送信デーモン操作
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            VPS上の PM2 プロセスを直接制御、または即時手動テストを実行します。
          </p>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => handleAction("restart_crawler")}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${actionLoading === "restart_crawler" ? "animate-spin" : ""}`} />
              <span>デーモン再起動</span>
            </button>

            <button
              onClick={() => handleAction("test_crawl")}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${actionLoading === "test_crawl" ? "animate-spin" : ""}`} />
              <span>テスト巡回 (3件)</span>
            </button>

            <button
              onClick={() => handleAction("trigger_indexnow")}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${actionLoading === "trigger_indexnow" ? "animate-spin" : ""}`} />
              <span>IndexNow 即時送信</span>
            </button>

            <button
              onClick={() => handleAction("trigger_google")}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Globe className={`w-3.5 h-3.5 ${actionLoading === "trigger_google" ? "animate-spin" : ""}`} />
              <span>Google VIP 即時送信</span>
            </button>
          </div>
        </div>

        {/* Actions 2: Targeted Cache Purge Form */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white [font-feature-settings:'palt']">
                ピンポイント キャッシュ即時破棄
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              特定企業の更新内容を Cloudflare & Nginx から即座に反映します（ja/en/vi 3言語一括パージ）。
            </p>
          </div>

          <form onSubmit={handlePurgeSingleCompany} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="13桁の法人番号 (例: 8010001120391)"
                value={targetCorpNum}
                onChange={(e) => setTargetCorpNum(e.target.value)}
                maxLength={13}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
              />
              <button
                type="submit"
                disabled={actionLoading !== null || !targetCorpNum.trim()}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1B4F8A] hover:bg-[#143D6C] text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {actionLoading === "purge_company_cache" ? "削除中..." : "パージ実行"}
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-400">緊急時全体キャッシュパージ:</span>
            <button
              onClick={() => {
                if (window.confirm("全ゾーンのキャッシュ（Cloudflare + Nginx）を即時全消去します。よろしいですか？")) {
                  handleAction("purge_all_cache");
                }
              }}
              disabled={actionLoading !== null}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              <span>全消去 (Emergency Flush)</span>
            </button>
          </div>
        </div>

        {/* Actions 3: HelloWork Maintenance Status Widget */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white [font-feature-settings:'palt']">
                  ハローワーク公式 保守スケジュール
                </h3>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  maintenance.inMaintenance
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                    : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}
              >
                {maintenance.inMaintenance ? "保守中" : "通常提供中"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              厚生労働省ハローワークの定期保守時間帯はクローラーが自動待機します。
            </p>
          </div>

          <div className="flex flex-col gap-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">現在時刻 (JST):</span>
              <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                {maintenance.currentJst || "---"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">毎週定期保守:</span>
              <span className="text-slate-600 dark:text-slate-400">{maintenance.weeklyWindow}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">月末定期保守:</span>
              <span className="text-slate-600 dark:text-slate-400">{maintenance.monthlyWindow}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Execution Output Modal/Box (if any) */}
      {actionResult && (
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">{actionResult.title}</span>
            </div>
            <button
              onClick={() => setActionResult(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
            >
              閉じる
            </button>
          </div>
          <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto p-2 bg-black/40 rounded max-h-48 text-emerald-300">
            {actionResult.output}
          </pre>
        </div>
      )}

      {/* Live Logs Viewer Console */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white [font-feature-settings:'palt']">
              リアルタイム実行ログ (Live Logs)
            </h3>
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveLogTab("hellowork")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeLogTab === "hellowork"
                  ? "bg-[#1B4F8A] text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              HelloWork クローラー
            </button>
            <button
              onClick={() => setActiveLogTab("indexnow")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeLogTab === "indexnow"
                  ? "bg-[#1B4F8A] text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Bing IndexNow
            </button>
            <button
              onClick={() => setActiveLogTab("google")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeLogTab === "google"
                  ? "bg-[#1B4F8A] text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Google VIP Indexing
            </button>
          </div>
        </div>

        {/* Log Text Box */}
        <div className="relative rounded-lg bg-slate-900 border border-slate-800 p-3 sm:p-4 overflow-hidden">
          <pre className="text-[11px] font-mono leading-relaxed text-slate-200 overflow-x-auto max-h-72 select-text whitespace-pre-wrap">
            {activeLogTab === "hellowork"
              ? logs.hellowork || "ログデータがありません。"
              : activeLogTab === "indexnow"
              ? logs.indexnow || "ログデータがありません。"
              : logs.google || "ログデータがありません。"}
          </pre>
        </div>
      </div>

      {/* Recent Crawled & Synchronized Events Table */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white [font-feature-settings:'palt']">
              直近に自動収集・同期された求人シグナル (最新20件)
            </h3>
          </div>
          <span className="text-xs text-slate-400">hub_dynamic_events 連携</span>
        </div>

        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">日時</th>
                <th className="py-2.5 px-3">法人番号</th>
                <th className="py-2.5 px-3">企業名</th>
                <th className="py-2.5 px-3">都道府県</th>
                <th className="py-2.5 px-3">職種 / 求人内容</th>
                <th className="py-2.5 px-3 text-right">確認</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    現在直近の同期イベントはありません。
                  </td>
                </tr>
              ) : (
                recentEvents.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-500 text-[11px] whitespace-nowrap">
                      {ev.event_date || (ev.created_at ? ev.created_at.slice(0, 10) : "---")}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {ev.corporate_number}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-850 dark:text-white max-w-[200px] truncate">
                      {ev.company_name}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {ev.prefecture_name || "---"}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-[280px] truncate">
                      {ev.title_ja}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/ja/company/${ev.corporate_number}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4F8A] hover:underline dark:text-blue-400"
                      >
                        <span>ページ</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
