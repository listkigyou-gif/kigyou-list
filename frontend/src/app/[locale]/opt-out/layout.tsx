import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Opt-Out & Suppression Management | Kigyou-list",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function OptOutLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
