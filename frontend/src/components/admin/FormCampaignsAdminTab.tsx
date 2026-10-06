"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Eye,
  ExternalLink,
  FileText,
  AlertTriangle,
  X,
  Search,
  Filter,
  Check,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Globe,
  Tag
} from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";

interface FormCampaignAdmin {
  id: string;
  user_email: string;
  title: string;
  status: "draft" | "pending_approval" | "approved" | "processing" | "completed" | "rejected" | "cancelled";
  target_count: number;
  template_id: string | null;
  pitch_subject: string;
  pitch_body: string;
  sender_company_name: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  sender_website: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface FormCampaignsAdminTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export function FormCampaignsAdminTab({ adminEmail, getAdminHeaders }: FormCampaignsAdminTabProps) {
  const [campaigns, setCampaigns] = useState<FormCampaignAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect Modal
  const [inspectCampaign, setInspectCampaign] = useState<FormCampaignAdmin | null>(null);

  // Reject Modal
  const [rejectingCampaign, setRejectingCampaign] = useState<FormCampaignAdmin | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(
    "営業メッセージ内に特定商取引法に基づく配信停止（オプトアウト）の記載または送信者情報の不備が見受けられました。"
  );
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`/api/admin/form-campaigns?status=${statusFilter}`, { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (e) {
      console.error("Failed to fetch campaigns for admin:", e);
    } finally {
      setLoading(false);
    }
  }, [getAdminHeaders, statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleReviewAction = async (campaignId: string, action: "approve" | "reject" | "complete", reason?: string) => {
    if (action === "approve") {
      if (!window.confirm("このキャンペーンを承認しますか？\n（承認後、配信システムが順次フォームへの自動送信を開始します）")) {
        return;
      }
    }

    setSubmittingAction(true);
    try {
      const headers = { ...getAdminHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/form-campaigns", {
        method: "POST",
        headers,
        body: JSON.stringify({
          campaignId,
          action,
          rejectionReason: reason || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(
          action === "approve"
            ? "キャンペーンを承認しました。配信キューに追加されました。"
            : action === "reject"
            ? "キャンペーンを却下しました。"
            : "キャンペーンを完了に設定しました。"
        );
        setRejectingCampaign(null);
        setInspectCampaign(null);
        fetchCampaigns();
      } else {
        alert(`操作に失敗しました: ${data.error || "エラーが発生しました"}`);
      }
    } catch (e: any) {
      alert(`通信エラー: ${e.message || "再試行してください"}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: FormCampaignAdmin["status"]) => {
    switch (status) {
      case "pending_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            審査待ち (Pending)
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            承認済み・配信待機 (Approved)
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            配信中 (Sending)
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Check className="w-3.5 h-3.5" />
            配信完了 (Completed)
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3.5 h-3.5" />
            却下・差し戻し (Rejected)
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            下書き (Draft)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchEmail = c.user_email?.toLowerCase().includes(q);
      const matchCompany = c.sender_company_name?.toLowerCase().includes(q);
      const matchSubject = c.pitch_subject?.toLowerCase().includes(q);
      if (!matchTitle && !matchEmail && !matchCompany && !matchSubject) return false;
    }
    return true;
  });

  const pendingCount = campaigns.filter((c) => c.status === "pending_approval").length;
  const approvedCount = campaigns.filter((c) => c.status === "approved" || c.status === "processing").length;
  const completedCount = campaigns.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>審査待ち (要確認)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingCount} <span className="text-xs font-normal text-slate-400">件</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>承認済み・配信中</span>
            <Send className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {approvedCount} <span className="text-xs font-normal text-slate-400">件</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>配信完了</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {completedCount} <span className="text-xs font-normal text-slate-400">件</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>総キャンペーン登録数</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {campaigns.length} <span className="text-xs font-normal text-slate-400">件</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter tabs & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "すべて", count: campaigns.length },
            { id: "pending_approval", label: "審査待ち", count: pendingCount, highlight: true },
            { id: "approved", label: "承認済み", count: campaigns.filter((c) => c.status === "approved").length },
            { id: "processing", label: "配信中", count: campaigns.filter((c) => c.status === "processing").length },
            { id: "completed", label: "配信完了", count: completedCount },
            { id: "rejected", label: "却下", count: campaigns.filter((c) => c.status === "rejected").length },
            { id: "draft", label: "下書き", count: campaigns.filter((c) => c.status === "draft").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : tab.highlight && tab.count > 0
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="キャンペーン名・Email・件名検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => fetchCampaigns()}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-50"
            title="再読み込み"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
            <p className="text-xs text-slate-500">キャンペーン情報を読み込み中...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs">該当するフォーム営業キャンペーンはありません。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">ステータス</th>
                  <th className="py-3 px-4">キャンペーン名 / 件名</th>
                  <th className="py-3 px-4">依頼主 (ユーザー)</th>
                  <th className="py-3 px-4">対象件数</th>
                  <th className="py-3 px-4">登録日時</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredCampaigns.map((camp) => (
                  <tr
                    key={camp.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                      camp.status === "pending_approval" ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(camp.status)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white max-w-sm truncate" title={camp.title}>
                        {camp.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm truncate mt-0.5" title={camp.pitch_subject}>
                        件名: {camp.pitch_subject || "（未設定）"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {camp.sender_company_name || "会社名未設定"}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {camp.user_email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {camp.target_count?.toLocaleString() || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">件</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {parseUTCDate(camp.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectCampaign(camp)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>詳細確認</span>
                        </button>

                        {camp.status === "pending_approval" && (
                          <>
                            <button
                              onClick={() => handleReviewAction(camp.id, "approve")}
                              disabled={submittingAction}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>承認</span>
                            </button>

                            <button
                              onClick={() => setRejectingCampaign(camp)}
                              disabled={submittingAction}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>却下</span>
                            </button>
                          </>
                        )}

                        {camp.status === "approved" && (
                          <button
                            onClick={() => handleReviewAction(camp.id, "complete")}
                            disabled={submittingAction}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>完了にする</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Campaign Modal */}
      {inspectCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-250">
            <button
              onClick={() => setInspectCampaign(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                キャンペーン詳細審査
              </span>
              {getStatusBadge(inspectCampaign.status)}
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">
              {inspectCampaign.title}
            </h3>

            {/* Sender Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs mb-4">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">送信元企業</span>
                <span className="font-bold text-slate-900 dark:text-white">{inspectCampaign.sender_company_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">担当者名</span>
                <span className="font-bold text-slate-900 dark:text-white">{inspectCampaign.sender_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">返信用メールアドレス</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{inspectCampaign.sender_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">電話番号</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{inspectCampaign.sender_phone || "未設定"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">WebサイトURL</span>
                {inspectCampaign.sender_website ? (
                  <a
                    href={inspectCampaign.sender_website.startsWith("http") ? inspectCampaign.sender_website : `https://${inspectCampaign.sender_website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>{inspectCampaign.sender_website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">未設定</span>
                )}
              </div>
            </div>

            {/* Pitch Subject & Body */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  営業件名 (Pitch Subject)
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
                  {inspectCampaign.pitch_subject}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  営業本文 (Pitch Message Body)
                </label>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                  {inspectCampaign.pitch_body}
                </div>
              </div>

              {inspectCampaign.rejection_reason && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                  <span className="font-bold block mb-1">却下理由:</span>
                  {inspectCampaign.rejection_reason}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInspectCampaign(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                閉じる
              </button>

              <div className="flex items-center gap-2">
                {inspectCampaign.status === "pending_approval" && (
                  <>
                    <button
                      onClick={() => setRejectingCampaign(inspectCampaign)}
                      disabled={submittingAction}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
                    >
                      却下する
                    </button>
                    <button
                      onClick={() => handleReviewAction(inspectCampaign.id, "approve")}
                      disabled={submittingAction}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>承認・配信キューへ</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <h4 className="text-base font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              キャンペーンの却下・差し戻し
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              顧客（{rejectingCampaign.user_email}）に表示する差し戻し理由を入力してください。
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-red-500 mb-4 leading-relaxed"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingCampaign(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction(rejectingCampaign.id, "reject", rejectionReason)}
                disabled={submittingAction || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>却下を確定する</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
