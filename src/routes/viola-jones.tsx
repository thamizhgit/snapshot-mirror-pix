import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SectionTitle, Panel, Steps, Flow, Formula, ProsCons, Viva, DropZone, RunButton, ErrorBox, EmptyResult, Metric, ResultImage } from "@/components/lab/ui";
import { loadImage } from "@/lib/cv/image";
import { detectFacesVJ, type VJResult } from "@/lib/cv/opencv";

export const Route = createFileRoute("/viola-jones")({
  head: () => ({
    meta: [
      { title: "Viola-Jones Face Detection Lab — VISIONLAB" },
      { name: "description", content: "Detect faces with OpenCV's Haar cascade classifier. Tune scale factor, min neighbours and min size." },
      { property: "og:title", content: "Viola-Jones Face Detection Lab — VISIONLAB" },
      { property: "og:description", content: "Haar features, integral images, AdaBoost and cascades — live in your browser." },
    ],
  }),
  component: Page,
});

function Range({ id, label, value, min, max, step, onChange, fmt }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex justify-between text-sm font-medium">{label}<span className="font-mono text-primary">{fmt ? fmt(value) : value}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--primary)]" />
    </div>
  );
}

function Page() {
  const [img, setImg] = useState<string | null>(null);
  const [scaleFactor, setSF] = useState(1.1);
  const [minNeighbors, setMN] = useState(5);
  const [minSize, setMS] = useState(30);
  const [detectEyes, setEyes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<VJResult | null>(null);

  const run = async () => {
    if (!img) return;
    setLoading(true); setErr(null); setRes(null);
    try { setRes(await detectFacesVJ(await loadImage(img), { scaleFactor, minNeighbors, minSize, detectEyes })); }
    catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="Object Detection" title="Viola-Jones Algorithm" desc="The Viola-Jones framework (2001) was the first real-time face detector. It combines Haar-like features, integral images, AdaBoost feature selection and an attentional cascade of classifiers." />

      <SectionTitle n="01">Live demo</SectionTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-5">
          <DropZone label="Image with faces" value={img} onChange={(u) => { setImg(u); setRes(null); }} />
          <Range id="sf" label="Scale factor" value={scaleFactor} min={1.02} max={1.5} step={0.01} onChange={setSF} fmt={(v) => v.toFixed(2)} />
          <Range id="mn" label="Min neighbours" value={minNeighbors} min={1} max={12} step={1} onChange={setMN} />
          <Range id="ms" label="Min face size (px)" value={minSize} min={10} max={200} step={5} onChange={setMS} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={detectEyes} onChange={(e) => setEyes(e.target.checked)} className="accent-[var(--primary)]" />Also detect eyes (second cascade)</label>
          <RunButton onClick={run} loading={loading} disabled={!img} loadingText="Running Haar cascade…">Detect Faces</RunButton>
          <p className="text-xs text-muted-foreground">First run downloads OpenCV.js (~9 MB) and the pretrained cascade XML.</p>
          {err && <ErrorBox msg={err} />}
        </Panel>
        <Panel className="space-y-4">
          <p className="text-sm font-medium">Result</p>
          {!res ? <EmptyResult text={loading ? "Loading OpenCV and scanning image pyramid…" : "Upload an image and press Detect Faces."} /> : (
            <div className="fade-up space-y-4">
              <ResultImage src={res.resultUrl} name="viola-jones.jpg" />
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Faces detected" value={res.faces.length} accent />
                <Metric label="Processing" value={`${res.processingMs} ms`} />
                <Metric label="Image" value={<span className="text-sm">{res.width}×{res.height}</span>} />
              </div>
              {res.faces.length === 0 && <p className="text-sm text-muted-foreground">No faces found. Try lowering min neighbours or min size, or use a frontal face photo.</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {res.faces.map((f, i) => (
                  <div key={i} className="rounded-md border border-border bg-surface p-2 text-xs">
                    <img src={f.crop} alt={`Face ${i + 1}`} className="aspect-square w-full rounded object-cover" />
                    <p className="mt-2 font-mono">#{i + 1} · {f.width}×{f.height}</p>
                    <p className="font-mono text-muted-foreground">({f.x}, {f.y}){detectEyes && ` · ${f.eyes} eye(s)`}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <SectionTitle n="02">The four key ideas</SectionTitle>
      <Steps items={[
        { t: "Haar-like features", d: "Rectangular light/dark patterns (edge, line, four-rectangle) — e.g. the eye region is darker than the cheeks." },
        { t: "Integral image", d: "Each pixel stores the sum of all pixels above-left, so any rectangle sum needs only 4 lookups." },
        { t: "AdaBoost", d: "Selects a few hundred discriminative features from 160 000+ candidates and weights them into a strong classifier." },
        { t: "Cascade classifier", d: "A chain of increasingly complex stages; most non-face windows are rejected in the first stages." },
      ]} />
      <div className="mt-4"><Panel><Flow steps={["Input", "Grayscale", "Integral image", "Haar features", "Stage 1", "Stage 2", "…", "Stage N", "Face"]} /></Panel></div>

      <SectionTitle n="03">Mathematics</SectionTitle>
      <Formula>{`Integral image:   ii(x,y) = Σ_{x'≤x, y'≤y} i(x',y')
Rectangle sum:    S = ii(D) − ii(B) − ii(C) + ii(A)
Haar feature:     f = Σ pixels(white) − Σ pixels(black)
Strong classifier: H(x) = sign( Σ αₜ · hₜ(x) )`}</Formula>

      <SectionTitle n="04">Detection parameters</SectionTitle>
      <div className="grid gap-4 md:grid-cols-3">
        <Panel><p className="font-mono text-sm text-primary">scaleFactor</p><p className="mt-1 text-sm text-muted-foreground">How much the image is shrunk at each pyramid level. Smaller = more thorough but slower.</p></Panel>
        <Panel><p className="font-mono text-sm text-primary">minNeighbors</p><p className="mt-1 text-sm text-muted-foreground">How many overlapping detections are required to keep a face. Higher = fewer false positives.</p></Panel>
        <Panel><p className="font-mono text-sm text-primary">minSize</p><p className="mt-1 text-sm text-muted-foreground">Smallest window considered. Filters out tiny spurious detections.</p></Panel>
      </div>

      <SectionTitle n="05">Advantages & limitations</SectionTitle>
      <ProsCons pros={["Real-time on CPU", "Low memory footprint", "Well understood and interpretable"]}
        cons={["Mostly frontal faces only", "Sensitive to pose, lighting and occlusion", "Higher false-positive rate than CNN detectors"]} />

      <SectionTitle n="06">Viva questions</SectionTitle>
      <Viva qa={[
        { q: "Why is the integral image important?", a: "It lets any rectangular sum be computed in constant time (4 array references), making Haar feature evaluation extremely fast at any scale." },
        { q: "What does AdaBoost do here?", a: "It acts as feature selection: each weak classifier uses one Haar feature, and boosting combines the best ones with weights αₜ." },
        { q: "Why use a cascade?", a: "Most windows are background. Early cheap stages reject them quickly, so expensive stages run only on promising regions." },
        { q: "What is the role of minNeighbors?", a: "Detections at nearby positions/scales are grouped; minNeighbors is the minimum group size to accept a face." },
      ]} />
    </div>
  );
}
