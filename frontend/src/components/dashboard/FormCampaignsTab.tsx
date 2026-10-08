"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Send, Plus, FileText, CheckCircle2, Clock, AlertCircle, 
  Trash2, Edit3, Eye, Copy, ArrowRight, Loader2, Sparkles, 
  ShieldCheck, X, Building2, User, Mail, Phone, Globe, ExternalLink,
  ChevronRight, RefreshCw, Check, Coins, Target, Filter, ListFilter,
  CheckSquare, Layers, Compass, Lock, History
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

interface FormCreditTransaction {
  id: string;
  user_email: string;
  amount: number;
  balance_after: number;
  type: 'charge' | 'reserve' | 'refund' | 'delivered';
  campaign_id: string | null;
  campaign_name: string | null;
  note: string | null;
  created_at: string;
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
  status: "draft" | "pending_review" | "pending_approval" | "approved" | "sending" | "processing" | "completed" | "rejected";
  rejection_reason: string | null;
  sent_count: number;
  success_count: number;
  skipped_count: number;
  report_file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormCampaignsTabProps {
  initialTargetCompanies?: { id: string; name: string }[];
  onClearInitialTarget?: () => void;
}

const INDUSTRY_OPTIONS = [
  { id: "all", ja: "全業種（制限なし）", vi: "Tất cả ngành nghề", en: "All Industries" },
  { id: "it", ja: "IT・情報通信・Web・SaaS", vi: "Công nghệ thông tin, Viễn thông, Web", en: "IT, Tech & SaaS" },
  { id: "manufacturing", ja: "製造業・メーカー・機械", vi: "Sản xuất, Nhà máy, Chế tạo", en: "Manufacturing" },
  { id: "service", ja: "サービス業・B2Bコンサルティング", vi: "Dịch vụ B2B, Tư vấn", en: "B2B Services & Consulting" },
  { id: "realestate_construction", ja: "不動産業・建設・住宅", vi: "Bất động sản & Xây dựng", en: "Real Estate & Construction" },
  { id: "wholesale_retail", ja: "卸売業・小売業・商社・EC", vi: "Bán buôn, Bán lẻ, Thương mại", en: "Wholesale & Retail" },
  { id: "medical", ja: "医療・福祉・ヘルスケア", vi: "Y tế, Dược phẩm & Chăm sóc sức khỏe", en: "Healthcare & Medical" },
  { id: "finance", ja: "金融・保険・士業", vi: "Tài chính, Bảo hiểm, Luật", en: "Finance & Legal" },
];

const PREFECTURE_OPTIONS = [
  { id: "all", ja: "全国（全47都道府県）", vi: "Toàn quốc (47 tỉnh)", en: "All Japan (Nationwide)" },
  { id: "kanto", ja: "関東圏（東京・神奈川・千葉・埼玉）", vi: "Vùng Kanto (Tokyo, Kanagawa...)", en: "Kanto Metro Area" },
  { id: "kansai", ja: "関西圏（大阪・兵庫・京都）", vi: "Vùng Kansai (Osaka, Hyogo...)", en: "Kansai Metro Area" },
  { id: "tokyo", ja: "東京都のみ", vi: "Chỉ Tokyo", en: "Tokyo Only" },
  { id: "osaka", ja: "大阪府のみ", vi: "Chỉ Osaka", en: "Osaka Only" },
  { id: "aichi", ja: "愛知県（名古屋）のみ", vi: "Chỉ Aichi (Nagoya)", en: "Aichi Only" },
  { id: "kanagawa", ja: "神奈川県（横浜）のみ", vi: "Chỉ Kanagawa (Yokohama)", en: "Kanagawa Only" },
  { id: "fukuoka", ja: "福岡県のみ", vi: "Chỉ Fukuoka", en: "Fukuoka Only" },
];

export function FormCampaignsTab({ initialTargetCompanies, onClearInitialTarget }: FormCampaignsTabProps = {}) {
  const { locale } = useLanguage();
  const { user, savedCompanies } = useAuth();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const [activeSubTab, setActiveSubTab] = useState<"campaigns" | "templates" | "transactions">("campaigns");

  // Data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [presets, setPresets] = useState<Template[]>([]);
  const [transactions, setTransactions] = useState<FormCreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [formCredits, setFormCredits] = useState<{ balance: number; reserved?: number; total_purchased: number; total_used: number }>({
    balance: 0,
    reserved: 0,
    total_purchased: 0,
    total_used: 0
  });
  const [loading, setLoading] = useState(true);

  // Flow Guide Modal
  const [showFlowGuideModal, setShowFlowGuideModal] = useState(false);

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
  const [cmpTargetCount, setCmpTargetCount] = useState<number>(100);
  const [cmpSenderCompany, setCmpSenderCompany] = useState("");
  const [cmpSenderName, setCmpSenderName] = useState("");
  const [cmpSenderEmail, setCmpSenderEmail] = useState(user?.email || "");
  const [cmpSenderPhone, setCmpSenderPhone] = useState("");
  const [cmpSenderWebsite, setCmpSenderWebsite] = useState("");
  const [cmpSubject, setCmpSubject] = useState("");
  const [cmpBody, setCmpBody] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);

  // Target Configuration States (used when opened with pre-selected target)
  const [targetType, setTargetType] = useState<"my_list" | "preset_filter" | "custom_companies">("custom_companies");
  const [myListScope, setMyListScope] = useState<"all" | "uncontacted">("all");
  const [targetIndustry, setTargetIndustry] = useState<string>("all");
  const [targetPrefecture, setTargetPrefecture] = useState<string>("all");
  const [customCompanies, setCustomCompanies] = useState<{ id: string; name: string }[]>([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCmp, resTpl, resCredits] = await Promise.all([
        fetch("/api/user/form-campaigns"),
        fetch("/api/user/form-templates"),
        fetch("/api/user/form-credits")
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
      if (resCredits.ok) {
        const data = await resCredits.json();
        const c = data.credits || data;
        setFormCredits({
          balance: Number(c.balance || 0),
          reserved: Number(c.reserved || 0),
          total_purchased: Number(c.total_purchased || 0),
          total_used: Number(c.total_used || 0)
        });
      }
    } catch (e) {
      console.error("Failed to fetch form campaigns data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const res = await fetch("/api/user/form-credits/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error("Failed to fetch credit transactions", e);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchTransactions();
  }, [fetchData, fetchTransactions]);

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

  // Open Campaign Creator or Editor
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

      // Restore target configuration if exists
      if (cmp.target_filters) {
        try {
          const parsed = typeof cmp.target_filters === "string" ? JSON.parse(cmp.target_filters) : cmp.target_filters;
          if (parsed.type) {
            setTargetType(parsed.type);
            if (parsed.scope) setMyListScope(parsed.scope);
            if (parsed.industry) setTargetIndustry(parsed.industry);
            if (parsed.prefecture) setTargetPrefecture(parsed.prefecture);
            if (parsed.companies) setCustomCompanies(parsed.companies);
          }
        } catch {
          setTargetType("custom_companies");
        }
      }
      setIsCampaignModalOpen(true);
    } else {
      // If clicking create new without initial target, show Flow Guide Modal!
      if (!initialTargetCompanies || initialTargetCompanies.length === 0) {
        setShowFlowGuideModal(true);
        return;
      }

      if (initialTargetCompanies.length < 100) {
        alert(
          isJa
            ? `フォーム営業キャンペーンの作成は【最低100社以上】の選定が必要です。\n（現在選択中: ${initialTargetCompanies.length}社）\n\n少数の過剰申請を防ぎ、アプローチ成約率を担保するため、100社以上を選択して作成してください。`
            : isVi
            ? `Chiến dịch gửi Form yêu cầu tối thiểu từ 100 doanh nghiệp trở lên.\n(Hiện đang chọn: ${initialTargetCompanies.length} công ty)\n\nVui lòng chọn tối thiểu 100 công ty.`
            : `Minimum target count is 100 companies per campaign (currently: ${initialTargetCompanies.length}).`
        );
        return;
      }

      setEditingCampaignId(null);
      setCmpName(isJa ? `マイリスト選定企業宛_フォーム営業_${new Date().toLocaleDateString("ja-JP")}` : `Gửi Form đến ${initialTargetCompanies.length} doanh nghiệp đã chọn`);
      setCmpSenderCompany("");
      setCmpSenderName("");
      setCmpSenderEmail(user?.email || "");
      setCmpSenderPhone("");
      setCmpSenderWebsite("");
      setTargetType("custom_companies");
      setCustomCompanies(initialTargetCompanies);
      setCmpTargetCount(initialTargetCompanies.length);

      if (presets.length > 0) {
        setCmpSubject(presets[0].subject);
        setCmpBody(presets[0].body);
      } else {
        setCmpSubject("");
        setCmpBody("");
      }
      setIsCampaignModalOpen(true);
    }
  };

  // Automatically trigger campaign modal if initialTargetCompanies are passed in
  useEffect(() => {
    if (initialTargetCompanies && initialTargetCompanies.length > 0) {
      if (initialTargetCompanies.length < 100) {
        alert(
          isJa
            ? `フォーム営業キャンペーンの作成は【最低100社以上】の選定が必要です。\n（現在選択中: ${initialTargetCompanies.length}社）\n\n少数の過剰申請を防ぎ、アプローチ成約率を担保するため、100社以上を選択して作成してください。`
            : isVi
            ? `Chiến dịch gửi Form yêu cầu tối thiểu từ 100 doanh nghiệp trở lên.\n(Hiện đang chọn: ${initialTargetCompanies.length} công ty)\n\nVui lòng chọn tối thiểu 100 công ty.`
            : `Minimum target count is 100 companies per campaign (currently: ${initialTargetCompanies.length}).`
        );
        if (onClearInitialTarget) onClearInitialTarget();
        return;
      }
      setEditingCampaignId(null);
      setCmpName(isJa ? `マイリスト選定企業宛_フォーム営業_${new Date().toLocaleDateString("ja-JP")}` : `Gửi Form đến ${initialTargetCompanies.length} doanh nghiệp đã chọn`);
      setTargetType("custom_companies");
      setCustomCompanies(initialTargetCompanies);
      setCmpTargetCount(initialTargetCompanies.length);
      setCmpSenderEmail(user?.email || "");
      if (presets.length > 0) {
        setCmpSubject(presets[0].subject);
        setCmpBody(presets[0].body);
      }
      setIsCampaignModalOpen(true);
    }
  }, [initialTargetCompanies, isJa, user?.email, presets, onClearInitialTarget]);

  // Save Campaign (as draft or submit for review)
  const handleSaveCampaign = async (statusToSet: "draft" | "pending_review") => {
    if (!cmpName || !cmpSenderCompany || !cmpSenderName || !cmpSubject || !cmpBody) {
      alert(isJa ? "必須項目（会社名、お名前、件名、本文）を入力してください。" : isVi ? "Vui lòng nhập các trường bắt buộc (Công ty, Người gửi, Tiêu đề, Nội dung)." : "Please enter all required fields.");
      return;
    }

    if (cmpTargetCount < 100) {
      alert(
        isJa
          ? "1キャンペーンあたりの配信件数は【最低100件以上】を指定してください。\n（少数の過剰申請を防ぎ、十分なアプローチ効果を担保するため）"
          : isVi
          ? "Số lượng gửi tối thiểu cho mỗi chiến dịch là từ 100 form trở lên (nhằm tránh tạo quá nhiều chiến dịch nhỏ lẻ và đảm bảo hiệu quả tiếp cận)."
          : "Minimum target count is 100 forms per campaign."
      );
      return;
    }

    // Build target_filters payload
    let targetFiltersPayload: any = null;
    if (targetType === "my_list") {
      targetFiltersPayload = {
        type: "my_list",
        scope: myListScope,
        saved_count: savedCompanies?.length || 0,
        label: isJa ? `マイリスト（${myListScope === "uncontacted" ? "未連絡のみ" : "全件"}）` : `My List (${myListScope})`
      };
    } else if (targetType === "preset_filter") {
      targetFiltersPayload = {
        type: "preset_filter",
        industry: targetIndustry,
        prefecture: targetPrefecture,
        label: `${INDUSTRY_OPTIONS.find(i => i.id === targetIndustry)?.ja || "全業種"} × ${PREFECTURE_OPTIONS.find(p => p.id === targetPrefecture)?.ja || "全国"}`
      };
    } else if (targetType === "custom_companies") {
      targetFiltersPayload = {
        type: "custom_companies",
        companies: customCompanies.map(c => ({ id: c.id, name: c.name })),
        company_count: customCompanies.length,
        label: isJa ? `マイリスト選択企業 (${customCompanies.length}社)` : `Selected Companies (${customCompanies.length})`
      };
    }

    // MANDATORY TARGET VALIDATION WHEN SUBMITTING FOR APPROVAL
    if (statusToSet === "pending_review") {
      const isAlreadyPending = editingCampaignId && campaigns.find(c => c.id === editingCampaignId)?.status === "pending_review";
      if (!isAlreadyPending && cmpTargetCount > formCredits.balance) {
        alert(
          isJa
            ? `保有クレジット残高が不足しています。\n（必要: ${cmpTargetCount.toLocaleString()} 件 / 保有残高: ${formCredits.balance.toLocaleString()} 件）\n先にクレジットをチャージするか、送信件数を調整してください。`
            : isVi
            ? `Số dư credits không đủ để gửi chiến dịch này.\n(Cần: ${cmpTargetCount.toLocaleString()} lượt / Hiện có: ${formCredits.balance.toLocaleString()} lượt)\nVui lòng nạp thêm credits hoặc giảm số lượng gửi.`
            : `Insufficient credit balance. Required: ${cmpTargetCount}, Available: ${formCredits.balance}. Please top up first.`
        );
        return;
      }
    }

    setSavingCampaign(true);

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
          target_filters: targetFiltersPayload,
          target_count: cmpTargetCount,
          cost_jpy: 0,
          status: statusToSet
        })
      });

      const data = await res.json();

      if (res.ok) {
        setIsCampaignModalOpen(false);
        if (onClearInitialTarget) onClearInitialTarget();
        fetchData();
        fetchTransactions();
        if (statusToSet === "pending_review") {
          alert(
            isJa
              ? `キャンペーンの審査申請を受け付けました（${cmpTargetCount.toLocaleString()} クレジットを仮押さえ）。\n管理者の審査後、自動配信が開始されます。`
              : isVi
              ? `Đã gửi duyệt chiến dịch (Tạm giữ ${cmpTargetCount.toLocaleString()} credits).\nSau khi duyệt, hệ thống sẽ tự động bắt đầu gửi.`
              : `Campaign submitted for moderation. Credits reserved: ${cmpTargetCount}.`
          );
        } else {
          alert(
            isJa
              ? "変更内容を下書きとして保存しました。"
              : isVi
              ? "Đã lưu thay đổi vào bản nháp."
              : "Draft updated successfully."
          );
        }
      } else {
        alert(data.error || "エラーが発生しました。");
      }
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました。");
    } finally {
      setSavingCampaign(false);
    }
  };

  // Quick 1-click Submit Campaign for Approval (Draft -> Pending Review)
  const handleQuickSubmitForApproval = async (cmp: Campaign) => {
    if (!cmp.name || !cmp.subject || !cmp.body || !cmp.sender_company || !cmp.sender_name) {
      alert(
        isJa
          ? "キャンペーンの必須情報（会社名、お名前、件名、本文）が未設定です。「編集」ボタンを押して内容を入力・確認してください。"
          : isVi
          ? "Chiến dịch chưa hoàn thiện thông tin bắt buộc (Công ty, Người gửi, Tiêu đề, Nội dung). Vui lòng nhấn 'Sửa' để hoàn tất trước khi gửi duyệt."
          : "Please complete required fields before submitting."
      );
      openCampaignModal(cmp);
      return;
    }

    if (cmp.target_count < 100) {
      alert(
        isJa
          ? `1キャンペーンあたりの配信件数は【最低100件以上】が必要です（現在: ${cmp.target_count}件）。\n「編集」より配信ターゲット件数を100件以上に調整してください。`
          : isVi
          ? `Số lượng gửi tối thiểu cho 1 chiến dịch là 100 form (hiện tại: ${cmp.target_count} form). Vui lòng chọn 'Sửa' để điều chỉnh tệp mục tiêu.`
          : `Minimum target count is 100 forms (currently: ${cmp.target_count}).`
      );
      return;
    }

    if (formCredits.balance < cmp.target_count) {
      alert(
        isJa
          ? `クレジット残高が不足しています。\n必要件数: ${cmp.target_count.toLocaleString()} 件\n利用可能残高: ${formCredits.balance.toLocaleString()} 件\n\n「クレジットをチャージ」より追加チャージを行ってください。`
          : isVi
          ? `Số dư credit không đủ để gửi chiến dịch này.\nYêu cầu: ${cmp.target_count.toLocaleString()} lượt\nKhả dụng: ${formCredits.balance.toLocaleString()} lượt\n\nVui lòng nạp thêm credit.`
          : `Insufficient credits. Required: ${cmp.target_count}, available: ${formCredits.balance}.`
      );
      return;
    }

    const confirmMsg = isJa
      ? `【審査申請の確認】\n「${cmp.name}」の審査申請を送信しますか？\n\n・配信対象件数: ${cmp.target_count.toLocaleString()} 件\n・仮押さえクレジット: ${cmp.target_count.toLocaleString()} 件\n\n※審査中（承認待ち）の間は、いつでも「申請取下げ」でキャンセル・クレジット即時全額返還が可能です。\n※管理者の承認完了後、自動配信が開始されます。`
      : isVi
      ? `【Xác nhận gửi phê duyệt】\nGửi yêu cầu kiểm duyệt cho chiến dịch "${cmp.name}"?\n\n- Số lượng gửi: ${cmp.target_count.toLocaleString()} form\n- Tạm giữ tín dụng: ${cmp.target_count.toLocaleString()} credits\n\n* Trong thời gian chờ duyệt, bạn có thể ấn "Dừng yêu cầu phê duyệt" bất cứ lúc nào để rút lại và hoàn credit ngay lập tức.\n* Sau khi admin phê duyệt, hệ thống sẽ tự động gửi đi.`
      : `Submit "${cmp.name}" for review? (${cmp.target_count.toLocaleString()} credits will be held).`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/user/form-campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cmp.id, action: "submit_for_approval" })
      });

      const data = await res.json();
      if (res.ok) {
        fetchData();
        fetchTransactions();
        alert(
          isJa
            ? `審査申請を送信しました（${cmp.target_count.toLocaleString()} クレジットを仮押さえ）。\nいつでも「申請取下げ」でキャンセル可能です。`
            : isVi
            ? `Đã gửi yêu cầu phê duyệt thành công (Tạm giữ ${cmp.target_count.toLocaleString()} credits).\nTrạng thái chuyển sang Chờ duyệt. Bạn có thể ấn 'Dừng yêu cầu duyệt' bất cứ lúc nào.`
            : `Submitted for review successfully!`
        );
      } else {
        alert(data.error || "審査申請に失敗しました。");
      }
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました。");
    }
  };

  // Revert Pending Campaign back to Draft (and refund reserved credits)
  const handleRevertToDraft = async (cmp: Campaign) => {
    const confirmMsg = isJa
      ? `このキャンペーンの審査申請を取り下げて「下書き」に戻しますか？\n（予約された ${cmp.target_count.toLocaleString()} 件のクレジットは即座に利用可能残高へ返還されます）`
      : isVi
      ? `Dừng yêu cầu phê duyệt chiến dịch này và rút về bản 'Nháp'?\n(${cmp.target_count.toLocaleString()} lượt credits tạm giữ sẽ được hoàn lại số dư khả dụng ngay lập tức)`
      : `Revert this campaign to draft? (${cmp.target_count.toLocaleString()} reserved credits will be returned to your available balance)`;

    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch("/api/user/form-campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cmp.id, action: "revert_to_draft" })
      });
      if (res.ok) {
        if (isCampaignModalOpen) setIsCampaignModalOpen(false);
        fetchData();
        fetchTransactions();
        alert(
          isJa
            ? `申請を取り下げて下書きに戻しました。${cmp.target_count.toLocaleString()} クレジットが利用可能残高に返還されました。`
            : isVi
            ? `Đã dừng yêu cầu duyệt và chuyển về nháp. Hoàn ${cmp.target_count.toLocaleString()} credits về số dư khả dụng.`
            : `Reverted to draft. Credits returned: ${cmp.target_count}.`
        );
      } else {
        const err = await res.json();
        alert(err.error || "エラーが発生しました。");
      }
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました。");
    }
  };

  // Delete Draft, Rejected, or Cancel Pending Campaign
  const handleDeleteCampaign = async (cmp: Campaign) => {
    const isPending = cmp.status === "pending_review" || cmp.status === "pending_approval" || cmp.status === "approved";
    const isRejected = cmp.status === "rejected";
    const confirmMsg = isPending
      ? (isJa
          ? `この申請中キャンペーンを取り消しますか？\n（予約された ${cmp.target_count.toLocaleString()} 件のクレジットは即座にウォレットへ全額返還されます）`
          : isVi
          ? `Hủy duyệt chiến dịch này?\n(${cmp.target_count.toLocaleString()} lượt credits đã giữ sẽ được hoàn trả ngay lập tức vào Ví của bạn)`
          : `Cancel this campaign? (${cmp.target_count.toLocaleString()} reserved credits will be refunded to your wallet)`)
      : isRejected
      ? (isJa
          ? `この却下されたキャンペーンを削除しますか？\n（クレジットは既にウォレットへ全額返還済みです）`
          : isVi
          ? `Xóa chiến dịch bị từ chối này?\n(Credits đã được hoàn trả lại Ví của bạn)`
          : `Delete this rejected campaign? (Credits already returned)`)
      : (isJa ? "この下書きキャンペーンを削除しますか？" : isVi ? "Xóa bản nháp chiến dịch này?" : "Delete draft campaign?");

    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch(`/api/user/form-campaigns?id=${cmp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
        fetchTransactions();
      } else {
        alert(data.error || (isJa ? "削除に失敗しました。" : isVi ? "Không thể xóa chiến dịch." : "Failed to delete."));
      }
    } catch (e) {
      console.error(e);
      alert(isJa ? "エラーが発生しました。" : "Đã có lỗi xảy ra.");
    }
  };

  const insertVariable = (variable: string) => {
    setCmpBody((prev) => prev + variable);
  };

  const statusBadge = (status: Campaign["status"]) => {
    switch (status) {
      case "draft":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{isJa ? "下書き" : isVi ? "Bản nháp" : "Draft"}</span>;
      case "pending_review":
      case "pending_approval":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{isJa ? "審査中（予約枠）" : isVi ? "Chờ duyệt (Đã giữ chỗ)" : "In Review (Reserved)"}</span>;
      case "approved":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" />{isJa ? "承認済み・待機中" : isVi ? "Đã duyệt / Chờ gửi" : "Approved"}</span>;
      case "sending":
      case "processing":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 animate-pulse flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" />{isJa ? "配信中" : isVi ? "Đang gửi" : "Sending"}</span>;
      case "completed":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">{isJa ? "配信完了" : isVi ? "Hoàn thành" : "Completed"}</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">{isJa ? "要修正（再申請可）" : isVi ? "Cần điều chỉnh nội dung" : "Revision Required"}</span>;
      default:
        return null;
    }
  };

  const renderTargetInfo = (filtersJson: string | null) => {
    if (!filtersJson) {
      return <span className="text-slate-400 font-normal">ターゲット未設定</span>;
    }
    try {
      const parsed = typeof filtersJson === "string" ? JSON.parse(filtersJson) : filtersJson;
      if (parsed.type === "custom_companies") {
        return (
          <span className="font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
            <CheckSquare className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
            <span>指定企業 ({parsed.company_count || parsed.companies?.length || 0}社)</span>
          </span>
        );
      }
      if (parsed.type === "my_list") {
        return (
          <span className="font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
            <ListFilter className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
            <span>マイリスト ({parsed.scope === "uncontacted" ? "未連絡" : "全件"})</span>
          </span>
        );
      }
      if (parsed.type === "preset_filter") {
        const ind = INDUSTRY_OPTIONS.find(i => i.id === parsed.industry)?.ja.split("（")[0] || "全業種";
        const pref = PREFECTURE_OPTIONS.find(p => p.id === parsed.prefecture)?.ja.split("（")[0] || "全国";
        return (
          <span className="font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
            <span>{ind} × {pref}</span>
          </span>
        );
      }
      return <span className="font-semibold text-slate-700 dark:text-slate-200">{parsed.label || "条件指定済"}</span>;
    } catch {
      return <span className="text-slate-500">条件指定済</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Navigation (Clean B2B Style) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => setActiveSubTab("campaigns")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "campaigns"
                ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {isJa ? "キャンペーン一覧" : isVi ? "Danh sách chiến dịch" : "Campaigns"} ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveSubTab("templates")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "templates"
                ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {isJa ? "営業文面テンプレート" : isVi ? "Mẫu thư chào hàng" : "Pitch Templates"} ({templates.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab("transactions");
              fetchTransactions();
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "transactions"
                ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{isJa ? "利用明細・履歴" : isVi ? "Lịch sử biến động Credits" : "Credit History"}</span>
            {transactions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                {transactions.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "campaigns" ? (
            <button
              onClick={() => setShowFlowGuideModal(true)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isJa ? "新規キャンペーン作成" : isVi ? "Tạo chiến dịch mới" : "New Campaign"}</span>
            </button>
          ) : activeSubTab === "templates" ? (
            <button
              onClick={() => openTemplateModal()}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isJa ? "テンプレート新規作成" : isVi ? "Tạo mẫu thư mới" : "New Template"}</span>
            </button>
          ) : (
            <button
              onClick={fetchTransactions}
              disabled={loadingTransactions}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTransactions ? "animate-spin" : ""}`} />
              <span>{isJa ? "明細を更新" : isVi ? "Làm mới dữ liệu" : "Refresh"}</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#1B4F8A]" />
          <span className="text-xs">{isJa ? "読み込み中..." : isVi ? "Đang tải dữ liệu..." : "Loading..."}</span>
        </div>
      ) : activeSubTab === "campaigns" ? (
        /* CAMPAIGNS SUB-TAB */
        <div className="space-y-6">
          {/* Credit Wallet Card - Japanese Corporate Trust SaaS Blue Design */}
          <div className="bg-gradient-to-br from-[#0B1A30] via-[#102A4C] to-[#1B4F8A] border border-[#1B4F8A]/40 text-white rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                    <Coins className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isJa ? "フォーム営業クレジット" : isVi ? "Ví tín dụng gửi Form" : "Outreach Credits"}</span>
                  </span>
                  <span className="text-[11px] font-medium text-blue-200/80">
                    {isJa ? "有効期限なし・100件〜自由分割配信" : isVi ? "Không giới hạn thời hạn • Chia lẻ gửi nhiều đợt" : "No Expiry • Flexible Batches"}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 pt-0.5 flex-wrap">
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
                    {formCredits.balance.toLocaleString()}
                    <span className="text-sm font-semibold ml-1.5 text-blue-200/80">
                      {isJa ? "件（利用可能残高）" : isVi ? " lượt khả dụng" : " available"}
                    </span>
                  </div>
                  {(formCredits.reserved ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isJa ? "審査中（予約枠）" : isVi ? "Đang tạm giữ duyệt" : "Reserved in review"}: <strong>{formCredits.reserved?.toLocaleString()}</strong> 件</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-blue-200/70 pt-1 flex-wrap">
                  <span>{isJa ? "累計チャージ" : isVi ? "Tổng đã nạp" : "Total Top-up"}: <strong className="text-white font-mono">{formCredits.total_purchased.toLocaleString()}</strong> 件</span>
                  <span>•</span>
                  <span>{isJa ? "実送信完了" : isVi ? "Đã gửi thực tế" : "Delivered"}: <strong className="text-white font-mono">{(formCredits.total_used || 0).toLocaleString()}</strong> 件</span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab("transactions");
                      fetchTransactions();
                    }}
                    className="text-amber-300 hover:text-amber-200 underline underline-offset-4 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <History className="w-3 h-3" />
                    <span>{isJa ? "増減明細・履歴を見る" : isVi ? "Xem lịch sử trừ & hoàn credit" : "View transaction logs"}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                <Link
                  href={`/${locale}/pricing?tab=form`}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
                >
                  <Coins className="w-3.5 h-3.5 text-slate-950" />
                  <span>{isJa ? "クレジットをチャージ" : isVi ? "Nạp thêm Credits" : "Top Up Credits"}</span>
                </Link>
                <Link
                  href={`/${locale}/search`}
                  className="px-4 py-2 rounded-xl font-semibold text-xs text-white hover:bg-white/10 border border-white/20 transition-all flex items-center justify-center gap-1 text-center"
                >
                  <span>{isJa ? "企業検索から選定" : isVi ? "Tìm doanh nghiệp" : "Search Companies"}</span>
                  <ArrowRight className="w-3 h-3 text-blue-200" />
                </Link>
              </div>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl p-10 sm:p-12 text-center">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#1B4F8A] border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                {isJa ? "作成されたキャンペーンはありません" : isVi ? "Chưa có chiến dịch gửi Form nào" : "No Campaigns Created"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                {isJa
                  ? "企業検索から最適なターゲット企業を抽出し、問い合わせフォーム営業キャンペーンを作成できます。"
                  : isVi
                  ? "Lọc doanh nghiệp mục tiêu từ trang Tìm kiếm và thiết lập chiến dịch gửi form chào hàng tự động."
                  : "Filter target prospects from company search and launch automated outreach campaigns."}
              </p>
              <button
                onClick={() => setShowFlowGuideModal(true)}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-xs transition-all cursor-pointer"
              >
                {isJa ? "最初のキャンペーンを作成する" : isVi ? "Tạo chiến dịch đầu tiên" : "Create Campaign"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((cmp) => (
                <div
                  key={cmp.id}
                  className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(cmp.status)}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {cmp.name}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cmp.subject}</span> — {cmp.sender_company} ({cmp.sender_name})
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                      <span>{isJa ? "対象件数" : isVi ? "Số lượng" : "Volume"}: <strong className="text-slate-700 dark:text-slate-200">{cmp.target_count.toLocaleString()} 件</strong></span>
                      <span>•</span>
                      <span>{isJa ? "配信ターゲット" : isVi ? "Tệp mục tiêu" : "Target"}: {renderTargetInfo(cmp.target_filters)}</span>
                      <span>•</span>
                      <span>{isJa ? "作成日時" : isVi ? "Ngày tạo" : "Created"}: {new Date(cmp.created_at).toLocaleDateString()}</span>
                      {cmp.status === "completed" && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {isJa ? "送信成功" : isVi ? "Gửi thành công" : "Delivered"}: {cmp.success_count}/{cmp.target_count}
                        </span>
                      )}
                    </div>

                    {cmp.status === "rejected" && cmp.rejection_reason && (
                      <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900 mt-2">
                        {isJa ? "審査フィードバック・修正要請" : isVi ? "Lý do từ chối & Yêu cầu sửa" : "Review Feedback"}: {cmp.rejection_reason}
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
                          onClick={() => handleQuickSubmitForApproval(cmp)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title={isJa ? "審査申請を送信（クレジット予約枠確保）" : isVi ? "Gửi yêu cầu phê duyệt" : "Submit for Approval"}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isJa ? "審査申請" : isVi ? "Gửi duyệt" : "Submit"}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(cmp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title={isJa ? "削除" : isVi ? "Xóa" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {(cmp.status === "pending_review" || cmp.status === "pending_approval" || cmp.status === "approved") && (
                      <>
                        <button
                          onClick={() => openCampaignModal(cmp)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          {isJa ? "編集" : isVi ? "Sửa" : "Edit"}
                        </button>
                        <button
                          onClick={() => handleRevertToDraft(cmp)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer flex items-center gap-1"
                          title={isJa ? "審査申請を取り下げて下書きに戻す（予約枠クレジット即時返還）" : isVi ? "Dừng yêu cầu phê duyệt và hoàn lại credit về ví ngay lập tức" : "Withdraw review request & refund credits"}
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{isJa ? "申請取下げ" : isVi ? "Dừng yêu cầu phê duyệt" : "Withdraw"}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(cmp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title={isJa ? "削除してクレジット返還" : isVi ? "Xóa và hoàn credits" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {cmp.status === "rejected" && (
                      <>
                        <button
                          onClick={() => openCampaignModal(cmp)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>{isJa ? "内容を修正して再申請" : isVi ? "Chỉnh sửa & Nộp lại" : "Edit & Resubmit"}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(cmp)}
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
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isJa ? "レポートCSV" : isVi ? "Báo cáo CSV" : "Report CSV"}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeSubTab === "templates" ? (
        /* TEMPLATES SUB-TAB */
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {isJa ? "自作テンプレート (保存済)" : isVi ? "Mẫu thư đã lưu của bạn" : "Saved Pitch Templates"} ({templates.length})
            </h3>
            {templates.length === 0 ? (
              <div className="p-8 rounded-xl bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                {isJa ? "まだ保存された独自テンプレートはありません。「+ テンプレート新規作成」または下記のプリセットから作成できます。" : isVi ? "Bạn chưa lưu mẫu riêng nào. Hãy bấm 'Tạo mẫu thư mới' hoặc sao chép từ mẫu có sẵn bên dưới." : "No custom templates yet."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-xl bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{tpl.name}</h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openTemplateModal(tpl)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 line-clamp-1">{tpl.subject}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap">{tpl.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Presets */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {isJa ? "高成約プリセット文面（そのまま使用・複製可能）" : isVi ? "Mẫu thư chuẩn tỷ lệ chuyển đổi cao" : "High-Converting Presets"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1B4F8A] border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900 mb-2 inline-block">
                      {preset.category === "b2b_service" ? "B2B SaaS" : preset.category === "recruitment" ? "HR / 採用" : "アライアンス"}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{preset.name}</h4>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 line-clamp-1">{preset.subject}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap">{preset.body}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 mt-3">
                    <button
                      onClick={() => {
                        setEditingTemplate(null);
                        setTplName(`${preset.name} (コピー)`);
                        setTplSubject(preset.subject);
                        setTplBody(preset.body);
                        setIsTemplateModalOpen(true);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{isJa ? "複製して編集" : isVi ? "Sao chép" : "Clone"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setCmpSubject(preset.subject);
                        setCmpBody(preset.body);
                        setShowFlowGuideModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isJa ? "この文面を使う" : isVi ? "Sử dụng" : "Use Template"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TRANSACTIONS SUB-TAB */
        <div className="space-y-6">
          {/* Overview Statement Card */}
          <div className="bg-[#0F1E36] border border-blue-900/40 text-white rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <History className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {isJa ? "フォーム営業クレジット 増減明細・取引履歴" : isVi ? "Lịch sử biến động tín dụng gửi Form" : "Credit Transaction Statement"}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  {isJa 
                    ? "クレジットのチャージ（購入）、申請時の仮押さえ、取下げ・却下時の返還、配信完了時の実消化の全履歴です。" 
                    : isVi 
                    ? "Ghi nhận đầy đủ biến động: Nạp credit, Tạm giữ khi gửi duyệt, Hoàn trả khi rút/từ chối, và Trừ thực tế khi gửi thành công."
                    : "Complete audit log of credit purchases, review holds, refunds, and actual delivery deductions."}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">{isJa ? "利用可能残高" : isVi ? "Số dư khả dụng" : "Available Balance"}</span>
                  <span className="text-xl font-black font-mono text-amber-400">{formCredits.balance.toLocaleString()} 件</span>
                </div>
                <Link
                  href={`/${locale}/pricing?tab=form`}
                  className="px-4 py-2 rounded-lg font-bold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 text-slate-950" />
                  <span>{isJa ? "クレジットをチャージ" : isVi ? "Nạp thêm" : "Top Up"}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {isJa ? "取引明細一覧" : isVi ? "Bảng kê chi tiết biến động" : "Transactions Log"}
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {transactions.length} {isJa ? "件" : isVi ? "giao dịch" : "records"}
                </span>
              </div>
              <button
                onClick={fetchTransactions}
                disabled={loadingTransactions}
                className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTransactions ? "animate-spin" : ""}`} />
                <span>{isJa ? "明細を更新" : isVi ? "Làm mới" : "Refresh"}</span>
              </button>
            </div>

            {loadingTransactions ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-[#1B4F8A]" />
                <span className="text-xs">{isJa ? "明細を取得中..." : isVi ? "Đang tải dữ liệu..." : "Loading records..."}</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Coins className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isJa ? "クレジットの増減履歴はまだありません" : isVi ? "Chưa có lịch sử biến động credit nào" : "No credit transactions yet"}
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  {isJa
                    ? "クレジットのチャージや、キャンペーン申請（仮押さえ）・取下げ（返還）を行うとこちらに明細が記録されます。"
                    : isVi
                    ? "Khi nạp credit, gửi yêu cầu phê duyệt hoặc dừng phê duyệt chiến dịch, lịch sử cộng trừ sẽ hiển thị tại đây."
                    : "Purchases, campaign reservations, and refunds will appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold">
                      <th className="py-3 px-4">{isJa ? "日時" : isVi ? "Thời gian" : "Date"}</th>
                      <th className="py-3 px-4">{isJa ? "取引種別" : isVi ? "Loại giao dịch" : "Type"}</th>
                      <th className="py-3 px-4">{isJa ? "関連キャンペーン / 内容" : isVi ? "Chiến dịch / Nội dung" : "Campaign / Details"}</th>
                      <th className="py-3 px-4 text-right">{isJa ? "増減" : isVi ? "Biến động" : "Amount"}</th>
                      <th className="py-3 px-4 text-right">{isJa ? "残高" : isVi ? "Số dư khả dụng" : "Balance After"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {transactions.map((tx) => {
                      const isPositive = tx.type === "charge" || tx.type === "refund";
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {new Date(tx.created_at).toLocaleString(isJa ? "ja-JP" : "vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {tx.type === "charge" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                + {isJa ? "チャージ (購入)" : isVi ? "Nạp credits" : "Top Up"}
                              </span>
                            )}
                            {tx.type === "reserve" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                ⏳ {isJa ? "審査申請 (仮押さえ)" : isVi ? "Tạm giữ duyệt" : "Reserved in review"}
                              </span>
                            )}
                            {tx.type === "refund" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                ↩ {isJa ? "仮押さえ返還" : isVi ? "Hoàn trả số dư" : "Refund / Returned"}
                              </span>
                            )}
                            {tx.type === "delivered" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                ✓ {isJa ? "送信完了 (実消化)" : isVi ? "Gửi thành công" : "Delivered"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {tx.campaign_name && (
                              <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                                {tx.campaign_name}
                              </div>
                            )}
                            {tx.note && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {tx.note}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                            <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                              {isPositive ? `+${tx.amount.toLocaleString()}` : `-${tx.amount.toLocaleString()}`}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1 font-sans">件</span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {tx.balance_after.toLocaleString()}
                            <span className="text-[11px] text-slate-400 ml-1 font-sans">件</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TEMPLATE CREATION / EDIT MODAL                               */}
      {/* ============================================================ */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto relative shadow-xl">
            <button
              onClick={() => setIsTemplateModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
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
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
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
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
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

                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <button
                    type="button"
                    onClick={() => setTplBody((prev) => prev + "{{company_name}}")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    + {"{{company_name}}"} (宛先企業名)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTplBody((prev) => prev + "{{representative_name}}")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    + {"{{representative_name}}"} (代表者名)
                  </button>
                </div>

                <textarea
                  rows={8}
                  required
                  value={tplBody}
                  onChange={(e) => setTplBody(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  {isJa ? "キャンセル" : isVi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
      {/* CAMPAIGN CREATION / EDITING MODAL                             */}
      {/* ============================================================ */}
      {isCampaignModalOpen && (() => {
        const isEditingExisting = Boolean(editingCampaignId);
        const currentEditingCampaign = campaigns.find(c => c.id === editingCampaignId);
        const isPendingReview = currentEditingCampaign?.status === "pending_review";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 max-w-3xl w-full max-h-[92vh] overflow-y-auto relative shadow-2xl scrollbar-thin">
              <button
                onClick={() => {
                  setIsCampaignModalOpen(false);
                  if (onClearInitialTarget) onClearInitialTarget();
                }}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                {isEditingExisting ? <Edit3 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" /> : <Send className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />}
                <span>
                  {isEditingExisting
                    ? (isPendingReview 
                        ? (isJa ? "キャンペーン内容の編集 (審査待ち)" : isVi ? "Chỉnh sửa chiến dịch (Đang chờ duyệt)" : "Edit Campaign (In Review)")
                        : (isJa ? "キャンペーン編集" : isVi ? "Chỉnh sửa chiến dịch" : "Edit Campaign"))
                    : (isJa ? "フォーム営業キャンペーン作成" : isVi ? "Tạo chiến dịch gửi Form" : "Create Form DM Campaign")}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                {isEditingExisting
                  ? (isJa 
                      ? "送信メッセージや送信者情報を編集できます。審査承認後に設定内容で自動配信されます。"
                      : isVi
                      ? "Chỉnh sửa thông điệp và thông tin người gửi. Sau khi Admin duyệt, bot sẽ gửi theo nội dung này."
                      : "Edit pitch message and sender details. Outreach starts automatically after approval.")
                  : (isJa 
                      ? "ターゲット企業と文面を設定し、下書きとして保存または審査申請を行えます。審査承認後に自動送信されます。" 
                      : isVi 
                      ? "Thiết lập đối tượng mục tiêu và kịch bản chào hàng. Sau khi Admin duyệt, hệ thống sẽ tự động gửi." 
                      : "Configure target prospects and pitch copy. Outreach starts automatically after approval.")}
              </p>

              <div className="space-y-4">
                {/* 1. Campaign Name & Target Volume */}
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
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isEditingExisting 
                          ? (isJa ? "送信件数 (固定)" : isVi ? "Số lượng gửi (Cố định)" : "Target Volume (Locked)")
                          : (isJa ? "送信件数 (クレジット消費) *" : isVi ? "Số lượng gửi (Khấu trừ Credits) *" : "Target Volume *")}
                      </label>
                      <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-500" />
                        <span>
                          {isPendingReview
                            ? (isJa ? "仮押さえ済:" : isVi ? "Đã tạm giữ:" : "Reserved:")
                            : (isJa ? "保有残高:" : isVi ? "Số dư:" : "Balance:")}
                        </span>
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {isPendingReview 
                            ? `${cmpTargetCount.toLocaleString()} 件` 
                            : `${formCredits.balance.toLocaleString()} 件`}
                        </strong>
                      </div>
                    </div>

                    {isEditingExisting ? (
                      <div className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-bold font-mono flex items-center justify-between">
                        <span>{cmpTargetCount.toLocaleString()} 件</span>
                        <span className="text-[11px] font-normal text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{isJa ? "変更不可" : isVi ? "Cố định" : "Locked"}</span>
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <input
                            type="number"
                            min={100}
                            value={cmpTargetCount || ""}
                            onChange={(e) => setCmpTargetCount(Math.max(100, parseInt(e.target.value) || 0))}
                            className="w-full text-xs font-bold px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] font-mono"
                            placeholder="100"
                          />
                          <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                            {isJa ? "件 (最低100件〜)" : isVi ? "lượt (Tối thiểu 100)" : "forms (min 100)"}
                          </span>
                        </div>

                        {/* Quick preset chips */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          <span className="text-[10px] text-slate-400 font-medium mr-0.5">{isJa ? "クイック選択:" : isVi ? "Chọn nhanh:" : "Presets:"}</span>
                          {[100, 250, 500, 1000].map((presetNum) => (
                            <button
                              key={presetNum}
                              type="button"
                              onClick={() => setCmpTargetCount(presetNum)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                cmpTargetCount === presetNum
                                  ? "bg-[#1B4F8A] text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200"
                              }`}
                            >
                              {presetNum.toLocaleString()}件
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ======================================================= */}
                {/* 2. TARGET SELECTION SECTION                             */}
                {/* ======================================================= */}
                {isEditingExisting ? (
                  /* LOCKED TARGET AUDIENCE CARD (B2B Standard) */
                  <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isJa ? "配信ターゲット（固定・変更不可）" : isVi ? "Tệp mục tiêu (Đã khóa cố định)" : "Target Audience (Locked)"}</span>
                      </h4>
                      <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                        {cmpTargetCount.toLocaleString()} {isJa ? "件" : "forms"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 font-medium py-1">
                      {renderTargetInfo(currentEditingCampaign?.target_filters || (targetType === "my_list" ? JSON.stringify({ type: "my_list", scope: myListScope }) : targetType === "custom_companies" ? JSON.stringify({ type: "custom_companies", companies: customCompanies }) : JSON.stringify({ type: "preset_filter", industry: targetIndustry, prefecture: targetPrefecture })))}
                    </div>

                    <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-900/60 leading-relaxed">
                      {isJa
                        ? "※ 配信ターゲット（抽出条件および件数）は変更できません。ターゲットを変更したい場合は、一度この申請を取り下げ（または削除）し、企業検索画面より新規作成してください。"
                        : isVi
                        ? "※ Tệp mục tiêu và số lượng đã được cố định. Nếu muốn đổi đối tượng, vui lòng rút lại duyệt (hoặc xóa) và tạo mới từ trang Tìm kiếm doanh nghiệp."
                        : "Target audience is locked. To change targets, cancel this campaign and create a new one from company search."}
                    </p>
                  </div>
                ) : (
                  /* INTERACTIVE TARGET SELECTOR (From My List / Initial Targets) */
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                        <Target className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                        <span>{isJa ? "配信ターゲットの選択 *" : isVi ? "Chọn đối tượng mục tiêu (Target) *" : "Target Audience *"}</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {isJa ? "※ 審査申請時は設定必須" : isVi ? "※ Bắt buộc khi gửi duyệt" : "Required for approval"}
                      </span>
                    </div>

                    {/* Target Type Selector Tabs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setTargetType("my_list")}
                        className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                          targetType === "my_list"
                            ? "bg-white dark:bg-slate-800 border-[#1B4F8A] shadow-2xs ring-1 ring-[#1B4F8A]"
                            : "bg-white/60 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1">
                            <ListFilter className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                            <span>{isJa ? "マイリストから配信" : isVi ? "Từ My List" : "From My List"}</span>
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {savedCompanies?.length || 0}社
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">
                          {isJa ? "保存済みの企業リストへ一括配信" : "Doanh nghiệp đã lưu trong My List"}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetType("preset_filter")}
                        className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                          targetType === "preset_filter"
                            ? "bg-white dark:bg-slate-800 border-[#1B4F8A] shadow-2xs ring-1 ring-[#1B4F8A]"
                            : "bg-white/60 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                            <span>{isJa ? "業種・地域で指定" : isVi ? "Theo Ngành & Khu vực" : "Industry & Region"}</span>
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-300">
                            自動抽出
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">
                          {isJa ? "500万社DBから合致企業へ配信" : "Tự động query từ 5 triệu cty"}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetType("custom_companies")}
                        className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                          targetType === "custom_companies"
                            ? "bg-white dark:bg-slate-800 border-[#1B4F8A] shadow-2xs ring-1 ring-[#1B4F8A]"
                            : "bg-white/60 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                            <span>{isJa ? "指定企業リスト" : isVi ? "Doanh nghiệp đã chọn" : "Selected Companies"}</span>
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {customCompanies.length}社
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">
                          {customCompanies.length > 0 
                            ? (isJa ? `選択中の ${customCompanies.length} 社宛て` : `${customCompanies.length} công ty đã tick`)
                            : (isJa ? "マイリストでチェックした企業" : "Tick chọn từ My List")}
                        </p>
                      </button>
                    </div>

                    {/* Sub-configuration according to selected Target Mode */}
                    {targetType === "my_list" && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {isJa ? "マイリスト内の配信スコープ:" : isVi ? "Phạm vi trong My List:" : "Scope:"}
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="myListScope"
                              checked={myListScope === "all"}
                              onChange={() => setMyListScope("all")}
                              className="text-[#1B4F8A] focus:ring-[#1B4F8A]"
                            />
                            <span>{isJa ? `マイリスト全件（${savedCompanies?.length || 0} 社）` : `Toàn bộ My List (${savedCompanies?.length || 0} cty)`}</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="myListScope"
                              checked={myListScope === "uncontacted"}
                              onChange={() => setMyListScope("uncontacted")}
                              className="text-[#1B4F8A] focus:ring-[#1B4F8A]"
                            />
                            <span>{isJa ? "「未連絡」の企業のみ優先" : "Chỉ các cty 'Chưa liên hệ'"}</span>
                          </label>
                        </div>
                        {(!savedCompanies || savedCompanies.length === 0) && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-1">
                            ⚠️ {isJa ? "現在マイリストに企業が保存されていません。先に「企業検索」で気になる企業を保存してください。" : "Hiện chưa có công ty nào trong My List."}
                          </p>
                        )}
                      </div>
                    )}

                    {targetType === "preset_filter" && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            {isJa ? "業種カテゴリー" : isVi ? "Ngành nghề mục tiêu" : "Target Industry"}
                          </label>
                          <select
                            value={targetIndustry}
                            onChange={(e) => setTargetIndustry(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                          >
                            {INDUSTRY_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {isJa ? opt.ja : isVi ? opt.vi : opt.en}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            {isJa ? "地域・都道府県" : isVi ? "Khu vực / Tỉnh thành" : "Target Region"}
                          </label>
                          <select
                            value={targetPrefecture}
                            onChange={(e) => setTargetPrefecture(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                          >
                            {PREFECTURE_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {isJa ? opt.ja : isVi ? opt.vi : opt.en}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {targetType === "custom_companies" && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {isJa ? `選択された企業一覧 (${customCompanies.length} 社)` : `Danh sách (${customCompanies.length} công ty)`}
                          </span>
                          {customCompanies.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomCompanies([]);
                                setTargetType("my_list");
                              }}
                              className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                            >
                              {isJa ? "選択を解除" : "Xóa danh sách"}
                            </button>
                          )}
                        </div>
                        {customCompanies.length === 0 ? (
                          <p className="text-[11px] text-slate-400 py-1">
                            {isJa ? "マイリスト画面で送信したい企業のチェックボックスにチェックを入れると、ここにリストアップされます。" : "Hãy tick chọn các công ty trong tab My List."}
                          </p>
                        ) : (
                          <div className="max-h-28 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-600 dark:text-slate-350 pr-1">
                            {customCompanies.map((c) => (
                              <div key={c.id} className="py-1 flex items-center justify-between">
                                <span className="truncate">{c.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{c.id}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Sender Details (Tokushoho Compliance) */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800">
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
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
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
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
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
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">{isJa ? "電話番号" : isVi ? "Số điện thoại" : "Phone"}</label>
                      <input
                        type="tel"
                        placeholder="03-1234-5678"
                        value={cmpSenderPhone}
                        onChange={(e) => setCmpSenderPhone(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Pitch Message & Template quick loader */}
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350">
                    {isJa ? "送信メッセージ" : isVi ? "Thông điệp gửi" : "Outreach Pitch"}
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px]">{isJa ? "テンプレート引用:" : isVi ? "Chọn từ mẫu:" : "Load:"}</span>
                    <select
                      onChange={(e) => {
                        const all = [...presets, ...templates];
                        const found = all.find((x) => x.id === e.target.value);
                        if (found) {
                          setCmpSubject(found.subject);
                          setCmpBody(found.body);
                        }
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
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
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-500">{isJa ? "本文 (Body) *" : isVi ? "Nội dung *" : "Body *"}</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertVariable("{{company_name}}")}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
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
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] font-mono text-[11px]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCampaignModalOpen(false);
                      if (onClearInitialTarget) onClearInitialTarget();
                    }}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 cursor-pointer"
                  >
                    {isJa ? "閉じる" : isVi ? "Đóng" : "Close"}
                  </button>

                  <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    {isPendingReview ? (
                      <>
                        <button
                          type="button"
                          disabled={savingCampaign}
                          onClick={() => {
                            if (currentEditingCampaign) handleRevertToDraft(currentEditingCampaign);
                          }}
                          className="px-4 py-2.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs transition-colors cursor-pointer"
                        >
                          {isJa ? "申請を取り下げる (下書きへ)" : isVi ? "Rút lại (Về bản nháp)" : "Withdraw to Draft"}
                        </button>

                        <button
                          type="button"
                          disabled={savingCampaign}
                          onClick={() => handleSaveCampaign("pending_review")}
                          className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {savingCampaign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{isJa ? "変更内容を保存 (審査継続)" : isVi ? "Lưu thay đổi (Tiếp tục duyệt)" : "Save Changes"}</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={savingCampaign}
                          onClick={() => handleSaveCampaign("draft")}
                          className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                        >
                          {savingCampaign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isJa ? "💾 下書きとして保存" : isVi ? "💾 Lưu bản nháp" : "💾 Save as Draft")}
                        </button>

                        <button
                          type="button"
                          disabled={savingCampaign}
                          onClick={() => handleSaveCampaign("pending_review")}
                          className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {savingCampaign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>{isJa ? "審査申請・配信へ進む" : isVi ? "Gửi duyệt chiến dịch" : "Submit for Approval"}</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* FLOW GUIDE MODAL (B2B Quick Onboarding)                       */}
      {/* ============================================================ */}
      {showFlowGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 max-w-xl w-full shadow-2xl relative">
            <button
              onClick={() => setShowFlowGuideModal(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 text-[11px] font-bold border border-blue-200/80 dark:border-blue-900 mb-2">
                <Compass className="w-3.5 h-3.5" />
                <span>{isJa ? "フォーム営業の始め方" : isVi ? "Quy trình gửi Form" : "Outreach Guide"}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {isJa ? "フォーム営業キャンペーンの作成手順" : isVi ? "Quy trình 3 bước gửi Form chào hàng" : "Form Outreach Workflow"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isJa
                  ? "Kigyou-Listでは、500万社の企業データベースからターゲット条件（業種・地域・フォーム有無等）を先に絞り込んでからキャンペーンを作成します。"
                  : isVi
                  ? "Tại Kigyou-List, bạn cần lọc đối tượng doanh nghiệp mục tiêu từ kho 5 triệu công ty trước khi thiết lập nội dung gửi Form."
                  : "Filter target companies from the 5M directory first before creating your campaign."}
              </p>
            </div>

            {/* 3 Step Cards */}
            <div className="space-y-3 mb-6">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-[#1B4F8A] text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{isJa ? "企業検索でターゲットを絞り込み" : isVi ? "Bước 1: Lọc đối tượng tại trang Tìm kiếm" : "Step 1: Filter Companies"}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isJa
                      ? "業種、都道府県、資本金、問い合わせフォーム有無などを指定し、反響が見込める企業を抽出します。"
                      : isVi
                      ? "Chọn ngành nghề, khu vực, vốn điều lệ và tiêu chí có form liên hệ để lọc đúng tệp khách hàng tiềm năng."
                      : "Select industry, prefecture, and contact form availability."}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{isJa ? "「この条件でフォーム営業」をクリック" : isVi ? "Bước 2: Bấm nút gửi Form tự động" : "Step 2: Launch Outreach"}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isJa
                      ? "検索結果上部にある「この条件でフォーム営業 (自動配信)」ボタンを押すと、抽出条件を保持したまま作成画面が開きます。"
                      : isVi
                      ? "Bấm nút 'この条件でフォーム営業 (自動配信)' trên kết quả tìm kiếm để nạp toàn bộ bộ lọc vào chiến dịch."
                      : "Click the Form Outreach button on the search toolbar to carry over all filters."}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{isJa ? "文面を入力して審査申請" : isVi ? "Bước 3: Soạn nội dung & Nộp duyệt" : "Step 3: Pitch & Approval"}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isJa
                      ? "効果的な営業文面テンプレートを選定・編集し、審査申請を送信します。承認後、安全に自動配信されます。"
                      : isVi
                      ? "Soạn tiêu đề, nội dung thư chào hàng và gửi duyệt. Sau khi Admin duyệt, bot sẽ tự động gửi form."
                      : "Select or write your pitch, submit for review. Automated delivery starts after approval."}
                  </p>
                </div>
              </div>
            </div>

            {/* Minimum volume note */}
            <div className="p-3 mb-5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300">
              <span className="font-bold">※ {isJa ? "最低配信件数" : isVi ? "Quy định số lượng" : "Volume Policy"}:</span>
              <span>
                {isJa 
                  ? "1キャンペーンあたり【最低100件以上】から承っております（少数の過剰申請を防ぎ、十分な営業効果を確保するため）。" 
                  : isVi 
                  ? "Mỗi chiến dịch gửi tối thiểu từ 100 form trở lên để đảm bảo hiệu quả tiếp cận B2B và tối ưu vận hành." 
                  : "Minimum target count is 100 forms per campaign."}
              </span>
            </div>

            {/* CTA Actions */}
            <div className="space-y-2.5">
              <Link
                href={`/${locale}/search`}
                onClick={() => setShowFlowGuideModal(false)}
                className="w-full py-3 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{isJa ? "企業検索へ移動してターゲットを選ぶ" : isVi ? "Đến trang Tìm kiếm để lọc đối tượng" : "Go to Company Search"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {savedCompanies && savedCompanies.length >= 100 ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowFlowGuideModal(false);
                    // Open modal targeting My List
                    setEditingCampaignId(null);
                    setCmpName(isJa ? `マイリスト全件宛_フォーム営業_${new Date().toLocaleDateString("ja-JP")}` : `Gửi Form tới My List (${savedCompanies.length} công ty)`);
                    setTargetType("my_list");
                    setMyListScope("all");
                    setCmpTargetCount(Math.min(formCredits.balance >= 100 ? formCredits.balance : 100, Math.max(100, savedCompanies.length)));
                    setCmpSenderEmail(user?.email || "");
                    if (presets.length > 0) {
                      setCmpSubject(presets[0].subject);
                      setCmpBody(presets[0].body);
                    }
                    setIsCampaignModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-lg font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ListFilter className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{isJa ? `保存済みのマイリスト (${savedCompanies.length}社) から作成する` : isVi ? `Tạo từ danh sách My List đã lưu (${savedCompanies.length} công ty)` : `Create from Saved My List`}</span>
                </button>
              ) : savedCompanies && savedCompanies.length > 0 ? (
                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 py-1">
                  {isJa
                    ? `※ マイリスト保存件数が ${savedCompanies.length}社です。100社以上保存するとマイリストからも直接作成できます。`
                    : isVi
                    ? `※ Danh sách My List hiện có ${savedCompanies.length} công ty (cần từ 100 công ty trở lên để tạo chiến dịch).`
                    : `My List has ${savedCompanies.length} companies (requires 100+).`}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
