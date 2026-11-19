import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opt-Out & Suppression Management | Kigyou-list",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function OptOutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
