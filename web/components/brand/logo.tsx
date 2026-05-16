"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  withText = true,
  withSlogan = false,
  size = "md",
}: {
  className?: string;
  withText?: boolean;
  withSlogan?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const t = useTranslations("common");
  const dims = {
    sm: { box: 28, text: "text-base", slogan: "text-[10px]" },
    md: { box: 36, text: "text-lg", slogan: "text-[11px]" },
    lg: { box: 48, text: "text-2xl", slogan: "text-xs" },
  }[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="Vibe English"
        width={dims.box}
        height={dims.box}
        priority
        className="shrink-0 rounded-lg"
        style={{ width: dims.box, height: dims.box }}
      />
      {withText && (
        <div className="flex flex-col leading-tight">
          <span className={cn("font-bold tracking-tight", dims.text)}>
            Vibe <span className="text-brand-600">English</span>
          </span>
          {withSlogan && (
            <span className={cn("text-stone-400 font-normal -mt-0.5", dims.slogan)}>
              {t("tagline")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
