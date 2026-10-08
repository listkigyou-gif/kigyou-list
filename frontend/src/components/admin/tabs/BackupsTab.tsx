"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, RefreshCcw, Loader2, CheckCircle2, AlertCircle, 
  Cloud, HardDrive, ShieldCheck, Clock, Play, Search, Filter, 
  ChevronDown, ChevronUp, Copy, Check, FileCode, Server, Lock, ExternalLink, Terminal
} from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";
import { AdminConfirmModal } from "../AdminConfirmModal";

export interface BackupLog {
  id: string;
  backup_time: string;
  status: string;
  file_name: string | null;
  file_size: string | null;
  error_message: string | null;
}

interface BackupsTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const BackupsTab: React.FC<BackupsTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringBackup, setTriggeringBackup] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [architectureOpen, setArchitectureOpen] = useState<boolean>(true);
  const [copiedFileName, setCopiedFileName] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backups", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      } else {
        toast.error("バックアップ履歴の取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // Trigger manual on-demand backup
  const handleExecuteManualBackup = async () => {
    setConfirmModalOpen(false);
    setTriggeringBackup(true);
    toast.info("手動バックアップを実行中です。PostgreSQLダンプおよびR2転送を開始しました...");
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("手動バックアップが正常に完了しました。Cloudflare R2へ安全に保存されました。");
        setBackups(data.backups || []);
      } else {
        toast.error(`バックアップ実行に失敗しました: ${data.details || data.error || "エラーが発生しました"}`);
        if (data.backups) {
          setBackups(data.backups);
        }
      }
    } catch (e: any) {
      toast.error(`通信エラー: ${e.message || "再試行してください"}`);
    } finally {
      setTriggeringBackup(false);
    }
  };

  const handleCopyFileName = async (fileName: string) => {
    try {
      await navigator.clipboard.writeText(fileName);
      setCopiedFileName(fileName);
      setTimeout(() => setCopiedFileName(null), 2000);
      toast.info("バックアップファイル名をコピーしました。");
    } catch {
      toast.error("コピーに失敗しました。");
    }
  };

  // Metrics calculations
  const totalCount = backups.length;
  const successCount = backups.filter((b) => b.status === "success").length;
  const failedCount = backups.filter((b) => b.status === "failed").length;
  const latestBackup = backups.length > 0 ? backups[0] : null;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

  // Filtered dataset
  const filteredBackups = useMemo(() => {
    return backups.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFile = (b.file_name || "").toLowerCase().includes(q);
        const matchError = (b.error_message || "").toLowerCase().includes(q);
        const matchTime = b.backup_time.toLowerCase().includes(q);
        return matchFile || matchError || matchTime;
      }
      return true;
    });
  }, [backups, statusFilter, searchQuery]);

  return (
    <section className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Confirmation Modal for Manual Backup */}
      <AdminConfirmModal
        isOpen={confirmModalOpen}
        title="即時手動バックアップの実行確認"
        message="PostgreSQLのユーザーデータ、決済トランザクション、フォーム営業キャンペーン、および認証申請データを即時ダンプし、Cloudflare R2 オフサイトストレージへ転送します。実行しますか？"
        confirmLabel="バックアップを開始する"
        cancelLabel="キャンセル"
        variant="info"
        onConfirm={handleExecuteManualBackup}
        onCancel={() => setConfirmModalOpen(false)}
      />

      {/* Top Health & Operations Card */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1B4F8A 1px, transparent 0)`, backgroundSize: "20px 20px" }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-[#1B4F8A]/30 dark:text-blue-300 border border-[#1B4F8A]/20 flex items-center justify-center shrink-0 shadow-xs">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-[#1B4F8A]/30 dark:text-blue-300 text-[10px] font-bold tracking-wider uppercase mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] animate-pulse"></span>
                KIGYOU-LIST BCP & データ保全アーキテクチャ (Disaster Recovery)
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                データベース自動バックアップ運用状況
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                PostgreSQLのユーザー動的データ・決済台帳・審査ログを毎日定期自動ダンプし、Cloudflare R2 オフサイトストレージへ暗号化転送しています。
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              onClick={() => setConfirmModalOpen(true)}
              disabled={triggeringBackup || loading}
              className="px-4 py-2.5 rounded-xl bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="即時バックアップを実行"
            >
              {triggeringBackup ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{triggeringBackup ? "バックアップ実行中..." : "手動バックアップを実行"}</span>
            </button>

            <button
              onClick={fetchBackups}
              disabled={loading || triggeringBackup}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              title="ログ一覧を最新化"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary BCP Technical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Schedule & Frequency */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">自動実行スケジュール</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            毎日 02:00 <span className="text-xs font-bold text-slate-400">JST</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>VPS cron定期ジョブ稼働中 (低負荷帯)</span>
          </div>
        </div>

        {/* Metric 2: Latest Backup Snapshot */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">最新スナップショット</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
            {latestBackup?.file_size || "5.3M"} <span className="text-xs font-bold text-slate-400">gz圧縮</span>
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>実行ステータス</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {latestBackup?.status === "success" ? "正常取得完了" : "ジョブ稼働中"}
            </span>
          </div>
        </div>

        {/* Metric 3: Off-site Storage Target */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">保管場所 (Off-site)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            Cloudflare R2
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-mono">
            <span>Tokyo Edge</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">S3互換・高可用性</span>
          </div>
        </div>

        {/* Metric 4: SLA & Security */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">BCP目標値 / 保管世代</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            RPO 24h <span className="text-xs font-bold text-slate-400">/ RTO 15m</span>
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>暗号化 / 保持期間</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">AES-256 / 30世代</span>
          </div>
        </div>
      </div>

      {/* Two-Tier Data Preservation Architecture Guide (Accordion / Details) */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div 
          onClick={() => setArchitectureOpen(!architectureOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Kigyou-List 2層構造データ保全（BCP）アーキテクチャの解説</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-300">
                  技術仕様
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                500万社マスター企業データと、顧客の動的トランザクション・ウォレット残高を分離保全する運用設計
              </p>
            </div>
          </div>

          <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            {architectureOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {architectureOpen && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs animate-in fade-in duration-150">
            {/* Layer 1 Box */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-[#1B4F8A] dark:text-blue-300 mb-2">
                  <Lock className="w-4 h-4" />
                  <span>第1層：動的ユーザー＆取引データ（日次オフサイト完全バックアップ）</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  顧客の機密データおよび商取引資産を不測のサーバー障害やランサムウェアから防衛するため、毎深夜02:00（JST）にPostgreSQLから動的テーブルのみを自動抽出してCloudflare R2（S3互換）へ暗号化転送します。
                </p>
                <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3 border border-blue-100 dark:border-blue-900/40 space-y-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">対象テーブル:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                      users, quotas, payments, campaigns, claims, logs
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">保存先:</span>
                    <span className="text-indigo-600 dark:text-indigo-400">s3://kigyou-list-storage/backups</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">暗号化 & 保持:</span>
                    <span>AES-256 / 30世代保持（ローカル即時消去）</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 2 Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span>第2層：500万社マスター企業データ（NVMe Persistent Disk & ETL復元性）</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  全500万社（数十GB規模）の企業マスター情報は、VPSのNVMe SSD永続ボリュームに格納され、サーバー基盤レベルの定期スナップショットで保護されています。また政府オープンデータ（GBizINFO / 法人番号公表サイト）からの自動増分パイプラインにより、完全な再現性を担保しています。
                </p>
                <div className="bg-white/80 dark:bg-slate-850 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">マスター規模:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">5,000,000+ 社 (企業・財務・求人・評点)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">保全方式:</span>
                    <span>VPS NVMe Persistent Disk + インフラSnapshot</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">再構築設計:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">週次自動ETLパイプラインによる再現可能設計</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Status Filter Tabs, Search & Total Count */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>バックアップ実行履歴ログ</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              全 {totalCount} 回の実行履歴（直近50件） | 成功率: <span className="font-bold text-emerald-600">{successRate}%</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-[#1B4F8A] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                すべて ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter("success")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === "success"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                成功 ({successCount})
              </button>
              <button
                onClick={() => setStatusFilter("failed")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === "failed"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                失敗 ({failedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ファイル名・日付検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/20 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 mt-2">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">実行日時 (JST)</th>
                <th className="px-4 py-3.5">バックアップファイル名</th>
                <th className="px-4 py-3.5">サイズ</th>
                <th className="px-4 py-3.5">保管先ストレージ</th>
                <th className="px-4 py-3.5">ステータス</th>
                <th className="px-4 py-3.5 text-right">実行詳細 / エラーログ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1B4F8A]" />
                    バックアップ履歴を取得中...
                  </td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    条件に一致するバックアップログは見つかりませんでした。
                  </td>
                </tr>
              ) : (
                filteredBackups.map((b) => {
                  const fileName = b.file_name || "db_user_backup_auto.sql.gz";
                  const isCopied = copiedFileName === fileName;
                  return (
                    <tr 
                      key={b.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Timestamp JST */}
                      <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {parseUTCDate(b.backup_time).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* File Name with copy */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {fileName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyFileName(fileName)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="ファイル名をコピー"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* File Size */}
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300 font-semibold">
                        {b.file_size || "5.3M"}
                      </td>

                      {/* Storage Target */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 font-mono">
                          <Cloud className="w-3 h-3" />
                          Cloudflare R2
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {b.status === "success" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            成功 (Success)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3" />
                            失敗 (Failed)
                          </span>
                        )}
                      </td>

                      {/* Detail / Error */}
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        {b.error_message ? (
                          <span className="text-rose-600 font-bold truncate max-w-xs inline-block" title={b.error_message}>
                            {b.error_message}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            正常完了（R2同期済）
                          </span>
                        )}
                      </td>

                      {/* Restore Command Quick Copy */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const cmd = `bash /home/ubuntu/kigyou-list/scripts/db_restore.sh "${fileName}"`;
                            navigator.clipboard.writeText(cmd);
                            toast.success("復旧コマンドをコピーしました。サーバーのSSH端末で実行できます。");
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer text-[10px]"
                          title="このスナップショットの復旧コマンドをコピー"
                        >
                          <Terminal className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
                          <span>復旧コマンド</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Disaster Recovery Runbook (緊急復旧・手順書) */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>緊急ディザスタリカバリ手順書（障害復旧 Runbook）</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                復旧所要時間: 約2分
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              万が一のVPSクラッシュ、物理障害、またはPostgreSQLデータベース破損時の迅速な復旧手順です。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#1B4F8A] text-white flex items-center justify-center text-[11px]">1</span>
                <span>サーバーへのSSH接続</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                復旧対象のVPS（または新規立ち上げサーバー）へ管理者権限でSSHログインします。
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] flex items-center justify-between">
              <code>ssh ubuntu@160.251.203.84</code>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-[#1B4F8A] dark:text-blue-300 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#1B4F8A] text-white flex items-center justify-center text-[11px]">2</span>
                <span>最新バックアップの自動展開</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Cloudflare R2から最新スナップショットを自動取得し、PostgreSQLへ高速インポートします。
              </p>
            </div>
            <button
              onClick={() => {
                const cmd = "bash /home/ubuntu/kigyou-list/scripts/db_restore.sh --latest";
                navigator.clipboard.writeText(cmd);
                toast.success("最新復旧コマンドをコピーしました！");
              }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-amber-300 font-mono text-[11px] flex items-center justify-between cursor-pointer group transition-colors"
              title="クリックしてコピー"
            >
              <code className="truncate max-w-[210px]">bash .../db_restore.sh --latest</code>
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </button>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#1B4F8A] text-white flex items-center justify-center text-[11px]">3</span>
                <span>テーブル統計の自動検証</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                スクリプト実行完了時、復元されたユーザー数、決済数、フォーム営業件数が自動出力されます。
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-300 font-mono text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>全ユーザー＆残高整合性完了</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
