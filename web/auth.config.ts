import type { NextAuthConfig } from "next-auth";

// Edge-safe config — used by middleware. No DB/argon2 calls here.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth",
  },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const publicPaths = ["/auth", "/_next", "/favicon", "/api/auth"];
      if (publicPaths.some((p) => path.startsWith(p))) return true;

      // Everything else requires auth
      if (!isLoggedIn) {
        const url = new URL("/auth", nextUrl.origin);
        url.searchParams.set("next", path + nextUrl.search);
        return Response.redirect(url);
      }
      return true;
    },
    session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      if (token?.role) session.user.role = token.role as "user" | "admin";
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: "user" | "admin" }).role ?? "user";
      }
      return token;
    },
  },
  session: { strategy: "jwt" },
  providers: [], // populated in auth.ts (Node runtime)
};
