import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getUserQuota } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
