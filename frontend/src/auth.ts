import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { getUserQuota, verifyAndConsumeMagicLinkToken, updateUserLoginIp } from "@/lib/db";
import { headers } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: "magiclink",
      name: "MagicLink",
      credentials: {
        email: { label: "Email", type: "text" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.token) {
          return null;
        }
        const email = credentials.email as string;
        const token = credentials.token as string;
        
        const isValid = await verifyAndConsumeMagicLinkToken(email, token);
        if (isValid) {
          return { email, name: email.split("@")[0] };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        // Automatically check/create user quota in database on sign in
        try {
          await getUserQuota(user.email);
          try {
            const reqHeaders = await headers();
            const ip = reqHeaders.get("cf-connecting-ip") || reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() || reqHeaders.get("x-real-ip") || "127.0.0.1";
            await updateUserLoginIp(user.email, ip);
          } catch {}
        } catch (error) {
          console.error("Error in signIn callback (getUserQuota):", error);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const isDev = process.env.NODE_ENV === "development";
      const publicBase = isDev ? "http://localhost:3000" : "https://kigyoulist.com";
      if (url.startsWith("/")) {
        return `${publicBase}${url}`;
      }
      try {
        const parsed = new URL(url);
        if (!isDev && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) {
          return `${publicBase}${parsed.pathname}${parsed.search}`;
        }
        if (parsed.origin === publicBase || parsed.origin === baseUrl) {
          return url;
        }
      } catch {}
      return publicBase;
    },
  },
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 365 days in seconds
  },
  secret: process.env.AUTH_SECRET,
});
