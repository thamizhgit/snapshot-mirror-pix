import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SectionTitle, Panel, DropZone, RunButton, ErrorBox, EmptyResult, Metric, ResultImage, Bar } from "@/components/lab/ui";
import { loadImage } from "@/lib/cv/image";
import { analyzeFaces, type FaceAnalysis } from "@/lib/cv/faceapi";

export const Route = createFileRoute("/deepface")({
  head: () => ({ meta: [
    { title: "DeepFace Facial Analysis Lab — VISIONLAB" },
    { name: "description", content: "CNN-based age, gender and emotion analysis running in your browser." },
    { property: "og:title", content: "DeepFace Facial Analysis Lab — VISIONLAB" },
    { property: "og:description", content: "Real facial attribute analysis with pretrained CNNs." },
  ] }),
  component: Page,
});

function Page() {
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<{ faces: FaceAnalysis[]; processingMs: number; resultUrl: string } | null>(null);
  const run = async () => {
    if (!img) return;
    setLoading(true); setErr(null); setRes(null);
    try { setRes(await analyzeFaces(await loadImage(img))); } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader eyebrow="Deep Learning" title="DeepFace" desc="DeepFace-style facial attribute analysis: a CNN detects each face, then dedicated networks estimate age, gender and emotion probabilities. Race is not shown because the browser models don't provide it reliably." />
      <SectionTitle n="01">Live demo</SectionTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-5">
          <DropZone label="Face image" value={img} onChange={(u) => { setImg(u); setRes(null); }} />
          <RunButton onClick={run} loading={loading} disabled={!img} loadingText="Loading models & analyzing…">Analyze Face</RunButton>
          <p className="text-xs text-muted-foreground">First run downloads pretrained model weights (~15 MB).</p>
          {err && <ErrorBox msg={err} />}
        </Panel>
        <Panel className="space-y-4">
          <p className="text-sm font-medium">Result</p>
          {!res ? <EmptyResult text="Upload a photo and press Analyze Face." /> : (
            <div className="fade-up space-y-5">
              <ResultImage src={res.resultUrl} name="deepface.jpg" />
              <p className="font-mono text-xs text-muted-foreground">{res.faces.length} face(s) · {res.processingMs} ms</p>
              {res.faces.map((f, i) => (
                <div key={i} className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center gap-3"><img src={f.crop} alt={`Face ${i + 1}`} className="h-14 w-14 rounded object-cover" /><p className="font-mono text-sm">Face #{i + 1} · conf {(f.detectionScore * 100).toFixed(0)}%</p></div>
                  <div className="grid grid-cols-3 gap-3">
                    <Metric label="Age (est.)" value={Math.round(f.age)} accent />
                    <Metric label="Gender" value={<span className="capitalize">{f.gender} <span className="text-xs text-muted-foreground">{(f.genderProbability * 100).toFixed(0)}%</span></span>} />
                    <Metric label="Emotion" value={<span className="capitalize">{f.dominantEmotion}</span>} />
                  </div>
                  <div className="space-y-2">{f.emotions.map((e) => <Bar key={e.label} label={e.label} value={e.value} />)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
