"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Key, KeyRound, Terminal, AlertTriangle, CheckCircle2, Copy, Loader2, 
  Trash2, Plus, Zap, ShieldCheck, Download, ExternalLink, Bot, Check, Sparkles, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { parseUTCDate } from "@/lib/dateUtils";

interface DeveloperTabProps {
  user: any;
  quota: any;
  locale: string;
}

export const DeveloperTab: React.FC<DeveloperTabProps> = ({ user, quota, locale }) => {
  const isEn = locale === "en";
  const isVi = locale === "vi";
  const isJa = locale === "ja";

  const isEligibleForApi = Boolean(
    (quota && (quota.plan === "pro" || quota.plan === "business" || quota.plan === "enterprise")) ||
    (user && (user.role === "pro" || user.role === "business" || user.role === "enterprise" || user.role === "admin"))
  );

  // API Key States
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    setLoadingApiKeys(true);
    try {
      const res = await fetch("/api/user/apikeys");
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch (e) {
      console.error("Failed to fetch API keys", e);
    } finally {
      setLoadingApiKeys(false);
    }
  }, []);

  useEffect(() => {
    if (isEligibleForApi) {
      fetchApiKeys();
    }
  }, [isEligibleForApi, fetchApiKeys]);

  const handleCreateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch("/api/user/apikeys", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.rawKey) {
        setNewRawKey(data.rawKey);
        fetchApiKeys();
      } else {
        alert(data.error || "Failed to generate key");
      }
    } catch (e) {
      alert("Error generating API Key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleDeleteApiKey = async (keyId: string) => {
    const confirmMsg = isJa 
      ? "このAPIキーを無効化し、完全に削除しますか？\n外部システムとの連携が直ちに停止し、この操作は取り消せません。"
      : isVi 
      ? "Bạn có chắc muốn vô hiệu hóa và xóa vĩnh viễn API Key này?\nCác liên kết hệ thống bên ngoài sẽ dừng ngay lập tức và không thể hoàn tác."
      : "Revoke and permanently delete this API Key?\nExternal integrations will stop immediately and this cannot be undone.";

    if (!confirm(confirmMsg)) return;

    setRevokingId(keyId);
    try {
      const res = await fetch(`/api/user/apikeys?id=${encodeURIComponent(keyId)}&action=delete`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, action: "delete" })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchApiKeys();
      } else {
        alert(data.error || (isJa ? "APIキーの削除に失敗しました。" : isVi ? "Xóa API Key thất bại." : "Failed to delete API key"));
      }
    } catch (e) {
      console.error("Error deleting key", e);
      alert(isJa ? "通信エラーが発生しました。" : isVi ? "Lỗi kết nối khi xóa API key." : "Error deleting key");
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const mcpConfigJson = `{
  "mcpServers": {
    "kigyoulist": {
      "command": "python",
      "args": ["c:/kigyou-list/scripts/mcp/kigyoulist_mcp_server.py"],
      "env": {
        "KIGYOU_API_KEY": "${apiKeys?.[0]?.api_key_preview ? 'kigyou_live_...' : 'YOUR_API_KEY'}"
      }
    }
  }
}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Plan Warning Banner for Free */}
      {!isEligibleForApi ? (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xs">
          <div className="max-w-xl">
            <div className="b2b-kicker mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isVi ? "TỪ GÓI PRO TRỞ LÊN" : isJa ? "PROプラン以上" : "PRO, BUSINESS & ENTERPRISE"}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {isVi 
                ? "Tích hợp API & AI Agent (MCP / Webhook / CRM)" 
                : isJa 
                ? "API・AIエージェント連携（MCP / Webhook）のご利用" 
                : "API & AI Agent Integration"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isVi
                ? "500 vạn doanh nghiệp, máy chủ MCP, Webhooks thời gian thực và cấp API Key kết nối CRM/ERP được hỗ trợ từ gói PRO trở lên."
                : isJa
                ? "500万社の法人番号特定、特定電子メール法コンプライアンス検証、MCPサーバー連携はPROプラン以上でご利用いただけます。"
                : "Full access to our 5M+ corporate dataset, MCP Server, Realtime Webhooks, and API keys is available on PRO, BUSINESS and ENTERPRISE plans."}
            </p>
          </div>
          <Link
            href="/pricing"
            className="b2b-btn-primary shrink-0"
          >
            <span>{isVi ? "Nâng cấp lên gói PRO" : isJa ? "PROプランにアップグレード" : "Upgrade to PRO"}</span>
          </Link>
        </div>
      ) : null}

      {/* 1. API KEY MANAGEMENT SECTION */}
      <div className="b2b-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isJa ? "APIキー管理 (Authentication Keys)" : "API Key Management"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isJa ? "Claude、Cursor、Python SDK、外部システムから接続するための認証トークンです。" : "Bearer tokens to authenticate external AI agents and integrations."}
              </p>
            </div>
          </div>
          {isEligibleForApi && (
            <button
              onClick={handleCreateApiKey}
              disabled={generatingKey}
              className="b2b-btn-primary self-start sm:self-auto"
            >
              {generatingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isJa ? "APIキーを発行する" : "Generate Key"}</span>
            </button>
          )}
        </div>

        {/* Display New Raw Key Alert */}
        {newRawKey && (
          <div className="my-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4">
            <div className="flex items-start gap-2.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                  {isJa ? "【重要】APIキーが発行されました。今すぐ安全な場所に保存してください" : "API Key Generated"}
                </strong>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                  {isJa ? "セキュリティ保護のため、この画面を閉じるとキーは二度と表示されません。" : "This key will not be shown again. Store it securely."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-lg mt-2 font-mono text-xs text-slate-900 dark:text-white">
              <span className="flex-1 select-all break-all">{newRawKey}</span>
              <button
                onClick={() => copyToClipboard(newRawKey, "raw")}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {copiedKeyId === "raw" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => setNewRawKey(null)}
              className="mt-3 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[10px] font-bold self-end cursor-pointer transition-colors"
            >
              {isJa ? "保存を確認して閉じる" : "I have saved it — Close"}
            </button>
          </div>
        )}

        {/* API Keys Table */}
        <div className="mt-5 overflow-x-auto">
          {loadingApiKeys ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              {isJa ? "発行済みのAPIキーはありません。「APIキーを発行する」ボタンをクリックしてください。" : "No active API keys found."}
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-2.5">Key Preview</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Created</th>
                  <th className="px-4 py-2.5">Last Used</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      kigyou_live_...{k.api_key_preview.replace(/^\.\.\./, "")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        k.status === "active" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300" 
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {parseUTCDate(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {k.last_used_at ? parseUTCDate(k.last_used_at).toLocaleDateString() : "Unused"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteApiKey(k.id)}
                        disabled={revokingId === k.id}
                        className="px-2.5 py-1 text-[10px] font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:border-rose-900/60 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                        title={isJa ? "APIキーを無効化して完全に削除" : isVi ? "Thu hồi và xóa vĩnh viễn" : "Revoke and permanently delete"}
                      >
                        {revokingId === k.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span>{isJa ? "削除" : isVi ? "Xóa" : "Revoke & Delete"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 2. REAL-TIME WEBHOOK INTEGRATION SECTION */}
      <div className="b2b-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isJa ? "リアルタイム・シグナル通知 Webhooks (Push モデル)" : "Real-time Event Webhooks"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isJa ? "企業の新規求人・補助金採択を検知した瞬間、指定URLへHMAC署名付きで即時Push配信します。" : "Receive signed HMAC webhooks the second new hiring or grant signals are detected."}
              </p>
            </div>
          </div>
          <Link
            href="/developer#code-examples"
            className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            <span>{isJa ? "Webhook仕様書を見る" : "Webhook Docs"}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
            <div>
              <span className="font-bold block text-slate-900 dark:text-white text-xs">
                {isJa ? "API または Python SDK による自動購読" : "Automated Webhook Subscriptions"}
              </span>
              <span className="text-[11px] text-slate-400">
                {isJa ? "client.subscribe_webhook('https://your-domain.com/signals') で即座に連携可能。" : "Call POST /api/v1/webhooks to register endpoints programmatically."}
              </span>
            </div>
          </div>
          <Link
            href={`/${locale}/developer`}
            className="b2b-btn-secondary text-[11px] py-1.5 px-3 self-end sm:self-auto"
          >
            {isJa ? "リファレンス" : "Reference"}
          </Link>
        </div>
      </div>

      {/* 3. 1-CLICK INTEGRATION CARDS (MCP / DIFY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* MCP Card */}
        <div className="b2b-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                Anthropic Standard
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
                MCP Protocol
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Model Context Protocol (MCP) 連携
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Claude Desktop や Cursor の設定ファイルに下記を追加するだけで、AIが自律的に企業データとシグナルを検索できます。
            </p>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 mb-4 overflow-x-auto">
              <pre>{mcpConfigJson}</pre>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(mcpConfigJson);
              setCopiedSnippet(true);
              setTimeout(() => setCopiedSnippet(false), 2000);
            }}
            className="b2b-btn-secondary w-full"
          >
            {copiedSnippet ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copiedSnippet ? "コピー完了" : "MCP設定JSONをコピー"}</span>
          </button>
        </div>

        {/* Dify & OpenAPI Card */}
        <div className="b2b-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                No-Code Automation
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
                Dify & n8n
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Dify 公式 OpenAPI テンプレート
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Dify の「カスタムツール」にこの OpenAPI 3.0 仕様をインポートするだけで、ノーコードで日本企業データの検索と逆引きが組み込めます。
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200/90 dark:border-slate-800 mb-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>OpenAPI 3.0 仕様準拠</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Resolve API & Semantic Search 搭載</span>
              </div>
            </div>
          </div>
          <a
            href="/api/v1/openapi.yaml"
            download="kigyoulist_openapi.yaml"
            className="b2b-btn-primary w-full"
          >
            <Download className="w-4 h-4" />
            <span>Dify用 OpenAPI YAML をダウンロード</span>
          </a>
        </div>
      </div>
    </div>
  );
};
