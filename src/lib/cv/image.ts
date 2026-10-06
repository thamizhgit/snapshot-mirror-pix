export const MAX_FILE_MB = 8;
export const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/bmp"];

export function validateFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return "Unsupported format. Use JPG, PNG, WEBP or BMP.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `File too large. Max ${MAX_FILE_MB} MB.`;
  return null;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image."));
    img.src = src;
  });
}

/** Draw image into a canvas, scaled so the longest side <= maxSide. */
export function toCanvas(img: HTMLImageElement, maxSide = 1600) {
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * s);
  c.height = Math.round(img.naturalHeight * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return { canvas: c, scale: s };
}

export function cropFace(img: HTMLImageElement, box: { x: number; y: number; width: number; height: number }) {
  const c = document.createElement("canvas");
  const pad = 0.15;
  const x = Math.max(0, box.x - box.width * pad);
  const y = Math.max(0, box.y - box.height * pad);
  const w = Math.min(img.naturalWidth - x, box.width * (1 + 2 * pad));
  const h = Math.min(img.naturalHeight - y, box.height * (1 + 2 * pad));
  c.width = 160;
  c.height = Math.round((160 * h) / w);
  c.getContext("2d")!.drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.9);
}

export const BOX_COLOR = "#38d4f0";
export const BOX_ALT = "#a78bfa";
