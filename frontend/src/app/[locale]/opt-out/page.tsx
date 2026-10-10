"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle2, AlertCircle, Loader2, Ban, ShieldCheck, Building2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function OptOutPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale || "ja";
  const searchParams = useSearchParams();

  const corpNumParam = searchParams.get("c") || "";
  const userParam = searchParams.get("u") || "admin";
  const cmpParam = searchParams.get("cmp") || "";
  const tokenParam = searchParams.get("token") || "";

  const [corporateNumber, setCorporateNumber] = useState(corpNumParam);
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [initialFetching, setInitialFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [alreadyOptedOut, setAlreadyOptedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!corpNumParam) {
      setInitialFetching(false);
      return;
    }

    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/opt-out?c=${encodeURIComponent(corpNumParam)}&u=${encodeURIComponent(userParam)}&token=${encodeURIComponent(tokenParam)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setCompanyName(data.company_name || "");
          if (data.already_opted_out) {
            setAlreadyOptedOut(true);
            setSuccess(true);
          } else if (data.valid_token) {
            // Valid token: automatically process 1-click opt-out for seamless UX
            await executeOptOut(corpNumParam, userParam, cmpParam, tokenParam, data.company_name);
          }
        }
      } catch (err) {
        console.error("Failed to load opt-out info:", err);
      } finally {
        setInitialFetching(false);
      }
    };

    fetchInfo();
  }, [corpNumParam, userParam, cmpParam, tokenParam]);

  const executeOptOut = async (c: string, u: string, cmp: string, token: string, name?: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate_number: c,
          user_id: u,
          campaign_id: cmp,
          company_name: name || companyName,
          token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "処理に失敗いたしました。");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "通信エラーが発生いたしました。");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corporateNumber || corporateNumber.trim().length < 10) {
      setError("有効な法人番号（13桁）をご入力ください。");
      return;
    }
    executeOptOut(corporateNumber.trim(), userParam, cmpParam, tokenParam);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mb-4 shadow-sm">
              <Ban className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              フォーム営業の配信停止（オプトアウト）
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              お問い合わせフォーム経由でのご案内・送信停止のお手続き
            </p>
          </div>

          {initialFetching ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              <p className="text-sm">登録情報を確認しております...</p>
            </div>
          ) : success ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-6 text-center animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-emerald-900 mb-2">
                {alreadyOptedOut ? "既に配信停止に登録済みです" : "配信停止の受付が完了いたしました"}
              </h2>
              <p className="text-sm text-emerald-800 leading-relaxed mb-4">
                {companyName && (
                  <span className="font-semibold block mb-1">
                    {companyName} 様
                  </span>
                )}
                貴社への今後のフォーム営業・案内送信を速やかに除外リストへ登録いたしました。<br />
                今後は該当の送信者からのWebフォーム送信は行われません。
              </p>
              <div className="bg-white/80 border border-emerald-100 rounded-lg p-3 text-xs text-slate-500 mb-6 text-left space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>対象法人番号: {corporateNumber || "登録完了"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>除外範囲: {userParam === "admin" ? "Kigyou-list公式運営事務局からの送信" : "該当アカウントからの送信"}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                ※システム反映までに最大24時間程度お時間をいただく場合がございます。行き違いで直近に送信が重複した際は、何卒ご容赦いただけますと幸いです。
              </p>
              <Link
                href={`/${locale}`}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all"
              >
                Kigyou-List トップページへ
              </Link>
            </div>
          ) : (
            <div>
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {companyName && (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    停止対象企業
                  </span>
                  <p className="text-base font-bold text-slate-800">{companyName}</p>
                  <p className="text-xs text-slate-500 mt-1">法人番号: {corporateNumber}</p>
                </div>
              )}

              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                この度は貴社Webフォームへのご案内にてお時間を取らせてしまい、大変恐縮でございます。
                下記ボタンをクリックいただくことで、以降のフォーム営業リストから即座に除外いたします。
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                {!corpNumParam && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      貴社の法人番号（13桁）
                    </label>
                    <input
                      type="text"
                      value={corporateNumber}
                      onChange={(e) => setCorporateNumber(e.target.value)}
                      placeholder="例: 1010001000000"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-mono"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>処理中...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" />
                      <span>配信停止（送信除外）を確定する</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-slate-400 text-center mt-6">
                ※お手続き完了後、以降のご案内送信は行われません。
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
