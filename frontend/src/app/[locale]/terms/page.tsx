import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  FileText, 
  ChevronRight, 
  AlertCircle,
  Building2,
  Scale,
  ShieldCheck,
  Receipt,
  Phone,
  Mail,
  Globe,
  Database,
  Send,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Lock,
  Layers,
  HelpCircle
} from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const pageTitle = isEn
    ? "Terms of Service | Kigyou-list"
    : isVi
    ? "Điều khoản dịch vụ (Terms of Service) | Kigyou-list"
    : "利用規約 | Kigyou-list（500万社企業データベース・自動フォーム営業）";

  const pageDesc = isEn
    ? "Standard B2B SaaS Terms of Service for Kigyou-list (Corporate Database & Automated Contact Form Outreach). Operated by TQC Corporation (Invoice Registration: T4013301048678)."
    : isVi
    ? "Điều khoản sử dụng dịch vụ B2B chuẩn Nhật Bản cho nền tảng Kigyou-list (Dữ liệu 5 triệu doanh nghiệp & Tự động gửi Form liên hệ). Do Công ty Cổ phần TQC vận hành (Mã số thuế T4013301048678)."
    : "Kigyou-list（企業リスト）のサービス利用規約です。日本全国500万社企業データベースの利用許諾条件、問い合わせフォーム営業代行の配信規則、定期課金・解約条件、知的財産権の保護、反社会的勢力の排除等を定めています。運営会社: TQC株式会社（適格請求書登録番号: T4013301048678）。";

  const ogLocale = isEn ? "en_US" : isVi ? "vi_VN" : "ja_JP";

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `/${locale}/terms`,
      languages: {
        ja: "/ja/terms",
        en: "/en/terms",
        vi: "/vi/terms",
        "x-default": "/ja/terms",
      }
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://kigyoulist.com/${locale}/terms`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: ["/og-image.png"],
    },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  const isJa = locale === 'ja';
  const isVi = locale === 'vi';
  const isEn = locale === 'en';

  const d = isJa ? {
    home: "ホーム",
    terms: "利用規約",
    kicker: "B2B SaaS サービス利用規約（標準約款）",
    title: "利用規約 (Terms of Service)",
    subtitle: "Kigyou-list サービスのご利用条件、データ利用許諾範囲、およびフォーム営業代行の運用規程",
    revisedDate: "最終改定日: 2026年10月8日（制定日: 2025年4月1日）",
    intro: "この利用規約（以下「本規約」といいます。）は、TQC株式会社（以下「当社」といいます。）がウェブサイト上で提供する企業情報データベース検索・抽出サービスおよび問い合わせフォーム営業代行サービス「Kigyou-list」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーおよび本サービスを利用されるすべてのお客様（以下「ユーザー」といいます。）には、本規約に同意のうえ本サービスをご利用いただきます。",
    invoiceBadge: "適格請求書発行事業者登録済（T4013301048678）",
    antisocialBadge: "反社会的勢力排除条項 策定済",
    securityBadge: "Stripe セキュア決済・暗号化通信保護",
    highlightsTitle: "ご利用にあたっての重要ポイント（要約）",
    highlights: [
      {
        icon: <Database className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        title: "データの商用利用範囲",
        desc: "取得した企業データは貴社の内部的な営業開拓・マーケティング目的に自由にご利用いただけます。ただし、第三者への生データの転売・バルク再配布や競合サービスの作成は固く禁止されています。"
      },
      {
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        title: "契約期間の縛りなし・いつでも解約可能",
        desc: "月額プランはマイページの「設定」メニューよりいつでも次回更新の自動解約が可能です。最低契約期間の縛りや中途解約違約金は一切ございません。"
      },
      {
        icon: <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        title: "フォーム営業の法令遵守と審査",
        desc: "問い合わせフォーム営業代行では特定商取引法・特定電子メール法を遵守し、AIによる「営業お断り」企業の自動除外および運営スタッフによる文面審査を実施します。"
      }
    ],
    sections: [
      {
        id: "art1",
        articleNum: "第1条",
        title: "適用範囲および本規約の変更",
        paragraphs: [
          "1. 本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の権利義務関係に適用されます。",
          "2. 当社が本サービスのウェブサイト上で掲載する利用ガイド、個別規定、プライバシーポリシー、特定商取引法に基づく表記等は、本規約の一部を構成するものとします。",
          "3. 当社は、法令の改正、社会情勢の変動、または本サービスの機能向上・運営上の必要に応じて、ユーザーの個別の承諾を得ることなく本規約を変更できるものとします。変更後の規約は、本サイト上に掲示した時点より効力を生じるものとします。"
        ]
      },
      {
        id: "art2",
        articleNum: "第2条",
        title: "定義",
        paragraphs: [
          "本規約において使用する主要な用語の定義は、以下の通りとします。",
          "(1) 「本サービス」とは、当社が運営する「Kigyou-list」において提供される日本全国の企業情報データベース検索・CSV抽出機能、問い合わせフォーム営業自動配信機能、企業意図シグナル閲覧機能、ABM営業管理CRM機能、およびAPI連携機能を含む一切のサービスを指します。",
          "(2) 「ユーザー」とは、本規約に同意の上、本サービスに会員登録を行い、本サービスを利用する法人、団体または個人事業主を指します。",
          "(3) 「企業データ」とは、国税庁法人番号公表サイト、官公庁オープンデータ、および各企業が公に開示している公式ウェブサイト等から収集・解析・体系化した企業情報（法人名、法人番号、所在地、電話番号、FAX番号、メールアドレス、フォームURL、財務指標、求人・助成金シグナル等）を指します。",
          "(4) 「フォーム営業代行」とは、ユーザーが作成したアプローチ文面を、当社システムが対象企業の公式問い合わせフォームに対して送信処理を行う役務を指します。"
        ]
      },
      {
        id: "art3",
        articleNum: "第3条",
        title: "会員登録およびアカウント管理",
        paragraphs: [
          "1. 本サービスの利用を希望する者は、本規約を遵守することに同意し、当社の定める方法により会員登録を申請するものとします。",
          "2. ユーザーは、自己の責任においてアカウント情報（メールアドレスおよびパスワード）ならびにAPIキーを厳重に管理するものとし、第三者への譲渡、貸与、名義変更、または共有をしてはなりません。",
          "3. アカウント情報の管理不十分、使用上の過誤、または第三者の使用によって生じた損害の責任はユーザーが負うものとし、当社は一切の責任を負いません。",
          "4. 当社は、登録申請者が過去に規約違反等により処分を受けたことがある場合、反社会的勢力に該当するおそれがある場合、またはその他当社が不適切と判断した場合には、登録を拒否または抹消することができます。"
        ]
      },
      {
        id: "art4",
        articleNum: "第4条",
        title: "サービス提供内容および利用枠",
        paragraphs: [
          "1. 当社は、ユーザーに対し、選択されたプランに応じて以下の機能を提供します。",
          "・FREEプラン: 1日あたり20件までの企業データCSVダウンロード、基本検索機能",
          "・PROプラン: 月間2,000行までのCSVダウンロード、メールアドレス開示、かんばんCRM機能",
          "・BUSINESSプラン: 月間10,000行までのCSVダウンロード、Mechanism Bによる大量データバックグラウンド抽出、優先サポート",
          "・ENTERPRISEプラン: 月間40,000行までのCSVダウンロード、API連携機能、専任テクニカルサポート",
          "・追加容量パック（買い切り）: 10,000行 / 50,000行 / 100,000行のCSVダウンロード枠の追加付与",
          "・問い合わせフォーム営業配信（都度購入）: 1,000件 / 3,000件 / 5,000件 / 大口個別枠のフォーム配信チケット付与",
          "2. 各月額プランに付帯する当月分のダウンロード枠は契約月度ごとに更新され、未使用枠の翌月繰り越しは行われません。ただし、買い切り型の追加容量パックについては有効期限なくご利用いただけます。"
        ]
      },
      {
        id: "art5",
        articleNum: "第5条",
        title: "利用料金および支払方法",
        paragraphs: [
          "1. ユーザーは、本サービスの有料プランおよびチケットの利用対価として、当社がウェブサイト上に定める利用料金（消費税込み）を支払うものとします。",
          "2. 支払方法は、クレジットカード決済（Stripe決済サービス経由）によるものとします。ただし、大口配信または年間契約等の事前の合意がある法人の場合は、請求書払い（銀行振込）による決済を認めることがあります。",
          "3. 当社は適格請求書発行事業者（登録番号: T4013301048678）であり、ユーザーは決済完了後、マイページの決済履歴より適格請求書等保存方式（インボイス制度）に対応した領収書PDFを即座に発行・ダウンロードすることができます。",
          "4. デジタルデータおよびオンライン配信サービスの特性上、決済完了後のお客様都合による返金、減額、またはキャンセルには一切応じられません。"
        ]
      },
      {
        id: "art6",
        articleNum: "第6条",
        title: "定期課金プランの自動更新および解約手続",
        paragraphs: [
          "1. 月額定期プランは、ユーザーが解約手続きを行わない限り、1か月ごとに自動的に更新され、登録されたクレジットカードに対して次回利用料金が決済されます。",
          "2. ユーザーは、ダッシュボードの「設定」メニューよりいつでも次回更新の自動解約（自動更新停止）の手続きを行うことができます。次回更新日の前日までに解約手続きを完了した場合、次月以降の請求は発生いたしません。",
          "3. 利用期間の途中で解約された場合でも、日割り計算による返金は行われません。ただし、当該契約期間の満了日までは引き続きプランの機能および残存枠をご利用いただけます。",
          "4. 本サービスには最低契約期間の縛りや、解約に伴う違約金・解約手数料は一切存在しません。"
        ]
      },
      {
        id: "art7",
        articleNum: "第7条",
        title: "問い合わせフォーム営業代行サービスに関する特則",
        paragraphs: [
          "1. ユーザーは、問い合わせフォーム営業代行を利用するにあたり、特定商取引法、特定電子メールの送信の適正化等に関する法律、不正競争防止法、および個人情報の保護に関する法律等の関連法令を遵守しなければなりません。",
          "2. 配信文面には、発信者情報（会社名、代表者名または担当部署、連絡先電話番号またはメールアドレス）および送信停止案内（オプトアウト）を必ず明記するものとします。",
          "3. 当社は、配信開始前にユーザーの文面および送信対象の審査を行います。以下に該当すると当社が判断した場合、配信を停止または拒否することができます。",
          "・公序良俗に反する商品、アダルト、出会い系、風俗営業等に関する案内",
          "・マルチ商法、情報商材、暗号資産投資詐欺、その他不法な金銭勧誘",
          "・虚偽または著しく誇大な宣伝表示、他者の名誉・信用を毀損する内容",
          "・特定商取引法に基づく表記やオプトアウト文言が欠落している場合",
          "4. 当社システムは「営業目的の連絡お断り」と明記されている企業のフォームをAIにより自動除外しますが、対象企業のウェブサイト仕様変更等による未配信枠については、当社規定に基づきクレジット返還等の措置を実施します。",
          "5. 送信結果としての返信率、アポイント獲得数、商談化等の成果について、当社は何ら保証するものではありません。"
        ]
      },
      {
        id: "art8",
        articleNum: "第8条",
        title: "提供データの知的財産権および利用許諾範囲",
        paragraphs: [
          "1. 本サービスを構成するシステム、プログラム、データベース構造、UIデザイン、商標等の知的財産権は、すべて当社または正当な権利者に帰属します。",
          "2. 当社は、ユーザーに対し、本サービスから取得した企業データを「ユーザー自己の営業活動、マーケティング分析、および見込み顧客獲得の目的」に限り利用する非独占的かつ譲渡不能な権利を許諾します。",
          "3. ユーザーは、本サービスから取得したデータを以下の目的に使用してはなりません。",
          "・取得した企業データベースを生データのまま第三者に再販売、有償提供、公衆送信、または二次配布する行為",
          "・本サービスと実質的に同一または競合する企業情報データベースサービスやリード提供サービスを構築・運営する行為",
          "・クローラーやスクレイピングプログラム等を用いてデータを網羅的にリバースエンジニアリングする行為"
        ]
      },
      {
        id: "art9",
        articleNum: "第9条",
        title: "禁止事項",
        paragraphs: [
          "ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。",
          "(1) 法令、公序良俗、または本規約に違反する行為",
          "(2) 当社、他のユーザー、または第三者の知的財産権、プライバシー権、名誉、信用その他の権利を侵害する行為",
          "(3) 当社のサーバーやネットワークに過度な負荷をかける行為、スクレイピングツール等の無許可ボットによる高頻度アクセス",
          "(4) 他のユーザーのアカウント、パスワード、またはAPIキーを不正に使用する行為",
          "(5) 本サービスの脆弱性を意図的に突いた攻撃、逆アセンブル、逆コンパイル、リバースエンジニアリング",
          "(6) 迷惑メール、スパムDM、嫌がらせ、または詐欺的文面を大量送信する行為",
          "(7) 本サービスの運営を妨害する行為、または当社の信用を毀損するおそれのある行為",
          "(8) その他、当社が不適切と判断する行為"
        ]
      },
      {
        id: "art10",
        articleNum: "第10条",
        title: "サービスの停止・中断および仕様変更",
        paragraphs: [
          "1. 当社は、以下のいずれかの事由が生じた場合、ユーザーに事前に通知することなく、本サービスの全部または一部の提供を一時的に停止または中断できるものとします。",
          "・システムの保守、点検、修理、または改修作業を緊急に行う場合",
          "・火災、停電、天災地変、戦争、暴動、テロ等の不可抗力によりサービスの提供が困難となった場合",
          "・電気通信事業者の回線障害、クラウドインフラ（AWS/Vercel/Stripe等）の大規模障害が発生した場合",
          "2. 当社は、業務上の都合により、事前の予告をもって本サービスの内容や仕様を変更し、またはサービスの提供を終了することができます。",
          "3. 当社は、本条に基づき行われた措置によってユーザーに生じた損害について、一切の責任を負いません。"
        ]
      },
      {
        id: "art11",
        articleNum: "第11条",
        title: "利用停止および登録抹消",
        paragraphs: [
          "1. 当社は、ユーザーが以下のいずれかに該当した場合、事前の催告を要することなく直ちに本サービスの利用を停止し、アカウントを抹消できるものとします。",
          "・本規約のいずれかの条項に違反した場合",
          "・利用料金の支払いを怠り、督促後も支払われない場合",
          "・登録情報に虚偽の事実が含まれていることが判明した場合",
          "・支払停止、破産手続開始、民事再生手続開始等の申立てがあった場合",
          "・当社からの連絡に対し、30日以上応答がない場合",
          "2. 前項に基づきアカウントが抹消された場合、当該ユーザーは当社に対する一切の債務について当然に期限の利益を失い、直ちに全額を弁済しなければなりません。"
        ]
      },
      {
        id: "art12",
        articleNum: "第12条",
        title: "反社会的勢力の排除",
        paragraphs: [
          "1. ユーザーおよび当社は、自己およびその役員・実質的支配者が、暴力団、暴力団員、暴力団準構成員、総会屋、社会運動等標ぼうゴロ、特殊知能暴力集団その他これらに準ずる者（以下「反社会的勢力」といいます。）に該当しないこと、および資金提供その他を通じて反社会的勢力の維持・運営に協力していないことを表明し、将来にわたっても確約します。",
          "2. 相手方が前項の誓約に違反したことが判明した場合、何らの催告を要せず直ちに本サービスの利用契約を解除することができるものとします。"
        ]
      },
      {
        id: "art13",
        articleNum: "第13条",
        title: "非保証および免責事項",
        paragraphs: [
          "1. 当社は、本サービスで提供する企業情報データベースについて、情報の正確性、最新性、網羅性、有用性、および特定の営業目的への適合性に関し、商業上合理的な努力を払って収集・整備を行いますが、完全無欠であることを明示的にも黙示的にも保証するものではありません。",
          "2. 企業情報の変更、法人の統廃合、電話番号やメールアドレス等の連絡先情報の変動による不通・未達等について、当社は責任を負いません。",
          "3. 本サービスまたは提供データを利用したことにより、ユーザーと第三者（送信先企業等）との間で生じた苦情、紛争、または損害について、当社は一切関与せず、ユーザー自身の責任と費用において解決するものとします。",
          "4. 何らかの事由により当社がユーザーに対して損害賠償責任を負う場合であっても、当社の損害賠償責任の範囲は、現実に生じた直接かつ通常の損害に限られ、ユーザーが過去1か月間に当社に支払った利用料金の総額を上限とします。"
        ]
      },
      {
        id: "art14",
        articleNum: "第14条",
        title: "秘密保持および個人情報の保護",
        paragraphs: [
          "1. ユーザーおよび当社は、本サービスの利用に関連して知り得た相手方の非公開情報を、相手方の書面による事前の承諾なく第三者に開示または漏洩してはなりません。",
          "2. 当社は、ユーザーが登録した個人情報および利用履歴を、別途定めるプライバシーポリシーに従って適切に取り扱います。"
        ]
      },
      {
        id: "art15",
        articleNum: "第15条",
        title: "準拠法および専属的合意管轄裁判所",
        paragraphs: [
          "1. 本規約の解釈および適用にあたっては、日本法を準拠法とします。",
          "2. 本サービスまたは本規約に関して当社とユーザーとの間で生じた一切の紛争については、訴額に応じ、東京簡易裁判所または東京地方裁判所を第一審の専属的合意管轄裁判所とします。"
        ]
      }
    ],
    operatorTitle: "運営事業者情報（サービス運営元）",
    operatorCompany: "TQC株式会社 (TQC Corporation)",
    operatorRep: "代表取締役: キム バン チュン (Van Trung Kim)",
    operatorAddress: "〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F",
    operatorTaxId: "適格請求書発行事業者登録番号: T4013301048678",
    operatorTel: "代表電話: 03-6907-1219 / FAX: 03-6701-2399",
    operatorEmail: "メール窓口: info@kigyoulist.com",
    operatorWeb: "公式URL: https://kigyoulist.com",
    contactSupportBtn: "お問い合わせ窓口へ",
    viewTokushohoBtn: "特定商取引法に基づく表記を見る"
  } : isVi ? {
    home: "Trang chủ",
    terms: "Điều khoản dịch vụ",
    kicker: "Điều khoản dịch vụ B2B SaaS tiêu chuẩn Nhật Bản",
    title: "Điều khoản dịch vụ (Terms of Service)",
    subtitle: "Điều kiện sử dụng nền tảng Kigyou-list, phạm vi cấp phép dữ liệu và quy chuẩn chiến dịch gửi Form",
    revisedDate: "Sửa đổi lần cuối: Ngày 08 tháng 10 năm 2026 (Ban hành: Ngày 01 tháng 04 năm 2025)",
    intro: "Bản Điều khoản dịch vụ này (sau đây gọi là \"Điều khoản\") quy định các điều kiện sử dụng dịch vụ tra cứu cơ sở dữ liệu doanh nghiệp và dịch vụ gửi biểu mẫu liên hệ chào hàng tự động \"Kigyou-list\" (sau đây gọi là \"Dịch vụ\") do Công ty Cổ phần TQC (sau đây gọi là \"Công ty\") cung cấp. Khách hàng sử dụng Dịch vụ (sau đây gọi là \"Người dùng\") phải đồng ý và tuân thủ các quy định tại Điều khoản này.",
    invoiceBadge: "Doanh nghiệp hóa đơn hợp lệ (T4013301048678)",
    antisocialBadge: "Cam kết loại trừ thế lực chống phá xã hội",
    securityBadge: "Bảo mật thanh toán Stripe & Mã hóa dữ liệu",
    highlightsTitle: "Các điểm cốt lõi quan trọng (Tóm tắt)",
    highlights: [
      {
        icon: <Database className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        title: "Phạm vi sử dụng dữ liệu thương mại",
        desc: "Dữ liệu tải về được dùng cho mục đích tiếp thị và bán hàng nội bộ của doanh nghiệp bạn. Nghiêm cấm bán lại dữ liệu thô cho bên thứ ba hoặc xây dựng dịch vụ cạnh tranh."
      },
      {
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        title: "Không ràng buộc thời hạn - Hủy bất cứ lúc nào",
        desc: "Gói thuê bao tháng có thể dừng gia hạn tự động mọi lúc ngay tại menu 'Cài đặt' của Dashboard. Không có thời hạn cam kết bắt buộc và không có phí phạt hủy gói."
      },
      {
        icon: <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        title: "Tuân thủ pháp luật gửi Form tiếp thị",
        desc: "Dịch vụ gửi Form tự động tuân thủ nghiêm ngặt Luật Tokushoho và Luật chống thư rác Nhật Bản, có AI lọc doanh nghiệp cấm chào hàng và khâu kiểm duyệt trước khi phát hành."
      }
    ],
    sections: [
      {
        id: "art1",
        articleNum: "Điều 1",
        title: "Phạm vi áp dụng và Thay đổi điều khoản",
        paragraphs: [
          "1. Điều khoản này áp dụng cho toàn bộ quyền và nghĩa vụ giữa Người dùng và Công ty liên quan đến việc sử dụng Dịch vụ.",
          "2. Các hướng dẫn sử dụng, quy định riêng, Chính sách quyền riêng tư và Công bố Luật Tokushoho được đăng tải trên website đều là một phần không thể tách rời của Điều khoản này.",
          "3. Công ty có quyền sửa đổi Điều khoản này khi có sự thay đổi về pháp luật hoặc nâng cấp Dịch vụ mà không cần sự đồng ý riêng lẻ của từng Người dùng. Điều khoản sửa đổi có hiệu lực ngay khi được đăng tải trên trang web."
        ]
      },
      {
        id: "art2",
        articleNum: "Điều 2",
        title: "Giải thích từ ngữ",
        paragraphs: [
          "Trong Điều khoản này, các thuật ngữ dưới đây được hiểu như sau:",
          "(1) 'Dịch vụ' chỉ toàn bộ nền tảng 'Kigyou-list' bao gồm tra cứu dữ liệu 5 triệu doanh nghiệp, xuất file CSV, tự động gửi Form liên hệ B2B, tín hiệu mua sắm, quản lý CRM và kết nối API.",
          "(2) 'Người dùng' là các pháp nhân, tổ chức hoặc cá nhân kinh doanh đăng ký tài khoản hợp lệ trên nền tảng.",
          "(3) 'Dữ liệu doanh nghiệp' là thông tin công khai được thu thập và tổng hợp hợp pháp từ Cơ quan Thuế Quốc gia Nhật Bản, dữ liệu mở của chính phủ và website chính thức của doanh nghiệp.",
          "(4) 'Dịch vụ gửi Form tiếp thị' là dịch vụ tự động gửi thông điệp chào hàng của Người dùng tới biểu mẫu liên hệ trên website của các doanh nghiệp mục tiêu theo quy chuẩn kỹ thuật và pháp lý."
        ]
      },
      {
        id: "art3",
        articleNum: "Điều 3",
        title: "Đăng ký thành viên và Quản lý tài khoản",
        paragraphs: [
          "1. Người dùng đồng ý tuân thủ Điều khoản này và thực hiện đăng ký tài khoản theo đúng quy trình của Công ty.",
          "2. Người dùng có trách nhiệm tự bảo mật thông tin đăng nhập và khóa API của mình, không được chuyển nhượng, cho thuê hoặc chia sẻ tài khoản cho bên thứ ba.",
          "3. Công ty có quyền từ chối hoặc khóa tài khoản đối với các trường hợp vi phạm quy định hoặc có liên quan đến các hành vi gian lận."
        ]
      },
      {
        id: "art4",
        articleNum: "Điều 4",
        title: "Nội dung dịch vụ và Hạn ngạch sử dụng",
        paragraphs: [
          "1. Tùy theo gói dịch vụ đã chọn, Người dùng được hưởng các quyền hạn tương ứng:",
          "・Gói FREE: Tải tối đa 20 dòng CSV mỗi ngày.",
          "・Gói PRO: Tải tối đa 2.000 dòng CSV mỗi tháng, mở khóa email, bảng Kanban CRM.",
          "・Gói BUSINESS: Tải tối đa 10.000 dòng CSV mỗi tháng, hỗ trợ xuất hàng loạt Mechanism B.",
          "・Gói ENTERPRISE: Tải tối đa 40.000 dòng CSV mỗi tháng, tích hợp API, hỗ trợ chuyên trách.",
          "・Gói mua thêm dung lượng CSV: Mua thêm 10.000 / 50.000 / 100.000 dòng CSV không thời hạn.",
          "・Gói gửi Form tiếp thị: Mua vé phát hành 1.000 / 3.000 / 5.000 lượt gửi biểu mẫu.",
          "2. Hạn ngạch hàng tháng của gói thuê bao không được cộng dồn sang tháng kế tiếp. Các gói dung lượng mua thêm (Add-on pack) được bảo lưu vĩnh viễn cho đến khi dùng hết."
        ]
      },
      {
        id: "art5",
        articleNum: "Điều 5",
        title: "Giá cước và Phương thức thanh toán",
        paragraphs: [
          "1. Người dùng thanh toán phí dịch vụ theo mức giá niêm yết (đã bao gồm thuế tiêu dùng 10%).",
          "2. Phương thức thanh toán mặc định là Thẻ tín dụng quốc tế qua cổng thanh toán bảo mật Stripe. Trường hợp doanh nghiệp ký hợp đồng lớn có thể thanh toán qua chuyển khoản ngân hàng theo hóa đơn.",
          "3. Công ty là đơn vị phát hành hóa đơn hợp lệ (Mã số: T4013301048678). Người dùng có thể tải hóa đơn PDF chuẩn Nhật Bản từ Dashboard ngay sau khi thanh toán.",
          "4. Do bản chất dịch vụ dữ liệu kỹ thuật số, Công ty không hỗ trợ hoàn tiền vì lý do cá nhân sau khi giao dịch đã hoàn tất."
        ]
      },
      {
        id: "art6",
        articleNum: "Điều 6",
        title: "Tự động gia hạn và Quy trình hủy gói thuê bao",
        paragraphs: [
          "1. Gói thuê bao hàng tháng sẽ tự động gia hạn vào mỗi kỳ thanh toán trừ khi Người dùng thực hiện thao tác hủy.",
          "2. Người dùng có thể hủy gia hạn bất kỳ lúc nào tại mục 'Cài đặt' trong Dashboard trước ngày đến hạn tiếp theo mà không mất thêm bất kỳ chi phí nào.",
          "3. Khi hủy giữa chu kỳ, hệ thống không hoàn tiền theo tỷ lệ ngày nhưng Người dùng vẫn được sử dụng toàn bộ tính năng cho tới hết ngày cuối cùng của kỳ thanh toán.",
          "4. Không áp dụng hợp đồng ràng buộc thời hạn tối thiểu và không có phí phạt hủy gói."
        ]
      },
      {
        id: "art7",
        articleNum: "Điều 7",
        title: "Quy định riêng cho Dịch vụ gửi Form tiếp thị",
        paragraphs: [
          "1. Người dùng cam kết tuân thủ Luật Thương mại Đặc định, Luật Chống thư rác và các quy định pháp luật liên quan của Nhật Bản.",
          "2. Nội dung thông điệp gửi đi bắt buộc phải có đầy đủ thông tin pháp nhân người gửi và câu hướng dẫn từ chối nhận tin (Opt-out).",
          "3. Công ty có quyền từ chối phát hành các nội dung vi phạm thuần phong mỹ tục, lừa đảo, đa cấp hoặc thiếu thông tin minh bạch theo luật.",
          "4. Hệ thống AI tự động loại trừ các doanh nghiệp có thông báo cấm chào hàng. Các form lỗi kỹ thuật sẽ được xử lý hoàn lại hạn mức theo quy chế.",
          "5. Công ty không cam kết tỷ lệ chuyển đổi hoặc số lượng cuộc hẹn cố định từ chiến dịch tiếp thị."
        ]
      },
      {
        id: "art8",
        articleNum: "Điều 8",
        title: "Quyền sở hữu trí tuệ và Giới hạn sử dụng dữ liệu",
        paragraphs: [
          "1. Mọi quyền sở hữu trí tuệ đối với cấu trúc hệ thống, cơ sở dữ liệu và giao diện đều thuộc về Công ty.",
          "2. Người dùng được cấp quyền phi độc quyền sử dụng dữ liệu cho mục đích kinh doanh và tiếp thị nội bộ của chính mình.",
          "3. Nghiêm cấm hành vi bán lại dữ liệu thô cho bên thứ ba, cào dữ liệu trái phép hoặc xây dựng sản phẩm dịch vụ cạnh tranh trực tiếp với Kigyou-list."
        ]
      },
      {
        id: "art9",
        articleNum: "Điều 9",
        title: "Các hành vi bị nghiêm cấm",
        paragraphs: [
          "Người dùng không được thực hiện các hành vi sau:",
          "(1) Vi phạm pháp luật hoặc xâm phạm quyền lợi của bên thứ ba.",
          "(2) Tấn công hệ thống, cào dữ liệu tự động với tần suất cao gây quá tải máy chủ.",
          "(3) Chia sẻ tài khoản trái phép hoặc khai thác lỗ hổng bảo mật.",
          "(4) Phát tán nội dung lừa đảo, spam hoặc quấy rối doanh nghiệp đối tác."
        ]
      },
      {
        id: "art10",
        articleNum: "Điều 10",
        title: "Tạm ngừng dịch vụ và Bảo trì",
        paragraphs: [
          "1. Công ty có thể tạm dừng hệ thống trong trường hợp bảo trì khẩn cấp hoặc sự cố bất khả kháng (thiên tai, sự cố đường truyền mạng quốc tế).",
          "2. Công ty không chịu trách nhiệm bồi thường cho các gián đoạn ngoài tầm kiểm soát hợp lý."
        ]
      },
      {
        id: "art11",
        articleNum: "Điều 11",
        title: "Chấm dứt tài khoản do vi phạm",
        paragraphs: [
          "Công ty có quyền khóa và chấm dứt tài khoản ngay lập tức mà không cần báo trước nếu Người dùng vi phạm nghiêm trọng Điều khoản hoặc không thanh toán phí dịch vụ."
        ]
      },
      {
        id: "art12",
        articleNum: "Điều 12",
        title: "Cam kết loại trừ thế lực chống phá xã hội",
        paragraphs: [
          "Hai bên cam kết không thuộc các tổ chức tội phạm có tổ chức (Yakuza), bạo lực băng nhóm hoặc tài trợ cho các hoạt động phạm pháp tại Nhật Bản."
        ]
      },
      {
        id: "art13",
        articleNum: "Điều 13",
        title: "Miễn trừ trách nhiệm và Giới hạn bồi thường",
        paragraphs: [
          "1. Công ty nỗ lực tối đa để bảo đảm tính chuẩn xác của dữ liệu nhưng không bảo đảm dữ liệu hoàn hảo 100% trong mọi trường hợp do biến động doanh nghiệp.",
          "2. Mọi tranh chấp phát sinh giữa Người dùng và đối tác kinh doanh do Người dùng tự chịu trách nhiệm giải quyết.",
          "3. Giới hạn trách nhiệm bồi thường thiệt hại trực tiếp của Công ty (nếu có) không vượt quá tổng số tiền Người dùng đã thanh toán trong 01 tháng gần nhất."
        ]
      },
      {
        id: "art14",
        articleNum: "Điều 14",
        title: "Bảo mật thông tin",
        paragraphs: [
          "Hai bên cam kết bảo mật mọi thông tin kinh doanh và dữ liệu người dùng theo đúng Luật Bảo vệ Thông tin Cá nhân của Nhật Bản."
        ]
      },
      {
        id: "art15",
        articleNum: "Điều 15",
        title: "Luật áp dụng và Tòa án tài phán",
        paragraphs: [
          "Điều khoản này được điều chỉnh theo pháp luật Nhật Bản. Mọi tranh chấp phát sinh sẽ thuộc thẩm quyền tài phán độc quyền của Tòa án quận Tokyo (Tokyo District Court)."
        ]
      }
    ],
    operatorTitle: "Thông tin đơn vị vận hành dịch vụ",
    operatorCompany: "Công ty Cổ phần TQC (TQC株式会社 / TQC Corporation)",
    operatorRep: "Đại diện: KIM VAN TRUNG (キム バン チュン)",
    operatorAddress: "Tầng 3 Tòa nhà Sato, 2-33-6 Minami-Ikebukuro, Toshima-ku, Tokyo 171-0022, Nhật Bản",
    operatorTaxId: "Mã số doanh nghiệp hóa đơn hợp lệ: T4013301048678",
    operatorTel: "Điện thoại: +81-3-6907-1219 / FAX: +81-3-6701-2399",
    operatorEmail: "Email hỗ trợ: info@kigyoulist.com",
    operatorWeb: "Website: https://kigyoulist.com",
    contactSupportBtn: "Liên hệ bộ phận hỗ trợ",
    viewTokushohoBtn: "Xem công bố Luật Tokushoho"
  } : {
    home: "Home",
    terms: "Terms of Service",
    kicker: "Standard B2B SaaS Terms of Service (Service Agreement)",
    title: "Terms of Service",
    subtitle: "Terms and conditions for utilizing Kigyou-list database, data licensing guidelines, and contact form marketing operational policies",
    revisedDate: "Last Revised: October 8, 2026 (Established: April 1, 2025)",
    intro: "These Terms of Service (hereinafter referred to as the \"Terms\") define the operational conditions and licensing terms for using the corporate database search and automated contact form marketing platform \"Kigyou-list\" (hereinafter referred to as the \"Service\") provided by TQC Corporation (hereinafter referred to as the \"Company\"). All registered users and participating organizations (hereinafter referred to as \"Users\") agree to be bound by these Terms upon accessing the Service.",
    invoiceBadge: "Registered Qualified Invoice Issuer (T4013301048678)",
    antisocialBadge: "Anti-Social Forces Exclusion Clause Established",
    securityBadge: "Stripe Secure Payment Protection & Encryption",
    highlightsTitle: "Key Highlights & Core Provisions (Summary)",
    highlights: [
      {
        icon: <Database className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        title: "Commercial Data Licensing Scope",
        desc: "Exported corporate data is licensed strictly for internal prospecting and sales acquisition. Raw bulk redistribution, resale, or building competing lead services is strictly prohibited."
      },
      {
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        title: "Zero Lock-In Contract & Transparent Cancellation",
        desc: "Monthly subscriptions can be terminated anytime directly from Dashboard Settings. No minimum commitment periods or cancellation fees."
      },
      {
        icon: <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        title: "Contact Form Compliance & Screening",
        desc: "Form outreach strictly adheres to the Japanese Act on Specified Commercial Transactions and Anti-Spam Act, featuring automated AI anti-sales exclusion and human review."
      }
    ],
    sections: [
      {
        id: "art1",
        articleNum: "Article 1",
        title: "Scope of Application and Amendments",
        paragraphs: [
          "1. These Terms shall govern all legal and contractual relationships between the User and the Company regarding the use of the Service.",
          "2. Operating guidelines, individual feature terms, Privacy Policy, and Specified Commercial Transactions disclosures posted on the website form an integral part of these Terms.",
          "3. The Company reserves the right to amend these Terms in response to statutory updates, technological advancements, or operational requirements. Revised Terms become effective immediately upon publication on the site."
        ]
      },
      {
        id: "art2",
        articleNum: "Article 2",
        title: "Definitions",
        paragraphs: [
          "The following terms used herein shall have the meanings set forth below:",
          "(1) 'Service' refers to the Kigyou-list platform, including 5M+ corporate directory search, CSV export features, automated contact form dispatch, buying signals, Kanban CRM, and API integrations.",
          "(2) 'User' refers to registered corporations, partnerships, sole proprietors, or authorized individuals using the Service.",
          "(3) 'Corporate Data' refers to aggregated and standardized business records sourced lawfully from public registries, government open datasets, and official company portals.",
          "(4) 'Form Marketing Outreach' refers to the automated transmission service that delivers sales proposals directly into target corporate inquiry forms in compliance with Japanese communication standards."
        ]
      },
      {
        id: "art3",
        articleNum: "Article 3",
        title: "User Registration and Account Security",
        paragraphs: [
          "1. Prospective users shall register an account through prescribed procedures while agreeing unconditionally to these Terms.",
          "2. Users bear sole responsibility for safeguarding their account credentials and API keys. Account sharing or leasing to third parties is strictly prohibited.",
          "3. The Company reserves the right to deny registration or terminate accounts of parties associated with historical contract breaches or fraudulent behavior."
        ]
      },
      {
        id: "art4",
        articleNum: "Article 4",
        title: "Service Plans and Quota Allocation",
        paragraphs: [
          "1. Feature access and download quotas are provisioned according to the selected plan tier:",
          "・FREE Plan: Up to 20 CSV company exports per day.",
          "・PRO Plan: 2,000 CSV downloads/month, corporate emails disclosure, Kanban CRM.",
          "・BUSINESS Plan: 10,000 CSV downloads/month, Mechanism B bulk background downloads, priority support.",
          "・ENTERPRISE Plan: 40,000 CSV downloads/month, API access, dedicated account engineer.",
          "・Quota Add-on Packs: One-off packs for 10,000 / 50,000 / 100,000 additional CSV downloads.",
          "・Form Marketing Outreach Packs: 1,000 / 3,000 / 5,000 send credits, or custom bulk enterprise volume.",
          "2. Monthly subscription quotas reset upon each billing cycle and do not roll over. One-off quota add-on packs remain active indefinitely until exhausted."
        ]
      },
      {
        id: "art5",
        articleNum: "Article 5",
        title: "Fees, Invoicing, and Payment Terms",
        paragraphs: [
          "1. Users shall pay fees according to published pricing schedules, inclusive of 10% Japanese consumption tax.",
          "2. Credit card payments are securely processed via Stripe. Enterprise customers ordering annual contracts or 10,000+ form dispatches may request invoice bank wire terms.",
          "3. The Company is a certified Qualified Invoice Issuer (Registration No: T4013301048678). Compliant PDF receipts are generated instantly from the user dashboard.",
          "4. Due to the digital delivery of data and communication services, fees paid are non-refundable for customer convenience."
        ]
      },
      {
        id: "art6",
        articleNum: "Article 6",
        title: "Automatic Renewal and Cancellation Policy",
        paragraphs: [
          "1. Monthly subscription plans automatically renew every billing cycle unless the User disables renewal via the dashboard.",
          "2. Users can disable auto-renewal anytime in Dashboard Settings prior to the next billing date without incurring fees.",
          "3. Mid-cycle cancellations are not refunded on a prorated basis; however, full plan access continues until the end of the paid billing period.",
          "4. There are no minimum contract duration lock-ins or early termination penalties."
        ]
      },
      {
        id: "art7",
        articleNum: "Article 7",
        title: "Contact Form Marketing Outreach Special Provisions",
        paragraphs: [
          "1. Users must ensure outreach content strictly complies with the Japanese Act on Specified Commercial Transactions, Act on Regulation of Transmission of Specified Electronic Mail, and Anti-Monopoly regulations.",
          "2. Outreach submissions must prominently display verified sender corporate identity and clear opt-out instructions.",
          "3. The Company pre-screens submitted copy and reserves the right to reject dispatches involving adult, multi-level marketing, predatory lending, or deceptive claims.",
          "4. The system automatically excludes domains bearing explicit anti-solicitation statements. Deliverability errors caused by external URL shutdown receive appropriate credit adjustments.",
          "5. Specific sales appointment counts or lead conversion metrics cannot be guaranteed."
        ]
      },
      {
        id: "art8",
        articleNum: "Article 8",
        title: "Intellectual Property Rights and Data License Scope",
        paragraphs: [
          "1. All intellectual property rights in the software, algorithms, data architectures, and interfaces belong exclusively to the Company.",
          "2. Users are granted a non-exclusive license to use exported corporate data solely for their internal sales acquisition and market analysis.",
          "3. Users shall not resell, syndicate, publish, or redistribute raw bulk data to third parties, nor build competing directory platforms."
        ]
      },
      {
        id: "art9",
        articleNum: "Article 9",
        title: "Prohibited Conduct",
        paragraphs: [
          "Users are expressly prohibited from engaging in:",
          "(1) Violating statutory regulations, public decency, or third-party proprietary rights.",
          "(2) Deploying automated scrapers or stress-testing scripts that burden the Company's servers.",
          "(3) Unauthorized credential sharing, unauthorized API distribution, or security circumvention.",
          "(4) Distributing unlawful unsolicited spam or harassing communications."
        ]
      },
      {
        id: "art10",
        articleNum: "Article 10",
        title: "Service Interruption and Maintenance",
        paragraphs: [
          "1. The Company may suspend service temporarily for emergency maintenance, network outages, or force majeure events.",
          "2. The Company assumes no liability for damages arising from reasonable and unavoidable infrastructure interruptions."
        ]
      },
      {
        id: "art11",
        articleNum: "Article 11",
        title: "Account Suspension and Termination",
        paragraphs: [
          "The Company may suspend or terminate user access without prior notice upon substantial breach of these Terms, non-payment, or insolvency."
        ]
      },
      {
        id: "art12",
        articleNum: "Article 12",
        title: "Exclusion of Anti-Social Forces",
        paragraphs: [
          "Both parties represent and warrant that neither they nor their executives are affiliated with organized crime syndicates (Yakuza), money laundering, or related illicit enterprises."
        ]
      },
      {
        id: "art13",
        articleNum: "Article 13",
        title: "Disclaimer of Warranties and Limitation of Liability",
        paragraphs: [
          "1. While the Company exercises commercially reasonable efforts in collecting and curating corporate data, it does not guarantee uninterrupted flawlessness or fitness for a particular purpose.",
          "2. The Company bears no responsibility for commercial disputes arising between Users and contacted enterprise leads.",
          "3. The aggregate liability of the Company for direct damages shall not exceed the total fees paid by the User to the Company during the preceding one-month period."
        ]
      },
      {
        id: "art14",
        articleNum: "Article 14",
        title: "Confidentiality and Personal Information",
        paragraphs: [
          "Both parties shall maintain strict confidentiality over proprietary business information and handle personal data in accordance with Japanese privacy regulations."
        ]
      },
      {
        id: "art15",
        articleNum: "Article 15",
        title: "Governing Law and Jurisdiction",
        paragraphs: [
          "1. These Terms are governed by and construed in accordance with the laws of Japan.",
          "2. The Tokyo District Court or Tokyo Summary Court shall have exclusive primary jurisdiction over any disputes arising out of or in connection with the Service."
        ]
      }
    ],
    operatorTitle: "Operating Entity Disclosures",
    operatorCompany: "TQC Corporation (TQC株式会社)",
    operatorRep: "Representative Director: Van Trung Kim (キム バン チュン)",
    operatorAddress: "3F Sato Bldg, 2-33-6 Minami-Ikebukuro, Toshima-ku, Tokyo 171-0022, Japan",
    operatorTaxId: "Qualified Invoice Registration No: T4013301048678",
    operatorTel: "Tel: +81-3-6907-1219 / FAX: +81-3-6701-2399",
    operatorEmail: "Support: info@kigyoulist.com",
    operatorWeb: "Official Website: https://kigyoulist.com",
    contactSupportBtn: "Contact Support Desk",
    viewTokushohoBtn: "View Specified Commercial Transactions Disclosures"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": d.home,
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": d.terms,
        "item": `https://kigyoulist.com/${locale}/terms`
      }
    ]
  };

  const termsSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": d.title,
    "description": isJa 
      ? "Kigyou-list サービス利用規約。TQC株式会社（適格請求書登録番号: T4013301048678）。"
      : isVi 
      ? "Điều khoản dịch vụ Kigyou-list. Do Công ty Cổ phần TQC vận hành."
      : "Kigyou-list Terms of Service. Operated by TQC Corporation.",
    "url": `https://kigyoulist.com/${locale}/terms`,
    "publisher": {
      "@type": "Organization",
      "name": "TQC株式会社",
      "url": "https://kigyoulist.com",
      "taxID": "T4013301048678"
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 font-sans antialiased selection:bg-[#1B4F8A]/15 selection:text-[#1B4F8A]">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-8">
        {/* Visual Breadcrumb Navigation */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
            {d.home}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">
            {d.terms}
          </span>
        </nav>

        {/* Translation Disclaimer for non-Japanese viewers */}
        {(isEn || isVi) && (
          <div className="bg-amber-50/90 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-2xl p-4 sm:p-5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-extrabold text-[11px] uppercase tracking-wider block mb-1">
                {isVi ? "Lưu ý về tính pháp lý của ngôn ngữ" : "Official Language Precedence Disclaimer"}
              </span>
              <p className="leading-relaxed font-medium">
                {isVi 
                  ? "Đây là bản dịch tham khảo của Điều khoản dịch vụ chính thức bằng tiếng Nhật. Trong trường hợp có bất kỳ sự khác biệt hoặc mâu thuẫn nào về thuật ngữ pháp lý, bản tiếng Nhật gốc sẽ luôn là bản có giá trị pháp lý cao nhất và có hiệu lực thi hành."
                  : "This page is an English reference translation of the official Japanese Terms of Service. In case of any conflict, discrepancy, or ambiguity between this translation and the Japanese version, the original Japanese version shall prevail and remain legally binding."}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            HERO HEADER SECTION (B2B Japanese Authority & Trust)
            ======================================================== */}
        <section className="relative overflow-hidden bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs">
          {/* Subtle B2B grid background element */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1c2128_1px,transparent_1px),linear-gradient(to_bottom,#1c2128_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="relative flex flex-col gap-6">
            {/* Eyebrow Kicker */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold tracking-wide shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#1B4F8A] dark:bg-blue-400 animate-pulse" />
                <span>{d.kicker}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {d.revisedDate}
              </span>
            </div>

            {/* Title & Icon */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-500/15 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {d.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {d.subtitle}
                </p>
              </div>
            </div>

            {/* Introductory statement */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal border-t border-slate-100 dark:border-slate-800 pt-6">
              {d.intro}
            </p>

            {/* Trust Badges Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200">
                <Receipt className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                <span className="font-semibold line-clamp-1">{d.invoiceBadge}</span>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold line-clamp-1">{d.antisocialBadge}</span>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-semibold line-clamp-1">{d.securityBadge}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            KEY HIGHLIGHTS CARDS (Top 3 B2B Rules)
            ======================================================== */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>{d.highlightsTitle}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {d.highlights.map((h, i) => (
              <div 
                key={i} 
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs">
                  {h.icon}
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {h.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            TWO-COLUMN LAYOUT: STICKY TOC SIDEBAR + DETAILED ARTICLES
            ======================================================== */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sticky Table of Contents Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 rounded-3xl p-5 shadow-xs lg:sticky lg:top-24 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-2 pb-3 border-b border-slate-150 dark:border-slate-800">
              <Layers className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider">
                {isJa ? "目次（全15条）" : isVi ? "Mục lục (15 điều)" : "Table of Contents"}
              </span>
            </div>

            <div className="flex flex-col gap-1 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 text-xs">
              {d.sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] hover:bg-slate-50 dark:hover:text-blue-300 dark:hover:bg-slate-800/60 font-semibold transition-all flex items-center gap-2 group"
                >
                  <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0">
                    {sec.articleNum}
                  </span>
                  <span className="truncate">{sec.title}</span>
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex flex-col gap-2">
              <Link
                href={`/${locale}/tokushoho`}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
              >
                <span>{isJa ? "特定商取引法表記" : isVi ? "Luật Tokushoho" : "Tokushoho"}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
              >
                <span>{isJa ? "プライバシーポリシー" : isVi ? "Chính sách bảo mật" : "Privacy Policy"}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </aside>

          {/* Main Articles Container */}
          <section className="flex-1 w-full bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs flex flex-col gap-10">
            {d.sections.map((sec, idx) => (
              <div 
                key={sec.id} 
                id={sec.id} 
                className={`flex flex-col gap-4 scroll-mt-28 ${
                  idx > 0 ? "pt-8 border-t border-slate-150 dark:border-slate-800" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-500/15 dark:text-blue-400 font-mono text-xs font-black tracking-tight">
                    {sec.articleNum}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {sec.title}
                  </h2>
                </div>

                <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* Operating Entity Card inside Terms */}
            <div className="pt-10 border-t-2 border-slate-200 dark:border-slate-800 flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/40 p-6 sm:p-8 rounded-2xl">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {d.operatorTitle}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div>
                  <strong className="text-slate-900 dark:text-white block font-bold mb-0.5">{d.operatorCompany}</strong>
                  <span>{d.operatorRep}</span>
                  <p className="mt-1">{d.operatorAddress}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#1B4F8A] dark:text-blue-400">{d.operatorTaxId}</span>
                  <span>{d.operatorTel}</span>
                  <span>{d.operatorEmail}</span>
                  <span>{d.operatorWeb}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Link
                  href={`/${locale}/contact`}
                  className="px-4 py-2 rounded-xl bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{d.contactSupportBtn}</span>
                </Link>
                <Link
                  href={`/${locale}/tokushoho`}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors shadow-2xs flex items-center gap-2"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-400" />
                  <span>{d.viewTokushohoBtn}</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
