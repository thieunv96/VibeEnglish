import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { AuthTabs } from "./auth-tabs";
import { Sparkles, Brain, BarChart3, Zap } from "lucide-react";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: "login" | "register" }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const sp = await searchParams;

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <aside className="hidden lg:flex relative w-1/2 brand-gradient overflow-hidden">
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-40 -right-20 size-[28rem] rounded-full bg-white/5 blur-2xl" />
        <div className="absolute inset-0 dotted-bg opacity-30" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <Logo size="lg" className="text-white [&_div]:bg-white/15 [&_div]:backdrop-blur" />

          <div className="space-y-8 max-w-md">
            <div>
              <h1 className="text-4xl font-bold leading-tight">
                Tự do học,<br />tự tin nói.
              </h1>
              <p className="mt-4 text-white/85 text-lg">
                Học tiếng Anh từ video thực tế, AI chấm và điều chỉnh lộ trình theo trình độ + mục tiêu của bạn.
              </p>
            </div>

            <ul className="space-y-4">
              {[
                { icon: Sparkles, label: "Cá nhân hoá sâu theo mục tiêu" },
                { icon: Brain, label: "AI chấm & feedback tức thì" },
                { icon: BarChart3, label: "Theo dõi tiến độ rõ ràng" },
                { icon: Zap, label: "Session ngắn 5-30 phút" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-white/90">
                  <span className="size-9 rounded-lg bg-white/15 flex items-center justify-center">
                    <Icon className="size-4.5" />
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-white/60 text-xs">© Vibe English · {new Date().getFullYear()}</p>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>
          <AuthTabs defaultMode={sp.mode === "register" ? "register" : "login"} nextPath={sp.next} />
        </div>
      </main>
    </div>
  );
}
