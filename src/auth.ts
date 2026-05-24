import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Minimum password length is intentionally low — the admin account uses a short
// dev-only password. Production users should pick longer ones.
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = (user as { id?: string }).id;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      // Refresh isAdmin from DB on session-update events (so promoting a user
      // in the DB takes effect on next sign-in or update).
      if (trigger === "update" && token.uid) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.uid as string },
          select: { isAdmin: true },
        });
        if (fresh) token.isAdmin = fresh.isAdmin;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.uid && session.user) {
        const u = session.user as { id?: string; isAdmin?: boolean };
        u.id = token.uid as string;
        u.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});
