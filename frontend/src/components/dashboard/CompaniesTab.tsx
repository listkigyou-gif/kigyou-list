"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  ShieldCheck,
  ExternalLink,
  FileEdit,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Unlink,
  ArrowRight,
  FileText,
  BadgeCheck,
  Mail,
  FileCheck2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { CompanyManagementModal } from "@/components/CompanyManagementModal";

interface ClaimedCompany {
  claim_id: number;
  corporate_number: string;
  role: string;
  verification_method: string;
  verified_at: string;
  claim_status: string;
  company_name: string;
  postal_code: string | null;
  prefecture_name: string | null;
  phone_number: string | null;
  email_address: string | null;
  website_url: string | null;
  is_claimed: boolean;
  claimed_at: string;
  pr_title: string | null;
  pr_message: string | null;
  claimed_by_name: string | null;
  is_hidden: boolean;
}

interface ClaimRequest {
  id: number;
  corporate_number: string;
  company_name: string;
  applicant_name: string;
  applicant_phone: string | null;
  department: string | null;
  document_type: string;
  document_url: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface SearchResultCompany {
  corporate_number: string;
  company_name: string;
  prefecture_name: string | null;
  city_name?: string | null;
  jigyo_shumoku?: string | null;
}

export interface CompaniesTabStats {
  count: number;
  prCount: number;
  isVerified: boolean;
  allowance: number;
  pendingCount: number;
}

interface CompaniesTabProps {
  userEmail: string;
  locale: string;
  onStatsUpdate?: (stats: CompaniesTabStats) => void;
}

// Module-level cache for instant tab transitions
let cachedCompaniesData: {
  companies: ClaimedCompany[];
  claimRequests: ClaimRequest[];
  isVerifiedPartner: boolean;
  dailyAllowance: number;
  timestamp: number;
} | null = null;

export function CompaniesTab({ userEmail, locale, onStatsUpdate }: CompaniesTabProps) {
  const isJa = locale === "ja";
  const [loading, setLoading] = useState(() => !cachedCompaniesData);
  const [isVerifiedPartner, setIsVerifiedPartner] = useState(() => cachedCompaniesData?.isVerifiedPartner || false);
  const [dailyAllowance, setDailyAllowance] = useState(() => cachedCompaniesData?.dailyAllowance || 20);
  const [companies, setCompanies] = useState<ClaimedCompany[]>(() => cachedCompaniesData?.companies || []);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>(() => cachedCompaniesData?.claimRequests || []);
  const [selectedCompanyForModal, setSelectedCompanyForModal] = useState<ClaimedCompany | null>(null);

  // In-page Quick Search for claiming
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultCompany[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Emit stats update from cache on mount
  useEffect(() => {
    if (cachedCompaniesData && onStatsUpdate) {
      onStatsUpdate({
        count: cachedCompaniesData.companies.length,
        prCount: cachedCompaniesData.companies.filter((c) => Boolean(c.pr_message)).length,
        isVerified: cachedCompaniesData.isVerifiedPartner,
        allowance: cachedCompaniesData.dailyAllowance,
        pendingCount: cachedCompaniesData.claimRequests.filter((c) => c.status === "pending").length,
      });
    }
  }, [onStatsUpdate]);

  const fetchUserCompanies = async () => {
    if (!userEmail) return;
    if (!cachedCompaniesData) {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/user/companies?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const loadedCompanies: ClaimedCompany[] = data.companies || [];
        const loadedClaims: ClaimRequest[] = data.claim_requests || [];
        const loadedIsPartner = Boolean(data.is_verified_partner);
        const loadedAllowance = data.daily_allowance || 20;

        setCompanies(loadedCompanies);
        setClaimRequests(loadedClaims);
        setIsVerifiedPartner(loadedIsPartner);
        setDailyAllowance(loadedAllowance);

        cachedCompaniesData = {
          companies: loadedCompanies,
          claimRequests: loadedClaims,
          isVerifiedPartner: loadedIsPartner,
          dailyAllowance: loadedAllowance,
          timestamp: Date.now(),
        };

        if (onStatsUpdate) {
          onStatsUpdate({
            count: loadedCompanies.length,
            prCount: loadedCompanies.filter((c) => Boolean(c.pr_message)).length,
            isVerified: loadedIsPartner,
            allowance: loadedAllowance,
            pendingCount: loadedClaims.filter((c) => c.status === "pending").length,
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch user companies:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCompanies();
  }, [userEmail]);

  // Debounced in-page search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.companies || []);
          setHasSearched(true);
        }
      } catch (e) {
        console.error("In-page search error", e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDetachCompany = async (corporateNumber: string, companyName: string) => {
    const confirmMsg = isJa
      ? `「${companyName}」を自社管理企業リストから解除してもよろしいですか？\n\n（※企業ページに掲載されたPR情報等は削除されませんが、あなたの管理対象外となります）`
      : `Bạn có chắc chắn muốn gỡ liên kết doanh nghiệp 「${companyName}」 khỏi danh sách quản lý không?\n\n(Nội dung PR đã lưu trên trang công ty vẫn được bảo lưu)`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/user/companies/detach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corporate_number: corporateNumber, user_email: userEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchUserCompanies();
      } else {
        alert(data.error || (isJa ? "解除に失敗しました。" : "Gỡ liên kết thất bại."));
      }
    } catch {
      alert(isJa ? "通信エラーが発生しました。" : "Lỗi kết nối.");
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "business_card":
        return isJa ? "名刺" : "Danh thiếp";
      case "registry":
        return isJa ? "登記簿謄本" : "Giấy ĐKKD";
      case "employee_id":
        return isJa ? "社員証" : "Thẻ nhân viên";
      default:
        return isJa ? "その他書類" : "Giấy tờ khác";
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Overview Banner: Japanese B2B Minimalist Card */}
      <section className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xs relative overflow-hidden">
        {/* Subtle Brand Accent Bar */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1B4F8A]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pl-2">
          {/* Left: Program Details */}
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold text-[#1B4F8A] dark:text-blue-400">
              <ShieldCheck className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <span style={{ fontFeatureSettings: '"palt"' }}>
                {isJa ? "公式認証パートナー限定プログラム" : "Chương trình Doanh nghiệp Chính chủ"}
              </span>
            </div>

            <h2
              className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              style={{ fontFeatureSettings: '"palt"' }}
            >
              {isJa ? "自社プロファイル管理 & 公式オーナー認証" : "Quản lý Hồ sơ Doanh nghiệp & Xác thực Chính chủ"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {isJa
                ? "自社の公式オーナー認証を完了すると、信頼の証である「公式認証企業マーク」が付与され、企業詳細ページに公式PRメッセージや採用案内を無料で掲載できます。さらに、毎日のリスト無料ダウンロード枠が永久に 20件 → 50件/日（月間1,500件）に拡大されます。"
                : "Xác minh chính chủ để nhận huy hiệu Doanh nghiệp xác thực, tự do cập nhật thông điệp PR, tuyển dụng và được nâng cấp hạn ngạch tải danh bạ lên 50 lượt/ngày (1.500 lượt/tháng)."}
            </p>

            {/* 3 Core Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {isJa ? "公式認証マーク付与" : "Huy hiệu xác minh"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-normal">
                    {isJa ? "公認バッジで社会的信用を担保" : "Khẳng định uy tín chính chủ"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {isJa ? "公式PR・採用情報の掲載" : "Đăng PR & Tuyển dụng"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-normal">
                    {isJa ? "500万社DB上で強みをアピール" : "Tiếp cận hàng nghìn khách hàng"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {isJa ? "毎日50件ダウンロード枠" : "Tải 50 lượt/ngày"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-normal">
                    {isJa ? "通常20件から+150%永続拡大" : "Mở khóa 1.500 lượt/tháng"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Status Indicator Gauge */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 p-5 rounded-xl text-center shrink-0 min-w-[240px] flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {isJa ? "現在の無料ダウンロード枠" : "Hạn ngạch tải danh bạ"}
              </span>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {dailyAllowance}{" "}
                <span className="text-xs font-sans font-medium text-slate-500">
                  {isJa ? "件/日" : "lượt/ngày"}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/80">
              {isVerifiedPartner ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  <span>{isJa ? "公式認証特典 適用中" : "Đã kích hoạt ưu đãi"}</span>
                </span>
              ) : (
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {isJa ? "認証完了で 50件/日 へ拡大" : "Xác thực để nhận 50 lượt/ngày"}
                  </span>
                  <span className="text-[10px] font-semibold text-[#1B4F8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 px-2 py-0.5 rounded">
                    {isJa ? "+150% 枠拡大" : "+150% dung lượng"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Verification Channels Notice */}
        <div className="mt-5 pt-4 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pl-2">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A]" />
            <span>{isJa ? "選べる2つの安全な認証方式:" : "Hai phương thức xác thực chính thức:"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Mail className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isJa ? "会社ドメインメール認証 (即時 0分)" : "Email tên miền công ty (Tức thì)"}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <FileCheck2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>{isJa ? "名刺・登記簿写真の審査 (平日24h以内)" : "Danh thiếp / Giấy ĐKKD (Duyệt trong 24h)"}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h3
            className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
            style={{ fontFeatureSettings: '"palt"' }}
          >
            <Building2 className="w-4.5 h-4.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{isJa ? "管理企業一覧" : "Danh sách doanh nghiệp quản lý"}</span>
            <span className="px-2 py-0.5 rounded-md text-xs font-mono tabular-nums font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {companies.length} {isJa ? "社" : "cty"}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isJa
              ? "あなたが公式オーナーとして認証・管理している企業の一覧です。"
              : "Các doanh nghiệp bạn đã xác thực và có quyền quản lý thông tin."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUserCompanies}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title={isJa ? "更新" : "Làm mới"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href={`/${locale}/search`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isJa ? "企業を追加認証する" : "Thêm doanh nghiệp quản lý"}</span>
          </Link>
        </div>
      </div>

      {/* Claimed Companies List */}
      {loading ? (
        <div className="p-14 text-center bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-[#1B4F8A] dark:text-blue-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500">{isJa ? "管理企業情報を取得中..." : "Đang tải dữ liệu..."}</p>
        </div>
      ) : companies.length === 0 ? (
        /* Empty State with 3-Step Verification Guide & Quick Search */
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/60">
                <Building2 className="w-6 h-6" />
              </div>
              <h4
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                style={{ fontFeatureSettings: '"palt"' }}
              >
                {isJa ? "まだ認証済みの企業がありません" : "Chưa có doanh nghiệp nào được xác thực"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {isJa
                  ? "自社の企業ページを検索し、「公式オーナー認証」を行うことで、公式PRメッセージの掲載や連絡先の更新が行えます。以下の手順で簡単にお手続きいただけます。"
                  : "Tìm kiếm doanh nghiệp của bạn và thực hiện 'Xác minh chính chủ' để cập nhật thông tin và hưởng ưu đãi 50 lượt tải/ngày."}
              </p>
            </div>

            {/* 3-Step Verification Process (Japanese B2B Standard Flow) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900 px-2 py-0.5 rounded">
                    STEP 01
                  </span>
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1">
                  {isJa ? "自社企業を検索" : "Tìm kiếm công ty"}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa
                    ? "企業名または法人番号（13桁）で自社の掲載ページを検索して開きます。"
                    : "Tìm kiếm theo tên công ty hoặc mã số pháp nhân 13 số."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900 px-2 py-0.5 rounded">
                    STEP 02
                  </span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1">
                  {isJa ? "認証方式を選択" : "Chọn cách xác thực"}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa
                    ? "会社ドメインメール（即時）または名刺・登記簿写真（24h審査）で申請。"
                    : "Xác thực tức thì qua email công ty hoặc nộp ảnh danh thiếp."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                    STEP 03
                  </span>
                  <BadgeCheck className="w-4 h-4 text-[#059669]" />
                </div>
                <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1">
                  {isJa ? "認証完了・特典反映" : "Hoàn tất & Nhận ưu đãi"}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa
                    ? "公式認証マークが付与され、50件/日のCSVダウンロード枠が即時開放されます。"
                    : "Mở khóa hạn mức 50 lượt/ngày và đăng thông điệp PR."}
                </p>
              </div>
            </div>

            {/* In-Page Quick Search Box */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-800">
              <div className="max-w-xl mx-auto space-y-3">
                <label className="block text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isJa ? "今すぐ自社を検索して認証手続きを開始する" : "Tìm kiếm công ty của bạn để xác thực ngay"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isJa
                        ? "例: 株式会社〇〇 または 法人番号（13桁）..."
                        : "Nhập tên công ty hoặc pháp nhân số 13 số..."
                    }
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#1B4F8A] dark:text-blue-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {/* Instant Search Results Dropdown/List */}
                {hasSearched && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-md divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in text-left">
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        {isJa ? "該当する企業が見つかりませんでした。" : "Không tìm thấy doanh nghiệp phù hợp."}
                      </div>
                    ) : (
                      searchResults.map((comp) => (
                        <div
                          key={comp.corporate_number}
                          className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {comp.company_name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono tabular-nums">法人番号: {comp.corporate_number}</span>
                              {comp.prefecture_name && <span>• {comp.prefecture_name}</span>}
                            </div>
                          </div>
                          <Link
                            href={`/${locale}/company/${comp.corporate_number}?action=claim`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-bold text-xs rounded-lg transition-colors shrink-0 shadow-2xs"
                          >
                            <span>{isJa ? "認証する" : "Xác thực"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="text-center pt-1">
                  <Link
                    href={`/${locale}/search`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                  >
                    <span>{isJa ? "詳細条件を指定して企業データベース全体から探す" : "Tìm kiếm nâng cao"}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Verified Companies List */
        <div className="grid grid-cols-1 gap-3.5">
          {companies.map((comp) => (
            <div
              key={comp.corporate_number}
              className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2.5 flex-1 min-w-0">
                {/* Badges with Status Dots */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                    <span>{isJa ? "公式認証企業" : "Đã xác minh chính chủ"}</span>
                  </span>

                  {comp.is_hidden ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                      <span>{isJa ? "非公開設定中" : "Đang ẩn"}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A]" />
                      <span>{isJa ? "公開中" : "Đang công khai"}</span>
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400 font-medium">
                    {comp.verification_method === "manual_document"
                      ? isJa
                        ? "書類審査完了"
                        : "Duyệt giấy tờ"
                      : isJa
                      ? "会社ドメイン認証"
                      : "Xác thực tên miền"}
                  </span>
                </div>

                <div>
                  <h4
                    className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
                    style={{ fontFeatureSettings: '"palt"' }}
                  >
                    {comp.company_name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                    法人番号:{" "}
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{comp.corporate_number}</span>
                    {comp.prefecture_name && ` | 所在地: ${comp.prefecture_name}`}
                    {comp.phone_number && ` | TEL: ${comp.phone_number}`}
                  </p>
                </div>

                {comp.pr_message && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-150 dark:border-slate-800 leading-relaxed font-normal">
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold">公式PR: </strong>
                    {comp.pr_title && (
                      <span className="font-semibold text-[#1B4F8A] dark:text-blue-400">「{comp.pr_title}」 </span>
                    )}
                    {comp.pr_message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyForModal(comp)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>{isJa ? "プロファイル編集" : "Chỉnh sửa hồ sơ"}</span>
                </button>

                <Link
                  href={`/${locale}/company/${comp.corporate_number}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-[#151B22] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  <span>{isJa ? "公開ページ" : "Xem trang"}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <button
                  type="button"
                  onClick={() => handleDetachCompany(comp.corporate_number, comp.company_name)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
                  title={isJa ? "自社管理リストから解除" : "Gỡ khỏi danh sách quản lý"}
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>{isJa ? "解除" : "Gỡ"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending / Processed Document Applications */}
      {claimRequests.length > 0 && (
        <div className="space-y-3.5 pt-6 border-t border-slate-200/80 dark:border-slate-800">
          <div>
            <h4
              className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"
              style={{ fontFeatureSettings: '"palt"' }}
            >
              <Clock className="w-4 h-4 text-[#D97706]" />
              <span>{isJa ? "名刺・書類審査の申請履歴" : "Lịch sử nộp hồ sơ xét duyệt"}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              {isJa
                ? "書類アップロードによる認証申請の進捗状況です。通常24時間以内に審査が完了します。"
                : "Tiến độ xét duyệt các yêu cầu xác minh bằng giấy tờ/danh thiếp. Thông thường hoàn tất trong 24 giờ làm việc."}
            </p>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="px-4 py-3">{isJa ? "申請日時" : "Thời gian"}</th>
                  <th className="px-4 py-3">{isJa ? "対象企業名" : "Tên doanh nghiệp"}</th>
                  <th className="px-4 py-3">{isJa ? "書類種類" : "Loại giấy tờ"}</th>
                  <th className="px-4 py-3">{isJa ? "審査状況" : "Trạng thái"}</th>
                  <th className="px-4 py-3">{isJa ? "備考・結果" : "Ghi chú"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {claimRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono tabular-nums">
                      {new Date(req.created_at).toLocaleDateString(isJa ? "ja-JP" : "vi-VN")}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {req.company_name}
                      <span className="block text-[11px] text-slate-400 font-mono tabular-nums font-normal">
                        法人番号: {req.corporate_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {getDocTypeLabel(req.document_type)}
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
                          <span>{isJa ? "審査中（24時間以内）" : "Đang xét duyệt"}</span>
                        </span>
                      ) : req.status === "approved" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                          <span>{isJa ? "承認完了" : "Đã phê duyệt"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                          <span>{isJa ? "見送り / 却下" : "Từ chối"}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {req.rejection_reason || req.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Profile Modal Integration */}
      {selectedCompanyForModal && (
        <CompanyManagementModal
          isOpen={Boolean(selectedCompanyForModal)}
          onClose={() => setSelectedCompanyForModal(null)}
          corporateNumber={selectedCompanyForModal.corporate_number}
          companyName={selectedCompanyForModal.company_name}
          initialPhone={selectedCompanyForModal.phone_number}
          initialWebsite={selectedCompanyForModal.website_url}
          initialEmail={selectedCompanyForModal.email_address}
          initialPrTitle={selectedCompanyForModal.pr_title}
          initialPrMessage={selectedCompanyForModal.pr_message}
          isClaimed={true}
          onSuccess={() => {
            fetchUserCompanies();
            setSelectedCompanyForModal(null);
          }}
        />
      )}
    </div>
  );
}
