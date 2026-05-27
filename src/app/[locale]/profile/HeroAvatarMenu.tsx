"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { renderCroppedJpeg } from "@/lib/avatar-crop";

interface Props {
  name: string;
  currentUrl: string | null;
  labels: {
    menuLabel: string;
    upload: string;
    remove: string;
    cropTitle: string;
    save: string;
    cancel: string;
    zoom: string;
    saved: string;
    removed: string;
    tooLarge: string;
    uploadFailed: string;
    removeFailed: string;
  };
}

export function HeroAvatarMenu({ name, currentUrl, labels }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null); // dataURL being cropped
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [pending, setPending] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  function pickFile() {
    setMenuOpen(false);
    fileInput.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error(labels.tooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  async function save() {
    if (!src || !croppedArea) return;
    setPending(true);
    try {
      const blob = await renderCroppedJpeg(src, croppedArea, 256);
      const fd = new FormData();
      fd.append("avatar", blob, "avatar.jpg");
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? labels.uploadFailed);
        return;
      }
      toast.success(labels.saved);
      setSrc(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setMenuOpen(false);
    setPending(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) {
        toast.success(labels.removed);
        router.refresh();
      } else {
        toast.error(labels.removeFailed);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block" data-testid="hero-avatar-menu">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={labels.menuLabel}
        data-testid="hero-avatar-trigger"
        className="group relative rounded-full ring-offset-2 ring-offset-background hover:ring-2 hover:ring-brand transition-shadow"
      >
        <Avatar name={name} src={currentUrl ?? undefined} size={96} className="shadow-sm" />
        {/* Camera badge to hint clickability */}
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-brand text-white border-2 border-white shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          data-testid="hero-avatar-panel"
          className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-xl border border-border bg-white shadow-lg overflow-hidden z-20"
        >
          <ul className="py-1 text-sm">
            <li>
              <button
                type="button"
                onClick={pickFile}
                disabled={pending}
                data-testid="hero-avatar-upload"
                role="menuitem"
                className="w-full text-left block px-4 py-2 hover:bg-surface text-foreground disabled:opacity-50"
              >
                {labels.upload}
              </button>
            </li>
            {currentUrl && (
              <li>
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  data-testid="hero-avatar-remove"
                  role="menuitem"
                  className="w-full text-left block px-4 py-2 hover:bg-surface text-red-600 font-medium disabled:opacity-50"
                >
                  {labels.remove}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
        data-testid="hero-avatar-file"
      />

      {src && (
        <div
          role="dialog"
          aria-modal
          aria-label={labels.cropTitle}
          data-testid="hero-avatar-crop-modal"
          className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4 space-y-3">
            <h3 className="font-semibold">{labels.cropTitle}</h3>
            <div className="relative h-72 bg-surface rounded-md overflow-hidden">
              <Cropper
                image={src}
                aspect={1}
                cropShape="round"
                crop={crop}
                zoom={zoom}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid={false}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted w-12">{labels.zoom}</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-emerald-600"
                data-testid="hero-avatar-zoom"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSrc(null)}
                className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold"
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                data-testid="hero-avatar-save"
                className="rounded-md bg-brand hover:bg-brand-strong text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {pending ? "…" : labels.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
