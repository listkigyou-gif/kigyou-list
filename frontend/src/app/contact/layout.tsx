import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ | Kigyou-list",
  description: "Kigyou-listに関するお問い合わせ窓口です。サービスのご利用方法、料金プランに関するご相談、企業データの掲載依頼や修正依頼、その他ご不明な点がございましたらお気軽にお問い合わせください。",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
