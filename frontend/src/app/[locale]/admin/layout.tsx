import type { Metadata } from "next";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { isAdminEmail } from "@/lib/adminAuth";

export const metadata: Metadata = {
  title: "Admin Panel | Kigyou-list",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  const isUserAdmin = Boolean(
    user?.email && isAdminEmail(user.email)
  );

  // Enterprise Stealth Mode (Stripe / GitHub / Shopify Standard):
  // If the requester is unauthenticated or not an authorized platform administrator,
  // immediately return 404 Not Found at the Server Level before any admin bundle is delivered.
  // To unauthorized users, crawlers, and scanners, this administrative endpoint does not exist.
  if (!isUserAdmin) {
    notFound();
  }

  return <>{children}</>;
}
