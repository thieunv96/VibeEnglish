import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

interface Props {
  withTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

const dim = { sm: 28, md: 36, lg: 56 } as const;
const text = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
} as const;

export async function Logo({ withTagline = false, size = "md" }: Props) {
  const d = dim[size];
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
      <Image
        src="/brand/logo.png"
        alt="VibeEnglish"
        width={d}
        height={d}
        priority
        className="rounded-lg"
      />
      <span className="flex flex-col leading-tight">
        <span className={`font-bold tracking-tight text-foreground ${text[size]}`}>
          VibeEnglish
        </span>
        {tagline && (
          <span className="text-xs font-medium text-muted">{tagline}</span>
        )}
      </span>
    </Link>
  );
}
