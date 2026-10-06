// @ts-nocheck -- typed-array index math; noUncheckedIndexedAccess adds noise here
import { BOX_COLOR, BOX_ALT } from "./image";

export type TMMethod = "TM_CCOEFF_NORMED" | "TM_CCORR_NORMED" | "TM_SQDIFF_NORMED";

export interface TMMatch { x: number; y: number; width: number; height: number; score: number }
export interface TMResult {
  best: TMMatch;
  matches: TMMatch[];
  processingMs: number;
  resultUrl: string;
  heatmapUrl: string;
  workScale: number;
}

function gray(canvas: HTMLCanvasElement): Float64Array {
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  const g = new Float64Array(canvas.width * canvas.height);
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  return g;
}

function scaled(img: HTMLImageElement, s: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * s));
  c.height = Math.max(1, Math.round(img.naturalHeight * s));
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/**
 * Real sliding-window template matching (same formulas as OpenCV's matchTemplate).
 * Integral images give O(1) window sums; the cross-correlation term is computed directly.
 */
export function matchTemplate(src: HTMLImageElement, tpl: HTMLImageElement, method: TMMethod, threshold: number): TMResult {
  const t0 = performance.now();
  if (tpl.naturalWidth > src.naturalWidth || tpl.naturalHeight > src.naturalHeight)
    throw new Error("Template must be smaller than the source image.");

  // Work at reduced resolution to keep it interactive in the browser.
  const s = Math.min(1, 420 / Math.max(src.naturalWidth, src.naturalHeight));
  const sc = scaled(src, s);
  const tc = scaled(tpl, s);
  const W = sc.width, H = sc.height, w = tc.width, h = tc.height;
  if (w < 3 || h < 3) throw new Error("Template is too small relative to the source.");
  const I = gray(sc), T = gray(tc);
  const n = w * h;

  let sumT = 0, sumT2 = 0;
  for (let i = 0; i < n; i++) { sumT += T[i]; sumT2 += T[i] * T[i]; }
  const meanT = sumT / n;
  const Tz = new Float64Array(n);
  let varT = 0;
  for (let i = 0; i < n; i++) { Tz[i] = T[i] - meanT; varT += Tz[i] * Tz[i]; }
  const K = method === "TM_CCOEFF_NORMED" ? Tz : T;

  // integral images
  const S = new Float64Array((W + 1) * (H + 1)), S2 = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let r = 0, r2 = 0;
    for (let x = 0; x < W; x++) {
      const v = I[y * W + x]; r += v; r2 += v * v;
      S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + r;
      S2[(y + 1) * (W + 1) + x + 1] = S2[y * (W + 1) + x + 1] + r2;
    }
  }
  const box = (A: Float64Array, x: number, y: number) =>
    A[(y + h) * (W + 1) + x + w] - A[y * (W + 1) + x + w] - A[(y + h) * (W + 1) + x] + A[y * (W + 1) + x];

  const RW = W - w + 1, RH = H - h + 1;
  const R = new Float64Array(RW * RH);
  for (let y = 0; y < RH; y++) {
    for (let x = 0; x < RW; x++) {
      let cross = 0;
      for (let ty = 0; ty < h; ty++) {
        const ro = (y + ty) * W + x, to = ty * w;
        for (let tx = 0; tx < w; tx++) cross += K[to + tx] * I[ro + tx];
      }
      const sI = box(S, x, y), sI2 = box(S2, x, y);
      let v: number;
      if (method === "TM_CCOEFF_NORMED") {
        const varI = sI2 - (sI * sI) / n;
        const d = Math.sqrt(varT * Math.max(varI, 0));
        v = d > 1e-9 ? cross / d : 0;
      } else if (method === "TM_CCORR_NORMED") {
        const d = Math.sqrt(sumT2 * sI2);
        v = d > 1e-9 ? cross / d : 0;
      } else {
        const d = Math.sqrt(sumT2 * sI2);
        const sq = sumT2 - 2 * cross + sI2;
        v = d > 1e-9 ? 1 - Math.min(1, Math.max(0, sq / d)) : 0; // convert to similarity
      }
      R[y * RW + x] = v;
    }
  }

  // best + thresholded matches with non-maximum suppression
  const cand: { x: number; y: number; v: number }[] = [];
  let bi = 0;
  for (let i = 0; i < R.length; i++) {
    if (R[i] > R[bi]) bi = i;
    if (R[i] >= threshold) cand.push({ x: i % RW, y: Math.floor(i / RW), v: R[i] });
  }
  cand.sort((a, b) => b.v - a.v);
  const kept: typeof cand = [];
  for (const c of cand) {
    if (kept.length >= 25) break;
    if (kept.every((k) => Math.abs(k.x - c.x) > w / 2 || Math.abs(k.y - c.y) > h / 2)) kept.push(c);
  }
  const toOrig = (x: number, y: number, v: number): TMMatch => ({
    x: Math.round(x / s), y: Math.round(y / s), width: tpl.naturalWidth, height: tpl.naturalHeight, score: v,
  });
  const best = toOrig(bi % RW, Math.floor(bi / RW), R[bi]);
  const matches = kept.map((k) => toOrig(k.x, k.y, k.v));

  // render result
  const out = document.createElement("canvas");
  out.width = src.naturalWidth; out.height = src.naturalHeight;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const lw = Math.max(2, Math.round(out.width / 300));
  ctx.lineWidth = lw;
  ctx.strokeStyle = BOX_ALT;
  for (const m of matches.slice(1)) ctx.strokeRect(m.x, m.y, m.width, m.height);
  ctx.strokeStyle = BOX_COLOR;
  ctx.strokeRect(best.x, best.y, best.width, best.height);
  ctx.fillStyle = BOX_COLOR;
  ctx.font = `${Math.max(12, lw * 6)}px monospace`;
  ctx.fillText(`${(best.score * 100).toFixed(1)}%`, best.x, Math.max(14, best.y - lw * 2));

  // heatmap of the response map
  const hm = document.createElement("canvas");
  hm.width = RW; hm.height = RH;
  const hctx = hm.getContext("2d")!;
  const id = hctx.createImageData(RW, RH);
  let mn = Infinity, mx = -Infinity;
  for (const v of R) { if (v < mn) mn = v; if (v > mx) mx = v; }
  for (let i = 0; i < R.length; i++) {
    const t = (R[i] - mn) / (mx - mn || 1);
    id.data[i * 4] = Math.round(255 * Math.min(1, t * 1.6));
    id.data[i * 4 + 1] = Math.round(255 * t * t);
    id.data[i * 4 + 2] = Math.round(255 * (0.35 + 0.65 * (1 - t)) * (1 - t * 0.6));
    id.data[i * 4 + 3] = 255;
  }
  hctx.putImageData(id, 0, 0);

  return {
    best, matches, workScale: s,
    processingMs: Math.round(performance.now() - t0),
    resultUrl: out.toDataURL("image/jpeg", 0.92),
    heatmapUrl: hm.toDataURL("image/png"),
  };
}
