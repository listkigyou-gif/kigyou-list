"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
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
} from "lucide-react";
import Link from "next/link";

interface ClaimRequestAdmin {
  id: number;
  corporate_number: string;
  company_name: string;
  website_url: string | null;
  company_phone: string | null;
  user_email: string;
  applicant_name: string;
  applicant_phone: string | null;
  department: string | null;
  document_type: string;
  document_url: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface ClaimsReviewTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export function ClaimsReviewTab({ adminEmail, getAdminHeaders }: ClaimsReviewTabProps) {
  const [claims, setClaims] = useState<ClaimRequestAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Reviewing modal states
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [rejectingClaim, setRejectingClaim] = useState<ClaimRequestAdmin | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(
    "提出書類が不鮮明または企業関係者様であることを確認できませんでした。"
  );
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`/api/admin/claims?status=${statusFilter}`, { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaims(data.claims || []);
      }
    } catch (e) {
      console.error("Failed to fetch claims for admin:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const handleReview = async (requestId: number, action: "approve" | "reject", reason?: string) => {
    if (action === "approve") {
      if (!window.confirm("この企業の公式オーナー認証を承認しますか？\n（認証バッジ付与、1日50件枠への拡大、通知メールが自動送信されます）")) {
        return;
      }
    }

    setSubmittingAction(true);
    try {
      const headers = { ...getAdminHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/claims/review", {
        method: "POST",
        headers,
        body: JSON.stringify({
          request_id: requestId,
          action,
          rejection_reason: reason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(action === "approve" ? "申請を承認しました。" : "申請を却下しました。");
        setRejectingClaim(null);
        fetchClaims();
      } else {
        alert(data.error || "処理に失敗しました。");
      }
    } catch {
      alert("通信エラーが発生しました。");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.company_name?.toLowerCase().includes(q) ||
      c.corporate_number.includes(q) ||
      c.applicant_name?.toLowerCase().includes(q) ||
      c.user_email?.toLowerCase().includes(q)
    );
  });

  const pendingCount = claims.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>企業公式オーナー認証 審査管理</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            名刺・登記簿等の書類審査申請の確認、承認、および却下処理を行います。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              未審査
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "approved"
                  ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              承認済
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "rejected"
                  ? "bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              却下
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              すべて
            </button>
          </div>

          <button
            onClick={fetchClaims}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="再読み込み"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="企業名、法人番号、申請者名、メールアドレスで検索..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 shadow-2xs"
        />
      </div>

      {/* Claims Table */}
      <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <p className="text-xs">審査データを取得中...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold">該当する申請データはありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">ID / 申請日時</th>
                  <th className="px-4 py-3.5">対象企業</th>
                  <th className="px-4 py-3.5">申請者情報</th>
                  <th className="px-4 py-3.5">提出書類</th>
                  <th className="px-4 py-3.5">補足・連絡事項</th>
                  <th className="px-4 py-3.5">ステータス</th>
                  <th className="px-4 py-3.5 text-right">審査アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 text-slate-500">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                        #{claim.id}
                      </span>
                      <span className="text-[10px]">
                        {new Date(claim.created_at).toLocaleString("ja-JP", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/ja/company/${claim.corporate_number}`}
                          target="_blank"
                          className="text-slate-900 dark:text-white hover:text-emerald-600 transition-colors flex items-center gap-1"
                        >
                          <span>{claim.company_name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-normal block mt-0.5">
                        {claim.corporate_number}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {claim.applicant_name}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {claim.department || "部署未指定"} | {claim.applicant_phone || "電話未記載"}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        {claim.user_email}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setPreviewDocUrl(claim.document_url)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {claim.document_type === "business_card"
                            ? "名刺画像を確認"
                            : claim.document_type === "registry"
                            ? "登記簿を確認"
                            : "添付書類を確認"}
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate" title={claim.notes || ""}>
                      {claim.notes || "-"}
                    </td>

                    <td className="px-4 py-3.5">
                      {claim.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          未審査
                        </span>
                      ) : claim.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          承認済
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3" />
                          却下
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {claim.status === "pending" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={submittingAction}
                            onClick={() => handleReview(claim.id, "approve")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            承認する
                          </button>
                          <button
                            type="button"
                            disabled={submittingAction}
                            onClick={() => setRejectingClaim(claim)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                          >
                            却下
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {claim.reviewed_by ? `審査者: ${claim.reviewed_by.split("@")[0]}` : "完了"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                提出書類プレビュー
              </h3>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-100 dark:bg-slate-900">
              {previewDocUrl.startsWith("data:application/pdf") ? (
                <iframe src={previewDocUrl} className="w-full h-[500px] rounded-xl border border-slate-300" />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="提出書類"
                  className="max-h-[600px] w-auto object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                申請の却下（見送り理由の入力）
              </h3>
              <button
                onClick={() => setRejectingClaim(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p>対象企業: <strong>{rejectingClaim.company_name}</strong></p>
              <p>申請者: <strong>{rejectingClaim.applicant_name}</strong> ({rejectingClaim.user_email})</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                却下理由（申請者へのメールに記載されます）
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingClaim(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleReview(rejectingClaim.id, "reject", rejectionReason)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "却下通知を送信する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
