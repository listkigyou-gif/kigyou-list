import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Sparkles, Check, ArrowRight, ShieldCheck, Database, 
  Download, Bot, Copy, HelpCircle, FileSpreadsheet, Send, Zap
} from "lucide-react";

export const revalidate = 86400; // Static ISR 24 hours

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const currentYear = new Date().getFullYear();
  const title = isVi
    ? `Tạo Danh Sách Bán Hàng B2B Bằng AI & ChatGPT ${currentYear} | Kigyou-list`
    : isEn
    ? `AI & ChatGPT B2B Sales Prospecting List Japan ${currentYear} | Kigyou-list`
    : `【${currentYear}年最新】ChatGPT・Claudeで作成する営業リスト活用ガイド | 500万社DB連携 | Kigyou-list`;

  const description = isVi
    ? "Hướng dẫn tối ưu hóa danh sách bán hàng bằng AI (ChatGPT, Claude, Notion) kết hợp cơ sở dữ liệu 5 triệu doanh nghiệp Nhật Bản. Tải mẫu prompt B2B độc quyền, xuất file Excel/CSV chuẩn hóa và tự động hóa gửi Form tiếp cận chỉ từ 5.9 JPY."
    : isEn
    ? "The ultimate playbook for B2B sales prospecting with ChatGPT and Claude in Japan. Fuel your generative AI with verified 5M+ corporate records, copy-paste sales prompts, and automate contact form outreach."
    : "ChatGPTやClaudeを活用した高精度な営業リスト作成手順とプロンプト集を公開。AIのハルシネーションを回避し、全国500万社の正規法人データ（国税庁準拠・フォームURL・求人シグナル）を掛け合わせた成約率最大化のB2B営業手法を解説。毎月50社CSV無料ダウンロード可能。";

  const ogLocale = isEn ? "en_US" : isVi ? "vi_VN" : "ja_JP";

  return {
    title,
    description,
    keywords: isVi
      ? ["tạo danh sách khách hàng bằng chatgpt", "ai sales list japan", "danh bạ b2b nhật bản cho ai", "gửi form tự động"]
      : isEn
      ? ["chatgpt b2b sales list", "claude sales prospecting japan", "b2b lead generation japan", "kigyou-list ai sales"]
      : [
          "chatgpt 営業リスト", 
          "claude code 営業リスト", 
          "ai 営業リスト 作成", 
          "営業リスト エクセル 無料", 
          "notion 営業リスト", 
          "musubu 営業リスト 代替",
          "企業リスト ai 活用",
          "問い合わせフォーム 営業 自動化"
        ],
    alternates: {
      canonical: `/${locale}/tools/ai-sales-list`,
      languages: {
        ja: "/ja/tools/ai-sales-list",
        en: "/en/tools/ai-sales-list",
        vi: "/vi/tools/ai-sales-list",
        "x-default": "/ja/tools/ai-sales-list",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/tools/ai-sales-list`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Kigyou-list AI Sales List Generator",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function AISalesListPage({ params }: PageProps) {
  const { locale } = await params;
  const isEn = locale === "en";
  const isVi = locale === "vi";

  // Schema.org SoftwareApplication & FAQPage
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Kigyou-list AI Sales List Engine",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY",
      "description": "毎月50社CSV無料ダウンロード / 初月¥1,260〜（70% OFF）"
    },
    "description": "ChatGPT・Claude等の生成AIに最適な国内500万社法人データベースと連携した高精度営業リスト作成ソリューション。"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "ChatGPTだけで営業リストをゼロから作成することは可能ですか？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ChatGPT単体では架空の企業名を出力するハルシネーション（幻覚）や、連絡先（問い合わせフォームURL・代表電話）が取得できない課題があります。Kigyou-listの正規500万社データベースから抽出したCSVをAIにインプットすることで、100%実在する高精度なリストが完成します。"
        }
      },
      {
        "@type": "Question",
        "name": "MusubuやBaseconnect等の既存ツールと比較したコストメリットは？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "従来型ツールは月額3万〜10万円以上の年間固定契約が主流ですが、Kigyou-listは初月わずか¥1,260（通常¥4,200/月）で年縛りなし。いつでも解約可能です。さらに無料プランでも毎月50社のCSVを永久無料でダウンロードいただけます。"
        }
      },
      {
        "@type": "Question",
        "name": "作成したリストを使ってそのまま営業アプローチまで自動化できますか？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "はい。Kigyou-listは独自に収集した企業の問い合わせフォームURLを網羅しており、1通わずか5.9円〜の自動フォーム営業サービスとシームレスに連携しています。"
        }
      }
    ]
  };

  const promptCards = [
    {
      title: "1. ターゲット理想顧客（ICP）抽出プロンプト",
      desc: "自社商材の強み・単価から、最も受注確度の高い業種・規模・ペインを逆算して定義します。",
      promptText: `[自社商材]\nサービス名：[商材名]\n提供価値：[導入メリット]\n価格帯：[月額/一括]\n\n[指示]\n上記商材のLTVが最も高い「理想顧客プロファイル（ICP）」を構造化してください。\n1. 業種（JSIC分類）\n2. 推奨従業員規模・資本金\n3. 想定される最大の経営課題\n4. キーマン（決裁権者）の役職`
    },
    {
      title: "2. 問い合わせフォーム専用 パーソナライズ文面生成",
      desc: "営業拒否フィルターを自然に回避し、返信率を高める300文字以内の相談型アプローチ文章を生成します。",
      promptText: `[対象企業情報]\n企業名：[対象社名]\n事業概要：[事業内容]\n特徴：[求人中/新サービス開始]\n\n[指示]\n問い合わせフォーム営業用の個別メッセージ（300文字以内）を作成してください。\n冒頭で相手の特徴に触れ、売込感を抑えた「情報交換・業務効率化の無料相談」の形式で結んでください。`
    },
    {
      title: "3. Notion / Excel データクレンジング用プロンプト",
      desc: "CSVの社名表記ゆれ（前株・後株統一）や重複排除、Notion CRM用Markdownへの変換を自動化します。",
      promptText: `以下の企業リストをNotionの営業CRM用テーブルに整形してください。\nカラム定義：[社名, 業種, 都道府県, フォームURL, アプローチ状況(未着手), 次回連絡日]\n※社名の前株・後株の表記ゆれを自動で正規化してください。\n\n[企業データ貼り付け]`
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-slate-50 border-b border-slate-200 py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>生成AI（ChatGPT / Claude）× 500万社 法人データ</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              AIで勝率を最大化する<br className="hidden sm:inline" />
              <span className="text-[#1B4F8A]">「高精度 営業リスト」</span>作成ソリューション
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              ChatGPTやClaudeを単なるアイデア出しで終わらせない。<br className="hidden sm:inline" />
              国税庁公表の500万社正規データベースと掛け合わせ、幻覚（ハルシネーション）ゼロで成約直結のB2Bリストを瞬時に構築。
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${locale}/search`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#1B4F8A] text-white font-medium hover:bg-[#163f6e] transition-colors shadow-sm"
              >
                <Database className="w-5 h-5" />
                <span>500万社データベースを無料で検索</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/form-marketing`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                <Send className="w-5 h-5 text-blue-600" />
                <span>フォーム自動送信（1通5.9円〜）を見る</span>
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              ※ 無料会員登録で毎月50社CSVダウンロード無料・初期費用0円・契約期間の縛りなし
            </p>
          </div>
        </section>

        {/* 3 BOTTLENECK COMPARISON */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              なぜ、ChatGPT単体では「実用的な営業リスト」が作れないのか？
            </h2>
            <p className="mt-3 text-slate-600">
              AIのポテンシャルを100%引き出すには、高品質な「外部データ（正規DB）」との連携が不可欠です。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg mb-4">
                ✕
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">ハルシネーション（幻覚）</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                LLM単体に企業名を尋ねると、存在しない架空の会社や既に閉業・解散した法人が混ざり、リストの信頼性が著しく低下します。
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg mb-4">
                ✕
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">連絡先・フォームURLの欠落</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                社名は取得できても、アプローチに必要な最新の「問い合わせフォームURL」や「代表電話番号」が判明せず、手作業での調査工数が膨らみます。
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
                ✓
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Kigyou-list × AIの解決策</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kigyou-listから100%正規の企業CSV（法人番号・フォームURL付き）を出力し、AIに分析・個別文面作成を任せることで、圧倒的な成約率を実現します。
              </p>
            </div>
          </div>
        </section>

        {/* COPYABLE PROMPT TEMPLATES */}
        <section className="bg-slate-50 border-y border-slate-200 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100/60 px-2.5 py-1 rounded-md mb-3">
                <Bot className="w-4 h-4" />
                <span>実戦投入用 プロンプト集</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                今すぐコピーして使える「AI営業プロンプト」3選
              </h2>
              <p className="mt-3 text-slate-600 text-sm sm:text-base">
                Kigyou-listで検索・ダウンロードした企業データと組み合わせて、ChatGPTやClaudeに投入してください。
              </p>
            </div>

            <div className="space-y-6">
              {promptCards.map((card, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-blue-50 text-blue-700 text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {card.title}
                    </h3>
                    <span className="text-xs text-slate-500">{card.desc}</span>
                  </div>

                  <div className="relative mt-3">
                    <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {card.promptText}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              営業リスト作成ツールの徹底比較
            </h2>
            <p className="mt-3 text-slate-600">
              従来の高額な年間縛りツールとKigyou-listの圧倒的なコストパフォーマンスを比較。
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3.5 px-4">項目</th>
                  <th className="py-3.5 px-4 bg-blue-50 text-[#1B4F8A] font-bold">Kigyou-list（本サービス）</th>
                  <th className="py-3.5 px-4 text-slate-600">従来型ツール（Musubu等）</th>
                  <th className="py-3.5 px-4 text-slate-600">無料ネット収集・ChatGPT単体</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3.5 px-4 font-medium text-slate-900">データ網羅数</td>
                  <td className="py-3.5 px-4 bg-blue-50/50 font-bold text-blue-900">全国500万社（全法人完全網羅）</td>
                  <td className="py-3.5 px-4 text-slate-600">約140万〜200万社</td>
                  <td className="py-3.5 px-4 text-slate-500">数十〜数千社（極小）</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-slate-900">月額利用料</td>
                  <td className="py-3.5 px-4 bg-blue-50/50 font-bold text-emerald-700">初月¥1,260 / 翌月以降¥4,200</td>
                  <td className="py-3.5 px-4 text-slate-600">月額30,000円〜100,000円以上</td>
                  <td className="py-3.5 px-4 text-slate-500">0円（ただし人件費が膨大）</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-slate-900">契約縛り・解約</td>
                  <td className="py-3.5 px-4 bg-blue-50/50 font-bold text-emerald-700">縛りなし（いつでもWeb解約可能）</td>
                  <td className="py-3.5 px-4 text-rose-600">原則1年契約・途中解約不可</td>
                  <td className="py-3.5 px-4 text-slate-500">-</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-slate-900">フォームURL網羅</td>
                  <td className="py-3.5 px-4 bg-blue-50/50 font-bold text-blue-900">網羅（フォーム営業連携あり）</td>
                  <td className="py-3.5 px-4 text-slate-600">一部のみ・送信代行は別料金</td>
                  <td className="py-3.5 px-4 text-slate-500">手作業で探す必要あり</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-slate-900">無料プラン</td>
                  <td className="py-3.5 px-4 bg-blue-50/50 font-bold text-emerald-700">毎月50社CSV無料ダウンロード</td>
                  <td className="py-3.5 px-4 text-slate-600">デモのみ / ダウンロード制限</td>
                  <td className="py-3.5 px-4 text-slate-500">無料</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="bg-slate-50 border-t border-slate-200 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                よくある質問（FAQ）
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 flex items-start gap-2">
                  <span className="text-blue-600">Q.</span>
                  ChatGPTだけで営業リストをゼロから作成することは可能ですか？
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed pl-6">
                  ChatGPT単体では架空の企業名を出力するハルシネーション（幻覚）や、連絡先（問い合わせフォームURL・代表電話）が取得できない課題があります。Kigyou-listの正規500万社データベースから抽出したCSVをAIにインプットすることで、100%実在する高精度なリストが完成します。
                </p>
              </div>

              <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 flex items-start gap-2">
                  <span className="text-blue-600">Q.</span>
                  MusubuやBaseconnect等の既存ツールと比較したコストメリットは？
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed pl-6">
                  従来型ツールは月額3万〜10万円以上の年間固定契約が主流ですが、Kigyou-listは初月わずか¥1,260（通常¥4,200/月）で年縛りなし。いつでも解約可能です。さらに無料プランでも毎月50社のCSVを永久無料でダウンロードいただけます。
                </p>
              </div>

              <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 flex items-start gap-2">
                  <span className="text-blue-600">Q.</span>
                  作成したリストを使ってそのまま営業アプローチまで自動化できますか？
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed pl-6">
                  はい。Kigyou-listは独自に収集した企業の問い合わせフォームURLを網羅しており、1通わずか5.9円〜の自動フォーム営業サービス（AIオプトアウト検知機能付き）とシームレスに連携しています。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-[#1B4F8A] text-white py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              今すぐ500万社データベースでAI営業を始めましょう
            </h2>
            <p className="mt-3 text-blue-100 text-sm sm:text-base">
              会員登録はわずか30秒。毎月50社までのCSVエクスポートが完全無料で利用可能です。
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${locale}/search`}
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-white text-[#1B4F8A] font-bold hover:bg-blue-50 transition-colors shadow-sm inline-flex items-center justify-center gap-2"
              >
                <Database className="w-5 h-5" />
                <span>無料会員登録してリストを検索</span>
              </Link>
              <Link
                href={`/${locale}/compare`}
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-blue-900/60 text-white font-medium border border-blue-400/40 hover:bg-blue-900/80 transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>料金プラン・機能比較を見る</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
