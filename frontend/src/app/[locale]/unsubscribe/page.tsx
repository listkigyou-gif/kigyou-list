"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle2, AlertCircle, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function UnsubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale || "ja";
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoProcessed, setAutoProcessed] = useState(false);

  useEffect(() => {
    if (emailParam && tokenParam && !autoProcessed) {
      setAutoProcessed(true);
      handleUnsubscribe(emailParam, tokenParam);
    }
  }, [emailParam, tokenParam, autoProcessed]);

  const handleUnsubscribe = async (targetEmail: string, token?: string) => {
    if (!targetEmail || !targetEmail.includes("@")) {
      setError("有効なメールアドレスをご入力ください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/marketing/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "処理に失敗しました。");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-sm">
              <MailCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              メール配信停止（オプトアウト）
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Kigyou-List からのご案内メール配信停止のお手続き
            </p>
          </div>

          {success ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-6 text-center animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-emerald-900 mb-2">
                配信停止が完了いたしました
              </h2>
              <p className="text-sm text-emerald-800 leading-relaxed mb-4">
                <strong>{email}</strong> 宛へのご案内メールの配信停止を登録いたしました。<br />
                今後は当サービスからのメールは送信されません。
              </p>
              <p className="text-xs text-slate-400 mb-6">
                ※システムの都合上、行き違いで直近に準備されていたメールが届いてしまう場合がございます。何卒ご容赦ください。
              </p>
              <Link
                href={`/${locale}`}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all"
              >
                Kigyou-List トップページへ戻る
              </Link>
            </div>
          ) : (
            <div>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="text-center py-10">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-sm font-medium text-slate-600">配信停止の処理を行っております...</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUnsubscribe(email, tokenParam);
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      配信停止対象のメールアドレス
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@company.co.jp"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    特定電子メール法および関連規程に基づき、ご入力いただいたアドレスは直ちに配信除外リストへ登録され、以降の配信が行われることはございません。
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    配信を停止する
                  </button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>特定電子メール送信適正化法 準拠対応</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
