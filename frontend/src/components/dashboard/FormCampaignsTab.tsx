"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Send, Plus, FileText, CheckCircle2, Clock, AlertCircle, 
  Trash2, Edit3, Eye, Copy, ArrowRight, Loader2, Sparkles, 
  ShieldCheck, X, Building2, User, Mail, Phone, Globe, ExternalLink,
  ChevronRight, RefreshCw, Check
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  category?: string;
  subject: string;
  body: string;
  created_at?: string;
}

interface Campaign {
  id: string;
  name: string;
  template_id: string | null;
  sender_company: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  sender_website: string | null;
  subject: string;
  body: string;
  target_filters: string | null;
  target_count: number;
  cost_jpy: number;
  status: "draft" | "pending_review" | "approved" | "sending" | "completed" | "rejected";
  rejection_reason: string | null;
  sent_count: number;
  success_count: number;
  skipped_count: number;
  report_file_url: string | null;
  created_at: string;
  updated_at: string;
}

export function FormCampaignsTab() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const [activeSubTab, setActiveSubTab] = useState<"campaigns" | "templates">("campaigns");

  // Data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [presets, setPresets] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Template Modal States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [tplName, setTplName] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Campaign Modal States
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [cmpName, setCmpName] = useState("");
  const [cmpTargetCount, setCmpTargetCount] = useState<number>(500);
  const [cmpSenderCompany, setCmpSenderCompany] = useState("");
  const [cmpSenderName, setCmpSenderName] = useState("");
  const [cmpSenderEmail, setCmpSenderEmail] = useState(user?.email || "");
  const [cmpSenderPhone, setCmpSenderPhone] = useState("");
  const [cmpSenderWebsite, setCmpSenderWebsite] = useState("");
  const [cmpSubject, setCmpSubject] = useState("");
  const [cmpBody, setCmpBody] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [previewCompany, setPreviewCompany] = useState("サンプル株式会社");

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCmp, resTpl] = await Promise.all([
        fetch("/api/user/form-campaigns"),
        fetch("/api/user/form-templates")
      ]);

      if (resCmp.ok) {
        const data = await resCmp.json();
        setCampaigns(data.campaigns || []);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("formCampaignsUpdated"));
        }
      }
      if (resTpl.ok) {
        const data = await resTpl.json();
        setTemplates(data.templates || []);
        setPresets(data.presets || []);
      }
    } catch (e) {
      console.error("Failed to fetch form campaigns data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Template Modal for Create or Edit
  const openTemplateModal = (tpl?: Template) => {
    if (tpl) {
      setEditingTemplate(tpl);
      setTplName(tpl.name);
      setTplSubject(tpl.subject);
      setTplBody(tpl.body);
    } else {
      setEditingTemplate(null);
      setTplName("");
      setTplSubject("");
      setTplBody("");
    }
    setIsTemplateModalOpen(true);
  };

  // Save Template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName || !tplSubject || !tplBody) return;
    setSavingTemplate(true);

    try {
      const res = await fetch("/api/user/form-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTemplate?.id,
          name: tplName,
          subject: tplSubject,
          body: tplBody
        })
      });

      if (res.ok) {
        setIsTemplateModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTemplate(false);
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm(isJa ? "このテンプレートを削除してもよろしいですか？" : isVi ? "Bạn có chắc muốn xóa mẫu này không?" : "Delete this template?")) return;
    try {
      const res = await fetch(`/api/user/form-templates?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Open Campaign Creator
  const openCampaignModal = (cmp?: Campaign) => {
    if (cmp) {
      setEditingCampaignId(cmp.id);
      setCmpName(cmp.name);
      setCmpTargetCount(cmp.target_count);
      setCmpSenderCompany(cmp.sender_company);
      setCmpSenderName(cmp.sender_name);
      setCmpSenderEmail(cmp.sender_email);
      setCmpSenderPhone(cmp.sender_phone || "");
      setCmpSenderWebsite(cmp.sender_website || "");
      setCmpSubject(cmp.subject);
      setCmpBody(cmp.body);
    } else {
      setEditingCampaignId(null);
      setCmpName(isJa ? `新規フォーム営業キャンペーン_${new Date().toLocaleDateString("ja-JP")}` : `Chiến dịch gửi Form_${new Date().toLocaleDateString("vi-VN")}`);
      setCmpTargetCount(500);
      setCmpSenderCompany("");
      setCmpSenderName("");
      setCmpSenderEmail(user?.email || "");
      setCmpSenderPhone("");
      setCmpSenderWebsite("");
      // Default to first preset if available
      if (presets.length > 0) {
        setCmpSubject(presets[0].subject);
        setCmpBody(presets[0].body);
      } else {
        setCmpSubject("");
        setCmpBody("");
      }
    }
    setIsCampaignModalOpen(true);
  };

  // Save Campaign (as draft or submit for review)
  const handleSaveCampaign = async (statusToSet: "draft" | "pending_review") => {
    if (!cmpName || !cmpSenderCompany || !cmpSenderName || !cmpSubject || !cmpBody) {
      alert(isJa ? "必須項目（会社名、お名前、件名、本文）を入力してください。" : isVi ? "Vui lòng nhập các trường bắt buộc (Công ty, Người gửi, Tiêu đề, Nội dung)." : "Please enter all required fields.");
      return;
    }

    setSavingCampaign(true);
    const calculatedCost = cmpTargetCount <= 500 ? 12000 : cmpTargetCount <= 1000 ? 22000 : Math.round(cmpTargetCount * 20);

    try {
      const res = await fetch("/api/user/form-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCampaignId,
          name: cmpName,
          sender_company: cmpSenderCompany,
          sender_name: cmpSenderName,
          sender_email: cmpSenderEmail,
          sender_phone: cmpSenderPhone,
          sender_website: cmpSenderWebsite,
          subject: cmpSubject,
          body: cmpBody,
          target_count: cmpTargetCount,
          cost_jpy: calculatedCost,
          status: statusToSet
        })
      });

      if (res.ok) {
        setIsCampaignModalOpen(false);
        fetchData();
        if (statusToSet === "pending_review") {
          alert(isJa ? "キャンペーンの審査申請を受け付けました。管理者による内容確認（通常24時間以内）後、配信が自動開始されます。" : isVi ? "Đã gửi chiến dịch vào hàng đợi kiểm duyệt. Sau khi Admin duyệt, chiến dịch sẽ tự động bắt đầu gửi." : "Campaign submitted for moderation. Outreach will begin once approved by admin.");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCampaign(false);
    }
  };

  // Delete Draft Campaign
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm(isJa ? "この下書きキャンペーンを削除しますか？" : isVi ? "Xóa bản nháp chiến dịch này?" : "Delete draft campaign?")) return;
    try {
      const res = await fetch(`/api/user/form-campaigns?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Insert Variable helper into text
  const insertVariable = (variable: string) => {
    setCmpBody((prev) => prev + variable);
  };

  const statusBadge = (status: Campaign["status"]) => {
    switch (status) {
      case "draft":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350">{isJa ? "下書き" : isVi ? "Bản nháp" : "Draft"}</span>;
      case "pending_review":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">{isJa ? "審査待ち" : isVi ? "Chờ duyệt" : "In Review"}</span>;
      case "approved":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">{isJa ? "承認済・待機中" : isVi ? "Đã duyệt" : "Approved"}</span>;
      case "sending":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 animate-pulse">{isJa ? "送信中" : isVi ? "Đang gửi" : "Sending"}</span>;
      case "completed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">{isJa ? "完了" : isVi ? "Hoàn thành" : "Completed"}</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">{isJa ? "要修正・却下" : isVi ? "Bị từ chối" : "Rejected"}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("campaigns")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === "campaigns"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {isJa ? "マイキャンペーン一覧" : isVi ? "Chiến dịch của tôi" : "My Campaigns"} ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveSubTab("templates")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === "templates"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {isJa ? "営業テンプレート管理" : isVi ? "Mẫu thư ngỏ của tôi" : "Pitch Templates"} ({templates.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "campaigns" ? (
            <button
              onClick={() => openCampaignModal()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/15 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isJa ? "新規キャンペーン作成" : isVi ? "Tạo chiến dịch mới" : "New Campaign"}</span>
            </button>
          ) : (
            <button
              onClick={() => openTemplateModal()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/15 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isJa ? "テンプレート新規作成" : isVi ? "Tạo mẫu thư mới" : "New Template"}</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
          <span className="text-xs">{isJa ? "読み込み中..." : isVi ? "Đang tải dữ liệu..." : "Loading..."}</span>
        </div>
      ) : activeSubTab === "campaigns" ? (
        /* CAMPAIGNS SUB-TAB */
        campaigns.length === 0 ? (
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Send className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {isJa ? "まだ作成されたキャンペーンはありません" : isVi ? "Chưa có chiến dịch gửi Form nào" : "No Campaigns Created Yet"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              {isJa
                ? "ターゲット企業のお問い合わせフォームへ営業メッセージを一括送信するキャンペーンを作成できます。まずは下書きとして保存することも可能です。"
                : isVi
                ? "Bạn có thể tự tạo chiến dịch tiếp cận hàng loạt qua Form liên hệ. Bạn có thể lưu bản nháp để chỉnh sửa trước khi gửi duyệt."
                : "Create automated outbound campaigns targeting verified corporate forms. Save as draft anytime."}
            </p>
            <button
              onClick={() => openCampaignModal()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all cursor-pointer"
            >
              {isJa ? "最初のキャンペーンを作成する" : isVi ? "Tạo chiến dịch đầu tiên" : "Create First Campaign"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((cmp) => (
              <div
                key={cmp.id}
                className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(cmp.status)}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {cmp.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-350">{cmp.subject}</span> — {cmp.sender_company} ({cmp.sender_name})
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>{isJa ? "対象件数" : isVi ? "Số lượng" : "Volume"}: <strong className="text-slate-700 dark:text-slate-200">{cmp.target_count.toLocaleString()} 件</strong></span>
                    <span>{isJa ? "作成日時" : isVi ? "Ngày tạo" : "Created"}: {new Date(cmp.created_at).toLocaleDateString()}</span>
                    {cmp.status === "completed" && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {isJa ? "送信成功" : isVi ? "Gửi thành công" : "Sent"}: {cmp.success_count}/{cmp.target_count}
                      </span>
                    )}
                  </div>
                  {cmp.status === "rejected" && cmp.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900">
                      {isJa ? "却下理由・修正要請" : isVi ? "Lý do từ chối" : "Rejection Reason"}: {cmp.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {cmp.status === "draft" && (
                    <>
                      <button
                        onClick={() => openCampaignModal(cmp)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        {isJa ? "編集" : isVi ? "Sửa" : "Edit"}
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(cmp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title={isJa ? "削除" : isVi ? "Xóa" : "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {cmp.status === "completed" && cmp.report_file_url && (
                    <a
                      href={cmp.report_file_url}
                      download
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isJa ? "レポートCSV" : isVi ? "Báo cáo CSV" : "Download Report"}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TEMPLATES SUB-TAB */
        <div className="space-y-6">
          {/* Custom Templates */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              {isJa ? "自作テンプレート (保存済)" : isVi ? "Mẫu thư của bạn đã lưu" : "Saved Custom Templates"} ({templates.length})
            </h3>
            {templates.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                {isJa ? "まだ保存された独自テンプレートはありません。「+ テンプレート新規作成」または下記のプリセットから作成できます。" : isVi ? "Bạn chưa lưu mẫu riêng nào. Hãy bấm 'Tạo mẫu thư mới' hoặc dùng mẫu có sẵn bên dưới." : "No custom templates yet. Click 'New Template' or clone from presets below."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{tpl.name}</h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openTemplateModal(tpl)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2 truncate">
                        {tpl.subject}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed whitespace-pre-wrap font-mono text-[11px] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                        {tpl.body}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                      <button
                        onClick={() => {
                          setCmpSubject(tpl.subject);
                          setCmpBody(tpl.body);
                          openCampaignModal();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isJa ? "このテンプレートでキャンペーン作成" : isVi ? "Tạo chiến dịch với mẫu này" : "Use in Campaign"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Presets */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                {isJa ? "Kigyou-List 推奨プリセット文面（成約率重視）" : isVi ? "Kho mẫu chuẩn Nhật tích hợp sẵn (Khuyên dùng)" : "High-Converting System Presets"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#151921] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mb-1">{preset.name}</h4>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mb-2 truncate">
                      {preset.subject}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed whitespace-pre-wrap font-mono bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                      {preset.body}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setTplName(preset.name + (isJa ? " (複製)" : " (Bản sao)"));
                        setTplSubject(preset.subject);
                        setTplBody(preset.body);
                        setEditingTemplate(null);
                        setIsTemplateModalOpen(true);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{isJa ? "カスタムして保存" : isVi ? "Sao chép để sửa" : "Clone & Edit"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setCmpSubject(preset.subject);
                        setCmpBody(preset.body);
                        openCampaignModal();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isJa ? "この文面を使う" : isVi ? "Sử dụng mẫu này" : "Use Template"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TEMPLATE CREATION / EDIT MODAL                               */}
      {/* ============================================================ */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 scrollbar-thin">
            <button
              onClick={() => setIsTemplateModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              <span>{editingTemplate ? (isJa ? "テンプレート編集" : isVi ? "Chỉnh sửa mẫu thư" : "Edit Template") : (isJa ? "新規テンプレート作成" : isVi ? "Tạo mẫu thư mới" : "New Template")}</span>
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "テンプレート名 *" : isVi ? "Tên mẫu thư *" : "Template Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isJa ? "例: IT受託開発提案_Aパターン" : isVi ? "Ví dụ: Mẫu chào dịch vụ IT v1" : "e.g. IT Outsource Pitch v1"}
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isJa ? "件名 (Subject) *" : isVi ? "Tiêu đề thư ngỏ *" : "Subject Line *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isJa ? "例: 【ご提案】貴社の開発コスト削減と即戦力エンジニア体制のご案内" : isVi ? "Tiêu đề thu hút người đọc" : "Compelling subject line"}
                  value={tplSubject}
                  onChange={(e) => setTplSubject(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isJa ? "本文 (Body) *" : isVi ? "Nội dung thư ngỏ *" : "Message Body *"}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isJa ? "変数クリックで挿入" : isVi ? "Bấm để chèn biến" : "Click to insert variable"}
                  </span>
                </div>

                {/* Variable helper pills */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <button
                    type="button"
                    onClick={() => setTplBody((prev) => prev + "{{company_name}}")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    + {"{{company_name}}"} (宛先企業名)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTplBody((prev) => prev + "{{representative_name}}")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    + {"{{representative_name}}"} (代表者名)
                  </button>
                </div>

                <textarea
                  rows={8}
                  required
                  value={tplBody}
                  onChange={(e) => setTplBody(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  {isJa ? "キャンセル" : isVi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isJa ? "テンプレートを保存" : isVi ? "Lưu mẫu thư" : "Save Template"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CAMPAIGN CREATION / DRAFTING MODAL                            */}
      {/* ============================================================ */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-3xl w-full max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 scrollbar-thin">
            <button
              onClick={() => setIsCampaignModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-500" />
              <span>{isJa ? "フォーム営業キャンペーン作成・保存" : isVi ? "Tạo & Lưu chiến dịch gửi Form" : "Create Form DM Campaign"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {isJa ? "下書きとして保存するか、審査・配信申請を行えます。審査承認後に自動送信されます。" : isVi ? "Bạn có thể lưu bản nháp hoặc gửi duyệt chiến dịch. Sau khi Admin duyệt, bot sẽ tự động gửi." : "Save as draft or submit for approval. Once approved, outreach runs automatically."}
            </p>

            <div className="space-y-4">
              {/* Campaign Name & Volume */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isJa ? "キャンペーン名 *" : isVi ? "Tên chiến dịch *" : "Campaign Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={cmpName}
                    onChange={(e) => setCmpName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isJa ? "送信件数 (Volume)" : isVi ? "Số lượng gửi" : "Target Volume"}
                  </label>
                  <select
                    value={cmpTargetCount}
                    onChange={(e) => setCmpTargetCount(parseInt(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={500}>500 件 (¥12,000 / 単価24円)</option>
                    <option value={1000}>1,000 件 (¥22,000 / 単価22円)</option>
                    <option value={3000}>3,000 件 (¥59,000 / 単価19.6円 - おすすめ)</option>
                    <option value={5000}>5,000 件 (¥95,000 / 単価19円)</option>
                  </select>
                </div>
              </div>

              {/* Sender Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{isJa ? "送信者情報（特定商取引法表示義務）" : isVi ? "Thông tin người gửi (Theo quy định Tokushoho)" : "Sender Profile"}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">{isJa ? "会社名 *" : isVi ? "Tên công ty *" : "Company Name *"}</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 株式会社〇〇"
                      value={cmpSenderCompany}
                      onChange={(e) => setCmpSenderCompany(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">{isJa ? "担当者名 *" : isVi ? "Người phụ trách *" : "Contact Name *"}</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 山田 太郎"
                      value={cmpSenderName}
                      onChange={(e) => setCmpSenderName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">{isJa ? "返信用メールアドレス *" : isVi ? "Email nhận phản hồi *" : "Reply Email *"}</label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={cmpSenderEmail}
                      onChange={(e) => setCmpSenderEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">{isJa ? "電話番号" : isVi ? "Số điện thoại" : "Phone"}</label>
                    <input
                      type="tel"
                      placeholder="03-1234-5678"
                      value={cmpSenderPhone}
                      onChange={(e) => setCmpSenderPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Template quick loader */}
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350">
                  {isJa ? "送信メッセージ" : isVi ? "Thông điệp gửi" : "Outreach Pitch"}
                </label>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">{isJa ? "テンプレートから引用:" : isVi ? "Chọn từ mẫu:" : "Load:"}</span>
                  <select
                    onChange={(e) => {
                      const all = [...presets, ...templates];
                      const found = all.find((x) => x.id === e.target.value);
                      if (found) {
                        setCmpSubject(found.subject);
                        setCmpBody(found.body);
                      }
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value="">{isJa ? "-- テンプレートを選択 --" : isVi ? "-- Chọn mẫu --" : "-- Select Template --"}</option>
                    <optgroup label={isJa ? "推奨プリセット" : isVi ? "Mẫu hệ thống" : "Presets"}>
                      {presets.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                    {templates.length > 0 && (
                      <optgroup label={isJa ? "マイテンプレート" : isVi ? "Mẫu của bạn" : "My Templates"}>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">{isJa ? "件名 (Subject) *" : isVi ? "Tiêu đề *" : "Subject *"}</label>
                <input
                  type="text"
                  required
                  value={cmpSubject}
                  onChange={(e) => setCmpSubject(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-500">{isJa ? "本文 (Body) *" : isVi ? "Nội dung *" : "Body *"}</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertVariable("{{company_name}}")}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200"
                    >
                      + {"{{company_name}}"}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={7}
                  required
                  value={cmpBody}
                  onChange={(e) => setCmpBody(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 cursor-pointer"
                >
                  {isJa ? "閉じる" : isVi ? "Đóng" : "Close"}
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={savingCampaign}
                    onClick={() => handleSaveCampaign("draft")}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
                  >
                    {savingCampaign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isJa ? "💾 下書きとして保存" : isVi ? "💾 Lưu bản nháp" : "💾 Save as Draft")}
                  </button>

                  <button
                    type="button"
                    disabled={savingCampaign}
                    onClick={() => handleSaveCampaign("pending_review")}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {savingCampaign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isJa ? "審査申請・配信へ進む" : isVi ? "Gửi duyệt chiến dịch" : "Submit for Approval"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
