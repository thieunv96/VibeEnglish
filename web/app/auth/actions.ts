"use server";

import { z } from "zod";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, userProgress } from "@/db/schema";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const registerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: first.path[0] as string };
  }
  const { firstName, lastName, email, password } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "Email đã được sử dụng", field: "email" };
  }

  const id = crypto.randomUUID();
  const passwordHash = await argon2.hash(password);
  const isAdmin = email === process.env.ADMIN_EMAIL;

  await db.insert(users).values({
    id,
    email,
    name: `${firstName} ${lastName}`.trim(),
    passwordHash,
    role: isAdmin ? "admin" : "user",
  });
  await db.insert(userProgress).values({ userId: id }).onDuplicateKeyUpdate({ set: { userId: id } });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "Đăng nhập thất bại sau khi đăng ký" };
    throw e;
  }
  return { ok: true };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Email hoặc mật khẩu không hợp lệ" };
  }
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin") {
        return { ok: false, error: "Email hoặc mật khẩu không đúng" };
      }
      return { ok: false, error: "Lỗi đăng nhập" };
    }
    throw e;
  }
}
