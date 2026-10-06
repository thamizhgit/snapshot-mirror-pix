import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SectionTitle, Panel, Steps, Flow, Formula, ProsCons, Viva, DropZone, RunButton, ErrorBox, EmptyResult, Metric, ResultImage } from "@/components/lab/ui";
import { loadImage } from "@/lib/cv/image";
import { matchTemplate, type TMMethod, type TMResult } from "@/lib/cv/templateMatching";

export const Route = createFileRoute("/template-matching")({
  head: () => ({
    meta: [
      { title: "Template Matching Lab — VISIONLAB" },
      { name: "description", content: "Run real sliding-window template matching (CCOEFF, CCORR, SQDIFF normalized) on your own images." },
      { property: "og:title", content: "Template Matching Lab — VISIONLAB" },
      { property: "og:description", content: "Locate a template inside a source image with normalized correlation." },
    ],
  }),
  component: Page,
});

const METHODS: { v: TMMethod; d: string }[] = [
  { v: "TM_CCOEFF_NORMED", d: "Zero-mean normalized cross-correlation — robust to brightness changes." },
  { v: "TM_CCORR_NORMED", d: "Normalized cross-correlation — simple, sensitive to brightness." },
  { v: "TM_SQDIFF_NORMED", d: "Normalized squared difference — shown as 1 − value so higher is better." },
];

function Page() {
  const [src, setSrc] = useState<string | null>(null);
  const [tpl, setTpl] = useState<string | null>(null);
  const [method, setMethod] = useState<TMMethod>("TM_CCOEFF_NORMED");
  const [th, setTh] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<TMResult | null>(null);

  const run = async () => {
    if (!src || !tpl) return;
    setLoading(true); setErr(null); setRes(null);
    await new Promise((r) => setTimeout(r, 30));
    try {
      const [a, b] = await Promise.all([loadImage(src), loadImage(tpl)]);
      setRes(matchTemplate(a, b, method, th));
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  const found = res && res.best.score >= th;

  return (
    <div>
      <PageHeader eyebrow="Classical Computer Vision" title="Template Matching" desc="Template matching finds the location of a small template image inside a larger source image by sliding the template over every position and measuring similarity." />

      <SectionTitle n="01">Live demo</SectionTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-5">
          <DropZone label="Source image" value={src} onChange={(u) => { setSrc(u); setRes(null); }} />
          <DropZone label="Template image (crop of the object to find)" value={tpl} onChange={(u) => { setTpl(u); setRes(null); }} />
          <div>
            <label htmlFor="method" className="mb-2 block text-sm font-medium">Matching method</label>
            <select id="method" value={method} onChange={(e) => setMethod(e.target.value as TMMethod)} className="w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-sm">
              {METHODS.map((m) => <option key={m.v} value={m.v}>{m.v}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">{METHODS.find((m) => m.v === method)!.d}</p>
          </div>
          <div>
            <label htmlFor="th" className="mb-2 flex justify-between text-sm font-medium">Threshold <span className="font-mono text-primary">{th.toFixed(2)}</span></label>
            <input id="th" type="range" min={0} max={1} step={0.01} value={th} onChange={(e) => setTh(+e.target.value)} className="w-full accent-[var(--primary)]" />
          </div>
          <RunButton onClick={run} loading={loading} disabled={!src || !tpl} loadingText="Matching template…">Run Template Matching</RunButton>
          {err && <ErrorBox msg={err} />}
        </Panel>

        <Panel className="space-y-4">
          <p className="text-sm font-medium">Result</p>
          {!res ? <EmptyResult text={loading ? "Sliding the template over every position…" : "Upload a source and a template, then run matching."} /> : (
            <div className="fade-up space-y-4">
              <div className={`rounded-md border px-3 py-2 text-sm ${found ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                {found ? `Match found · ${res.matches.length} location(s) above threshold` : "No match above threshold — best candidate shown"}
              </div>
              <ResultImage src={res.resultUrl} name="template-match.jpg" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric label="Match score" value={`${(res.best.score * 100).toFixed(1)}%`} accent />
                <Metric label="Location" value={`${res.best.x}, ${res.best.y}`} />
                <Metric label="Size" value={`${res.best.width}×${res.best.height}`} />
                <Metric label="Processing" value={`${res.processingMs} ms`} />
                <Metric label="Method" value={<span className="text-xs">{method.replace("TM_", "")}</span>} />
                <Metric label="Work scale" value={`${(res.workScale * 100).toFixed(0)}%`} />
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Similarity response map (bright = higher similarity)</p>
                <img src={res.heatmapUrl} alt="Similarity heatmap" className="w-full rounded-md border border-border [image-rendering:pixelated]" />
              </div>
            </div>
          )}
        </Panel>
      </div>

      <SectionTitle n="02">How it works</SectionTitle>
      <Steps items={[
        { t: "Source image", d: "The large image I in which we search." },
        { t: "Template image", d: "A small patch T of size w × h." },
        { t: "Sliding window", d: "T is placed at every (x, y) position of I." },
        { t: "Similarity calculation", d: "A score R(x, y) is computed for each position." },
        { t: "Best matching location", d: "The max (or min for SQDIFF) of R gives the best location." },
        { t: "Bounding box", d: "A w × h rectangle is drawn at that location." },
      ]} />
      <div className="mt-4"><Panel><Flow steps={["Source + Template", "Grayscale", "Slide window", "Compute R(x,y)", "argmax R", "Bounding box"]} /></Panel></div>

      <SectionTitle n="03">Mathematics</SectionTitle>
      <Formula>{`CCOEFF_NORMED:  R(x,y) = Σ T'(x',y')·I'(x+x',y+y') / √(Σ T'² · Σ I'²)
                T' = T − mean(T),  I' = I − mean(I over window)

CCORR_NORMED:   R(x,y) = Σ T·I / √(Σ T² · Σ I²)

SQDIFF_NORMED:  R(x,y) = Σ (T − I)² / √(Σ T² · Σ I²)   (lower = better)`}</Formula>
      <p className="mt-3 text-sm text-muted-foreground">Window sums ΣI and ΣI² are computed in O(1) using integral images, exactly as OpenCV does internally.</p>

      <SectionTitle n="04">Advantages & limitations</SectionTitle>
      <ProsCons pros={["Simple and easy to implement", "No training data required", "Precise localization for identical patterns"]}
        cons={["Not invariant to scale or rotation", "Sensitive to lighting (except CCOEFF)", "Computationally expensive on large images", "Fails under occlusion or deformation"]} />

      <SectionTitle n="05">Applications</SectionTitle>
      <div className="flex flex-wrap gap-2">{["Industrial inspection", "Object localization", "Logo detection", "Document analysis", "Medical imaging", "Video tracking"].map((a) => <span key={a} className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm">{a}</span>)}</div>

      <SectionTitle n="06">Viva questions</SectionTitle>
      <Viva qa={[
        { q: "What is template matching?", a: "A technique that locates a template patch inside a larger image by computing a similarity score at every position and picking the best one." },
        { q: "Why is TM_CCOEFF_NORMED preferred?", a: "It subtracts the mean of both template and window, making it invariant to uniform brightness changes, and normalizes the result to [−1, 1]." },
        { q: "Why isn't template matching scale invariant?", a: "The template is compared pixel-to-pixel at a fixed size. A larger or smaller object produces a different pattern; multi-scale pyramids are needed." },
        { q: "How are multiple matches found?", a: "Threshold the response map and apply non-maximum suppression to keep only local peaks." },
      ]} />
    </div>
  );
}
