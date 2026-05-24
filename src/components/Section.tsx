import { cn } from "@/lib/cn";

export function Section({
  children,
  className,
  alt = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  alt?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 sm:py-20",
        alt && "bg-surface",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block uppercase tracking-widest text-xs font-semibold text-brand mb-3">
      {children}
    </span>
  );
}

export function SectionHead({
  kicker,
  title,
  sub,
  align = "center",
  action,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
}) {
  if (align === "left") {
    return (
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          {kicker && <Kicker>{kicker}</Kicker>}
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{title}</h2>
          {sub && <p className="mt-2 text-muted max-w-2xl">{sub}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
  return (
    <div className="text-center mb-12">
      {kicker && <Kicker>{kicker}</Kicker>}
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{title}</h2>
      {sub && <p className="mt-3 text-muted max-w-2xl mx-auto">{sub}</p>}
    </div>
  );
}
