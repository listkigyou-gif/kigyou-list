import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title =
    locale === "en"
      ? "Japan Invoice System (T-Number) Batch Verification Tool | Kigyou-list"
      : locale === "vi"
      ? "Tra cứu & Xác minh hàng loạt Mã số Hóa đơn Nhật Bản (Invoice T-Number) | Kigyou-list"
      : "インボイス登録番号（適格請求書発行事業者）一括検索・照合ツール【無料】 | Kigyou-list";

  const description =
    locale === "en"
      ? "Verify Japanese Qualified Invoice Issuer numbers (T + 13 digits) and Corporate Numbers in bulk for free. Synchronized with Japan's National Tax Agency."
      : locale === "vi"
      ? "Công cụ tra cứu và kiểm tra hàng loạt mã số đăng ký Hóa đơn hợp lệ (Invoice T-Number) từ dữ liệu Tổng cục Thuế Quốc gia Nhật Bản (NTA) hoàn toàn miễn phí."
      : "国税庁の適格請求書発行事業者公表システムと連携し、Tから始まる13桁のインボイス登録番号・法人番号・商号を無料で一括照合・CSV出力できる経理・与信管理ツールです。";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/invoice`,
      languages: {
        ja: "/ja/invoice",
        "x-default": "/ja/invoice",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/invoice`,
    },
  };
}

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
