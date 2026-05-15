"use server";

import { z } from "zod";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, userProgress } from "@/db/schema";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const CURRENT_YEAR = new Date().getFullYear();

const registerSchema = z
  .object({
    firstName: z.string().min(1, "first_name").max(50),
    lastName: z.string().min(1, "last_name").max(50),
    email: z.string().email("invalid_email"),
    yearOfBirth: z
      .coerce.number()
      .int()
      .min(1900, "invalid_year")
      .max(CURRENT_YEAR - 5, "invalid_year"),
    gender: z.enum(["male", "female", "other"]),
    password: z.string().min(6, "password_short"),
    confirmPassword: z.string(),
    captchaQuestion: z.string(),
    captchaAnswer: z.string().min(1, "captcha_required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "password_mismatch",
  })
  .refine(
    (d) => {
      // captchaQuestion format: "a+b" — verify captchaAnswer matches sum
      const m = d.captchaQuestion.match(/^(\d{1,2})\+(\d{1,2})$/);
      if (!m) return false;
      const expected = parseInt(m[1], 10) + parseInt(m[2], 10);
      return parseInt(d.captchaAnswer.trim(), 10) === expected;
    },
    { path: ["captchaAnswer"], message: "captcha_wrong" }
  );

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    yearOfBirth: formData.get("yearOfBirth"),
    gender: formData.get("gender"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    captchaQuestion: formData.get("captchaQuestion"),
    captchaAnswer: formData.get("captchaAnswer"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: first.path[0] as string };
  }
  const { firstName, lastName, email, yearOfBirth, gender, password } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "email_used", field: "email" };
  }

  const id = crypto.randomUUID();
  const passwordHash = await argon2.hash(password);
  const isAdmin = email === process.env.ADMIN_EMAIL;

  await db.insert(users).values({
    id,
    email,
    name: `${firstName} ${lastName}`.trim(),
    yearOfBirth,
    gender,
    passwordHash,
    role: isAdmin ? "admin" : "user",
  });
  await db.insert(userProgress).values({ userId: id }).onDuplicateKeyUpdate({ set: { userId: id } });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "login_after_register_failed" };
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
    return { ok: false, error: "bad_format" };
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
        return { ok: false, error: "bad_credentials" };
      }
      return { ok: false, error: "auth_error" };
    }
    throw e;
  }
}
