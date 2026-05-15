"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/icons/google";
import { GithubIcon } from "@/components/icons/github";
import { loginAction, registerAction } from "./actions";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function AuthTabs({
  defaultMode,
  nextPath,
}: {
  defaultMode: "login" | "register";
  nextPath?: string;
}) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = mode === "login" ? await loginAction(formData) : await registerAction(formData);
      if (result.ok) {
        setSuccess(true);
        const dest = mode === "register" ? "/onboarding" : nextPath || "/";
        router.replace(dest);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold">
          {mode === "login" ? "Chào mừng trở lại 👋" : "Bắt đầu hành trình"}
        </h2>
        <p className="text-sm text-stone-500">
          {mode === "login"
            ? "Đăng nhập để tiếp tục lộ trình học của bạn."
            : "Tạo tài khoản miễn phí trong 30 giây."}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-medium">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "h-9 rounded-lg transition",
              mode === m ? "bg-white shadow-sm text-brand-700" : "text-stone-500 hover:text-stone-900"
            )}
          >
            {m === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        ))}
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => signIn("google", { callbackUrl: nextPath || "/" })}
        >
          <GoogleIcon className="size-4" /> Google
        </Button>
        <Button type="button" variant="outline" disabled title="GitHub OAuth sẽ bật ở pha sau">
          <GithubIcon className="size-4" /> GitHub
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-stone-400">
            hoặc {mode === "login" ? "đăng nhập" : "đăng ký"} bằng email
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Họ</Label>
              <Input id="firstName" name="firstName" required placeholder="Nguyễn" autoComplete="given-name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Tên</Label>
              <Input id="lastName" name="lastName" required placeholder="Minh" autoComplete="family-name" />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="ban@email.com" autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Mật khẩu</Label>
            {mode === "login" && (
              <button type="button" className="text-xs text-brand-600 hover:underline">
                Quên mật khẩu?
              </button>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 6 : 1}
            placeholder={mode === "register" ? "Tối thiểu 6 ký tự" : "Mật khẩu của bạn"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            Thành công! Đang chuyển trang...
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin size-4" />}
          {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </Button>
      </form>

      <p className="text-center text-xs text-stone-400">
        Bằng việc {mode === "login" ? "đăng nhập" : "đăng ký"}, bạn đồng ý với Điều khoản & Chính sách của Vibe English.
      </p>
    </div>
  );
}
