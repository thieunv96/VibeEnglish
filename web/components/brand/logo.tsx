import { cn } from "@/lib/utils";

export function Logo({ className, withText = true, size = "md" }: {
  className?: string;
  withText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: { box: "size-7", text: "text-base" },
    md: { box: "size-9", text: "text-lg" },
    lg: { box: "size-12", text: "text-2xl" },
  }[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("brand-gradient rounded-lg flex items-center justify-center text-white font-bold", dims.box)}>
        <span className="text-[0.65em]">VE</span>
      </div>
      {withText && (
        <span className={cn("font-bold tracking-tight", dims.text)}>
          Vibe <span className="text-brand-600">English</span>
        </span>
      )}
    </div>
  );
}
