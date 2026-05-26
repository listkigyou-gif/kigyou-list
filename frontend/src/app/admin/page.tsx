"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldAlert, Plus, Ticket, Loader2, RefreshCcw, Users, MessageSquareWarning, CheckCircle, Ban, Download, CreditCard } from "lucide-react";

interface Coupon {
  code: string;
  discount_percent: number;
  expires_at: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface UserAdminView {
  user_email: string;
  monthly_base_allowance: number;
  monthly_base_used: number;
  purchased_add_on_balance: number;
  plan: string;
  updated_at: string;
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
}

interface PaymentAdminView {
  id: string;
  user_email: string;
  pack_id: string;
  amount_jpy: number;
  lines_added: number;
  status: string;
  invoice_url: string | null;
  created_at: string;
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
  const [activeTab, setActiveTab] = useState<"coupons" | "users" | "inquiries" | "exports" | "payments">("inquiries");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [usersList, setUsersList] = useState<UserAdminView[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJobAdminView[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentAdminView[]>([]);
  const [searchTermExports, setSearchTermExports] = useState("");
  const [searchTermPayments, setSearchTermPayments] = useState("");

  // Coupon form
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("60");
  const [newMaxUses, setNewMaxUses] = useState("100");
  const [newDaysValid, setNewDaysValid] = useState("30");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'success'|'error', text: string } | null>(null);

  // Plan Edit Modal States
  const [planEditUser, setPlanEditUser] = useState<{ email: string; currentPlan: string } | null>(null);
  const [selectedPlanToUpdate, setSelectedPlanToUpdate] = useState<string>("free");
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const fetchDataRef = useRef<() => void>(undefined);

  const fetchData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const headers = getAdminHeaders();
      
      const [resCoupons, resUsers, resInquiries, resExports, resPayments] = await Promise.all([
        fetch("/api/coupon/admin", { headers }),
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/inquiries", { headers }),
        fetch("/api/admin/exports", { headers }),
        fetch("/api/admin/payments", { headers })
      ]);

      if (resCoupons.status === 403 || resUsers.status === 403 || resInquiries.status === 403 || resExports.status === 403 || resPayments.status === 403) {
        const passcode = prompt("Nhập mã bảo mật Admin (Admin Secret Passcode) để xác thực truy cập:");
        if (passcode) {
          localStorage.setItem("kigyou_admin_secret", passcode);
          setTimeout(() => fetchDataRef.current?.(), 50);
          return;
        }
      }

      if (resCoupons.ok && resUsers.ok && resInquiries.ok && resExports.ok && resPayments.ok) {
        const dataCoupons = await resCoupons.json();
        const dataUsers = await resUsers.json();
        const dataInquiries = await resInquiries.json();
        const dataExports = await resExports.json();
        const dataPayments = await resPayments.json();
        
        setCoupons(dataCoupons.coupons || []);
        setUsersList(dataUsers.users || []);
        setInquiries(dataInquiries.inquiries || []);
        setExportJobs(dataExports.jobs || []);
        setPaymentHistory(dataPayments.payments || []);
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
            onClick={() => setActiveTab("inquiries")}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'inquiries' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <MessageSquareWarning className="w-4 h-4" /> 非公開・修正依頼
            {inquiries.filter(i => i.status === 'pending').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{inquiries.filter(i => i.status === 'pending').length}</span>
            )}
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
                      <td className="px-4 py-3">{new Date(inq.created_at).toLocaleString("ja-JP")}</td>
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
                    <th className="px-4 py-3">クォータ (月間基本)</th>
                    <th className="px-4 py-3">使用済み</th>
                    <th className="px-4 py-3">追加枠 (Add-on)</th>
                    <th className="px-4 py-3">更新日時</th>
                    <th className="px-4 py-3 rounded-tr-lg">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">登録ユーザーがいません。</td></tr>
                  ) : usersList.map((usr) => (
                    <tr key={usr.user_email} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-bold">{usr.user_email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          usr.plan === "pro"
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
                      <td className="px-4 py-3 text-primary font-bold">{usr.monthly_base_allowance.toLocaleString()}</td>
                      <td className="px-4 py-3">{usr.monthly_base_used.toLocaleString()}</td>
                      <td className="px-4 py-3 text-secondary font-bold">+{usr.purchased_add_on_balance.toLocaleString()}</td>
                      <td className="px-4 py-3">{new Date(usr.updated_at).toLocaleString()}</td>
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
                    const isExpired = new Date(coupon.expires_at) < new Date();
                    const isMaxed = coupon.used_count >= coupon.max_uses;
                    const isValid = !isExpired && !isMaxed && coupon.is_active;

                    return (
                      <tr key={coupon.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-black text-primary dark:text-secondary">{coupon.code}</td>
                        <td className="px-4 py-3 font-bold">{coupon.discount_percent}%</td>
                        <td className="px-4 py-3"><span className={isMaxed ? "text-rose-500 font-bold" : ""}>{coupon.used_count}</span> / {coupon.max_uses}</td>
                        <td className="px-4 py-3"><span className={isExpired ? "text-rose-500 font-bold" : ""}>{new Date(coupon.expires_at).toLocaleDateString()}</span></td>
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
                    <th className="px-4 py-3">出力行数</th>
                    <th className="px-4 py-3">適用フィルター</th>
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
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
                        const isExpired = !job.file_path;
                        const formattedDate = new Date(job.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

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
                            <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {job.records_count.toLocaleString()} 行
                            </td>
                            <td className="px-4 py-3 text-xs max-w-xs truncate" title={formatFilters(job.filters_json)}>
                              {formatFilters(job.filters_json)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                job.status === "completed"
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
                                <span className="text-xs text-slate-455 italic">実行中...</span>
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
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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
                        const formattedDate = new Date(pay.created_at).toLocaleString("ja-JP", {
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
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                pay.status === "succeeded" || pay.status === "completed"
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
