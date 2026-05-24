"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Avatar } from "./Avatar";
import { Link } from "@/i18n/navigation";

type MenuHref =
  | "/profile"
  | "/vocab"
  | "/history"
  | "/admin"
  | "/admin/lessons"
  | "/admin/exercises"
  | "/admin/analytics";

export interface AvatarMenuItem {
  href: MenuHref;
  label: string;
  testId: string;
}

interface Props {
  name: string;
  email: string;
  avatarUrl?: string | null;
  items: AvatarMenuItem[];
  signOutLabel: string;
}

export function AvatarMenu({ name, email, avatarUrl, items, signOutLabel }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative" data-testid="avatar-menu">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="avatar-menu-trigger"
        className="rounded-full ring-offset-2 ring-offset-background hover:ring-2 hover:ring-brand transition-shadow"
      >
        <Avatar name={name} src={avatarUrl ?? undefined} size={36} />
      </button>

      {open && (
        <div
          role="menu"
          data-testid="avatar-menu-panel"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-white shadow-lg overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-xs text-muted truncate">{email}</div>
          </div>
          <ul className="py-1 text-sm">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setOpen(false)}
                  data-testid={it.testId}
                  className="block px-4 py-2 hover:bg-surface text-foreground"
                  role="menuitem"
                >
                  {it.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
                data-testid="avatar-menu-signout"
                className="w-full text-left block px-4 py-2 hover:bg-surface text-red-600 font-medium"
                role="menuitem"
              >
                {signOutLabel}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
