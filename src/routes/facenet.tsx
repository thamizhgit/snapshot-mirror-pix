import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SectionTitle, Panel, DropZone, RunButton, ErrorBox, EmptyResult, Metric, Formula } from "@/components/lab/ui";
import { loadImage } from "@/lib/cv/image";
import { embedFace, compareEmbeddings, VERIFY_THRESHOLD } from "@/lib/cv/faceapi";

export const Route = createFileRoute("/facenet")({
  head: () => ({ meta: [
    { title: "FaceNet Face Verification Lab — VISIONLAB" },
    { name: "description", content: "Compare two faces using 128-D embeddings and Euclidean distance." },
    { property: "og:title", content: "FaceNet Face Verification Lab — VISIONLAB" },
    { property: "og:description", content: "Face verification by embedding distance, live in the browser." },
  ] }),
  component: Page,
});

type R = { a: string; b: string; euclidean: number; cosine: number; ms: number; vec: number[] };

function Page() {
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<R | null>(null);
  const run = async () => {
    if (!a || !b) return;
    setLoading(true); setErr(null); setRes(null);
    try {
      const t0 = performance.now();
      const [ea, eb] = [await embedFace(await loadImage(a)), await embedFace(await loadImage(b))];
      const c = compareEmbeddings(ea.vector, eb.vector);
      setRes({ a: ea.crop, b: eb.crop, ...c, ms: Math.round(performance.now() - t0), vec: Array.from(ea.vector.slice(0, 8)) });
    } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  };
  const same = res && res.euclidean < VERIFY_THRESHOLD;
  const sim = res ? Math.max(0, 1 - res.euclidean / (2 * VERIFY_THRESHOLD)) : 0;
  return (
    <div>
      <PageHeader eyebrow="Face Recognition" title="FaceNet" desc="FaceNet maps a face to a compact embedding so that distances directly measure identity similarity. This demo uses a 128-D ResNet embedding model trained with metric learning (FaceNet-style) and the standard 0.6 L2 threshold." />
      <SectionTitle n="01">Live demo</SectionTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-5">
          <DropZone label="Image A" value={a} onChange={(u) => { setA(u); setRes(null); }} />
          <DropZone label="Image B" value={b} onChange={(u) => { setB(u); setRes(null); }} />
          <RunButton onClick={run} loading={loading} disabled={!a || !b} loadingText="Generating embeddings…">Compare Faces</RunButton>
          {err && <ErrorBox msg={err} />}
        </Panel>
        <Panel className="space-y-4">
          <p className="text-sm font-medium">Result</p>
          {!res ? <EmptyResult text="Upload two face images and press Compare Faces." /> : (
            <div className="fade-up space-y-4">
              <div className="flex items-center justify-center gap-4"><img src={res.a} alt="Face A" className="h-24 w-24 rounded object-cover" /><span className="font-mono text-primary">↔</span><img src={res.b} alt="Face B" className="h-24 w-24 rounded object-cover" /></div>
              <div className={`rounded-md border px-3 py-2 text-center font-medium ${same ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>{same ? "✓ SAME PERSON" : "✕ DIFFERENT PEOPLE"}</div>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Similarity" value={`${(sim * 100).toFixed(1)}%`} accent />
                <Metric label="Euclidean distance" value={res.euclidean.toFixed(4)} />
                <Metric label="Cosine similarity" value={res.cosine.toFixed(4)} />
                <Metric label="Threshold / time" value={`${VERIFY_THRESHOLD} · ${res.ms} ms`} />
              </div>
              <p className="font-mono text-xs text-muted-foreground">Embedding A (first 8 of 128): [{res.vec.map((v) => v.toFixed(3)).join(", ")}, …]</p>
            </div>
          )}
        </Panel>
      </div>
      <SectionTitle n="02">Mathematics</SectionTitle>
      <Formula>{`d(A,B) = ‖f(A) − f(B)‖₂      same person if d < 0.6
Triplet loss: L = max(‖f(a)−f(p)‖² − ‖f(a)−f(n)‖² + α, 0)`}</Formula>
    </div>
  );
}
