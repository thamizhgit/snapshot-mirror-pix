import { BOX_COLOR, cropFace } from "./image";

/* eslint-disable @typescript-eslint/no-explicit-any */
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
let ready: Promise<any> | null = null;

/** Lazily import face-api (TensorFlow.js) and download pretrained weights. */
export function loadFaceApi(): Promise<any> {
  if (ready) return ready;
  ready = (async () => {
    const faceapi: any = await import("@vladmandic/face-api");
    await faceapi.tf.ready();
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    return faceapi;
  })().catch((e) => { ready = null; throw new Error("Could not load face models: " + (e?.message ?? e)); });
  return ready;
}

export interface FaceAnalysis {
  age: number;
  gender: string;
  genderProbability: number;
  dominantEmotion: string;
  emotions: { label: string; value: number }[];
  detectionScore: number;
  box: { x: number; y: number; width: number; height: number };
  crop: string;
}

export async function analyzeFaces(img: HTMLImageElement) {
  const faceapi = await loadFaceApi();
  const t0 = performance.now();
  const dets = await faceapi
    .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks().withFaceExpressions().withAgeAndGender();
  const ms = Math.round(performance.now() - t0);
  if (!dets.length) throw new Error("No face detected. Try a clearer, front-facing photo.");

  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const lw = Math.max(2, Math.round(c.width / 320));
  const faces: FaceAnalysis[] = dets.map((d: any, i: number) => {
    const b = d.detection.box;
    ctx.lineWidth = lw; ctx.strokeStyle = BOX_COLOR; ctx.strokeRect(b.x, b.y, b.width, b.height);
    ctx.fillStyle = BOX_COLOR; ctx.font = `${Math.max(12, lw * 6)}px monospace`;
    ctx.fillText(`#${i + 1}`, b.x + 2, Math.max(14, b.y - lw * 2));
    const emotions = Object.entries(d.expressions as Record<string, number>)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    const box = { x: b.x, y: b.y, width: b.width, height: b.height };
    return {
      age: d.age, gender: d.gender, genderProbability: d.genderProbability,
      dominantEmotion: emotions[0].label, emotions, detectionScore: d.detection.score, box,
      crop: cropFace(img, box),
    };
  });
  return { faces, processingMs: ms, resultUrl: c.toDataURL("image/jpeg", 0.92) };
}

export interface Embedding { vector: Float32Array; crop: string; score: number }

/** 128-D face embedding (ResNet-34 trained with metric learning, FaceNet-style). */
export async function embedFace(img: HTMLImageElement): Promise<Embedding> {
  const faceapi = await loadFaceApi();
  const d = await faceapi
    .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks().withFaceDescriptor();
  if (!d) throw new Error("No face detected in one of the images.");
  const b = d.detection.box;
  return { vector: d.descriptor, crop: cropFace(img, b), score: d.detection.score };
}

export function compareEmbeddings(a: Float32Array, b: Float32Array) {
  let sq = 0, dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    sq += (a[i] - b[i]) ** 2; dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  return { euclidean: Math.sqrt(sq), cosine: dot / (Math.sqrt(na) * Math.sqrt(nb)) };
}

/** Standard threshold for this model's L2 distance. */
export const VERIFY_THRESHOLD = 0.6;
