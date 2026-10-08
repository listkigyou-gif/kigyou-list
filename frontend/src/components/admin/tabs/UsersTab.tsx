"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, Search, Filter, RefreshCcw, Download, 
  ShieldAlert, ShieldCheck, Edit3, Loader2, Phone, UserCheck,
  Send, Database, Plus, CheckCircle2, Sparkles, MessageSquare
} from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";
import { AdminConfirmModal } from "../AdminConfirmModal";

export interface UserAdminView {
  user_email: string;
  monthly_base_allowance: number;
  monthly_base_used: number;
  purchased_add_on_balance: number;
  plan: string;
  subscription_status?: string;
  updated_at: string;
  contact_person?: string | null;
  contact_phone?: string | null;
  // Form outreach quota/credits fields:
  form_credits_balance?: number;
  form_credits_purchased?: number;
  form_credits_used?: number;
}

interface UsersTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
  onCountUpdate?: (count: number) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  adminEmail,
  getAdminHeaders,
  onCountUpdate,
}) => {
  const toast = useAdminToast();
  const [usersList, setUsersList] = useState<UserAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hasFormCreditsOnly, setHasFormCreditsOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // CSV Quota Modal
  const [quotaModalUser, setQuotaModalUser] = useState<UserAdminView | null>(null);
  const [newAllowance, setNewAllowance] = useState<number>(0);
  const [newAddOn, setNewAddOn] = useState<number>(0);
  const [updatingQuota, setUpdatingQuota] = useState(false);

  // Plan Modal
  const [planModalUser, setPlanModalUser] = useState<UserAdminView | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [updatingPlan, setUpdatingPlan] = useState(false);

  // Form Outreach (フォーム営業) Credits Modal
  const [formCreditsModalUser, setFormCreditsModalUser] = useState<UserAdminView | null>(null);
  const [formCreditMode, setFormCreditMode] = useState<"add" | "set">("add");
  const [formAddAmount, setFormAddAmount] = useState<number>(1000);
  const [formDirectBalance, setFormDirectBalance] = useState<number>(0);
  const [formReason, setFormReason] = useState<string>("");
  const [updatingFormCredits, setUpdatingFormCredits] = useState(false);

  // Confirm Modal
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = data.users || [];
        setUsersList(list);
        onCountUpdate?.(list.length);
      } else {
        toast.error("ユーザー一覧の取得に失敗しました。");
      }
    } catch {
      toast.error("サーバーとの通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Update CSV Quota
  const handleSaveQuota = async () => {
    if (!quotaModalUser) return;
    setUpdatingQuota(true);
    try {
      const res = await fetch("/api/admin/users/quota", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: quotaModalUser.user_email,
          allowance: Number(newAllowance),
          addOnBalance: Number(newAddOn),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "CSVクォータを更新しました。");
        setQuotaModalUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || "クォータの更新に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setUpdatingQuota(false);
    }
  };

  // Update Plan
  const handleSavePlan = async () => {
    if (!planModalUser) return;
    setUpdatingPlan(true);
    try {
      const res = await fetch("/api/admin/users/plan", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: planModalUser.user_email,
          plan: selectedPlan,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "プランを変更しました。");
        setPlanModalUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || "プランの変更に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setUpdatingPlan(false);
    }
  };

  // Update Form Outreach Credits
  const handleSaveFormCredits = async () => {
    if (!formCreditsModalUser) return;
    setUpdatingFormCredits(true);
    try {
      const payload: any = {
        targetEmail: formCreditsModalUser.user_email,
        reason: formReason.trim() || undefined,
      };

      if (formCreditMode === "add") {
        if (!formAddAmount || formAddAmount <= 0) {
          toast.error("追加する枠数を正しく入力してください。");
          setUpdatingFormCredits(false);
          return;
        }
        payload.addCredits = Number(formAddAmount);
      } else {
        if (formDirectBalance < 0) {
          toast.error("残高は0以上で設定してください。");
          setUpdatingFormCredits(false);
          return;
        }
        payload.balance = Number(formDirectBalance);
      }

      const res = await fetch("/api/admin/users/form-credits", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "フォーム営業配信枠を更新しました。");
        setFormCreditsModalUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || "フォーム営業枠の更新に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setUpdatingFormCredits(false);
    }
  };

  // Suspend / Unsuspend
  const handleToggleSuspend = (targetUser: UserAdminView) => {
    const isSuspended = targetUser.subscription_status === "suspended";
    const actionLabel = isSuspended ? "利用制限を解除" : "アカウントをブロック（一時停止）";
    setConfirmConfig({
      isOpen: true,
      title: `${actionLabel}の確認`,
      message: `${targetUser.user_email} の${actionLabel}を実行しますか？`,
      variant: isSuspended ? "info" : "danger",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const endpoint = isSuspended ? "/api/admin/users/unsuspend" : "/api/admin/users/suspend";
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({
              targetEmail: targetUser.user_email,
              reason: isSuspended ? undefined : "Admin manual block",
            }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success(data.message || "ステータスを変更しました。");
            fetchUsers();
          } else {
            toast.error(data.error || "更新に失敗しました。");
          }
        } catch {
          toast.error("通信エラーが発生しました。");
        }
      },
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (usersList.length === 0) return;
    const headers = [
      "Email", "Plan", "Status", 
      "Monthly CSV Allowance", "Monthly CSV Used", "CSV Add-on Balance", 
      "Form Credits Balance", "Form Credits Used", "Form Credits Total Granted",
      "Contact Person", "Phone", "Updated At"
    ];
    const rows = filteredUsers.map(u => [
      `"${u.user_email}"`,
      `"${u.plan || "free"}"`,
      `"${u.subscription_status || "active"}"`,
      u.monthly_base_allowance,
      u.monthly_base_used,
      u.purchased_add_on_balance,
      u.form_credits_balance ?? 0,
      u.form_credits_used ?? 0,
      u.form_credits_purchased ?? 0,
      `"${u.contact_person || ""}"`,
      `"${u.contact_phone || ""}"`,
      `"${u.updated_at}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kigyou_users_with_form_credits_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ユーザー一覧（CSV枠 & フォーム枠）を出力しました。");
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter((usr) => {
      if (planFilter !== "all" && (usr.plan || "free") !== planFilter) return false;
      if (statusFilter !== "all") {
        const isSusp = usr.subscription_status === "suspended";
        if (statusFilter === "suspended" && !isSusp) return false;
        if (statusFilter === "active" && isSusp) return false;
      }
      if (hasFormCreditsOnly && (!usr.form_credits_balance || usr.form_credits_balance <= 0)) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        usr.user_email.toLowerCase().includes(term) ||
        usr.contact_person?.toLowerCase().includes(term) ||
        usr.contact_phone?.toLowerCase().includes(term)
      );
    });
  }, [usersList, searchTerm, planFilter, statusFilter, hasFormCreditsOnly]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

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

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>ユーザー・プラン & 配信枠管理</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            登録ユーザー数: 全 <span className="font-bold text-slate-800 dark:text-slate-200">{usersList.length}</span> 名 
            （CSV出力枠 および フォーム営業配信クレジットを直接調整できます）
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Plan Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="all">全プラン</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Form Credits Filter Toggle */}
          <button
            type="button"
            onClick={() => setHasFormCreditsOnly(!hasFormCreditsOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              hasFormCreditsOnly
                ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            }`}
            title="フォーム営業残高ありユーザーのみ表示"
          >
            <Send className="w-3.5 h-3.5" />
            <span>フォーム枠ありのみ</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="メール / 氏名 / 電話番号..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-44 sm:w-56"
            />
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="全項目CSVダウンロード"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            CSV
          </button>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="再読み込み"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">メールアドレス</th>
              <th className="px-4 py-3">プラン</th>
              <th className="px-4 py-3">担当者 / 連絡先</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3 text-center border-l border-slate-200 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-950/10" colSpan={3}>
                CSV出力枠 (ダウンロード)
              </th>
              <th className="px-4 py-3 text-center border-l border-slate-200 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/10" colSpan={2}>
                フォーム営業 (配信枠)
              </th>
              <th className="px-4 py-3 border-l border-slate-200 dark:border-slate-800">最終更新</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
            <tr className="text-[10px] text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-800">
              <th colSpan={4}></th>
              <th className="px-3 py-1 font-semibold border-l border-slate-200 dark:border-slate-800">基本枠</th>
              <th className="px-3 py-1 font-semibold">使用済</th>
              <th className="px-3 py-1 font-semibold">追加枠</th>
              <th className="px-3 py-1 font-semibold border-l border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">配信残高</th>
              <th className="px-3 py-1 font-semibold text-slate-500">送信済</th>
              <th colSpan={2}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                  該当するユーザーはいません。
                </td>
              </tr>
            ) : (
              paginatedUsers.map((usr) => (
                <tr key={usr.user_email} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {usr.user_email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      usr.plan === "pro"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : usr.plan === "business"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          : usr.plan === "enterprise"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                      {usr.plan || "free"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {usr.contact_person || usr.contact_phone ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {usr.contact_person || "-"}
                        </span>
                        {usr.contact_phone && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {usr.contact_phone}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">未設定</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {usr.subscription_status === "suspended" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 inline-flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> 一時停止中
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> 有効
                      </span>
                    )}
                  </td>

                  {/* CSV Export Quota Columns */}
                  <td className="px-3 py-3 font-mono font-bold text-primary dark:text-secondary border-l border-slate-100 dark:border-slate-800/80">
                    {usr.monthly_base_allowance.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-700 dark:text-slate-300">
                    {usr.monthly_base_used.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{usr.purchased_add_on_balance.toLocaleString()}
                  </td>

                  {/* Form Outreach Columns */}
                  <td className="px-3 py-3 border-l border-slate-100 dark:border-slate-800/80">
                    {(usr.form_credits_balance ?? 0) > 0 ? (
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                        {(usr.form_credits_balance ?? 0).toLocaleString()} <span className="text-[9px] font-semibold">件</span>
                      </span>
                    ) : (
                      <span className="font-mono text-slate-400">0 件</span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-500">
                    {(usr.form_credits_used ?? 0).toLocaleString()} <span className="text-[9px]">件</span>
                  </td>

                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px] border-l border-slate-100 dark:border-slate-800/80">
                    {parseUTCDate(usr.updated_at).toLocaleDateString("ja-JP", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Action Buttons */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* CSV Quota */}
                      <button
                        onClick={() => {
                          setQuotaModalUser(usr);
                          setNewAllowance(usr.monthly_base_allowance);
                          setNewAddOn(usr.purchased_add_on_balance);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                        title="CSVダウンロード枠の調整"
                      >
                        CSV枠
                      </button>

                      {/* Form Outreach Credits */}
                      <button
                        onClick={() => {
                          setFormCreditsModalUser(usr);
                          setFormCreditMode("add");
                          setFormAddAmount(1000);
                          setFormDirectBalance(usr.form_credits_balance ?? 0);
                          setFormReason("");
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 font-bold rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-1 shadow-2xs"
                        title="フォーム営業配信枠の付与・調整"
                      >
                        <Send className="w-3 h-3 text-indigo-500" />
                        <span>フォーム枠</span>
                      </button>

                      {/* Plan Change */}
                      <button
                        onClick={() => {
                          setPlanModalUser(usr);
                          setSelectedPlan(usr.plan || "free");
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                        title="契約プラン変更"
                      >
                        プラン
                      </button>

                      {/* Block / Unblock */}
                      <button
                        onClick={() => handleToggleSuspend(usr)}
                        className={`px-2.5 py-1 font-bold rounded-lg transition-colors cursor-pointer text-[11px] ${
                          usr.subscription_status === "suspended"
                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
                        }`}
                        title={usr.subscription_status === "suspended" ? "制限解除" : "アカウント停止"}
                      >
                        {usr.subscription_status === "suspended" ? "解除" : "停止"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400">
            {filteredUsers.length} 件中 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredUsers.length)} 件を表示
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

      {/* ========================================================================= */}
      {/* Form Outreach (フォーム営業) Credits Management Modal */}
      {/* ========================================================================= */}
      {formCreditsModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  フォーム営業 配信枠・クレジット管理
                </h3>
                <p className="text-xs text-slate-500 font-mono truncate">
                  対象: {formCreditsModalUser.user_email}
                </p>
              </div>
            </div>

            {/* Current Balance Overview */}
            <div className="grid grid-cols-3 gap-3 mb-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">現在の利用可能残高</span>
                <span className="text-base font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {(formCreditsModalUser.form_credits_balance ?? 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">件</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">累計送信実績</span>
                <span className="text-base font-mono font-bold text-slate-700 dark:text-slate-300">
                  {(formCreditsModalUser.form_credits_used ?? 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">件</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">累計付与・購入数</span>
                <span className="text-base font-mono font-bold text-slate-500">
                  {(formCreditsModalUser.form_credits_purchased ?? 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">件</span>
              </div>
            </div>

            {/* Operation Mode Tabs */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormCreditMode("add")}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  formCreditMode === "add"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>枠を追加付与 (加算)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormCreditMode("set")}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  formCreditMode === "set"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>残高を直接指定</span>
              </button>
            </div>

            {/* Mode 1: Quick Add Packs */}
            {formCreditMode === "add" && (
              <div className="space-y-4 text-xs mb-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                    クイック追加パッケージ (配信件数)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[500, 1000, 3000, 5000, 10000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setFormAddAmount(amount)}
                        className={`p-2 rounded-xl text-center border font-mono font-bold transition-all cursor-pointer ${
                          formAddAmount === amount
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-600 dark:text-indigo-300 shadow-2xs"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        +{amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    追加する件数を直接入力
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formAddAmount}
                    onChange={(e) => setFormAddAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    付与後の残高: <strong className="text-slate-800 dark:text-slate-200 font-mono">{((formCreditsModalUser.form_credits_balance ?? 0) + formAddAmount).toLocaleString()}</strong> 件
                  </p>
                </div>
              </div>
            )}

            {/* Mode 2: Direct Set */}
            {formCreditMode === "set" && (
              <div className="space-y-4 text-xs mb-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    変更後の残高を指定 (件数)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formDirectBalance}
                    onChange={(e) => setFormDirectBalance(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Reason input for audit logs */}
            <div className="mb-4 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                変更理由（管理者監査ログに保存されます）
              </label>
              <input
                type="text"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="例: 有料プラン契約に伴う手動付与、テスト送信枠の提供、補填対応など"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFormCreditsModalUser(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={updatingFormCredits}
                onClick={handleSaveFormCredits}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm active:scale-98"
              >
                {updatingFormCredits ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{formCreditMode === "add" ? `+${formAddAmount.toLocaleString()} 件を付与する` : "残高を更新する"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CSV Quota Modal */}
      {/* ========================================================================= */}
      {quotaModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              CSV出力クォータの変更
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-mono truncate">
              対象: {quotaModalUser.user_email}
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  月間基本枠 (Monthly Allowance)
                </label>
                <input
                  type="number"
                  value={newAllowance}
                  onChange={(e) => setNewAllowance(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  追加残高 (Purchased Add-on Balance)
                </label>
                <input
                  type="number"
                  value={newAddOn}
                  onChange={(e) => setNewAddOn(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setQuotaModalUser(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={updatingQuota}
                onClick={handleSaveQuota}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {updatingQuota && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Plan Modal */}
      {/* ========================================================================= */}
      {planModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              契約プランの変更
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-mono truncate">
              対象: {planModalUser.user_email}
            </p>

            <div className="space-y-2 text-xs">
              {["free", "pro", "business", "enterprise"].map((planOption) => (
                <label
                  key={planOption}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedPlan === planOption
                      ? "border-primary bg-primary/5 text-primary font-bold dark:border-secondary dark:bg-secondary/10 dark:text-secondary"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className="uppercase text-xs">{planOption}</span>
                  <input
                    type="radio"
                    name="plan"
                    value={planOption}
                    checked={selectedPlan === planOption}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="accent-primary"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPlanModalUser(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={updatingPlan}
                onClick={handleSavePlan}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {updatingPlan && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                プランを更新
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
