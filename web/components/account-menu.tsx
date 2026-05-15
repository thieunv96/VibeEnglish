"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { AvatarCropper } from "@/components/avatar-cropper";
import { setLocaleAction } from "@/app/(account)/actions";
import { Camera, Globe, LogOut, Settings, Check } from "lucide-react";
import { initials } from "@/lib/utils";

type Props = {
  name: string | null | undefined;
  email: string;
  avatarSrc: string | null;
  locale: "vi" | "en";
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
};

export function AccountMenu({ name, email, avatarSrc, locale, isAdmin, signOutAction }: Props) {
  const t = useTranslations("account");
  const [cropOpen, setCropOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onLocale = (l: "vi" | "en") => {
    startTransition(async () => {
      await setLocaleAction(l);
      router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title={t("trigger")}
          >
            <Avatar className="size-9">
              {avatarSrc && <AvatarImage src={avatarSrc} />}
              <AvatarFallback>{initials(name || email)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuLabel>
            <div className="font-semibold text-sm text-stone-900 truncate">{name || email}</div>
            <div className="text-[11px] text-stone-500 truncate font-normal">{email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCropOpen(true)}>
            <Camera /> {t("changeAvatar")}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Globe /> {t("language")}
              <span className="ml-auto text-xs text-stone-400">
                {locale === "vi" ? t("viLabel") : t("enLabel")}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => onLocale("vi")} disabled={pending}>
                {locale === "vi" && <Check />} {t("viLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onLocale("en")} disabled={pending}>
                {locale === "en" && <Check />} {t("enLabel")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {!isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> {t("settings")}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => startTransition(async () => { await signOutAction(); })}
            className="text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <LogOut /> {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AvatarCropper open={cropOpen} onOpenChange={setCropOpen} />
    </>
  );
}
