import { type Area } from "react-easy-crop";

// why: isolate the browser-canvas crop→JPEG logic out of HeroAvatarMenu so the
// pure geometry is unit-testable and the render step is reusable (REF-01 / LOW-8).

/**
 * Pure geometry: maps a crop Area + output size to the exact numeric args fed
 * to `ctx.drawImage` plus the canvas dimensions. No DOM/canvas involved, so it
 * is unit-testable in a node env. The source rect passes straight through; the
 * destination is a square of `outSize` (no distortion math beyond passthrough).
 */
export function cropDrawParams(area: Area, outSize: number) {
  return {
    sx: area.x,
    sy: area.y,
    sw: area.width,
    sh: area.height,
    dx: 0,
    dy: 0,
    dw: outSize,
    dh: outSize,
    canvasW: outSize,
    canvasH: outSize,
  };
}

export async function renderCroppedJpeg(src: string, area: Area, outSize: number): Promise<Blob> {
  const img = await loadImage(src);
  const { sx, sy, sw, sh, dx, dy, dw, dh, canvasW, canvasH } = cropDrawParams(area, outSize);
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas ctx unavailable");
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
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
