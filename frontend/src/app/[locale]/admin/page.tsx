"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldAlert, Plus, Ticket, Loader2, RefreshCcw, Users, MessageSquareWarning, CheckCircle, Ban, Download, CreditCard, History, Building2, Terminal, Database } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";

interface Coupon {
  code: string;
  discount_percent: number;
  expires_at: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface AdminActionLog {
  id: string;
  admin_email: string;
  action_type: string;
  target_identifier: string;
  details_json: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UserAdminView {
  user_email: string;
  monthly_base_allowance: number;
  monthly_base_used: number;
  purchased_add_on_balance: number;
  plan: string;
  subscription_status?: string;
  updated_at: string;
  contact_person?: string | null;
  contact_phone?: string | null;
}

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

interface ExportJobAdminView {
  id: string;
  user_email: string;
  status: "pending" | "processing" | "completed" | "failed";
  filters_json: string | null;
  records_count: number;
  file_path: string | null;
  error_message: string | null;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

interface PaymentAdminView {
  id: string;
  user_email: string;
  pack_id: string;
  amount_jpy: number;
  lines_added: number;
  status: string;
  invoice_url: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

interface BackupLog {
  id: string;
  backup_time: string;
  status: string;
  file_name: string | null;
  file_size: string | null;
  error_message: string | null;
}

export default function AdminPage() {
  const { isLoggedIn, user, setAuthModalOpen } = useAuth();

  const getAdminHeaders = useCallback(() => {
    const secret = typeof window !== "undefined" ? localStorage.getItem("kigyou_admin_secret") || "" : "";
    return {
      "x-admin-email": user?.email || "",
      "x-admin-secret": secret
    };
  }, [user?.email]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"coupons" | "users" | "inquiries" | "exports" | "payments" | "logs" | "partners" | "apiKeys" | "backups">("logs");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [usersList, setUsersList] = useState<UserAdminView[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJobAdminView[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentAdminView[]>([]);
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [runningBackup, setRunningBackup] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [searchTermExports, setSearchTermExports] = useState("");
  const [searchTermPayments, setSearchTermPayments] = useState("");
  const [searchTermLogs, setSearchTermLogs] = useState("");
  const [searchTermApiKeys, setSearchTermApiKeys] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState("all");

  // Coupon form
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("60");
  const [newMaxUses, setNewMaxUses] = useState("100");
  const [newDaysValid, setNewDaysValid] = useState("30");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Plan Edit Modal States
  const [planEditUser, setPlanEditUser] = useState<{ email: string; currentPlan: string } | null>(null);
  const [selectedPlanToUpdate, setSelectedPlanToUpdate] = useState<string>("free");
  const [updatingPlan, setUpdatingPlan] = useState(false);

  // API Key Status Edit Modal States
  const [apiKeyStatusModal, setApiKeyStatusModal] = useState<{
    keyId: string;
    currentStatus: string;
    targetEmail: string;
    keyPreview: string;
  } | null>(null);
  const [apiKeyStatusReason, setApiKeyStatusReason] = useState("");
  const [submittingApiKeyStatus, setSubmittingApiKeyStatus] = useState(false);

  const fetchDataRef = useRef<() => void>(undefined);

  const fetchData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const headers = getAdminHeaders();

      const [resCoupons, resUsers, resInquiries, resExports, resPayments, resLogs, resPartners, resApiKeys, resBackups] = await Promise.all([
        fetch("/api/coupon/admin", { headers }),
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/inquiries", { headers }),
        fetch("/api/admin/exports", { headers }),
        fetch("/api/admin/payments", { headers }),
        fetch("/api/admin/logs", { headers }),
        fetch("/api/admin/partners", { headers }),
        fetch("/api/admin/apikeys", { headers }),
        fetch("/api/admin/backups", { headers })
      ]);

      if (
        resCoupons.status === 403 ||
        resUsers.status === 403 ||
        resInquiries.status === 403 ||
        resExports.status === 403 ||
        resPayments.status === 403 ||
        resLogs.status === 403 ||
        resPartners.status === 403 ||
        resApiKeys.status === 403 ||
        resBackups.status === 403
      ) {
        const passcode = prompt("Nhập mã bảo mật Admin (Admin Secret Passcode) để xác thực truy cập:");
        if (passcode) {
          localStorage.setItem("kigyou_admin_secret", passcode);
          setTimeout(() => fetchDataRef.current?.(), 50);
          return;
        }
      }

      if (resCoupons.ok && resUsers.ok && resInquiries.ok && resExports.ok && resPayments.ok && resLogs.ok && resPartners.ok && resApiKeys.ok && resBackups.ok) {
        const dataCoupons = await resCoupons.json();
        const dataUsers = await resUsers.json();
        const dataInquiries = await resInquiries.json();
        const dataExports = await resExports.json();
        const dataPayments = await resPayments.json();
        const dataLogs = await resLogs.json();
        const dataPartners = await resPartners.json();
        const dataApiKeys = await resApiKeys.json();
        const dataBackups = await resBackups.json();

        setCoupons(dataCoupons.coupons || []);
        setUsersList(dataUsers.users || []);
        setInquiries(dataInquiries.inquiries || []);
        setExportJobs(dataExports.jobs || []);
        setPaymentHistory(dataPayments.payments || []);
        setLogs(dataLogs.logs || []);
        setPartners(dataPartners.partners || []);
        setApiKeys(dataApiKeys.apiKeys || []);
        setBackups(dataBackups.backups || []);
        setError(null);
      } else {
        setError("Không thể lấy dữ liệu. Hãy kiểm tra quyền truy cập.");
      }
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }, [user, getAdminHeaders]);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  const runBackupNow = async () => {
    if (runningBackup) return;
    setRunningBackup(true);
    setBackupMessage(null);
    try {
      const headers = getAdminHeaders();
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupMessage({ type: 'success', text: 'バックアップが正常に完了しました。' });
        setBackups(data.backups || []);
      } else {
        setBackupMessage({ type: 'error', text: data.error || 'バックアップ実行中にエラーが発生しました。' });
        if (data.backups) {
          setBackups(data.backups);
        }
      }
    } catch (err) {
      setBackupMessage({ type: 'error', text: 'ネットワークエラーが発生しました。' });
    } finally {
      setRunningBackup(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!user?.email || !planEditUser) return;

    setUpdatingPlan(true);
    try {
      const res = await fetch("/api/admin/users/plan", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: planEditUser.email, plan: selectedPlanToUpdate })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "プランの更新が完了しました。");
        setPlanEditUser(null);
        fetchData();
      } else {
        alert(data.error || "プランの更新に失敗しました。");
      }
    } catch {
      alert("接続エラーが発生しました。");
    } finally {
      setUpdatingPlan(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isLoggedIn && user?.email) {
      const email = user.email.toLowerCase().trim();
      const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "trungkim8694@gmail.com";
      const allowedAdmins = adminEmailsEnv.split(",").map(e => e.trim().toLowerCase());
      if (allowedAdmins.includes(email)) {
        fetchData();
      } else {
        setError("Bạn không có quyền truy cập trang này.");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user, fetchData]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setCreating(true);
    setCreateMsg(null);
    try {
      const payload = {
        code: newCode,
        discountPercent: parseInt(newDiscount),
        maxUses: parseInt(newMaxUses),
        daysValid: parseInt(newDaysValid)
      };
      const res = await fetch("/api/coupon/admin", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setCreateMsg({ type: 'success', text: "クーポンコードの作成が完了しました。" });
        setNewCode("");
        fetchData();
      } else {
        setCreateMsg({ type: 'error', text: data.error || "クーポンの作成に失敗しました。" });
      }
    } catch {
      setCreateMsg({ type: 'error', text: "サーバーへの接続エラーが発生しました。" });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateQuota = async (targetEmail: string, currentAllowance: number, currentAddOn: number) => {
    if (!user?.email) return;
    const newAllowance = prompt(`${targetEmail} の新しい月間基本クォータ (Monthly Base) を入力してください:`, String(currentAllowance));
    if (newAllowance === null) return;

    const allowanceNum = parseInt(newAllowance);
    if (isNaN(allowanceNum)) {
      alert("クォータの値が不正です。");
      return;
    }

    const newAddOn = prompt(`${targetEmail} の新しい追加枠 (Add-on Balance) を入力してください:`, String(currentAddOn));
    if (newAddOn === null) return;

    const addOnNum = parseInt(newAddOn);
    if (isNaN(addOnNum)) {
      alert("追加枠の値が不正です。");
      return;
    }

    try {
      const res = await fetch("/api/admin/users/quota", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, allowance: allowanceNum, addOnBalance: addOnNum })
      });
      if (res.ok) {
        alert("更新が完了しました。");
        fetchData();
      } else {
        alert("更新に失敗しました。");
      }
    } catch {
      alert("接続エラーが発生しました。");
    }
  };

  const handleSuspendUser = async (targetEmail: string) => {
    if (!user?.email) return;
    const reason = prompt(`${targetEmail} をブロックする理由を入力してください:`);
    if (reason === null) return;

    try {
      const res = await fetch("/api/admin/users/suspend", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, reason })
      });
      if (res.ok) {
        alert("アカウントを一時停止しました。");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "処理に失敗しました。");
      }
    } catch {
      alert("接続エラーが発生しました。");
    }
  };

  const handleUnsuspendUser = async (targetEmail: string) => {
    if (!user?.email) return;
    if (!window.confirm(`${targetEmail} のブロックを解除しますか？`)) return;

    try {
      const res = await fetch("/api/admin/users/unsuspend", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail })
      });
      if (res.ok) {
        alert("ブロックを解除しました。");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "処理に失敗しました。");
      }
    } catch {
      alert("接続エラーが発生しました。");
    }
  };

  const handleResolveInquiry = async (id: string, corporateNumber: string, action: "resolve" | "hide" | "unhide") => {
    if (!user?.email) return;
    let confirmMsg = "この問い合わせを解決済みにしますか？";
    if (action === "hide") confirmMsg = "この企業を検索結果から非公開にしますか？";
    if (action === "unhide") confirmMsg = "この企業を再公開しますか？";

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/inquiries/resolve", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, corporate_number: corporateNumber })
      });
      if (res.ok) {
        alert("処理が完了しました。");
        fetchData();
      } else {
        alert("処理エラーが発生しました。");
      }
    } catch {
      alert("接続エラーが発生しました。");
    }
  };

  const handleTogglePartnerFeatured = async (targetEmail: string, currentFeatured: boolean) => {
    if (!user?.email) return;
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, isFeatured: !currentFeatured })
      });
      const data = await res.json();
      if (res.ok) {
        setPartners(prev => prev.map(p => p.user_email === targetEmail ? { ...p, is_featured_partner: !currentFeatured } : p));
        alert("掲載ステータスを更新しました。");
      } else {
        alert(data.error || "更新に失敗しました。");
      }
    } catch {
      alert("接続エラーが発生しました。");
    }
  };

  const handleUpdateApiKeyStatus = (keyId: string, currentStatus: string, targetEmail: string, keyPreview: string) => {
    setApiKeyStatusReason(""); // Reset
    setApiKeyStatusModal({ keyId, currentStatus, targetEmail, keyPreview });
  };

  const submitApiKeyStatusUpdate = async () => {
    if (!apiKeyStatusModal) return;
    const { keyId, currentStatus, targetEmail, keyPreview } = apiKeyStatusModal;
    const nextStatus = currentStatus === "active" ? "revoked" : "active";

    setSubmittingApiKeyStatus(true);
    try {
      const res = await fetch("/api/admin/apikeys", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId,
          status: nextStatus,
          targetEmail,
          keyPreview,
          reason: apiKeyStatusReason.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "APIキーの更新が完了しました。");
        setApiKeyStatusModal(null);
        fetchData();
      } else {
        alert(data.error || "APIキーの更新に失敗しました。");
      }
    } catch {
      alert("接続エラーが発生しました。");
    } finally {
      setSubmittingApiKeyStatus(false);
    }
  };


  if (!mounted || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold mb-4">管理者アカウントでログインしてください</h2>
          <button onClick={() => setAuthModalOpen(true)} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">ログインする</button>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
          <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{error}</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-2">システムの統合管理を行います。</p>
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors" title="Refresh">
            <RefreshCcw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'logs' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <History className="w-4 h-4" /> 操作ログ
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Users className="w-4 h-4" /> ユーザー管理
          </button>
          <button
            onClick={() => setActiveTab("coupons")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'coupons' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Ticket className="w-4 h-4" /> クーポン管理
          </button>
          <button
            onClick={() => setActiveTab("exports")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'exports' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Download className="w-4 h-4" /> CSV出力履歴
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <CreditCard className="w-4 h-4" /> 決済・インボイス履歴
          </button>
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'inquiries' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <MessageSquareWarning className="w-4 h-4" /> 非公開・修正依頼
            {inquiries.filter(i => i.status === 'pending').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{inquiries.filter(i => i.status === 'pending').length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("partners")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'partners' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Building2 className="w-4 h-4" /> パートナーロゴ
          </button>
          <button
            onClick={() => setActiveTab("apiKeys")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'apiKeys' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Terminal className="w-4 h-4" /> APIキー管理
          </button>
          <button
            onClick={() => setActiveTab("backups")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'backups' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Database className="w-4 h-4" /> バックアップ履歴
          </button>
        </div>

        {/* Inquiries Tab */}
        {activeTab === "inquiries" && (
          <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">非公開・修正依頼一覧</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">送信日時</th>
                    <th className="px-4 py-3">企業名 / 法人番号</th>
                    <th className="px-4 py-3">申請者</th>
                    <th className="px-4 py-3">お問い合わせ理由・内容</th>
                    <th className="px-4 py-3">ステータス</th>
                    <th className="px-4 py-3 rounded-tr-lg">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inquiries.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">お問い合わせはまだありません。</td></tr>
                  ) : inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3">
                        {parseUTCDate(inq.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} (JST)
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold">{inq.company_name}</div>
                        <div className="text-xs text-slate-500">{inq.corporate_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        {inq.requester_email}
                        <div className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded inline-block mt-1">
                          {inq.type === 'hide' ? '非公開申請' : '修正・その他'}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" title={inq.message}>{inq.message}</td>
                      <td className="px-4 py-3">
                        {inq.status === 'pending' ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 text-[10px] font-bold rounded-full">未対応</span>
                        ) : inq.status === 'rejected' ? (
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 text-[10px] font-bold rounded-full">非公開却下 (再公開済み)</span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 text-[10px] font-bold rounded-full">解決済み</span>
                        )}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {inq.status === 'pending' && (
                          <>
                            {inq.type === 'hide' ? (
                              <button onClick={() => handleResolveInquiry(inq.id, inq.corporate_number, "unhide")} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded transition-colors flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> 再公開
                              </button>
                            ) : (
                              <button onClick={() => handleResolveInquiry(inq.id, inq.corporate_number, "hide")} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded transition-colors flex items-center gap-1">
                                <Ban className="w-3 h-3" /> 企業を非公開にする
                              </button>
                            )}
                            <button onClick={() => handleResolveInquiry(inq.id, inq.corporate_number, "resolve")} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold rounded transition-colors flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> 解決とする
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">ユーザー・プラン管理</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">メールアドレス</th>
                    <th className="px-4 py-3">プラン</th>
                    <th className="px-4 py-3">担当者 / 連絡先</th>
                    <th className="px-4 py-3">ステータス</th>
                    <th className="px-4 py-3">クォータ (月間基本)</th>
                    <th className="px-4 py-3">使用済み</th>
                    <th className="px-4 py-3">追加枠 (Add-on)</th>
                    <th className="px-4 py-3">更新日時</th>
                    <th className="px-4 py-3 rounded-tr-lg">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">登録ユーザーがいません。</td></tr>
                  ) : usersList.map((usr) => (
                    <tr key={usr.user_email} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-bold">{usr.user_email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${usr.plan === "pro"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : usr.plan === "business"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                              : usr.plan === "enterprise"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                          {usr.plan || "free"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {usr.contact_person || usr.contact_phone ? (
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {usr.contact_person || "-"}
                            </span>
                            {usr.contact_phone && (
                              <span className="text-[10px] text-slate-450 dark:text-slate-400 font-mono">
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                            一時停止中
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            有効
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-primary font-bold">{usr.monthly_base_allowance.toLocaleString()}</td>
                      <td className="px-4 py-3">{usr.monthly_base_used.toLocaleString()}</td>
                      <td className="px-4 py-3 text-secondary font-bold">+{usr.purchased_add_on_balance.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {parseUTCDate(usr.updated_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} (JST)
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => handleUpdateQuota(usr.user_email, usr.monthly_base_allowance, usr.purchased_add_on_balance)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold rounded transition-colors">
                          クォータ変更
                        </button>
                        <button
                          onClick={() => {
                            setPlanEditUser({ email: usr.user_email, currentPlan: usr.plan || "free" });
                            setSelectedPlanToUpdate(usr.plan || "free");
                          }}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/25 text-primary dark:text-secondary text-xs font-bold rounded transition-colors"
                        >
                          プラン変更
                        </button>
                        {usr.subscription_status === "suspended" ? (
                          <button
                            onClick={() => handleUnsuspendUser(usr.user_email)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded transition-colors"
                          >
                            ブロック解除
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendUser(usr.user_email)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded transition-colors"
                          >
                            ブロック
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" /> 新規クーポン作成
            </h2>
            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">クーポンコード (例: LAUNCH60)</label>
                <input required value={newCode} onChange={e => setNewCode(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">割引率 (%)</label>
                <input required value={newDiscount} onChange={e => setNewDiscount(e.target.value)} type="number" min="1" max="100" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">最大利用回数</label>
                <input required value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} type="number" min="1" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">有効日数</label>
                <input required value={newDaysValid} onChange={e => setNewDaysValid(e.target.value)} type="number" min="1" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-4 flex items-center justify-between mt-2">
                <div className="text-xs font-bold">
                  {createMsg && <span className={createMsg.type === 'success' ? "text-emerald-500" : "text-rose-500"}>{createMsg.text}</span>}
                </div>
                <button type="submit" disabled={creating} className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} クーポン作成
                </button>
              </div>
            </form>

            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-500" /> アクティブクーポン一覧
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">コード</th>
                    <th className="px-4 py-3">割引率</th>
                    <th className="px-4 py-3">利用回数 / 上限</th>
                    <th className="px-4 py-3">有効期限</th>
                    <th className="px-4 py-3 rounded-tr-lg">ステータス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {coupons.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">クーポンはまだ作成されていません。</td></tr>
                  ) : coupons.map((coupon) => {
                    const isExpired = parseUTCDate(coupon.expires_at) < new Date();
                    const isMaxed = coupon.used_count >= coupon.max_uses;
                    const isValid = !isExpired && !isMaxed && coupon.is_active;

                    return (
                      <tr key={coupon.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-black text-primary dark:text-secondary">{coupon.code}</td>
                        <td className="px-4 py-3 font-bold">{coupon.discount_percent}%</td>
                        <td className="px-4 py-3"><span className={isMaxed ? "text-rose-500 font-bold" : ""}>{coupon.used_count}</span> / {coupon.max_uses}</td>
                        <td className="px-4 py-3">
                          <span className={isExpired ? "text-rose-500 font-bold" : ""}>
                            {parseUTCDate(coupon.expires_at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isValid ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-full">有効</span>
                          ) : (
                            <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold rounded-full">{isExpired ? "期限切れ" : isMaxed ? "上限到達" : "無効"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Exports Tab */}
        {activeTab === "exports" && (
          <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold">ユーザーのCSVエクスポート履歴</h2>
              <input
                type="text"
                placeholder="メールアドレスまたはエクスポートIDで検索..."
                value={searchTermExports}
                onChange={(e) => setSearchTermExports(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">ユーザー</th>
                    <th className="px-4 py-3">タスクID / 実行日時 (JST)</th>
                    <th className="px-4 py-3">ダウンロード期限 (7日間)</th>
                    <th className="px-4 py-3">出力行数</th>
                    <th className="px-4 py-3">適用フィルター</th>
                    <th className="px-4 py-3">接続元情報 (IP / UA)</th>
                    <th className="px-4 py-3">ステータス</th>
                    <th className="px-4 py-3 rounded-tr-lg">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {exportJobs
                    .filter((job) => {
                      const term = searchTermExports.toLowerCase();
                      return (
                        job.user_email.toLowerCase().includes(term) ||
                        job.id.toLowerCase().includes(term)
                      );
                    })
                    .length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        該当する出力履歴がありません。
                      </td>
                    </tr>
                  ) : (
                    exportJobs
                      .filter((job) => {
                        const term = searchTermExports.toLowerCase();
                        return (
                          job.user_email.toLowerCase().includes(term) ||
                          job.id.toLowerCase().includes(term)
                        );
                      })
                      .map((job) => {
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
                          <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">
                              {job.user_email}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                                {job.id}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {formattedDate} (JST)
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs">
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
                            <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {job.records_count.toLocaleString()} 行
                            </td>
                            <td className="px-4 py-3 text-xs max-w-xs truncate" title={formatFilters(job.filters_json)}>
                              {formatFilters(job.filters_json)}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                {job.ip_address || "---"}
                              </div>
                              <UserAgentCell userAgent={job.user_agent} />
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${job.status === "completed"
                                  ? isExpired
                                    ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : job.status === "processing"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : job.status === "pending"
                                      ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                }`}>
                                {job.status === "completed"
                                  ? isExpired
                                    ? "期限切れ (削除済み)"
                                    : "成功"
                                  : job.status === "processing"
                                    ? "処理中..."
                                    : job.status === "pending"
                                      ? "待機中"
                                      : "失敗"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {job.status === "completed" ? (
                                isExpired ? (
                                  <span className="text-xs text-slate-400 italic">ストレージから削除済み (保存期間7日間)</span>
                                ) : (
                                  <a
                                    href={`/api/export/download?id=${job.id}&email=${encodeURIComponent(user?.email || "")}`}
                                    className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded transition-colors inline-flex items-center gap-1.5"
                                  >
                                    <Download className="w-3 h-3" /> ZIPダウンロード
                                  </a>
                                )
                              ) : job.status === "failed" ? (
                                <span className="text-xs text-rose-500 font-semibold" title={job.error_message || ""}>
                                  エラー: {job.error_message || "不明なエラー"}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">実行中...</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold">決済履歴＆インボイス照会</h2>
              <input
                type="text"
                placeholder="メールアドレスまたは取引IDで検索..."
                value={searchTermPayments}
                onChange={(e) => setSearchTermPayments(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">ユーザー</th>
                    <th className="px-4 py-3">取引ID / 決済日時 (JST)</th>
                    <th className="px-4 py-3">購入プラン・パック</th>
                    <th className="px-4 py-3">付与クレジット</th>
                    <th className="px-4 py-3">決済金額 (JPY)</th>
                    <th className="px-4 py-3">接続元情報 (IP / UA)</th>
                    <th className="px-4 py-3">ステータス</th>
                    <th className="px-4 py-3 rounded-tr-lg">インボイス (領収書)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paymentHistory
                    .filter((pay) => {
                      const term = searchTermPayments.toLowerCase();
                      return (
                        pay.user_email.toLowerCase().includes(term) ||
                        pay.id.toLowerCase().includes(term)
                      );
                    })
                    .length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        該当する決済履歴がありません。
                      </td>
                    </tr>
                  ) : (
                    paymentHistory
                      .filter((pay) => {
                        const term = searchTermPayments.toLowerCase();
                        return (
                          pay.user_email.toLowerCase().includes(term) ||
                          pay.id.toLowerCase().includes(term)
                        );
                      })
                      .map((pay) => {
                        const formattedDate = parseUTCDate(pay.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">
                              {pay.user_email}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]" title={pay.id}>
                                {pay.id}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {formattedDate} (JST)
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                              {pay.pack_id === "10k" ? "CSV 10k行パック" : pay.pack_id === "50k" ? "CSV 50k行パック" : pay.pack_id === "100k" ? "CSV 100k行パック" : pay.pack_id}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                              +{pay.lines_added.toLocaleString()} 行
                            </td>
                            <td className="px-4 py-3 font-mono font-black text-primary dark:text-secondary">
                              ¥{pay.amount_jpy.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                {pay.ip_address || "---"}
                              </div>
                              <UserAgentCell userAgent={pay.user_agent} />
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${pay.status === "succeeded" || pay.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                }`}>
                                {pay.status === "succeeded" || pay.status === "completed" ? "成功" : pay.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {pay.invoice_url ? (
                                <a
                                  href={`/api/stripe/invoice?id=${pay.id}&email=${encodeURIComponent(user?.email || "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-xs font-bold rounded transition-colors inline-flex items-center gap-1 shadow-sm"
                                >
                                  <CreditCard className="w-3 h-3 text-amber-500" /> インボイスを表示
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 italic">未発行</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Operation Logs Tab */}
        {activeTab === "logs" && (
          <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold">管理者操作ログ (Audit Logs)</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <select
                  value={selectedActionFilter}
                  onChange={(e) => setSelectedActionFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">すべての操作種別</option>
                  <option value="UPDATE_USER_PLAN">プラン変更</option>
                  <option value="UPDATE_USER_QUOTA">クォータ変更</option>
                  <option value="CREATE_COUPON">クーポン作成</option>
                  <option value="HIDE_COMPANY">企業非公開</option>
                  <option value="UNHIDE_COMPANY">企業再公開</option>
                  <option value="RESOLVE_INQUIRY">問い合わせ対応</option>
                  <option value="APPROVE_PARTNER_LOGO">ロゴ掲載承認</option>
                  <option value="REJECT_PARTNER_LOGO">ロゴ掲載停止</option>
                  <option value="REVOKE_API_KEY">APIキー無効化</option>
                  <option value="ACTIVATE_API_KEY">APIキー有効化</option>
                </select>
                <input
                  type="text"
                  placeholder="管理者・対象・詳細で検索..."
                  value={searchTermLogs}
                  onChange={(e) => setSearchTermLogs(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">実行日時 (JST)</th>
                    <th className="px-4 py-3">実行者 (Admin)</th>
                    <th className="px-4 py-3">操作種別</th>
                    <th className="px-4 py-3">操作対象 (Target)</th>
                    <th className="px-4 py-3">変更内容 (Details)</th>
                    <th className="px-4 py-3 rounded-tr-lg">接続元情報</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {logs
                    .filter((log) => {
                      const term = searchTermLogs.toLowerCase();
                      const matchesSearch =
                        log.admin_email.toLowerCase().includes(term) ||
                        log.target_identifier.toLowerCase().includes(term) ||
                        (log.details_json && log.details_json.toLowerCase().includes(term));

                      const matchesAction = selectedActionFilter === "all" || log.action_type === selectedActionFilter;

                      return matchesSearch && matchesAction;
                    })
                    .length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        該当する操作ログがありません。
                      </td>
                    </tr>
                  ) : (
                    logs
                      .filter((log) => {
                        const term = searchTermLogs.toLowerCase();
                        const matchesSearch =
                          log.admin_email.toLowerCase().includes(term) ||
                          log.target_identifier.toLowerCase().includes(term) ||
                          (log.details_json && log.details_json.toLowerCase().includes(term));

                        const matchesAction = selectedActionFilter === "all" || log.action_type === selectedActionFilter;

                        return matchesSearch && matchesAction;
                      })
                      .map((log) => {
                        const formattedDate = parseUTCDate(log.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        });

                        return (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="px-4 py-3 text-slate-400 font-medium">
                              {formattedDate}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">
                              {log.admin_email}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getActionBadgeColor(log.action_type)}`}>
                                {getActionLabel(log.action_type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {log.target_identifier}
                            </td>
                            <td className="px-4 py-3">
                              {formatLogDetails(log)}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                {log.ip_address || "---"}
                              </div>
                              <UserAgentCell userAgent={log.user_agent} />
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Partners Tab */}
        {activeTab === "partners" && (
          <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-2">パートナーロゴ・掲載管理</h2>
            <p className="text-xs text-slate-400 mb-6">
              領収書情報設定で会社ロゴをアップロードしたユーザーの一覧です。承認された企業はホームページのスライダーに表示されます。
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">企業名 / 宛名</th>
                    <th className="px-4 py-3">ユーザーメール</th>
                    <th className="px-4 py-3">企業ロゴ</th>
                    <th className="px-4 py-3">登録番号 (インボイス)</th>
                    <th className="px-4 py-3">所在地 / 電話</th>
                    <th className="px-4 py-3">掲載ステータス</th>
                    <th className="px-4 py-3 rounded-tr-lg">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {partners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        ロゴを登録したパートナー企業はまだありません。
                      </td>
                    </tr>
                  ) : (
                    partners.map((part) => (
                      <tr key={part.user_email} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {part.billing_name || "(宛名未設定)"}
                        </td>
                        <td className="px-4 py-3 font-medium">{part.user_email}</td>
                        <td className="px-4 py-3">
                          {part.logo_url ? (
                            <div className="w-16 h-8 bg-slate-55 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1">
                              <img src={part.logo_url} alt="Partner Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">ロゴなし</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{part.billing_tax_id || "未設定"}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="max-w-[200px] truncate" title={part.billing_address || ""}>
                            {part.billing_address || "-"}
                          </div>
                          <div className="text-slate-400 mt-0.5">{part.billing_phone || "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          {part.is_featured_partner ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                              掲載中
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold rounded-full">
                              非掲載
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleTogglePartnerFeatured(part.user_email, !!part.is_featured_partner)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${part.is_featured_partner
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/40 dark:text-rose-400"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-400"
                              }`}
                          >
                            {part.is_featured_partner ? "掲載を停止" : "掲載を承認"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* API Key Management Tab */}
        {activeTab === "apiKeys" && (
          <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold">APIキー・連携管理</h2>
                <p className="text-xs text-slate-400 mt-1">システム全体に発行されているAPIキーの有効/無効状態を管理します。</p>
              </div>
              <input
                type="text"
                placeholder="ユーザーメールまたはPreviewキーで検索..."
                value={searchTermApiKeys}
                onChange={(e) => setSearchTermApiKeys(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">ユーザーメール</th>
                    <th className="px-4 py-3">プラン</th>
                    <th className="px-4 py-3">キー (Preview)</th>
                    <th className="px-4 py-3">ステータス</th>
                    <th className="px-4 py-3">作成日時 (JST)</th>
                    <th className="px-4 py-3">最終利用日時 (JST)</th>
                    <th className="px-4 py-3">接続元 IP & User-Agent</th>
                    <th className="px-4 py-3 rounded-tr-lg">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {apiKeys.filter(k => {
                    const term = searchTermApiKeys.toLowerCase().trim();
                    return (
                      k.user_email.toLowerCase().includes(term) ||
                      k.api_key_preview.toLowerCase().includes(term)
                    );
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        該当するAPIキーが見つかりません。
                      </td>
                    </tr>
                  ) : (
                    apiKeys
                      .filter(k => {
                        const term = searchTermApiKeys.toLowerCase().trim();
                        return (
                          k.user_email.toLowerCase().includes(term) ||
                          k.api_key_preview.toLowerCase().includes(term)
                        );
                      })
                      .map((key) => {
                        const createdJst = new Date(key.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
                        const usedJst = key.last_used_at
                          ? new Date(key.last_used_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                          : "未使用";

                        return (
                          <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                              {key.user_email}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${key.plan === "business"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                  : key.plan === "enterprise"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                                }`}>
                                {key.plan}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold font-mono">
                              kigyou_live_{key.api_key_preview}
                            </td>
                            <td className="px-4 py-3">
                              {key.status === "active" ? (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                                  有効 (Active)
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold rounded-full">
                                    無効 (Revoked)
                                  </span>
                                  {key.revoked_reason && (
                                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium max-w-[150px] truncate block" title={key.revoked_reason}>
                                      理由: {key.revoked_reason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400 font-mono">{createdJst}</td>
                            <td className="px-4 py-3 text-xs text-slate-400 font-mono">{usedJst}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">
                              <div className="font-mono">{key.last_ip || "-"}</div>
                              <div className="max-w-[150px] truncate mt-0.5 font-sans" title={key.last_user_agent || ""}>
                                {key.last_user_agent || "-"}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleUpdateApiKeyStatus(key.id, key.status, key.user_email, `...${key.api_key_preview.replace(/^\.\.\./, "")}`)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${key.status === "active"
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/40 dark:text-rose-400"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-400"
                                  }`}
                              >
                                {key.status === "active" ? "キーを無効化" : "キーを有効化"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Backups Tab */}
        {activeTab === "backups" && (
          <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold">バックアップ履歴 (R2 Storage)</h2>
                <p className="text-xs text-slate-400 mt-1">6時間ごとに自動バックアップが実行されます。手動で今すぐバックアップを実行することも可能です。</p>
              </div>
              <button
                onClick={runBackupNow}
                disabled={runningBackup}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed animate-none"
              >
                {runningBackup ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    バックアップ中...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    今すぐバックアップを実行
                  </>
                )}
              </button>
            </div>

            {backupMessage && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-bold border ${
                backupMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' 
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
              }`}>
                {backupMessage.text}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">ID / タイムスタンプ</th>
                    <th className="px-4 py-3">実行時間 (JST)</th>
                    <th className="px-4 py-3">ステータス</th>
                    <th className="px-4 py-3">ファイル名</th>
                    <th className="px-4 py-3">ファイルサイズ</th>
                    <th className="px-4 py-3 rounded-tr-lg">ログ / エラーメッセージ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        バックアップ履歴が見つかりません。
                      </td>
                    </tr>
                  ) : (
                    backups.map((log) => {
                      const timeJst = new Date(log.backup_time).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {log.id}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 font-mono">
                            {timeJst}
                          </td>
                          <td className="px-4 py-3">
                            {log.status === "success" ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold rounded-full">
                                成功 (Success)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold rounded-full">
                                失敗 (Failed)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                            {log.file_name || "-"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                            {log.file_size || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {log.status === "success" ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Cloudflare R2 へのアップロード完了</span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-bold max-w-[300px] truncate block" title={log.error_message || ""}>
                                {log.error_message}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Plan Edit Modal */}
        {planEditUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setPlanEditUser(null)}
            />

            <div className="relative w-full max-w-sm bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
              <div className="w-12 h-12 bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CreditCard className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                  プランの変更
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  対象ユーザーのプランを変更します:<br />
                  <strong className="text-primary dark:text-secondary">{planEditUser.email}</strong>
                </p>
              </div>

              <div className="flex flex-col gap-3 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    新しいプランを選択
                  </label>
                  <select
                    value={selectedPlanToUpdate}
                    onChange={(e) => setSelectedPlanToUpdate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  >
                    <option value="free">FREE (20行/日)</option>
                    <option value="pro">PRO (2,000行/月)</option>
                    <option value="business">BUSINESS (10,000行/月)</option>
                    <option value="enterprise">ENTERPRISE (40,000行/月)</option>
                  </select>
                </div>

                <div className="mt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleUpdatePlan}
                    disabled={updatingPlan}
                    className="w-full py-3 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {updatingPlan ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      "プランを更新する"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanEditUser(null)}
                    className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {apiKeyStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setApiKeyStatusModal(null)}
            />

            <div className="relative w-full max-w-md bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200 text-left">
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  APIキーのステータス変更
                </h3>
                <button
                  onClick={() => setApiKeyStatusModal(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">ユーザー:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{apiKeyStatusModal.targetEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">キー (Preview):</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">kigyou_live_{apiKeyStatusModal.keyPreview}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">変更後の状態:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    apiKeyStatusModal.currentStatus === "active"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-455"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  }`}>
                    {apiKeyStatusModal.currentStatus === "active" ? "無効 (Revoked)" : "有効 (Active)"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  定型理由を選択 (クイック選択)
                </label>
                <div className="flex flex-wrap gap-2">
                  {apiKeyStatusModal.currentStatus === "active" ? (
                    // Revoke reasons
                    [
                      "情報漏洩の疑い",
                      "顧客からの要請",
                      "お支払い遅延・未払い",
                      "契約プランの変更・解約",
                      "不要な旧キーの整理",
                      "テスト用キーの破棄"
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setApiKeyStatusReason(preset)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${
                          apiKeyStatusReason === preset
                            ? "bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-955/20 dark:border-rose-900 dark:text-rose-450"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        {preset}
                      </button>
                    ))
                  ) : (
                    // Activate reasons
                    [
                      "お支払い状況の解消",
                      "一時停止の解除",
                      "誤操作による無効化の復旧",
                      "セキュリティ確認完了",
                      "テスト再開"
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setApiKeyStatusReason(preset)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${
                          apiKeyStatusReason === preset
                            ? "bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-955/20 dark:border-emerald-900 dark:text-emerald-400"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        {preset}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  理由のカスタム入力 / メモ (任意)
                </label>
                <textarea
                  value={apiKeyStatusReason}
                  onChange={(e) => setApiKeyStatusReason(e.target.value)}
                  placeholder="理由や詳細なメモを入力してください..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={submitApiKeyStatusUpdate}
                  disabled={submittingApiKeyStatus}
                  className={`w-full py-3 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                    apiKeyStatusModal.currentStatus === "active"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10"
                  }`}
                >
                  {submittingApiKeyStatus ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    apiKeyStatusModal.currentStatus === "active" ? "APIキーを無効化する" : "APIキーを有効化する"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setApiKeyStatusModal(null)}
                  className="w-full py-2 text-xs font-bold text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}

function formatFilters(filtersJson: string | null) {
  if (!filtersJson) return "なし";
  try {
    const filters = JSON.parse(filtersJson);
    const parts: string[] = [];
    if (filters.keyword) parts.push(`キーワード: ${filters.keyword}`);
    if (filters.prefecture_code) parts.push(`都道府県: ${filters.prefecture_code}`);
    if (filters.city_name) parts.push(`市区町村: ${filters.city_name}`);
    if (filters.industry_code) parts.push(`業種: ${filters.industry_code}`);
    if (filters.min_employees !== undefined || filters.max_employees !== undefined) {
      parts.push(`従業員数: ${filters.min_employees ?? 0}-${filters.max_employees ?? 'Max'}`);
    }
    if (filters.min_capital !== undefined || filters.max_capital !== undefined) {
      parts.push(`資本金: ${filters.min_capital ?? 0}-${filters.max_capital ?? 'Max'}`);
    }
    if (filters.has_hiring) parts.push("採用情報あり");
    if (filters.has_subsidy) parts.push("助成金あり");
    if (filters.has_bidding) parts.push("入札情報あり");
    return parts.join(", ") || "デフォルト";
  } catch {
    return filtersJson;
  }
}

const UserAgentCell: React.FC<{ userAgent?: string | null }> = ({ userAgent }) => {
  const [copied, setCopied] = useState(false);

  if (!userAgent) return <span className="text-[10px] text-slate-400">---</span>;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userAgent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("navigator.clipboard failed, attempting fallback copy: ", err);
      // Fallback copy mechanism
      const textArea = document.createElement("textarea");
      textArea.value = userAgent;
      // Position offscreen
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand("copy");
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          console.error("Fallback copy command was unsuccessful");
        }
      } catch (fallbackErr) {
        console.error("Fallback copy failed: ", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div
      onClick={handleCopy}
      className="relative group cursor-pointer select-none hover:z-50"
    >
      <span className="text-[10px] text-slate-400 truncate max-w-[180px] block hover:text-primary dark:hover:text-secondary transition-colors">
        {userAgent}
      </span>

      {/* Custom Tooltip */}
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 dark:bg-slate-800 text-white text-[10px] rounded-lg p-2.5 shadow-xl max-w-xs break-all whitespace-normal pointer-events-none transition-all border border-slate-700 dark:border-slate-600 animate-in fade-in zoom-in-95 duration-100">
        <div className="font-extrabold text-[9px] text-slate-400 dark:text-slate-400 mb-1 tracking-wider uppercase">
          {copied ? "✓ コピーされました！" : "🖱 クリックでコピー"}
        </div>
        <div className="leading-relaxed text-[10px]">{userAgent}</div>

        {/* Triangle Arrow */}
        <div className="absolute left-4 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-slate-800"></div>
      </div>
    </div>
  );
};

const formatLogDetails = (log: AdminActionLog) => {
  if (!log.details_json) return "---";
  try {
    const details = JSON.parse(log.details_json);
    switch (log.action_type) {
      case "UPDATE_USER_PLAN":
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase">{details.oldPlan}</span>
            <span className="text-slate-400">➜</span>
            <span className="font-bold text-primary dark:text-secondary uppercase">{details.newPlan}</span>
          </div>
        );
      case "UPDATE_USER_QUOTA":
        return (
          <div className="flex flex-col gap-0.5 text-xs text-slate-655 dark:text-slate-400">
            <div>
              月間枠: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{details.oldAllowance}</span> ➜ <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{details.newAllowance}</span>
            </div>
            <div>
              追加枠: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{details.oldAddOn}</span> ➜ <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{details.newAddOn}</span>
            </div>
          </div>
        );
      case "CREATE_COUPON":
        return (
          <div className="text-xs text-slate-655 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-0.5">
            <span>割引率: <strong className="text-slate-800 dark:text-slate-200">{details.discountPercent}%</strong></span>
            <span className="text-slate-300">|</span>
            <span>上限: <strong className="text-slate-800 dark:text-slate-200">{details.maxUses}回</strong></span>
            <span className="text-slate-300">|</span>
            <span>有効期間: <strong className="text-slate-800 dark:text-slate-200">{details.daysValid}日間</strong></span>
          </div>
        );
      case "HIDE_COMPANY":
        return (
          <div className="text-xs text-slate-655 dark:text-slate-400 truncate max-w-xs" title={details.reason}>
            理由: <span className="italic">"{details.reason}"</span>
          </div>
        );
      case "UNHIDE_COMPANY":
        return <span className="text-xs text-slate-500">企業情報を再公開</span>;
      case "RESOLVE_INQUIRY":
        return <span className="text-xs text-slate-500">問い合わせを解決済みに変更</span>;
      case "APPROVE_PARTNER_LOGO":
        return <span className="text-xs text-emerald-600 font-semibold">パートナーロゴの掲載を承認しました。</span>;
      case "REJECT_PARTNER_LOGO":
        return <span className="text-xs text-rose-600 font-semibold">パートナーロゴの掲載を却下しました。</span>;
      case "REVOKE_API_KEY":
        return (
          <div className="text-xs text-rose-600 font-semibold flex flex-col gap-0.5">
            <span>APIキーを無効化しました ({details.keyPreview})</span>
            {details.reason && <span className="text-slate-500 font-normal italic">理由: "{details.reason}"</span>}
          </div>
        );
      case "ACTIVATE_API_KEY":
        return (
          <div className="text-xs text-emerald-600 font-semibold flex flex-col gap-0.5">
            <span>APIキーを有効化しました ({details.keyPreview})</span>
            {details.reason && <span className="text-slate-500 font-normal italic">理由: "{details.reason}"</span>}
          </div>
        );
      default:
        return <span className="text-xs text-slate-500 font-mono">{log.details_json}</span>;
    }
  } catch {
    return <span className="text-xs font-mono text-slate-400">{log.details_json}</span>;
  }
};

const getActionLabel = (type: string) => {
  switch (type) {
    case "UPDATE_USER_PLAN": return "プラン変更";
    case "UPDATE_USER_QUOTA": return "クォータ変更";
    case "CREATE_COUPON": return "クーポン作成";
    case "HIDE_COMPANY": return "企業非公開";
    case "UNHIDE_COMPANY": return "企業再公開";
    case "RESOLVE_INQUIRY": return "問い合わせ対応";
    case "APPROVE_PARTNER_LOGO": return "ロゴ掲載承認";
    case "REJECT_PARTNER_LOGO": return "ロゴ掲載停止";
    case "REVOKE_API_KEY": return "APIキー無効化";
    case "ACTIVATE_API_KEY": return "APIキー有効化";
    default: return type;
  }
};

const getActionBadgeColor = (type: string) => {
  switch (type) {
    case "UPDATE_USER_PLAN":
      return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-955/20 dark:border-blue-900/40 dark:text-blue-400";
    case "UPDATE_USER_QUOTA":
      return "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-955/20 dark:border-indigo-900/40 dark:text-indigo-400";
    case "CREATE_COUPON":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-955/20 dark:border-emerald-900/40 dark:text-emerald-400";
    case "HIDE_COMPANY":
      return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-955/20 dark:border-rose-900/40 dark:text-rose-400";
    case "UNHIDE_COMPANY":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-955/20 dark:border-amber-900/40 dark:text-amber-400";
    case "RESOLVE_INQUIRY":
      return "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-955/20 dark:border-teal-900/40 dark:text-teal-400";
    case "APPROVE_PARTNER_LOGO":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-955/20 dark:border-emerald-900/40 dark:text-emerald-400";
    case "REJECT_PARTNER_LOGO":
      return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-955/20 dark:border-rose-900/40 dark:text-rose-455";
    case "REVOKE_API_KEY":
      return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-955/20 dark:border-rose-900/40 dark:text-rose-400";
    case "ACTIVATE_API_KEY":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-955/20 dark:border-emerald-900/40 dark:text-emerald-400";
    default:
      return "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/60 dark:text-slate-400";
  }
};

