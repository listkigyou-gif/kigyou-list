"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  MessageSquareWarning, Eye, CheckCircle, Ban, Undo2, 
  Search, Filter, Loader2, Copy, Check, Mail, ExternalLink, RefreshCcw, CheckSquare, Square
} from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";
import { AdminConfirmModal } from "../AdminConfirmModal";

interface Inquiry {
  id: string;
  corporate_number: string;
  company_name: string;
  type: string;
  requester_email: string;
  message: string;
  status: string;
  created_at: string;
}

interface InquiriesTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
  onCountUpdate?: (pendingCount: number) => void;
}

export const InquiriesTab: React.FC<InquiriesTabProps> = ({
  adminEmail,
  getAdminHeaders,
  onCountUpdate,
}) => {
  const toast = useAdminToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Detail Modal
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const getInquiryTypeBadge = (type: string) => {
    switch (type) {
      case "hide":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
            非公開申請
          </span>
        );
      case "edit":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 bg-blue-100 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
            情報修正申請
          </span>
        );
      case "form_marketing":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40">
            フォーム営業相談
          </span>
        );
      case "billing":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
            料金・請求相談
          </span>
        );
      case "enterprise":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40">
            法人提携・API
          </span>
        );
      default:
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            一般お問い合わせ
          </span>
        );
    }
  };

  const getInquiryTypeLabel = (type: string) => {
    switch (type) {
      case "hide": return "企業掲載の非公開・削除依頼";
      case "edit": return "企業情報の修正・更新申請";
      case "form_marketing": return "問い合わせフォーム営業・配信代行相談";
      case "billing": return "料金プラン・請求書払い・領収書相談";
      case "enterprise": return "大口法人契約・API連携・事業提携";
      default: return "その他・一般お問い合わせ";
    }
  };

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inquiries", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = data.inquiries || [];
        setInquiries(list);
        const pending = list.filter((i: Inquiry) => i.status === "pending").length;
        onCountUpdate?.(pending);
      } else {
        toast.error("お問い合わせ一覧の取得に失敗しました。");
      }
    } catch {
      toast.error("サーバーとの通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleResolve = async (id: string, corporateNumber: string, action: "hide" | "unhide" | "resolve") => {
    const actionLabel = action === "hide" ? "非公開" : action === "unhide" ? "再公開" : "解決済み";
    setConfirmConfig({
      isOpen: true,
      title: `${actionLabel}処理の確認`,
      message: `このお問い合わせを「${actionLabel}」として処理しますか？`,
      variant: action === "hide" ? "danger" : "info",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch("/api/admin/inquiries", {
            method: "POST",
            headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ inquiryId: id, action, corporateNumber }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success(data.message || "処理が完了しました。");
            fetchInquiries();
          } else {
            toast.error(data.error || "処理に失敗しました。");
          }
        } catch {
          toast.error("通信エラーが発生しました。");
        }
      },
    });
  };

  const handleRollback = async (corporateNumber: string, inquiryId?: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "ロールバック（元に戻す）",
      message: "この変更を取り消し、元の状態に戻しますか？（非公開の場合は再公開されます）",
      variant: "warning",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch("/api/admin/rollback", {
            method: "POST",
            headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ 
              corporate_number: corporateNumber,
              action_type: "unhide",
              history_id: inquiryId
            }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success(data.message || "ロールバック処理が完了しました。");
            fetchInquiries();
            setSelectedInquiry(null);
          } else {
            toast.error(data.error || "ロールバック処理に失敗しました。");
          }
        } catch {
          toast.error("通信エラーが発生しました。");
        }
      },
    });
  };

  // Bulk Resolve
  const handleBulkResolve = async () => {
    if (selectedIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: "一括解決処理",
      message: `選択された ${selectedIds.length} 件の申請をすべて「解決済み」にしますか？`,
      variant: "info",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setBulkActionLoading(true);
        let successCount = 0;
        for (const id of selectedIds) {
          const item = inquiries.find(i => i.id === id);
          if (!item) continue;
          try {
            const res = await fetch("/api/admin/inquiries", {
              method: "POST",
              headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
              body: JSON.stringify({ inquiryId: id, action: "resolve", corporateNumber: item.corporate_number }),
            });
            if (res.ok) successCount++;
          } catch (e) {
            console.error("Bulk resolve error:", e);
          }
        }
        setBulkActionLoading(false);
        setSelectedIds([]);
        toast.success(`${successCount} 件の申請を解決済みに更新しました。`);
        fetchInquiries();
      },
    });
  };

  const copyText = async (text: string, isMsg: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isMsg) {
        setCopiedMsg(true);
        setTimeout(() => setCopiedMsg(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    } catch {
      toast.info("コピーできませんでした。");
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (statusFilter !== "all" && inq.status !== statusFilter) return false;
      if (typeFilter !== "all" && inq.type !== typeFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        inq.company_name?.toLowerCase().includes(term) ||
        inq.corporate_number?.toLowerCase().includes(term) ||
        inq.requester_email?.toLowerCase().includes(term) ||
        inq.message?.toLowerCase().includes(term)
      );
    });
  }, [inquiries, searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredInquiries.length / pageSize) || 1;
  const paginatedInquiries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInquiries.slice(start, start + pageSize);
  }, [filteredInquiries, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedInquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedInquiries.map(i => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-200">
      <AdminConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-rose-500" />
            <span>非公開・修正依頼・お問い合わせ一覧</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            全 {inquiries.length} 件（未対応: <span className="font-bold text-rose-600">{inquiries.filter(i => i.status === 'pending').length}</span> 件）
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="all">すべてのステータス</option>
              <option value="pending">未対応 (要審査)</option>
              <option value="auto_approved">自動承認済み</option>
              <option value="resolved">解決済み</option>
              <option value="rejected">非公開却下</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="all">すべての申請種別</option>
              <option value="hide">掲載非公開依頼</option>
              <option value="edit">企業情報修正申請</option>
              <option value="form_marketing">フォーム営業相談</option>
              <option value="billing">料金・請求相談</option>
              <option value="enterprise">法人提携・API</option>
              <option value="other">一般お問い合わせ</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="企業名 / 法人番号 / メール..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={fetchInquiries}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="再読み込み"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
            {selectedIds.length} 件選択中
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkResolve}
              disabled={bulkActionLoading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {bulkActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              一括解決にする
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
            >
              解除
            </button>
          </div>
        </div>
      )}

      {/* Inquiries Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 w-10">
                <button onClick={toggleSelectAll} className="cursor-pointer text-slate-400 hover:text-slate-600">
                  {selectedIds.length === paginatedInquiries.length && paginatedInquiries.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3">送信日時</th>
              <th className="px-4 py-3">企業名 / 法人番号</th>
              <th className="px-4 py-3">申請者</th>
              <th className="px-4 py-3 min-w-[280px] max-w-sm">お問い合わせ理由・内容</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && paginatedInquiries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : paginatedInquiries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  該当するお問い合わせはありません。
                </td>
              </tr>
            ) : (
              paginatedInquiries.map((inq) => {
                const isSelected = selectedIds.includes(inq.id);
                return (
                  <tr 
                    key={inq.id} 
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                      isSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <button onClick={() => toggleSelectOne(inq.id)} className="cursor-pointer text-slate-400 hover:text-slate-600">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-mono text-slate-700 dark:text-slate-300">
                        {parseUTCDate(inq.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate" title={inq.company_name}>
                        {inq.company_name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {inq.corporate_number}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={inq.requester_email}>
                        {inq.requester_email}
                      </div>
                      {getInquiryTypeBadge(inq.type)}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-normal min-w-[280px] max-w-sm">
                      <div 
                        onClick={() => setSelectedInquiry(inq)}
                        className="line-clamp-2 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-secondary cursor-pointer leading-relaxed transition-colors"
                        title="クリックして全文を表示"
                      >
                        {inq.message || "---"}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {inq.status === 'pending' ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold rounded-full text-[10px] inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          未対応
                        </span>
                      ) : inq.status === 'auto_approved' ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full text-[10px]">
                          自動承認済
                        </span>
                      ) : inq.status === 'rejected' ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold rounded-full text-[10px]">
                          却下
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full text-[10px]">
                          解決済み
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInquiry(inq)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="詳細"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          詳細
                        </button>

                        {inq.status === 'auto_approved' && (
                          <button
                            type="button"
                            onClick={() => handleRollback(inq.corporate_number, inq.id)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="ロールバック"
                          >
                            <Undo2 className="w-3 h-3 text-amber-600" />
                            戻す
                          </button>
                        )}

                        {inq.status === 'pending' && (
                          <>
                            {inq.type === 'hide' ? (
                              <button
                                type="button"
                                onClick={() => handleResolve(inq.id, inq.corporate_number, "unhide")}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="w-3 h-3" /> 再公開
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleResolve(inq.id, inq.corporate_number, "hide")}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3 h-3" /> 非公開
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleResolve(inq.id, inq.corporate_number, "resolve")}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" /> 解決
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400">
            {filteredInquiries.length} 件中 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredInquiries.length)} 件を表示
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 cursor-pointer"
            >
              前へ
            </button>
            <span className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 cursor-pointer"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-primary" />
                お問い合わせ・申請詳細
              </h3>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-0.5">対象企業</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedInquiry.company_name}</span>
                  <span className="font-mono text-[11px] text-slate-500 block">{selectedInquiry.corporate_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">申請種別</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {getInquiryTypeLabel(selectedInquiry.type)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-bold">申請者メールアドレス</span>
                  <button
                    onClick={() => copyText(selectedInquiry.requester_email, false)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedEmail ? "コピー済み" : "メールアドレスをコピー"}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800">
                  {selectedInquiry.requester_email}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-bold">申請理由・本文</span>
                  <button
                    onClick={() => copyText(selectedInquiry.message, true)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedMsg ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedMsg ? "コピー済み" : "本文をコピー"}
                  </button>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-slate-100 dark:border-slate-800">
                  {selectedInquiry.message || "(本文なし)"}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <a
                href={`/ja/company/${selectedInquiry.corporate_number}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <span>企業ページを開く</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
