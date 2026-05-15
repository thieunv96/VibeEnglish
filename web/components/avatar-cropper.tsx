"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { updateAvatarAction } from "@/app/(account)/actions";
import { useRouter } from "next/navigation";

export function AvatarCropper({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const onCropComplete = useCallback((_: Area, areaPx: Area) => {
    setCroppedAreaPixels(areaPx);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5MB");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const close = () => {
    setImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setError(null);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!image || !croppedAreaPixels) return;
    setSaving(true);
    setError(null);
    try {
      const dataUri = await resizeCroppedTo64(image, croppedAreaPixels);
      const result = await updateAvatarAction({ dataUri });
      if (!result.ok) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.refresh();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi xử lý ảnh");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi ảnh đại diện</DialogTitle>
          <DialogDescription>
            Chọn ảnh, kéo để chọn vùng crop và zoom. Lưu thành 64×64.
          </DialogDescription>
        </DialogHeader>

        {!image ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-stone-300 p-12 flex flex-col items-center gap-2 text-stone-500 hover:border-brand-500 hover:bg-brand-50/30 transition"
            >
              <Upload className="size-8" />
              <span className="text-sm">Click để chọn ảnh từ máy</span>
              <span className="text-xs text-stone-400">PNG / JPEG / WebP · max 5MB</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        ) : (
          <>
            <div className="relative w-full h-64 bg-stone-900 rounded-lg overflow-hidden">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-600 flex items-center justify-between">
                <span>Zoom</span>
                <span className="text-stone-400 tabular-nums">{zoom.toFixed(1)}×</span>
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={close} disabled={saving}>
            Huỷ
          </Button>
          {image && (
            <Button variant="ghost" size="sm" onClick={() => setImage(null)}>
              Chọn ảnh khác
            </Button>
          )}
          <Button onClick={handleSave} disabled={!image || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function resizeCroppedTo64(srcDataUri: string, area: Area): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const SIZE = 64;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, SIZE, SIZE);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = srcDataUri;
  });
}
