"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Unlink,
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

interface CompaniesTabProps {
  userEmail: string;
  locale: string;
}

export function CompaniesTab({ userEmail, locale }: CompaniesTabProps) {
  const isJa = locale === "ja";
  const [loading, setLoading] = useState(true);
  const [isVerifiedPartner, setIsVerifiedPartner] = useState(false);
  const [dailyAllowance, setDailyAllowance] = useState(20);
  const [companies, setCompanies] = useState<ClaimedCompany[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [selectedCompanyForModal, setSelectedCompanyForModal] = useState<ClaimedCompany | null>(null);

  const fetchUserCompanies = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/companies?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCompanies(data.companies || []);
        setClaimRequests(data.claim_requests || []);
        setIsVerifiedPartner(Boolean(data.is_verified_partner));
        setDailyAllowance(data.daily_allowance || 20);
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
      {/* Top Banner: 50 Quota Partner Benefit */}
      <div className="bg-[#0F1E36] border border-blue-900/40 rounded-xl p-6 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-400/30 rounded-md text-xs font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isJa ? "公式認証パートナー限定プログラム" : "Chương trình Đối tác Doanh nghiệp"}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isJa ? "自社プロファイル管理 & 公式認証" : "Quản lý Hồ sơ Doanh nghiệp & Xác thực"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {isJa
                ? "自社の公式オーナー認証を完了し、ページを公開維持していただくことで、毎日のリスト無料ダウンロード枠が永久に 20件 → 50件/日（月間1,500件） に拡大されます。"
                : "Xác minh chính chủ và duy trì công khai hồ sơ doanh nghiệp để được nâng cấp hạn ngạch tải danh bạ lên 50 lượt/ngày (1.500 lượt/tháng)."}
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/70 p-4 sm:p-5 rounded-lg text-center shrink-0 min-w-[200px]">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              {isJa ? "現在の無料ダウンロード枠" : "Hạn ngạch miễn phí"}
            </span>
            <div className="text-3xl font-bold mt-1 text-white">
              {dailyAllowance} <span className="text-sm font-semibold text-slate-300">{isJa ? "件/日" : "lượt/ngày"}</span>
            </div>
            <div className="mt-2">
              {isVerifiedPartner ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {isJa ? "公式認証特典 適用中" : "Đã kích hoạt ưu đãi"}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">
                  {isJa ? "認証完了で50件/日に拡大" : "Xác thực để nhận 50 lượt/ngày"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <span>{isJa ? "管理企業一覧" : "Danh sách doanh nghiệp quản lý"}</span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {companies.length} {isJa ? "社" : "cty"}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isJa
              ? "あなたが公式オーナーとして認証・管理している企業の一覧です。"
              : "Các doanh nghiệp bạn đã xác thực và có quyền quản lý thông tin."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUserCompanies}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title={isJa ? "更新" : "Làm mới"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href={`/${locale}/search`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B4F8A] hover:bg-[#163e6d] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isJa ? "企業を追加認証する" : "Thêm doanh nghiệp quản lý"}</span>
          </Link>
        </div>
      </div>

      {/* Claimed Companies List */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-[#1B4F8A] dark:text-blue-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500">{isJa ? "管理企業情報を取得中..." : "Đang tải dữ liệu..."}</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/60">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isJa ? "まだ認証済みの企業がありません" : "Chưa có doanh nghiệp nào được xác thực"}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isJa
                ? "自社の企業ページを検索し、「公式オーナー認証」を行うことで、こちらからPRメッセージの掲載や連絡先の更新が行えます。"
                : "Hãy tìm kiếm công ty của bạn và thực hiện 'Xác minh chính chủ' để quản lý thông điệp PR và thông tin liên hệ."}
            </p>
          </div>
          <Link
            href={`/${locale}/search`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B4F8A] hover:bg-[#163e6d] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>{isJa ? "自社を検索して公式認証する" : "Tìm kiếm công ty để xác thực"}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {companies.map((comp) => (
            <div
              key={comp.corporate_number}
              className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {isJa ? "公式認証済" : "Đã xác minh chính chủ"}
                  </span>

                  {comp.is_hidden ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <EyeOff className="w-3 h-3 text-amber-600" />
                      {isJa ? "非公開中" : "Đang ẩn"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Eye className="w-3 h-3 text-[#1B4F8A]" />
                      {isJa ? "公開中" : "Công khai"}
                    </span>
                  )}

                  <span className="text-[10px] text-slate-400">
                    {comp.verification_method === "manual_document"
                      ? isJa
                        ? "📁 書類審査完了"
                        : "📁 Duyệt giấy tờ"
                      : isJa
                      ? "⚡ ドメイン認証"
                      : "⚡ Xác thực tên miền"}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {comp.company_name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    法人番号: <span className="font-mono text-slate-700 dark:text-slate-300">{comp.corporate_number}</span>
                    {comp.prefecture_name && ` | 所在地: ${comp.prefecture_name}`}
                  </p>
                </div>

                {comp.pr_message && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <strong className="text-slate-800 dark:text-slate-200">PR: </strong>
                    {comp.pr_title && <span className="font-semibold text-[#1B4F8A] dark:text-blue-400">「{comp.pr_title}」 </span>}
                    {comp.pr_message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyForModal(comp)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isJa ? "プロファイル編集" : "Chỉnh sửa hồ sơ"}</span>
                </button>

                <Link
                  href={`/${locale}/company/${comp.corporate_number}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors"
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
        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{isJa ? "名刺・書類審査の申請履歴" : "Lịch sử nộp hồ sơ xét duyệt"}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isJa
                ? "書類アップロードによる認証申請の進捗状況です。"
                : "Tiến độ xét duyệt các yêu cầu xác minh bằng giấy tờ/danh thiếp."}
            </p>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">{isJa ? "申請日時" : "Thời gian"}</th>
                  <th className="px-4 py-3">{isJa ? "対象企業名" : "Tên doanh nghiệp"}</th>
                  <th className="px-4 py-3">{isJa ? "書類種類" : "Loại giấy tờ"}</th>
                  <th className="px-4 py-3">{isJa ? "審査状況" : "Trạng thái"}</th>
                  <th className="px-4 py-3">{isJa ? "備考・結果" : "Ghi chú"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {claimRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {new Date(req.created_at).toLocaleDateString(isJa ? "ja-JP" : "vi-VN")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {req.company_name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        法人番号: {req.corporate_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {getDocTypeLabel(req.document_type)}
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          {isJa ? "審査中（24時間以内）" : "Đang xét duyệt"}
                        </span>
                      ) : req.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          {isJa ? "承認完了" : "Đã phê duyệt"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3" />
                          {isJa ? "見送り / 却下" : "Từ chối"}
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
