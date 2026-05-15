import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authConfig } from "./auth.config";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;
        const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
        const user = rows[0];
        if (!user?.passwordHash) return null;
        const ok = await argon2.verify(user.passwordHash, parsed.data.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    async signIn({ user, account }) {
      // For OAuth sign-ins, ensure a user row exists with our schema (id-based).
      if (account?.provider === "google" && user.email) {
        const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
        if (existing.length === 0) {
          const id = crypto.randomUUID();
          const isAdmin = user.email === process.env.ADMIN_EMAIL;
          await db.insert(users).values({
            id,
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            role: isAdmin ? "admin" : "user",
          });
          user.id = id;
        } else {
          user.id = existing[0].id;
        }
      }
    },
  },
});

declare module "next-auth" {
  interface User {
    role?: "user" | "admin";
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "user" | "admin";
    };
  }
}

