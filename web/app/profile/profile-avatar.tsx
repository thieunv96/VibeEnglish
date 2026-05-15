"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AvatarCropper } from "@/components/avatar-cropper";
import { deleteAvatarAction } from "@/app/(account)/actions";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { initials } from "@/lib/utils";

export function ProfileAvatar({
  name,
  email,
  avatarSrc,
}: {
  name: string | null;
  email: string;
  avatarSrc: string | null;
}) {
  const [cropOpen, setCropOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = () => {
    if (!confirm("Bạn chắc chắn muốn xoá ảnh đại diện?")) return;
    startTransition(async () => {
      const r = await deleteAvatarAction();
      if (r.ok) router.refresh();
      else alert("Xoá ảnh thất bại: " + (r.error ?? "unknown"));
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative size-24 rounded-full ring-4 ring-white/30 hover:ring-white/50 transition focus-visible:outline-none focus-visible:ring-white"
            title="Cập nhật ảnh đại diện"
          >
            <Avatar className="size-24">
              {avatarSrc && <AvatarImage src={avatarSrc} />}
              <AvatarFallback className="text-2xl">{initials(name || email)}</AvatarFallback>
            </Avatar>
            <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent rounded-b-full flex items-end justify-center pb-2 opacity-0 hover:opacity-100 transition pointer-events-none">
              <Camera className="size-4 text-white" />
            </span>
            {pending && (
              <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <Loader2 className="size-5 text-white animate-spin" />
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="min-w-44">
          <DropdownMenuItem onSelect={() => setCropOpen(true)}>
            <Camera /> {avatarSrc ? "Đổi ảnh" : "Tải lên ảnh mới"}
          </DropdownMenuItem>
          {avatarSrc && (
            <DropdownMenuItem onSelect={onDelete} className="text-red-600 focus:bg-red-50 focus:text-red-700">
              <Trash2 /> Xoá ảnh
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AvatarCropper open={cropOpen} onOpenChange={setCropOpen} />
    </>
  );
}
