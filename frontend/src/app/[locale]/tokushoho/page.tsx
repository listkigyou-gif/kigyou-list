import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Scale, 
  Building2, 
  Mail, 
  Phone, 
  ShieldAlert, 
  FileText, 
  Globe, 
  ChevronRight, 
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Clock,
  Laptop,
  CheckCircle2,
  Receipt,
  FileCheck,
  Send,
  Database,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Sparkles
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
    ? "Act on Specified Commercial Transactions | Kigyou-list"
    : isVi
    ? "Công bố theo Luật giao dịch thương mại đặc định (Tokushoho) | Kigyou-list"
    : "特定商取引法に基づく表記 | Kigyou-list（500万社企業データベース・自動フォーム営業）";

  const pageDesc = isEn
    ? "Statutory disclosures under the Act on Specified Commercial Transactions for Kigyou-list. Operated by TQC Corporation (Invoice Registration: T4013301048678)."
    : isVi
    ? "Thông tin công bố pháp lý bắt buộc theo Điều 11 Luật Giao dịch Thương mại Đặc định Nhật Bản cho dịch vụ Kigyou-list. Do Công ty Cổ phần TQC vận hành (Mã số hóa đơn T4013301048678)."
    : "特定商取引に関する法律第11条に基づく表示義務事項を掲載しています。TQC株式会社（適格請求書発行事業者登録番号: T4013301048678）が運営する企業データベースおよび問い合わせフォーム営業代行サービスの販売価格、支払い方法、役務提供時期、解約条件等を開示しています。";

  const ogLocale = isEn ? "en_US" : isVi ? "vi_VN" : "ja_JP";

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `/${locale}/tokushoho`,
      languages: {
        ja: "/ja/tokushoho",
        en: "/en/tokushoho",
        vi: "/vi/tokushoho",
        "x-default": "/ja/tokushoho",
      }
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://kigyoulist.com/${locale}/tokushoho`,
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

export default async function TokushohoPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  const isJa = locale === 'ja';
  const isVi = locale === 'vi';
  const isEn = locale === 'en';

  const d = isJa ? {
    home: "ホーム",
    tokushoho: "特定商取引法に基づく表記",
    kicker: "特定商取引法第11条に基づく法的表示",
    title: "特定商取引法に基づく表記",
    subtitle: "特定商取引に関する法律に基づく通信販売広告表示義務事項および役務提供条件の開示",
    updatedDate: "最終改定日: 2026年10月8日（制定日: 2025年4月1日）",
    intro: "特定商取引に関する法律（昭和51年法律第57号）第11条に基づき、Kigyou-list（企業リスト）における各種有料プラン、追加容量パック、および問い合わせフォーム営業配信サービスの販売条件その他の法定事項を以下の通り開示いたします。ご利用にあたっては本表記および利用規約を事前にご確認ください。",
    invoiceBadge: "適格請求書発行事業者登録済（登録番号: T4013301048678）",
    stripeBadge: "Stripe セキュア決済保護（256-bit SSL暗号化）",
    complianceBadge: "特定商取引法・特定電子メール法準拠",
    legalItems: [
      {
        icon: <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "販売業者",
        badge: "法人情報",
        value: "TQC株式会社 (TQC Corporation)"
      },
      {
        icon: <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "運営統括責任者",
        badge: "代表者",
        value: "キム　バン　チュン (Van Trung Kim)"
      },
      {
        icon: <Scale className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "所在地",
        badge: "登記住所",
        value: "〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F"
      },
      {
        icon: <Receipt className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "適格請求書発行事業者登録番号",
        badge: "インボイス対応",
        value: "T4013301048678\n※国税庁適格請求書発行事業者公表サイトにて確認可能。有料決済完了後、マイページ（決済管理）よりインボイス制度対応のPDF領収書を即座に発行・ダウンロードいただけます。"
      },
      {
        icon: <Phone className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "電話番号",
        badge: "カスタマーサポート",
        value: "03-6907-1219\n受付時間：平日 10:00〜18:00（土日・祝日・年末年始休業を除く）\n※お問い合わせ対応の履歴保全、および迅速かつ確実なご案内のため、原則としてWebフォームまたはメールでのご連絡を推奨しております。"
      },
      {
        icon: <Phone className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "FAX番号",
        badge: "法人窓口",
        value: "03-6701-2399"
      },
      {
        icon: <Mail className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "メールアドレス",
        badge: "総合受付",
        value: "info@kigyoulist.com（24時間受付、翌営業日中までに順次返答）"
      },
      {
        icon: <Globe className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "サービス公式URL",
        badge: "公式Webサイト",
        value: "https://kigyoulist.com"
      },
      {
        icon: <Database className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "取扱サービスの内容",
        badge: "提供役務",
        value: "1. 日本全国500万社企業データベース検索・リスト抽出・CSV一括ダウンロード（月額サブスクリプションおよび買い切り容量パック）\n2. 問い合わせフォーム営業自動配信・アプローチ代行サービス（都度購入型配信チケット、AI営業禁止フィルタリング付き）\n3. 企業購買意図シグナル（求人・助成金・入札・特許）閲覧機能およびABMかんばんCRM営業管理機能\n4. 法人データAPI連携（ENTERPRISEプラン対応）"
      },
      {
        icon: <FileText className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "販売価格（利用料金）",
        badge: "総額表示 (税込)",
        value: "各プラン紹介ページ（料金プラン）およびフォーム営業詳細ページに表示された価格（すべて消費税10%込みの総額表示）。\n\n【企業リスト月額プラン（サブスクリプション）】\n・FREEプラン: 0円 / 月（1日20件までCSVダウンロード）\n・PROプラン: 月額 2,900円（税込）（定価 4,200円、2,000行/月）\n・BUSINESSプラン: 月額 9,800円（税込）（定価 14,000円、10,000行/月・大量エクスポート対応）\n・ENTERPRISEプラン: 月額 29,000円（税込）（定価 42,000円、40,000行/月・専任サポート付）\n\n【追加ダウンロード容量パック（買い切り型）】\n・10,000行パック: 14,800円（税込）\n・50,000行パック: 49,800円（税込）\n・100,000行パック: 79,800円（税込）\n\n【問い合わせフォーム営業配信プラン（都度購入型）】\n・1,000件プラン: 19,600円（税込）（定価 28,000円、19.6円/件）\n・3,000件プラン: 48,300円（税込）（定価 69,000円、16.1円/件）\n・5,000件プラン: 69,300円（税込）（定価 99,000円、13.8円/件）\n・10,000件以上の大口配信・特注カスタムプラン: 個別お見積もり"
      },
      {
        icon: <FileText className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "商品代金以外の必要料金",
        badge: "諸費用",
        value: "・インターネット接続料金、通信回線費用、パケット通信料等（お客様のご負担となります）\n・銀行振込でのお支払いの際の振込手数料（お客様のご負担となります）\n※当サイトの販売価格はすべて消費税（10%）を含んだ総額表示となっております。"
      },
      {
        icon: <CreditCard className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "お支払い方法",
        badge: "決済手段",
        value: "・クレジットカード決済（VISA, Mastercard, American Express, JCB）\n  ※Stripe決済代行サービスを利用した高度なSSL暗号化通信により、安全に即時処理されます。弊社サーバーにお客様のカード番号等は一切保持されません。\n・請求書払い / 銀行振込\n  ※月間10,000件以上の大口配信、または法人年間契約等で事前審査・合意をいただいた法人様に限ります。"
      },
      {
        icon: <Clock className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "代金の決済時期・お支払い時期",
        badge: "決済タイミング",
        value: "【月額プラン（定期課金）】初回お申し込み時に即時決済。翌月以降は毎月の契約応当日に自動更新・自動決済されます。\n【追加容量パック / フォーム配信チケット（都度課金）】ご購入手続き完了時に即時決済されます。\n【請求書払い（法人契約）】請求書に記載された支払期日まで（原則として月末締め翌月末日払い）。"
      },
      {
        icon: <FileCheck className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "役務・サービスの提供時期",
        badge: "納期・引渡時期",
        value: "【企業データベース・追加容量パック】クレジットカード決済完了後、即時にシステムアカウントに権限およびダウンロード枠が付与され、すぐにご利用いただけます。\n【問い合わせフォーム営業代行】配信文面および送信先リストの特定商取引法・営業禁止除外審査完了後、お客様が指定されたスケジュールに基づき配信が開始されます。配信完了後は管理画面にて送信日時・企業名・URLを含む詳細CSVレポートを即座にダウンロードいただけます。"
      },
      {
        icon: <Laptop className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "動作環境（推奨利用環境）",
        badge: "システム要件",
        value: "当サービスはWebブラウザ上で動作するクラウドSaaSです。以下の環境でのご利用を推奨いたします。\n\n・対応OS: Windows 10/11, macOS 最新版, iOS 最新版, Android 最新版\n・推奨ブラウザ: Google Chrome（最新版）, Mozilla Firefox（最新版）, Apple Safari（最新版）, Microsoft Edge（最新版）\n・通信環境: ブロードバンドによる安定した常時インターネット接続環境\n・JavaScriptおよびCookieが有効になっている必要があります。"
      },
      {
        icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
        label: "返品・返金・キャンセル・解約特約",
        badge: "重要特約",
        value: "【お客様都合による返品・返金について】\nデジタルデータ、ソフトウェア、SaaSサービス及び配信役務の特性上、決済完了後のお客様のご都合による返品・交換・返金・キャンセルには理由の如何を問わず応じられません。\n\n【月額プランの解約（自動更新の停止）について】\n利用規約に基づき、ダッシュボードの「設定」メニューよりいつでも次回更新の自動解約（自動更新停止）のお手続きが可能です。次回請求日の前日までに解約手続きを行っていただければ、次月以降の請求は発生いたしません。なお、契約期間の途中で解約された場合でも日割りでの返金は行われませんが、当該利用期間の終了日までは引き続きサービスをご利用いただけます。\n\n【フォーム配信における未達・送信不可分の取り扱い】\n対象企業のWebサイト閉鎖や問い合わせフォームの仕様変更等により送信が完了しなかった件数分につきましては、システムポリシーに基づきクレジット返還または代替送信等の規定に沿って適切に対処いたします。"
      },
      {
        icon: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        label: "免責事項およびサービス品質に関する特約",
        badge: "免責事項",
        value: "・当サービスが提供する企業情報データベースは、国税庁法人番号公表サイト、官公庁公開情報、各社公式Webサイト等の公知情報を独自の技術で収集・解析・更新しております。情報の正確性・最新性・網羅性の維持に万全を期しておりますが、完全性・特定目的への適合性を恒常的に保証するものではありません。\n・問い合わせフォーム営業による反響率・商談化率・アポイント獲得数は、配信文面の内容、訴求商材、対象業界、市場環境等により大きく変動するため、一定の営業成果や利益を保証するものではありません。"
      }
    ],
    pricingOverviewTitle: "取扱プラン・料金体系の概要（早見表）",
    pricingOverviewDesc: "Kigyou-list で提供している全サービスの正規料金体系です。すべての価格は消費税（10%）を含んだ総額表示となっております。",
    dbPlansHeading: "1. 企業リスト・データベース月額プラン",
    packPlansHeading: "2. CSV追加ダウンロード容量パック（買い切り）",
    formPlansHeading: "3. 問い合わせフォーム営業配信プラン（都度購入）",
    viewAllPricing: "料金プラン一覧を詳しく見る",
    viewFormMarketing: "フォーム営業代行の詳細を見る",
    workflowTitle: "安心のご利用・解約フロー",
    workflowDesc: "契約期間の縛りや違約金はありません。いつでも安心してご利用を開始・解約いただけます。",
    steps: [
      {
        step: "01",
        title: "オンラインで簡単申し込み",
        desc: "プランを選びクレジットカードで安全に決済。Stripeによる即時処理でアカウントが有効化されます。"
      },
      {
        step: "02",
        title: "即座に機能・枠の利用開始",
        desc: "決済完了と同時にCSVダウンロード枠や配信クレジットが付与され、すぐに営業活動を開始できます。"
      },
      {
        step: "03",
        title: "いつでもマイページから解約可能",
        desc: "ダッシュボードの「設定」メニューよりワンクリックで次回自動更新を停止。契約の縛り・解約料は一切ございません。"
      }
    ],
    supportTitle: "公式サポート窓口・お問い合わせ",
    supportDesc: "本開示内容、サービス機能、適格請求書（領収書）の発行に関してご不明な点がございましたら、お気軽にお問い合わせください。",
    contactBtn: "お問い合わせフォームを開く",
    invoiceDocText: "※適格請求書（インボイス）のPDF領収書は、有料決済完了後に「ダッシュボード > 決済履歴」より24時間いつでも発行可能です。"
  } : isVi ? {
    home: "Trang chủ",
    tokushoho: "Luật giao dịch thương mại đặc định",
    kicker: "Công bố pháp lý theo Điều 11 Luật Giao dịch Thương mại Đặc định Nhật Bản",
    title: "Công bố theo Luật giao dịch thương mại đặc định (特定商取引法)",
    subtitle: "Công bố nghĩa vụ quảng cáo thương mại điện tử và điều kiện cung ứng dịch vụ tại thị trường Nhật Bản",
    updatedDate: "Sửa đổi lần cuối: Ngày 08 tháng 10 năm 2026 (Ban hành: Ngày 01 tháng 04 năm 2025)",
    intro: "Căn cứ theo Điều 11 Luật Giao dịch Thương mại Đặc định Nhật Bản (Đạo luật số 57 năm 1976), chúng tôi công bố công khai các điều kiện bán hàng, biểu phí dịch vụ cơ sở dữ liệu, gói bổ sung dung lượng và dịch vụ gửi Form tiếp thị tự động trên nền tảng Kigyou-list. Quý khách vui lòng xem kỹ trước khi sử dụng dịch vụ.",
    invoiceBadge: "Doanh nghiệp phát hành hóa đơn hợp lệ (Mã số: T4013301048678)",
    stripeBadge: "Bảo mật thanh toán Stripe (Mã hóa SSL 256-bit)",
    complianceBadge: "Tuân thủ luật Tokushoho & Luật chống thư rác Nhật Bản",
    legalItems: [
      {
        icon: <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Đơn vị bán hàng (販売業者)",
        badge: "Pháp nhân",
        value: "Công ty Cổ phần TQC (TQC株式会社 / TQC Corporation)"
      },
      {
        icon: <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Người đại diện điều hành (運営統括責任者)",
        badge: "Đại diện",
        value: "KIM VAN TRUNG (キム バン チュン)"
      },
      {
        icon: <Scale className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Địa chỉ trụ sở (所在地)",
        badge: "Địa chỉ đăng ký",
        value: "Tầng 3 Tòa nhà Sato, 2-33-6 Minami-Ikebukuro, Toshima-ku, Tokyo 171-0022, Nhật Bản (〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F)"
      },
      {
        icon: <Receipt className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Mã số doanh nghiệp hóa đơn hợp lệ (適格請求書登録番号)",
        badge: "Hóa đơn Invoice",
        value: "T4013301048678\n※Đã đăng ký chính thức với Cơ quan Thuế Quốc gia Nhật Bản (NTA). Sau khi thanh toán, quý khách có thể xuất hóa đơn điện tử chuẩn Qualified Invoice (PDF) trực tiếp từ trang Quản trị (Dashboard)."
      },
      {
        icon: <Phone className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Số điện thoại liên hệ (電話番号)",
        badge: "Hỗ trợ khách hàng",
        value: "+81-3-6907-1219 (03-6907-1219)\nThời gian tiếp nhận: Ngày làm việc 10:00 - 18:00 (Giờ Nhật Bản JST, trừ thứ 7, CN và ngày lễ tết).\n※Để đảm bảo lưu trữ lịch sử xử lý và phản hồi chính xác nhất, chúng tôi khuyến khích quý khách ưu tiên liên hệ qua Form liên hệ trực tuyến hoặc Email."
      },
      {
        icon: <Phone className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Số FAX (FAX番号)",
        badge: "Văn phòng",
        value: "+81-3-6701-2399 (03-6701-2399)"
      },
      {
        icon: <Mail className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Địa chỉ Email (メールアドレス)",
        badge: "Hộp thư hỗ trợ",
        value: "info@kigyoulist.com (Tiếp nhận 24/7, phản hồi trong vòng 1 ngày làm việc)"
      },
      {
        icon: <Globe className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Địa chỉ Website (ホームページURL)",
        badge: "Trang web chính thức",
        value: "https://kigyoulist.com"
      },
      {
        icon: <Database className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Nội dung dịch vụ cung cấp (取扱サービス)",
        badge: "Dịch vụ",
        value: "1. Nền tảng tra cứu, trích xuất và tải xuống danh sách 5 triệu doanh nghiệp Nhật Bản (Gói thuê bao tháng và gói dung lượng mua thêm).\n2. Dịch vụ tự động hóa gửi Form liên hệ B2B (Form DM Outreach) với bộ lọc AI loại trừ doanh nghiệp cấm chào hàng.\n3. Tính năng tín hiệu tuyển dụng, trợ cấp, đấu thầu và bảng quản trị CRM Kanban ABM.\n4. Kết nối tích hợp API dữ liệu doanh nghiệp (Gói ENTERPRISE)."
      },
      {
        icon: <FileText className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Giá bán dịch vụ (販売価格)",
        badge: "Bao gồm thuế VAT 10%",
        value: "Giá được niêm yết công khai trên trang Bảng giá và trang Dịch vụ gửi Form (Đã bao gồm thuế tiêu dùng 10% tại Nhật).\n\n【Gói thuê bao hàng tháng (Subcription)】\n・Gói FREE: 0 JPY / tháng (Tối đa 20 dòng CSV / ngày)\n・Gói PRO: 2.900 JPY / tháng (Giá gốc 4.200 JPY, 2.000 dòng CSV / tháng)\n・Gói BUSINESS: 9.800 JPY / tháng (Giá gốc 14.000 JPY, 10.000 dòng CSV / tháng, hỗ trợ xuất hàng loạt lớn)\n・Gói ENTERPRISE: 29.000 JPY / tháng (Giá gốc 42.000 JPY, 40.000 dòng CSV / tháng, kỹ sư hỗ trợ riêng)\n\n【Gói bổ sung dung lượng CSV (Mua một lần)】\n・Gói 10.000 dòng: 14.800 JPY\n・Gói 50.000 dòng: 49.800 JPY\n・Gói 100.000 dòng: 79.800 JPY\n\n【Gói gửi biểu mẫu liên hệ Form DM (Mua theo lượt)】\n・Gói 1.000 lượt gửi: 19.600 JPY (Giá gốc 28.000 JPY, 19,6 JPY/lượt)\n・Gói 3.000 lượt gửi: 48.300 JPY (Giá gốc 69.000 JPY, 16,1 JPY/lượt)\n・Gói 5.000 lượt gửi: 69.300 JPY (Giá gốc 99.000 JPY, 13,8 JPY/lượt)\n・Gửi số lượng lớn trên 10.000 lượt: Báo giá riêng theo yêu cầu"
      },
      {
        icon: <FileText className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Chi phí phát sinh khác (商品代金以外の必要料金)",
        badge: "Chi phí phụ",
        value: "・Cước phí kết nối internet, đường truyền mạng, phí truyền dữ liệu phát sinh (khách hàng tự chi trả).\n・Phí chuyển khoản ngân hàng trong trường hợp thanh toán bằng hình thức chuyển khoản (khách hàng chi trả).\n※Tất cả giá niêm yết trên website đã bao gồm thuế tiêu dùng 10%."
      },
      {
        icon: <CreditCard className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Phương thức thanh toán (お支払い方法)",
        badge: "Kênh thanh toán",
        value: "・Thanh toán thẻ tín dụng quốc tế (VISA, Mastercard, American Express, JCB)\n  ※Xử lý an toàn tức thì qua cổng thanh toán Stripe với mã hóa SSL cao cấp. Hệ thống của chúng tôi không lưu giữ thông tin thẻ của quý khách.\n・Thanh toán qua hóa đơn / Chuyển khoản ngân hàng (Chỉ áp dụng cho doanh nghiệp ký hợp đồng năm hoặc gửi form số lượng lớn trên 10.000 lượt sau khi thỏa thuận)."
      },
      {
        icon: <Clock className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Thời hạn thanh toán (お支払い時期)",
        badge: "Kỳ hạn",
        value: "【Gói thuê bao tháng】Thanh toán ngay khi đăng ký ban đầu. Các tháng tiếp theo sẽ được tự động gia hạn và trừ tiền vào đúng ngày tương ứng mỗi tháng.\n【Gói dung lượng / Gói gửi Form】Thanh toán ngay tại thời điểm đặt mua.\n【Hóa đơn trả sau cho doanh nghiệp】Theo kỳ hạn ghi trên hóa đơn (thường là chốt cuối tháng và thanh toán vào cuối tháng kế tiếp)."
      },
      {
        icon: <FileCheck className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Thời điểm cung cấp dịch vụ (サービスの提供時期)",
        badge: "Bàn giao",
        value: "【Dữ liệu doanh nghiệp & Gói dung lượng】Ngay sau khi giao dịch thẻ thành công, tài khoản sẽ được cấp quyền và hạn mức tải CSV tức thì để sử dụng ngay.\n【Dịch vụ gửi Form tiếp thị】Sau khi nội dung gửi và danh sách doanh nghiệp vượt qua khâu kiểm duyệt tuân thủ Tokushoho và lọc từ khóa cấm, hệ thống sẽ tự động phát hành theo lịch trình đã chọn. Sau khi hoàn tất, báo cáo chi tiết (gồm tên doanh nghiệp, thời gian, URL form) sẽ sẵn sàng để tải xuống."
      },
      {
        icon: <Laptop className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Yêu cầu môi trường vận hành (推奨動作環境)",
        badge: "Yêu cầu hệ thống",
        value: "Kigyou-list là ứng dụng đám mây (Cloud SaaS) chạy trên trình duyệt. Quý khách nên sử dụng trong môi trường sau:\n\n・Hệ điều hành: Windows 10/11, macOS phiên bản mới nhất, iOS, Android\n・Trình duyệt khuyến nghị: Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge (phiên bản cập nhật mới nhất)\n・Kết nối mạng: Đường truyền Internet băng thông rộng ổn định\n・Trình duyệt cần kích hoạt JavaScript và Cookie."
      },
      {
        icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
        label: "Quy định đổi trả, hoàn tiền và hủy gói (返品・返金・解約特約)",
        badge: "Điều khoản quan trọng",
        value: "【Chính sách hoàn tiền】\nDo tính chất là dữ liệu số hóa, phần mềm trực tuyến và dịch vụ truyền phát kỹ thuật số, sau khi giao dịch thanh toán thành công, chúng tôi không chấp nhận yêu cầu trả hàng, hủy bỏ hoặc hoàn tiền vì lý do cá nhân của khách hàng.\n\n【Quy trình hủy gia hạn gói thuê bao hàng tháng】\nQuý khách có thể dừng gia hạn tự động bất kỳ lúc nào tại menu \"Cài đặt (設定)\" trong trang Dashboard. Nếu hoàn tất trước ngày đến hạn thanh toán tiếp theo, quý khách sẽ không bị trừ tiền ở chu kỳ sau. Việc hủy giữa chu kỳ không được hoàn tiền theo tỷ lệ ngày, nhưng quý khách vẫn có toàn quyền sử dụng dịch vụ cho đến hết ngày cuối cùng của chu kỳ đã trả phí.\n\n【Xử lý trường hợp form đóng hoặc không gửi được】\nĐối với các biểu mẫu bị đóng trang web hoặc thay đổi cấu trúc không thể phát hành, số lượng này sẽ được bảo lưu hoặc xử lý hoàn lại hạn mức theo quy chế vận hành của hệ thống."
      },
      {
        icon: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        label: "Miễn trừ trách nhiệm và chất lượng dịch vụ (免責事項)",
        badge: "Miễn trừ",
        value: "・Dữ liệu doanh nghiệp được tổng hợp từ các cổng thông tin pháp nhân quốc gia, cơ quan nhà nước và website công khai của doanh nghiệp. Chúng tôi nỗ lực tối đa để duy trì tính chuẩn xác và cập nhật, nhưng không cam kết bảo đảm tính hoàn hảo tuyệt đối trong mọi thời điểm do biến động tự nhiên của doanh nghiệp.\n・Tỷ lệ phản hồi hoặc cuộc hẹn từ chiến dịch gửi Form liên hệ phụ thuộc lớn vào nội dung thông điệp, sản phẩm, ngành nghề và thị hiếu thị trường, do đó không thể coi là cam kết kết quả kinh doanh cố định."
      }
    ],
    pricingOverviewTitle: "Tóm tắt biểu phí và các gói dịch vụ hiện hành",
    pricingOverviewDesc: "Bảng tra cứu nhanh các gói dịch vụ trên Kigyou-list. Tất cả các mức giá đều đã bao gồm 10% thuế tiêu dùng.",
    dbPlansHeading: "1. Gói thuê bao dữ liệu doanh nghiệp hàng tháng",
    packPlansHeading: "2. Gói mua bổ sung hạn ngạch CSV (Mua 1 lần)",
    formPlansHeading: "3. Gói gửi biểu mẫu liên hệ tự động Form DM",
    viewAllPricing: "Xem chi tiết trang bảng giá",
    viewFormMarketing: "Tìm hiểu thêm về dịch vụ gửi Form DM",
    workflowTitle: "Quy trình sử dụng & Hủy gia hạn minh bạch",
    workflowDesc: "Không có hợp đồng ràng buộc thời gian dài hạn, không có phí phạt hủy gói. Bạn hoàn toàn chủ động.",
    steps: [
      {
        step: "01",
        title: "Đăng ký & Thanh toán an toàn",
        desc: "Lựa chọn gói phù hợp và thanh toán thẻ bảo mật qua Stripe, kích hoạt tài khoản ngay tức thì."
      },
      {
        step: "02",
        title: "Sử dụng tính năng & Hạn mức ngay",
        desc: "Hạn ngạch tải CSV hoặc lượt gửi Form được cộng trực tiếp vào tài khoản để sử dụng ngay."
      },
      {
        step: "03",
        title: "Dừng gia hạn bất cứ lúc nào trong Dashboard",
        desc: "Vào trang Cài đặt (Settings) của Dashboard để hủy tự động gia hạn chỉ với 1 cú click, hoàn toàn miễn phí."
      }
    ],
    supportTitle: "Hỗ trợ khách hàng & Hóa đơn hợp lệ",
    supportDesc: "Nếu có bất kỳ thắc mắc nào về pháp lý, thanh toán hoặc hóa đơn Qualified Invoice, vui lòng liên hệ với chúng tôi.",
    contactBtn: "Gửi yêu cầu qua Form liên hệ",
    invoiceDocText: "※Hóa đơn điện tử chuẩn Qualified Invoice (PDF) có thể tải về 24/7 tại mục Quản lý thanh toán trong Dashboard."
  } : {
    home: "Home",
    tokushoho: "Act on Specified Commercial Transactions",
    kicker: "Statutory Disclosures under Article 11 of the Japanese Act on Specified Commercial Transactions",
    title: "Act on Specified Commercial Transactions Disclosures",
    subtitle: "Legal Disclosures on Mail Order Advertising, Service Pricing, and Operational Policies in Japan",
    updatedDate: "Last Updated: October 8, 2026 (Established: April 1, 2025)",
    intro: "Pursuant to Article 11 of the Japanese Act on Specified Commercial Transactions (Act No. 57 of 1976), the terms and conditions for commercial transactions on Kigyou-list—including database monthly subscriptions, add-on data packs, and automated contact form marketing outreach—are disclosed below. Please review these terms prior to subscribing or purchasing.",
    invoiceBadge: "Registered Qualified Invoice Issuer (Reg. No: T4013301048678)",
    stripeBadge: "Stripe Secure Payment Protection (256-bit SSL)",
    complianceBadge: "Fully Compliant with Japanese Anti-Spam & Commercial Laws",
    legalItems: [
      {
        icon: <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Distributor / Company Name",
        badge: "Entity",
        value: "TQC Corporation (TQC株式会社)"
      },
      {
        icon: <Building2 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Representative / Managing Director",
        badge: "Representative",
        value: "Van Trung Kim (キム バン チュン)"
      },
      {
        icon: <Scale className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Headquarters Address",
        badge: "Registered Office",
        value: "3F Sato Bldg, 2-33-6 Minami-Ikebukuro, Toshima-ku, Tokyo 171-0022, Japan"
      },
      {
        icon: <Receipt className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Qualified Invoice Issuer Registration Number",
        badge: "Invoice System",
        value: "T4013301048678\n※Verified on the National Tax Agency Publication Site. Qualified invoice receipts (PDF) compliant with Japanese invoice requirements are generated automatically and downloadable immediately from the Dashboard."
      },
      {
        icon: <Phone className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Telephone Number",
        badge: "Customer Desk",
        value: "+81-3-6907-1219 (03-6907-1219)\nOperating Hours: Weekdays 10:00–18:00 JST (Excluding weekends and Japanese public holidays).\n※To maintain complete records and ensure expedited support, inquiries via the online contact form or email are strongly recommended."
      },
      {
        icon: <Phone className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "FAX Number",
        badge: "Office",
        value: "+81-3-6701-2399 (03-6701-2399)"
      },
      {
        icon: <Mail className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Email Address",
        badge: "Support Inbox",
        value: "info@kigyoulist.com (24/7 reception, responses dispatched within 1 business day)"
      },
      {
        icon: <Globe className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Official Service Website",
        badge: "URL",
        value: "https://kigyoulist.com"
      },
      {
        icon: <Database className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Services Provided",
        badge: "Services",
        value: "1. 5M+ Japanese corporate database search, precision filtering, and CSV bulk downloads (Monthly subscriptions & one-off data packs).\n2. Automated contact form marketing outreach with AI anti-sales filter and Tokushoho opt-out compliance.\n3. Corporate buying intent signals (Hiring, Subsidies, Public Bids, Patents) & ABM Kanban CRM pipeline tracking.\n4. Corporate Data API integration (Enterprise Tier)."
      },
      {
        icon: <FileText className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Selling Prices",
        badge: "Tax Included (10%)",
        value: "As listed on the Pricing Page and Form Marketing Page (All prices include 10% Japanese consumption tax).\n\n【Corporate Database Monthly Subscriptions】\n・FREE Plan: ¥0 / month (Up to 20 CSV downloads/day)\n・PRO Plan: ¥2,900 / month (List: ¥4,200, 2,000 CSV rows/month)\n・BUSINESS Plan: ¥9,800 / month (List: ¥14,000, 10,000 CSV rows/month, bulk export support)\n・ENTERPRISE Plan: ¥29,000 / month (List: ¥42,000, 40,000 CSV rows/month, dedicated account manager)\n\n【CSV Quota Add-on Packs (One-off)】\n・10,000 Row Pack: ¥14,800\n・50,000 Row Pack: ¥49,800\n・100,000 Row Pack: ¥79,800\n\n【Form Marketing Outreach Packs (Pay-per-send)】\n・1,000 Forms: ¥19,600 (List: ¥28,000, ¥19.6/form)\n・3,000 Forms: ¥48,300 (List: ¥69,000, ¥16.1/form)\n・5,000 Forms: ¥69,300 (List: ¥99,000, ¥13.8/form)\n・High-volume 10,000+ outreach: Custom quotation upon request"
      },
      {
        icon: <FileText className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Additional Costs",
        badge: "Expenses",
        value: "・Internet connection fees, telecommunication carrier costs, and data packet charges (borne by the customer).\n・Bank transfer handling charges in case of wire payment (borne by the customer).\n※All displayed prices are inclusive of 10% Japanese consumption tax."
      },
      {
        icon: <CreditCard className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Payment Methods",
        badge: "Payment Channels",
        value: "・Credit Card (VISA, Mastercard, American Express, JCB)\n  ※Processed securely through Stripe with 256-bit SSL encryption. Card credentials are never stored on our servers.\n・Invoice / Bank Wire Transfer\n  ※Available exclusively for large enterprise contracts (10,000+ form dispatches or annual corporate agreements) upon prior arrangement."
      },
      {
        icon: <Clock className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Payment Timing",
        badge: "Timing",
        value: "【Monthly Subscriptions】Charged immediately upon initial sign-up, and automatically billed monthly on the recurring billing cycle date.\n【Add-on Packs & Form Outreach Packs】Billed immediately upon purchase.\n【Invoice Wire Payments】Payable by the due date stated on the invoice (typically end of following month)."
      },
      {
        icon: <FileCheck className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Service Provision Timing",
        badge: "Delivery",
        value: "【Corporate Database & Add-on Packs】Available immediately upon completion of credit card payment; account privileges and export quotas are unlocked in real time.\n【Contact Form Marketing】Following compliance screening of the submitted script and target list, dispatch initiates according to the scheduled timeframe. Detailed CSV delivery reports with corporate names and timestamps are downloadable from the dashboard upon completion."
      },
      {
        icon: <Laptop className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />,
        label: "Recommended System Environment",
        badge: "System Specs",
        value: "Kigyou-list operates as a cloud-based web SaaS application. The following environment is recommended:\n\n・OS: Windows 10/11, macOS (latest), iOS, Android\n・Supported Browsers: Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge (latest stable versions)\n・Network: High-speed broadband internet connectivity\n・JavaScript and Cookies must be enabled."
      },
      {
        icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
        label: "Returns, Refunds, and Cancellation Special Provisions",
        badge: "Important Terms",
        value: "【Returns & Refunds Policy】\nDue to the nature of digital data, cloud software, and outreach communication services, refunds, returns, or cancellations after payment completion are strictly not accepted for customer convenience.\n\n【Subscription Cancellation (Stopping Auto-Renewal)】\nSubscribers may cancel automatic renewals at any time directly through the \"Settings\" tab on the user dashboard. If cancelled prior to the next billing date, no further charges will occur. No prorated refunds are issued for mid-cycle cancellations; however, service access remains active until the end of the paid billing period.\n\n【Undeliverable Contact Forms Policy】\nIn the event that target forms cannot be delivered due to website shutdown or form structural modifications, remaining credits or quota adjustments will be processed in accordance with system delivery policies."
      },
      {
        icon: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        label: "Disclaimers and Service Warranties",
        badge: "Disclaimers",
        value: "・Our corporate database is aggregated from public government sources (National Tax Agency Corporate Number Publication Site), official registries, and company websites. While we strive to maintain high accuracy and data freshness, we do not warrant that the database will be perpetually error-free or suitable for any specific commercial purpose.\n・Appointment generation rates and sales conversions from contact form marketing vary according to script quality, value proposition, and market dynamics; therefore, specific business outcomes or revenue levels cannot be guaranteed."
      }
    ],
    pricingOverviewTitle: "Service Plans & Pricing Quick Reference Matrix",
    pricingOverviewDesc: "Current authorized pricing across all Kigyou-list products. All prices include 10% Japanese consumption tax.",
    dbPlansHeading: "1. Corporate Database Monthly Subscription Plans",
    packPlansHeading: "2. CSV Download Quota Add-on Packs (One-off)",
    formPlansHeading: "3. Contact Form Marketing Outreach Packs (Pay-per-send)",
    viewAllPricing: "View Complete Pricing Details",
    viewFormMarketing: "Learn More About Form Marketing",
    workflowTitle: "Transparent Lifecycle & Cancellation Policy",
    workflowDesc: "No long-term contracts. No lock-in or cancellation penalties. Complete autonomy.",
    steps: [
      {
        step: "01",
        title: "Secure Online Checkout",
        desc: "Select your preferred plan and check out securely via Stripe. Instant automated account activation."
      },
      {
        step: "02",
        title: "Immediate Quota Unlocked",
        desc: "CSV export quotas or form dispatch credits are provisioned instantly so you can begin outreach right away."
      },
      {
        step: "03",
        title: "Cancel Anytime in Dashboard",
        desc: "Disable auto-renewal anytime with one click in the Dashboard Settings tab without cancellation fees."
      }
    ],
    supportTitle: "Customer Support & Qualified Invoice Helpdesk",
    supportDesc: "If you have any questions regarding these statutory disclosures, service features, or qualified invoices, please reach out to our team.",
    contactBtn: "Open Contact Form",
    invoiceDocText: "※Qualified Invoice receipts (PDF) can be downloaded 24/7 directly from Dashboard > Payment History after checkout."
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
        "name": d.tokushoho,
        "item": `https://kigyoulist.com/${locale}/tokushoho`
      }
    ]
  };

  const legalPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": d.title,
    "description": isJa 
      ? "特定商取引法第11条に基づく法的表示事項の開示。TQC株式会社（登録番号: T4013301048678）。"
      : isVi 
      ? "Công bố nghĩa vụ theo Luật giao dịch thương mại đặc định Nhật Bản. Công ty TQC (T4013301048678)."
      : "Statutory disclosures under the Act on Specified Commercial Transactions for Kigyou-list. TQC Corporation.",
    "url": `https://kigyoulist.com/${locale}/tokushoho`,
    "publisher": {
      "@type": "Organization",
      "name": "TQC株式会社",
      "url": "https://kigyoulist.com",
      "telephone": "+81-3-6907-1219",
      "email": "info@kigyoulist.com",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(legalPageSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-8">
        {/* Visual Breadcrumb Navigation */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
            {d.home}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">
            {d.tokushoho}
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
                  ? "Đây là bản dịch tham khảo của trang thông tin theo Luật Giao dịch Thương mại Đặc định (特定商取引法) của Nhật Bản. Trong trường hợp có bất kỳ sự khác biệt hoặc mâu thuẫn nào về thuật ngữ pháp lý, bản tiếng Nhật gốc sẽ luôn là bản có giá trị pháp lý cao nhất và có hiệu lực thi hành."
                  : "This page is an English reference translation of the statutory Act on Specified Commercial Transactions disclosure. In the event of any discrepancies or ambiguities between this translation and the Japanese version, the Japanese original shall prevail and remain legally binding."}
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
                {d.updatedDate}
              </span>
            </div>

            {/* Title & Icon */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-500/15 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Scale className="w-6 h-6 sm:w-7 sm:h-7" />
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
                <span className="font-semibold line-clamp-1">{d.stripeBadge}</span>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-semibold line-clamp-1">{d.complianceBadge}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            MAIN DISCLOSURE SPEC TABLE (B2B Japanese 2-Column Table)
            ======================================================== */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {isJa ? "特定商取引法に基づく開示事項（法定表記一覧）" : isVi ? "Danh mục các hạng mục công bố theo luật định" : "Statutory Disclosure Table"}
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {isJa ? "通信販売についての広告（第11条）" : isVi ? "Thương mại điện tử (Điều 11)" : "Article 11 Mail Order"}
            </span>
          </div>

          <div className="divide-y divide-slate-150 dark:divide-slate-800">
            {d.legalItems.map((item, idx) => {
              const isHighlight = item.label.includes("返品") || item.label.includes("Returns") || item.label.includes("đổi trả");
              const isImportant = item.label.includes("価格") || item.label.includes("Prices") || item.label.includes("Giá bán") || item.label.includes("登録番号");

              return (
                <div 
                  key={idx} 
                  className={`flex flex-col md:flex-row transition-colors ${
                    isHighlight 
                      ? "bg-rose-50/40 dark:bg-rose-950/10" 
                      : isImportant
                      ? "bg-slate-50/30 dark:bg-slate-850/20"
                      : "hover:bg-slate-50/60 dark:hover:bg-slate-800/20"
                  }`}
                >
                  {/* Left Column: Label & Badge */}
                  <div className="md:w-72 lg:w-80 p-4 sm:p-5 sm:py-6 bg-slate-50/60 dark:bg-slate-850/40 md:border-r border-slate-150 dark:border-slate-800 flex items-start gap-3 shrink-0">
                    <span className="shrink-0 mt-0.5">{item.icon}</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300 w-fit">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Detailed Value */}
                  <div className="flex-1 p-4 sm:p-5 sm:py-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================
            QUICK PRICING OVERVIEW MATRIX (Live Match to Website Features)
            ======================================================== */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isJa ? "最新サービスラインナップ" : isVi ? "Danh mục dịch vụ thực tế" : "Current Service Lineup"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {d.pricingOverviewTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {d.pricingOverviewDesc}
            </p>
          </div>

          {/* Group 1: Database Monthly Plans */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <span>{d.dbPlansHeading}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">FREE Plan</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">¥0 <span className="text-xs font-normal text-slate-500">/ 月</span></div>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {isJa ? "1日20件のCSVダウンロード枠" : isVi ? "Tải tối đa 20 dòng CSV/ngày" : "20 CSV items / day"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider block">PRO Plan</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">¥2,900 <span className="text-xs font-normal text-slate-500">/ 月 (税込)</span></div>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {isJa ? "毎月 2,000行 CSV枠 + メール開示 + かんばんCRM" : isVi ? "2.000 dòng CSV/tháng + Email + Kanban CRM" : "2,000 rows/mo + Emails + Kanban CRM"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex flex-col justify-between gap-3 relative overflow-hidden">
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#1B4F8A] text-white text-[9px] font-extrabold uppercase">
                  {isJa ? "人気No.1" : isVi ? "Phổ biến" : "Popular"}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider block">BUSINESS Plan</span>
                  <div className="text-xl font-black text-[#1B4F8A] dark:text-blue-300 mt-1">¥9,800 <span className="text-xs font-normal text-slate-500">/ 月 (税込)</span></div>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {isJa ? "毎月 10,000行 CSV枠 + Mechanism B 大量出力" : isVi ? "10.000 dòng CSV/tháng + Mechanism B" : "10,000 rows/mo + Mechanism B bulk export"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">ENTERPRISE Plan</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">¥29,000 <span className="text-xs font-normal text-slate-500">/ 月 (税込)</span></div>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {isJa ? "毎月 40,000行 CSV枠 + API連携 + 専任サポート" : isVi ? "40.000 dòng CSV/tháng + API + Kỹ sư riêng" : "40,000 rows/mo + API Key + Dedicated manager"}
                </div>
              </div>
            </div>
          </div>

          {/* Group 2 & 3 in 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Group 2: Add-on Packs */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>{d.packPlansHeading}</span>
              </h3>
              <div className="flex flex-col gap-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">10,000 行追加パック</span>
                    <span className="text-[11px] text-slate-500">{isJa ? "必要な分だけ少量追加" : isVi ? "Mua lẻ định mức nhỏ" : "Incremental quota"}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">¥14,800 <span className="text-[10px] font-normal text-slate-500">(税込)</span></span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 block">50,000 行追加パック（約32%OFF）</span>
                    <span className="text-[11px] text-slate-500">{isJa ? "一番人気のボリューム枠" : isVi ? "Gói phổ biến nhất" : "Most popular volume tier"}</span>
                  </div>
                  <span className="text-sm font-black text-[#1B4F8A] dark:text-blue-400">¥49,800 <span className="text-[10px] font-normal text-slate-500">(税込)</span></span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">100,000 行追加パック（最安値レート）</span>
                    <span className="text-[11px] text-slate-500">{isJa ? "大量抽出向け" : isVi ? "Tối ưu chi phí nhất" : "Best rate for big exports"}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">¥79,800 <span className="text-[10px] font-normal text-slate-500">(税込)</span></span>
                </div>
              </div>
            </div>

            {/* Group 3: Form Marketing Outreach */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>{d.formPlansHeading}</span>
              </h3>
              <div className="flex flex-col gap-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">1,000 件送信プラン</span>
                    <span className="text-[11px] text-slate-500">{isJa ? "単価 19.6円/件・テスト送信に最適" : isVi ? "Đơn giá 19,6 JPY/form" : "@¥19.6/form (Starter test)"}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">¥19,600 <span className="text-[10px] font-normal text-slate-500">(税込)</span></span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 block">3,000 件送信プラン（推奨）</span>
                    <span className="text-[11px] text-slate-500">{isJa ? "単価 16.1円/件・安定アポ獲得" : isVi ? "Đơn giá 16,1 JPY/form" : "@¥16.1/form (Standard)"}</span>
                  </div>
                  <span className="text-sm font-black text-[#1B4F8A] dark:text-blue-400">¥48,300 <span className="text-[10px] font-normal text-slate-500">(税込)</span></span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">5,000 件送信プラン</span>
                    <span className="text-[11px] text-slate-500">{isJa ? "単価 13.8円/件・商談数最大化" : isVi ? "Đơn giá 13,8 JPY/form" : "@¥13.8/form (Enterprise)"}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">¥69,300 <span className="text-[10px] font-normal text-slate-500">(税込)</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links to pricing & form marketing pages */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <span>{d.viewAllPricing}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href={`/${locale}/form-marketing`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors shadow-2xs"
            >
              <span>{d.viewFormMarketing}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </section>

        {/* ========================================================
            TRANSPARENT LIFECYCLE & CANCELLATION FLOW (3-Step Cards)
            ======================================================== */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {d.workflowTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {d.workflowDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {d.steps.map((st, idx) => (
              <div 
                key={idx} 
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/80 flex flex-col gap-2.5 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-[#1B4F8A]/30 dark:text-blue-400/30 font-mono">
                    {st.step}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            SUPPORT DESK & INVOICE GUIDANCE
            ======================================================== */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>{d.supportTitle}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {d.supportDesc}
            </p>
            <div className="text-[11px] text-slate-400 mt-1">
              {d.invoiceDocText}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={`/${locale}/contact`}
              className="px-5 py-3 rounded-xl bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>{d.contactBtn}</span>
            </Link>
            <Link
              href={`/${locale}/dashboard?tab=payments`}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-blue-400" />
              <span>{isJa ? "領収書・決済履歴" : isVi ? "Lịch sử hóa đơn" : "Receipts & Invoices"}</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
