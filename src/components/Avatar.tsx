import { initialsOf, avatarColor } from "@/lib/avatar";
import { cn } from "@/lib/cn";

interface Props {
  name: string;            // user.name or user.email
  src?: string | null;     // avatar URL
  size?: number;           // px
  className?: string;
  alt?: string;
}

export function Avatar({ name, src, size = 36, className, alt }: Props) {
  const dim = { width: size, height: size, minWidth: size, minHeight: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt ?? name}
        style={dim}
        className={cn("rounded-full object-cover bg-surface border border-border", className)}
        data-testid="avatar-img"
      />
    );
  }
  const initials = initialsOf(name);
  return (
    <span
      role="img"
      aria-label={alt ?? name}
      data-testid="avatar-initials"
      style={{
        ...dim,
        backgroundColor: avatarColor(name),
        fontSize: Math.round(size * 0.42),
      }}
      className={cn(
        "grid place-items-center rounded-full text-white font-bold select-none",
        className,
      )}
    >
      {initials}
    </span>
  );
}
