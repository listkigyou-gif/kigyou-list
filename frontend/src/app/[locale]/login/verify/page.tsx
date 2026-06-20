"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function VerifyPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ja";

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setErrorMsg(
        locale === "vi"
          ? "Đường dẫn xác thực không hợp lệ."
          : locale === "en"
          ? "Invalid verification link."
          : "認証リンクが無効です。"
      );
      return;
    }

    const performSignIn = async () => {
      try {
        const result = await signIn("magiclink", {
          email,
          token,
          redirect: false,
        });

        if (result?.error) {
          console.error("Sign-in error:", result.error);
          setStatus("error");
          setErrorMsg(
            locale === "vi"
              ? "Liên kết đăng nhập đã hết hạn hoặc không chính xác."
              : locale === "en"
              ? "The login link has expired or is incorrect."
              : "ログインリンクの有効期限が切れているか、正しくありません。"
          );
        } else {
          setStatus("success");
          localStorage.removeItem("kigyou_user");
          
          setTimeout(() => {
            router.push(`/${locale}/dashboard`);
          }, 2000);
        }
      } catch (err) {
        console.error("Sign-in exception:", err);
        setStatus("error");
        setErrorMsg("Internal auth error");
      }
    };

    performSignIn();
  }, [token, email, router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {locale === "vi"
                ? "Đang xác thực đăng nhập..."
                : locale === "en"
                ? "Verifying sign-in..."
                : "ログインを検証しています..."}
            </h2>
            <p className="text-sm text-slate-400">
              {locale === "vi"
                ? "Vui lòng giữ nguyên màn hình này."
                : locale === "en"
                ? "Please keep this tab open."
                : "このタブを開いたままにしてください。"}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {locale === "vi"
                ? "Đăng nhập thành công!"
                : locale === "en"
                ? "Sign-in successful!"
                : "ログインに成功しました！"}
            </h2>
            <p className="text-sm text-slate-400">
              {locale === "vi"
                ? "Đang chuyển hướng về trang Dashboard..."
                : locale === "en"
                ? "Redirecting to Dashboard..."
                : "ダッシュボードに遷移しています..."}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <XCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {locale === "vi"
                ? "Đăng nhập thất bại"
                : locale === "en"
                ? "Sign-in failed"
                : "ログインに失敗しました"}
            </h2>
            <p className="text-sm text-red-500 dark:text-red-400 max-w-xs">{errorMsg}</p>
            <button
              onClick={() => router.push(`/${locale}`)}
              className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all"
            >
              {locale === "vi"
                ? "Quay lại Trang chủ"
                : locale === "en"
                ? "Back to Home"
                : "ホームに戻る"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      }
    >
      <VerifyPageInner />
    </Suspense>
  );
}
