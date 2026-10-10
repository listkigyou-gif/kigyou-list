import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "配信停止（オプトアウト） | Kigyou-list",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OptOutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
