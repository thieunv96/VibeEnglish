"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";

interface Props {
  name: string;
  currentUrl: string | null;
  labels: {
    upload: string;
    remove: string;
    cropTitle: string;
    save: string;
    cancel: string;
    zoom: string;
    saved: string;
    removed: string;
    tooLarge: string;
  };
}

export function AvatarUploader({ name, currentUrl, labels }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);          // dataURL being cropped
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [pending, setPending] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  function pickFile() {
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
        toast.error(data?.error ?? "Upload failed");
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
    setPending(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) {
        toast.success(labels.removed);
        router.refresh();
      } else {
        toast.error("Remove failed");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-4" data-testid="avatar-uploader">
      <Avatar name={name} src={currentUrl ?? undefined} size={64} />
      <div className="flex flex-col gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFile}
          data-testid="avatar-file"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={pickFile}
            disabled={pending}
            data-testid="avatar-upload-btn"
            className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold text-sm px-3 py-1.5 disabled:opacity-50"
          >
            {labels.upload}
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              data-testid="avatar-remove-btn"
              className="rounded-md border border-border bg-white hover:bg-surface text-sm font-semibold px-3 py-1.5 disabled:opacity-50"
            >
              {labels.remove}
            </button>
          )}
        </div>
      </div>

      {src && (
        <div
          role="dialog"
          aria-modal
          aria-label={labels.cropTitle}
          data-testid="avatar-crop-modal"
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
                data-testid="avatar-zoom"
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
                data-testid="avatar-save-btn"
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

async function renderCroppedJpeg(src: string, area: Area, outSize: number): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas ctx unavailable");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outSize, outSize);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
