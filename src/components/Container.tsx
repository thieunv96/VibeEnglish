import { cn } from "@/lib/cn";

export function Container({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  const widths = {
    narrow: "max-w-3xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
  } as const;
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6", widths[size], className)}>
      {children}
    </div>
  );
}
