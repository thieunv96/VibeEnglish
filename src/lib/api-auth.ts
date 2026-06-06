import { NextResponse } from "next/server";
import { auth } from "@/auth";

export interface SessionUserInfo {
  id: string;
  isAdmin: boolean;
  email: string | null;
}

async function currentUser(): Promise<SessionUserInfo | null> {
  const session = await auth();
  const u = session?.user as
    | { id?: string; isAdmin?: boolean; email?: string | null }
    | undefined;
  if (!u?.id) return null;
  return {
    id: u.id,
    isAdmin: Boolean(u.isAdmin),
    email: u.email ?? null,
  };
}

/** Require an admin. Returns { userId } or { error } for the route handler. */
export async function requireAdmin(): Promise<
  { userId: string; user: SessionUserInfo } | { error: NextResponse }
> {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!user.isAdmin) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { userId: user.id, user };
}

/** Require a learner (signed-in non-admin). */
export async function requireLearner(): Promise<
  { userId: string; user: SessionUserInfo } | { error: NextResponse }
> {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (user.isAdmin) {
    return {
      error: NextResponse.json(
        { error: "admins do not record learner activity" },
        { status: 403 },
      ),
    };
  }
  return { userId: user.id, user };
}

/** Require any signed-in user (admin OR learner). Used by surfaces that
 * admins should be able to demo — e.g. the sample test and CEFR placement. */
export async function requireUser(): Promise<
  { userId: string; user: SessionUserInfo } | { error: NextResponse }
> {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  return { userId: user.id, user };
}
