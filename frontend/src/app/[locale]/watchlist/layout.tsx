import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale = "ja" } = await params;
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const title = isVi
    ? "Giám sát Doanh nghiệp & Cảnh báo Biến động Tín dụng 24/7 | Kigyou-list"
    : locale === "en"
    ? "Corporate Watchlist & Real-Time Credit Risk Alerts | Kigyou-list"
    : "【2026年最新】企業監視・取引先与信アラート（倒産・インボイス失効・代表変更を自動検知） | Kigyou-list";

  const description = isVi
    ? "Tự động theo dõi và nhận cảnh báo sớm khi đối tác tại Nhật Bản có biến động: hủy mã Invoice, chuyển trụ sở, đổi giám đốc hoặc nguy cơ phá sản. Miễn phí giám sát 10 công ty."
    : locale === "en"
    ? "Automatically monitor Japanese business partners for invoice revocation, HQ relocation, executive changes, and bankruptcy signals. Free monitoring for up to 10 companies."
    : "取引先・競合企業の重要変動（倒産・破産・解散公告、適格請求書インボイス登録失効、本社移転、代表者変更、行政処分）を24時間自動モニタリングしメールで即時通知。最大10社まで永久無料で監視可能。";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/watchlist`,
      languages: {
        ja: "/ja/watchlist",
        "x-default": "/ja/watchlist",
      },
    },
    robots: {
      index: isJa,
      follow: isJa,
      googleBot: { index: isJa, follow: isJa },
    },
  };
}

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
