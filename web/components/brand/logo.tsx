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
  const dims = {
    sm: { box: "size-7", text: "text-base", slogan: "text-[10px]" },
    md: { box: "size-9", text: "text-lg", slogan: "text-[11px]" },
    lg: { box: "size-12", text: "text-2xl", slogan: "text-xs" },
  }[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("brand-gradient rounded-lg flex items-center justify-center text-white font-bold", dims.box)}>
        <span className="text-[0.65em]">VE</span>
      </div>
      {withText && (
        <div className="flex flex-col leading-tight">
          <span className={cn("font-bold tracking-tight", dims.text)}>
            Vibe <span className="text-brand-600">English</span>
          </span>
          {withSlogan && (
            <span className={cn("text-stone-400 font-normal -mt-0.5", dims.slogan)}>
              Learn freely, speak confidently
            </span>
          )}
        </div>
      )}
    </div>
  );
}
