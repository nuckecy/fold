import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  fldIamUsers,
  fldIamAccounts,
  fldIamSessions,
  fldIamVerificationTokens,
} from "@/db/schema";
import bcryptjs from "bcryptjs";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: fldIamUsers as any,
    accountsTable: fldIamAccounts as any,
    sessionsTable: fldIamSessions as any,
    verificationTokensTable: fldIamVerificationTokens as any,
  }),
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(fldIamUsers)
          .where(eq(fldIamUsers.email, email))
          .limit(1);

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordMatch = await bcryptjs.compare(password, user.passwordHash);
        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      // Fetch profileComplete on sign-in and token refresh
      if (token.id && (user || trigger === "update")) {
        const [dbUser] = await db
          .select({ profileComplete: fldIamUsers.profileComplete })
          .from(fldIamUsers)
          .where(eq(fldIamUsers.id, token.id as string))
          .limit(1);
        token.profileComplete = dbUser?.profileComplete ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      (session as any).profileComplete = token.profileComplete ?? false;
      return session;
    },
  },
});
