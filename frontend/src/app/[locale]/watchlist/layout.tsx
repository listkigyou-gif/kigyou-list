import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watchlist | Kigyou-list",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
