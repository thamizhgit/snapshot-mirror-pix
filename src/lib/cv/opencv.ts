import { BOX_COLOR, BOX_ALT, cropFace } from "./image";

/* eslint-disable @typescript-eslint/no-explicit-any */
const OPENCV_URL = "https://docs.opencv.org/4.8.0/opencv.js";
const CASCADES = {
  face: "https://raw.githubusercontent.com/opencv/opencv/4.x/data/haarcascades/haarcascade_frontalface_default.xml",
  eye: "https://raw.githubusercontent.com/opencv/opencv/4.x/data/haarcascades/haarcascade_eye.xml",
};

let cvPromise: Promise<any> | null = null;

export function loadOpenCV(): Promise<any> {
  if (cvPromise) return cvPromise;
  cvPromise = new Promise((resolve, reject) => {
    const w = window as any;
    const finish = async () => {
      let cv = w.cv;
      if (cv instanceof Promise || typeof cv?.then === "function") cv = await cv;
      if (cv?.Mat) return resolve(cv);
      cv.onRuntimeInitialized = () => resolve(cv);
    };
    if (w.cv) return void finish();
    const s = document.createElement("script");
    s.src = OPENCV_URL;
    s.async = true;
    s.onload = () => void finish();
    s.onerror = () => { cvPromise = null; reject(new Error("Failed to download OpenCV.js. Check your connection.")); };
    document.body.appendChild(s);
  });
  return cvPromise;
}

const loaded = new Set<string>();
async function ensureCascade(cv: any, key: keyof typeof CASCADES) {
  const file = `${key}.xml`;
  if (loaded.has(file)) return file;
  const res = await fetch(CASCADES[key]);
  if (!res.ok) throw new Error("Could not download Haar cascade file.");
  const buf = new Uint8Array(await res.arrayBuffer());
  cv.FS_createDataFile("/", file, buf, true, false, false);
  loaded.add(file);
  return file;
}

export interface VJParams { scaleFactor: number; minNeighbors: number; minSize: number; detectEyes: boolean }
export interface VJFace { x: number; y: number; width: number; height: number; eyes: number; crop: string }
export interface VJResult { faces: VJFace[]; processingMs: number; resultUrl: string; width: number; height: number }

/** Viola-Jones detection using OpenCV's pretrained Haar cascade classifier. */
export async function detectFacesVJ(img: HTMLImageElement, p: VJParams): Promise<VJResult> {
  const cv = await loadOpenCV();
  const faceFile = await ensureCascade(cv, "face");
  const eyeFile = p.detectEyes ? await ensureCascade(cv, "eye") : null;
  const t0 = performance.now();

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const src = cv.imread(canvas);
  const grayM = new cv.Mat();
  cv.cvtColor(src, grayM, cv.COLOR_RGBA2GRAY);
  cv.equalizeHist(grayM, grayM);
  const faces = new cv.RectVector();
  const fc = new cv.CascadeClassifier();
  fc.load(faceFile);
  fc.detectMultiScale(grayM, faces, p.scaleFactor, p.minNeighbors, 0, new cv.Size(p.minSize, p.minSize), new cv.Size(0, 0));

  let ec: any = null;
  if (eyeFile) { ec = new cv.CascadeClassifier(); ec.load(eyeFile); }

  const out: VJFace[] = [];
  const lw = Math.max(2, Math.round(canvas.width / 320));
  for (let i = 0; i < faces.size(); i++) {
    const r = faces.get(i);
    let eyeCount = 0;
    ctx.lineWidth = lw;
    ctx.strokeStyle = BOX_COLOR;
    ctx.strokeRect(r.x, r.y, r.width, r.height);
    if (ec) {
      const roi = grayM.roi(r);
      const eyes = new cv.RectVector();
      ec.detectMultiScale(roi, eyes, 1.1, 5, 0, new cv.Size(Math.round(r.width / 10), Math.round(r.width / 10)), new cv.Size(0, 0));
      eyeCount = eyes.size();
      ctx.strokeStyle = BOX_ALT;
      ctx.lineWidth = Math.max(1, lw - 1);
      for (let j = 0; j < eyes.size(); j++) {
        const e = eyes.get(j);
        if (e.y > r.height * 0.6) continue;
        ctx.strokeRect(r.x + e.x, r.y + e.y, e.width, e.height);
      }
      eyes.delete(); roi.delete();
    }
    ctx.fillStyle = BOX_COLOR;
    ctx.font = `${Math.max(12, lw * 6)}px monospace`;
    ctx.fillText(`#${i + 1}`, r.x + 2, Math.max(14, r.y - lw * 2));
    out.push({ x: r.x, y: r.y, width: r.width, height: r.height, eyes: eyeCount, crop: cropFace(img, r) });
  }

  src.delete(); grayM.delete(); faces.delete(); fc.delete(); ec?.delete();
  return { faces: out, processingMs: Math.round(performance.now() - t0), resultUrl: canvas.toDataURL("image/jpeg", 0.92), width: canvas.width, height: canvas.height };
}
