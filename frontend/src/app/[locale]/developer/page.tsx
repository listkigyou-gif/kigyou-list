"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Terminal, Bot, ShieldCheck, Zap, Search, Copy, Check, Download, 
  ArrowRight, KeyRound, ExternalLink, Code2
} from "lucide-react";

export default function DeveloperHubPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ja";
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const [activeCodeTab, setActiveCodeTab] = useState<"python" | "mcp" | "curl" | "node">("python");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const copyCode = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const codeSnippets = {
    python: `# Install: pip install kigyoulist
from kigyoulist import KigyouListClient

client = KigyouListClient(api_key="kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx")

# 1. Reverse Identity Resolution (Domain -> 13-digit Corporate Number + Compliance)
identity = client.resolve(domain="sample.co.jp")
print(f"Company: {identity['company']['company_name']} | Safety: {identity['compliance']['status']}")

# 2. Natural Language AI Semantic Search
leads = client.semantic_search(
    query="東京都内で自社ECの売上拡大や物流DXを検討しており、採用強化中の企業",
    limit=5
)
for comp in leads["companies"]:
    print(f"- {comp['company_name']} (Relevance: {comp['semantic_relevance']['score']})")`,

    mcp: `// Add to your claude_desktop_config.json or Cursor settings:
{
  "mcpServers": {
    "kigyoulist": {
      "command": "python",
      "args": [
        "c:/kigyou-list/scripts/mcp/kigyoulist_mcp_server.py"
      ],
      "env": {
        "KIGYOU_API_KEY": "kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}`,

    curl: `# 1. Reverse Identity Resolution & Legal Compliance Score
curl -X GET "https://kigyoulist.com/api/v1/enrich/resolve?domain=sample.co.jp" \\
  -H "Authorization: Bearer kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx"

# 2. Natural Language Semantic Search
curl -X POST "https://kigyoulist.com/api/v1/companies/semantic-search" \\
  -H "Authorization: Bearer kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "東京都内で自社ECの売上拡大や物流DXを検討しており、採用強化中の企業",
    "limit": 5
  }'`,

    node: `// Modern Node.js / Next.js Fetch API
const apiKey = "kigyou_live_xxxxxxxxxxxxxxxxxxxxxxxx";

// Resolve Identity & Form Fingerprint
async function resolveCompany(domain) {
  const res = await fetch(\`https://kigyoulist.com/api/v1/enrich/resolve?domain=\${domain}\`, {
    headers: { "Authorization": \`Bearer \${apiKey}\` }
  });
  const data = await res.json();
  console.log("Corporate Number:", data.company.corporate_number);
  console.log("Compliance Status:", data.compliance.status);
  console.log("Form URL:", data.form_fingerprint.contact_url);
}

resolveCompany("sample.co.jp");`
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header />

      <main className="flex-1 pb-20">
        {/* Hero Section */}
        <section className="bg-white dark:bg-[#161B22] border-b border-slate-200/90 dark:border-slate-800 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="b2b-kicker mb-4 mx-auto w-fit">
              <Terminal className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>
                {isVi ? "Hạ tầng dữ liệu AI B2B số 1 Nhật Bản" : isEn ? "Japan's Leading B2B AI Sales Data Infrastructure" : "次世代AI営業（AI SDR）のための日本企業データ基盤"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight mb-5">
              {isVi ? (
                <>Cơ sở hạ tầng dữ liệu ngầm cho <span className="text-[#1B4F8A] dark:text-blue-400">AI Sales Agent</span> tại Nhật Bản</>
              ) : isEn ? (
                <>The Invisible Data Backbone for <span className="text-[#1B4F8A] dark:text-blue-400">AI Sales Agents</span> in Japan</>
              ) : (
                <>自律型AI営業を支える、<br className="hidden sm:inline" /><span className="text-[#1B4F8A] dark:text-blue-400">500万社 企業データ基盤</span></>
              )}
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-base max-w-3xl mx-auto mb-8 leading-relaxed">
              {isVi
                ? "Kết nối trực tiếp 5 triệu pháp nhân Nhật Bản vào Claude, Cursor, LangChain, Dify và n8n qua Model Context Protocol (MCP) và RESTful API thời gian thực."
                : isEn
                ? "Connect 5M+ verified Japanese business entities directly to Claude, Cursor, LangChain, Dify, and n8n via Model Context Protocol (MCP) and real-time REST APIs."
                : "法人番号13桁の一意特定、特定電子メール法コンプライアンス検証、リアルタイム購買シグナル通知を統合。Model Context Protocol（MCP）およびREST APIにより、数分でAIエージェントに日本全国の企業データを接続できます。"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/dashboard?tab=developer`}
                className="b2b-btn-primary"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isVi ? "Lấy API Key ngay" : isEn ? "Get API Key" : "今すぐAPIキーを発行する"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#code-examples"
                className="b2b-btn-secondary"
              >
                <Code2 className="w-4 h-4 text-slate-500" />
                <span>{isVi ? "Xem Code mẫu" : isEn ? "View Code Examples" : "コードサンプルを見る"}</span>
              </a>
            </div>
          </div>
        </section>

        {/* 4 Core Technology Pillars */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {isVi ? "4 Trụ Cột Công Nghệ Độc Quyền" : isEn ? "4 Proprietary Technology Pillars" : "AI営業基盤を支える4つの独自技術"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {isVi ? "Được thiết kế chuyên biệt cho văn hóa kinh doanh và luật pháp thương mại Nhật Bản." : isEn ? "Specifically engineered for Japan's rigorous B2B compliance and business manners." : "日本のビジネスマナーと法規制に完全準拠した、高精度データパイプライン。"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1 */}
            <div className="b2b-card p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 flex items-center justify-center mb-3">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {isVi ? "Native MCP Server" : isEn ? "Native MCP Server" : "MCPサーバー標準対応"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isVi 
                    ? "Tương thích chuẩn Model Context Protocol của Anthropic. Nhúng trực tiếp vào Claude Desktop, Cursor chỉ với 1 cấu hình JSON."
                    : isEn
                    ? "Fully compliant with Anthropic's Model Context Protocol. Embed 5M companies directly into Claude Desktop or Cursor."
                    : "Anthropic提唱のModel Context Protocolに準拠。Claude DesktopやCursor、LangChainから直接ツールとして呼び出し可能。"}
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="b2b-card p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {isVi ? "Giải mã & Tuân thủ pháp lý" : isEn ? "Identity & Compliance" : "逆引き特定 & 法的安全性"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isVi
                    ? "Chỉ cần 1 domain hoặc tên cty, tự động phân giải 13 số pháp nhân và tính điểm an toàn bảo vệ khỏi vi phạm luật 特定電子メール法 của Nhật."
                    : isEn
                    ? "Input a domain or email to resolve the 13-digit Corporate Number with real-time opt-out safety scoring under Japanese laws."
                    : "ドメインや社名から13桁の法人番号を即座に特定。特定電子メール法およびオプトアウトを自動照合し安全性をスコアリング。"}
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="b2b-card p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {isVi ? "Webhook Đẩy Real-time" : isEn ? "Real-time Event Webhooks" : "リアルタイム・シグナル通知"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isVi
                    ? "Khi doanh nghiệp có biến động tuyển dụng, nhận trợ cấp DX hay trúng thầu, hệ thống lập tức bắn webhook có chữ ký HMAC SHA-256."
                    : isEn
                    ? "Push-based webhooks. Receive signed HMAC payloads the moment companies publish new jobs or win DX grants."
                    : "求人掲載や補助金採択、公共調達などの最新購買シグナルを検知した瞬間、HMAC SHA-256署名付きでエージェントに即時Push通知。"}
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="b2b-card p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 flex items-center justify-center mb-3">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {isVi ? "Tìm kiếm Ngữ nghĩa AI" : isEn ? "Semantic Natural Search" : "AIセマンティック自然言語検索"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isVi
                    ? "Tìm kiếm bằng câu miêu tả tự nhiên như 'cty logistics tại Tokyo đang thiếu tài xế'. Tự động chấm điểm độ khớp và sinh lời chào Keigo."
                    : isEn
                    ? "Query in plain Japanese. Understands complex business pain points and returns relevance scores with pre-crafted Keigo pitch hooks."
                    : "「物流DXや採用に注力している企業」のような自然言語で検索可能。意図を自動解析し、適合理由とアプローチ用敬語文を生成。"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Code Examples Section */}
        <section id="code-examples" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="b2b-card overflow-hidden">
            {/* Header Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isVi ? "Code Mẫu Tích Hợp" : isEn ? "Integration Examples" : "連携コードサンプル"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-lg">
                {(["python", "mcp", "curl", "node"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeCodeTab === tab
                        ? "bg-[#1B4F8A] text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {tab === "python" ? "Python SDK" : tab === "mcp" ? "MCP Config" : tab === "curl" ? "cURL" : "Node.js"}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Box - Eye-friendly Soft Gray / White Standard */}
            <div className="relative p-5 bg-slate-50 dark:bg-[#161B22] border-t border-slate-200 dark:border-slate-800 font-mono text-[11px] overflow-x-auto text-slate-800 dark:text-slate-200 rounded-b-xl">
              <button
                onClick={() => copyCode(codeSnippets[activeCodeTab], activeCodeTab)}
                className="absolute top-4 right-4 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Copy to clipboard"
              >
                {copiedTab === activeCodeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] text-emerald-600 font-sans font-bold">{isVi ? "Đã sao chép" : "コピー完了"}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-sans font-medium">{isVi ? "Sao chép" : "コピー"}</span>
                  </>
                )}
              </button>
              <pre className="leading-relaxed whitespace-pre font-mono select-all text-slate-800 dark:text-slate-200">{codeSnippets[activeCodeTab]}</pre>
            </div>
          </div>
        </section>

        {/* 1-Click Ecosystem Downloads (Dify / n8n / SDK) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1 block">
                  {isVi ? "Hệ Sinh Thái No-Code & Automation" : isEn ? "No-Code & Automation Ecosystem" : "ノーコード・自動化ツール連携"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {isVi ? "Tích hợp sẵn cho Dify, n8n, Make & Flowise" : isEn ? "Ready-to-use Templates for Dify, n8n & Make" : "Dify & n8n 向け公式プラグイン・OpenAPI 仕様"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isVi
                    ? "Tải về file OpenAPI specification chính thức để import làm Custom Tool trong Dify chỉ mất 10 giây. Không cần viết code."
                    : isEn
                    ? "Download the official OpenAPI 3.0 specification to import Kigyou-list as a native Custom Tool in Dify or n8n in seconds."
                    : "Difyの「カスタムツール」にインポートするだけで、ノーコードで日本企業データの検索・逆引き・コンプライアンス検証が利用可能になります。"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="/api/v1/openapi.yaml"
                  download="kigyoulist_openapi.yaml"
                  className="b2b-btn-secondary"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>{isVi ? "Tải Dify OpenAPI YAML" : isEn ? "Download Dify OpenAPI YAML" : "Dify用 OpenAPI 仕様を取得"}</span>
                </a>
                <Link
                  href={`/${locale}/dashboard?tab=developer`}
                  className="b2b-btn-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isVi ? "Vào Dashboard Developer" : isEn ? "Open Developer Dashboard" : "開発者ダッシュボードへ"}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Publications & Engineering Case Studies (Qiita & Zenn) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-slate-50/80 dark:bg-[#12171F] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1 block">
                  {isVi ? "Tài Liệu Kỹ Thuật & Case Study Thực Chiến" : isEn ? "Engineering Publications & Case Studies" : "技術記事・アーキテクチャ事例"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {isVi
                    ? "Kiến trúc xử lý dữ liệu 5,000,000 doanh nghiệp & AI Agent"
                    : isEn
                    ? "5M+ Company Data Pipeline Architecture & B2B AI Agents"
                    : "500万社ビッグデータ基盤とB2B AIエージェントの技術知見"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                {isVi
                  ? "Đội ngũ kỹ thuật Kigyou-list chia sẻ kinh nghiệm thực chiến về Big Data crawling, ETL và AI Semantic Search trên các cộng đồng công nghệ uy tín tại Nhật Bản."
                  : isEn
                  ? "Read real-world architecture breakdowns and engineering guides published on Japan's top developer platforms."
                  : "QiitaおよびZennにて、データクレンジング、高速検索エンジン、AIエージェント連携の実運用知見を公開しています。"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Qiita Card */}
              <a
                href="https://qiita.com/listkigyou"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-[#1B4F8A] dark:hover:border-blue-500/60 transition-all flex items-start gap-4 shadow-2xs"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-500/20">
                  Q
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                      Qiita @listkigyou
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {isVi
                      ? "Chuyên trang kỹ thuật: Hướng dẫn tích hợp API, xây dựng pipeline ETL dữ liệu doanh nghiệp và tối ưu hóa chi phí B2B Sales Tech."
                      : "API連携、500万件データ処理パイプライン、B2Bセールステック最適化に関する技術解説シリーズ。"}
                  </p>
                </div>
              </a>

              {/* Zenn Card */}
              <a
                href="https://zenn.dev/kigyoulist"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-[#1B4F8A] dark:hover:border-blue-500/60 transition-all flex items-start gap-4 shadow-2xs"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm shrink-0 border border-blue-500/20">
                  Z
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                      Zenn @kigyoulist
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {isVi
                      ? "Bài viết chuyên sâu: Kiến trúc MCP Server, tích hợp LLM Semantic Search và tối ưu hóa hệ thống dữ liệu doanh nghiệp quy mô Production."
                      : "MCPサーバー実装、LLM意味検索連携、プロダクション運用での知見をまとめた実践記事。"}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
