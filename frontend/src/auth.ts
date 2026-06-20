import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { getUserQuota, verifyAndConsumeMagicLinkToken } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
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
  },
  secret: process.env.AUTH_SECRET,
});
