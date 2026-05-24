import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

interface Props {
  withTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "h-7 w-7 text-xs", text: "text-base" },
  md: { box: "h-9 w-9 text-sm", text: "text-lg" },
  lg: { box: "h-12 w-12 text-base", text: "text-2xl" },
} as const;

export async function Logo({ withTagline = false, size = "md" }: Props) {
  const dims = sizes[size];
  let tagline: string | null = null;
  if (withTagline) {
    const t = await getTranslations("brand");
    tagline = t("tagline");
  }
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 group"
      data-testid="logo"
    >
      <span
        className={cn(
          "grid place-items-center rounded-lg bg-brand text-white font-extrabold tracking-tight shadow-sm group-hover:bg-brand-strong transition-colors",
          dims.box,
        )}
        aria-hidden
      >
        VE
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn("font-bold tracking-tight text-foreground", dims.text)}>
          VibeEnglish
        </span>
        {tagline && (
          <span className="text-xs font-medium text-muted">{tagline}</span>
        )}
      </span>
    </Link>
  );
}
