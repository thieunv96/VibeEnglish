import type { NextAuthConfig } from "next-auth";

// Edge-safe config — used by middleware. No DB/argon2 calls here.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth",
  },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const publicPaths = ["/auth", "/_next", "/favicon", "/api/auth"];
      if (publicPaths.some((p) => path.startsWith(p))) return true;

      const isLoggedIn = !!auth?.user;
      if (!isLoggedIn) {
        const url = new URL("/auth", nextUrl.origin);
        url.searchParams.set("next", path + nextUrl.search);
        return Response.redirect(url);
      }

      const role = auth?.user?.role;
      // Admin role is management-only — block all learner routes and redirect to /admin
      const learnerPrefixes = ["/onboarding", "/lessons", "/profile", "/settings", "/feedback", "/help"];
      const isLearnerPath = path === "/" || learnerPrefixes.some((p) => path.startsWith(p));
      if (role === "admin" && isLearnerPath) {
        return Response.redirect(new URL("/admin", nextUrl.origin));
      }
      // Non-admin trying to access /admin/* — bounce to home
      if (role !== "admin" && path.startsWith("/admin")) {
        return Response.redirect(new URL("/", nextUrl.origin));
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
