"use client";

import React, { useState } from "react";
import {
  X,
  FileCheck2,
  UploadCloud,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Trash2,
  Info
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface InvoiceResultItem {
  raw_input: string;
  t_number: string;
  corporate_number: string;
  company_name: string | null;
  full_address: string | null;
  representative_name: string | null;
  status: "valid" | "cancelled" | "unregistered";
  status_label_ja: string;
  status_label_en: string;
  status_label_vi: string;
  registered_date: string | null;
  detail_url: string | null;
}

interface BatchInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  onSuccess?: () => void;
  initialNumbers?: string[];
  mode?: "add" | "audit";
}

export const BatchInvoiceModal: React.FC<BatchInvoiceModalProps> = ({
  isOpen,
  onClose,
  locale = "ja",
  onSuccess,
  initialNumbers,
  mode = "add",
}) => {
  const { saveCompaniesBatch, savedCompanies } = useAuth();

  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InvoiceResultItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Preload initial numbers if provided
  React.useEffect(() => {
    if (isOpen && initialNumbers && initialNumbers.length > 0) {
      const text = initialNumbers.join("\n");
      setInputVal(text);
      if (mode === "audit") {
        // Auto trigger search for audit
        setErrorMessage(null);
        setSuccessNotice(null);
        setLoading(true);
        fetch("/api/invoice/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numbers: text }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.results) {
              setResults(data.results);
            }
          })
          .catch((err) => {
            console.error("Auto audit error:", err);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else if (isOpen && (!initialNumbers || initialNumbers.length === 0)) {
      if (mode !== "audit") {
        // Keep or clear
      }
    }
  }, [isOpen, initialNumbers, mode]);

  if (!isOpen) return null;

  // Count lines in input
  const inputCount = inputVal
    .split(/[\r\n,;\t]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputVal(text);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBatch = async () => {
    if (!inputVal.trim()) {
      setErrorMessage(
        locale === "en"
          ? "Please enter at least one invoice number or corporate number."
          : locale === "vi"
          ? "Vui lòng nhập ít nhất một mã số Invoice hoặc Mã số pháp nhân."
          : "照会するインボイス登録番号または13桁の法人番号を入力してください。"
      );
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      const res = await fetch("/api/invoice/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: inputVal }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to query invoice data");
      }

      setResults(data.results || []);
    } catch (err: any) {
      console.error("Batch invoice modal error:", err);
      setErrorMessage(
        locale === "en"
          ? "Query failed. Please check your input and try again."
          : locale === "vi"
          ? "Tra cứu thất bại. Vui lòng kiểm tra lại định dạng."
          : "照会処理中にエラーが発生しました。入力内容をご確認の上、再度お試しください。"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkWatch = () => {
    const validCorps = results
      .filter((r) => r.status === "valid" && r.corporate_number && /^\d{13}$/.test(r.corporate_number))
      .map((r) => r.corporate_number);

    if (validCorps.length === 0) {
      setErrorMessage(
        locale === "en"
          ? "No valid registered companies found to watch."
          : locale === "vi"
          ? "Không tìm thấy doanh nghiệp hợp lệ nào để theo dõi."
          : "監視対象に追加可能な有効企業が見つかりませんでした。"
      );
      return;
    }

    const { addedCount, totalCount, maxReached } = saveCompaniesBatch(validCorps);
    if (addedCount > 0) {
      setSuccessNotice(
        locale === "en"
          ? `Successfully added ${addedCount} companies to Watchlist! (Total: ${savedCompanies.length + addedCount}/100)`
          : locale === "vi"
          ? `Đã thêm thành công ${addedCount} doanh nghiệp vào Danh sách theo dõi! (Tổng: ${savedCompanies.length + addedCount}/100)`
          : `${addedCount} 社を監視リストに一括登録しました！（現在登録数: ${savedCompanies.length + addedCount} / 100社）`
      );
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (maxReached) {
      setErrorMessage(
        locale === "en"
          ? "Watchlist capacity reached (Max 100 companies)."
          : locale === "vi"
          ? "Đã đạt giới hạn danh sách theo dõi (Tối đa 100 công ty)."
          : "監視リストの上限（最大100社）に達しています。"
      );
    } else {
      setSuccessNotice(
        locale === "en"
          ? "All valid companies are already in your Watchlist."
          : locale === "vi"
          ? "Tất cả các doanh nghiệp hợp lệ đã có trong danh sách theo dõi."
          : "照会した有効企業はすべて既に監視リストに登録されています。"
      );
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = ["インボイス登録番号", "法人番号", "商号（法人名）", "所在地", "代表者名", "判定結果", "照会日時"];
    const nowStr = new Date().toLocaleString("ja-JP");

    const rows = results.map((r) => [
      `"${r.t_number}"`,
      `"${r.corporate_number}"`,
      `"${(r.company_name || "").replace(/"/g, '""')}"`,
      `"${(r.full_address || "").replace(/"/g, '""')}"`,
      `"${(r.representative_name || "").replace(/"/g, '""')}"`,
      `"${r.status === "valid" ? "有効・登録済" : r.status === "cancelled" ? "失効・取消" : "未登録または形式不正"}"`,
      `"${nowStr}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kigyoulist_invoice_batch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validCount = results.filter((r) => r.status === "valid").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-800">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === "audit"
                  ? locale === "en"
                    ? "Monitored Companies Invoice Batch Audit"
                    : locale === "vi"
                    ? "Đối Soát Hóa Đơn Doanh Nghiệp Đang Theo Dõi"
                    : "監視中企業のインボイス一括照会・対照レポート"
                  : locale === "en"
                  ? "Bulk Invoice Query & Watchlist Import"
                  : locale === "vi"
                  ? "Tra Cứu Hóa Đơn Hàng Loạt & Đồng Bộ Theo Dõi"
                  : "インボイス登録番号 一括照会・監視登録"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === "audit"
                  ? locale === "en"
                    ? "Verify the latest Qualified Invoice Issuer status for your monitored companies directly with NTA."
                    : locale === "vi"
                    ? "Kiểm tra và đối soát trạng thái chứng nhận Hóa đơn hợp lệ mới nhất từ Cục Thuế cho danh sách đang theo dõi."
                    : "現在監視リストに登録されている全企業の適格請求書ステータスを国税庁公式データと直接対照します。"
                  : locale === "en"
                  ? "Query up to 100 corporate numbers and add valid entities to your Watchlist with 1 click."
                  : locale === "vi"
                  ? "Tra cứu tối đa 100 số và tự động thêm các doanh nghiệp hợp lệ vào danh sách theo dõi biến động."
                  : "最大100社まで一括照会し、有効な企業を1クリックで重要変動検知（ウォッチ）に追加できます。"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                {locale === "ja" ? "照会番号の入力（1行に1件）" : "Input Numbers (1 per line)"}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputVal("T1010001014427\nT7010001008844\nT8010001120391\n1010001012182")}
                  className="text-[11px] text-[#1B4F8A] hover:underline dark:text-blue-400 cursor-pointer"
                >
                  {locale === "ja" ? "サンプル番号を挿入" : "Insert Sample"}
                </button>
                {inputVal && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputVal("");
                      setResults([]);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                  >
                    {locale === "ja" ? "クリア" : "Clear"}
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={4}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="例:&#10;T1010001014427&#10;1010001000002&#10;（Excelの列をコピーしてそのまま貼り付け可能です）"
              className="w-full p-3 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] transition-all"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                <span>入力件数: <strong className="text-slate-900 dark:text-white">{inputCount}</strong> 件</span>
                <span>|</span>
                <span>最大 100 件まで一括照会可能</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors">
                  <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV読込</span>
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleExecuteBatch}
                  disabled={loading || inputCount === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] disabled:bg-slate-300 dark:disabled:bg-slate-700 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>照会中...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>一括照会を実行</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Results Table Section */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    照会結果一覧 ({results.length}件中 有効: {validCount}件)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    <span>CSV出力</span>
                  </button>

                  {mode === "audit" ? (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-200/80 dark:border-emerald-800">
                      ✓ 監視中全社の対照完了
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBulkWatch}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs cursor-pointer transition-colors"
                      title="有効な企業を一括で監視リスト（ウォッチ）に登録します"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>このリストを一括監視登録 (有効{validCount}社)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">インボイス / 法人番号</th>
                      <th className="py-2 px-3">商号（企業名）</th>
                      <th className="py-2 px-3">所在地</th>
                      <th className="py-2 px-3 text-center">判定</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono">
                    {results.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{r.t_number}</span>
                        </td>
                        <td className="py-2 px-3 font-sans">
                          {r.company_name ? (
                            <span className="font-medium text-slate-900 dark:text-slate-100">{r.company_name}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-sans max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                          {r.full_address || "-"}
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          {r.status === "valid" ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                              有効登録済
                            </span>
                          ) : r.status === "cancelled" ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-rose-800 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                              失効・取消
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                              未登録 / 不正
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 shrink-0 text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            ※ 国税庁適格請求書公表Web-APIおよび公式法人番号データと直接照合します。
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
