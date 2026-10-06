import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanSearch, ScanFace, Brain, Fingerprint, ArrowRight, Upload, Cpu, Image as ImageIcon } from "lucide-react";
import { Panel, SectionTitle, Flow } from "@/components/lab/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VISIONLAB — Dashboard | Image & Video Analytics" },
      { name: "description", content: "Interactive computer vision lab demonstrating Template Matching, Viola-Jones, DeepFace and FaceNet." },
      { property: "og:title", content: "VISIONLAB — Interactive Computer Vision Laboratory" },
      { property: "og:description", content: "Explore. Detect. Analyze. Understand. Four live CV algorithms in your browser." },
    ],
  }),
  component: Dashboard,
});

const ALGOS = [
  { to: "/template-matching", icon: ScanSearch, cat: "Classical CV", title: "Template Matching", desc: "Locate a small template image inside a larger source by sliding-window similarity.", tags: ["Object localization", "Pattern matching"] },
  { to: "/viola-jones", icon: ScanFace, cat: "Object Detection", title: "Viola-Jones", desc: "Real-time face detection with Haar-like features, integral images and a boosted cascade.", tags: ["Haar cascade", "AdaBoost"] },
  { to: "/deepface", icon: Brain, cat: "Deep Learning", title: "DeepFace", desc: "CNN-based facial attribute analysis — age, gender and emotion probabilities.", tags: ["Facial attributes", "CNN"] },
  { to: "/facenet", icon: Fingerprint, cat: "Face Recognition", title: "FaceNet", desc: "Map faces into an embedding space and verify identity by embedding distance.", tags: ["Embeddings", "Verification"] },
] as const;

const COMPARE = [
  ["Template Matching", "Classical", "Find template location", "Low", "Fast"],
  ["Viola-Jones", "Classical ML", "Face detection", "Medium", "Very fast"],
  ["DeepFace", "Deep learning", "Facial analysis", "High", "Moderate"],
  ["FaceNet", "Deep learning", "Face recognition", "Very high", "Moderate"],
];

function Dashboard() {
  return (
    <div>
      <section className="fade-up panel relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary/20" />
        <div className="pointer-events-none absolute -right-4 top-4 h-40 w-40 rounded-full border border-violet/20" />
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Explore · Detect · Analyze · Understand</p>
        <h1 className="mt-4 text-4xl font-bold tracking-wide sm:text-5xl">VISIONLAB</h1>
        <p className="mt-2 text-lg text-foreground/90">Interactive Computer Vision Laboratory</p>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          An interactive Image and Video Analytics laboratory demonstrating classical computer vision, object detection, facial analysis, and face recognition techniques.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#algorithms" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110">Explore Algorithms <ArrowRight className="h-4 w-4" /></a>
          <a href="#architecture" className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2.5 text-sm hover:bg-accent">View Architecture</a>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[["4", "Computer Vision Techniques"], ["2", "Face Analysis Methods"], ["OpenCV", "Classical CV"], ["AI", "Deep Learning"]].map(([v, l]) => (
          <Panel key={l}><p className="font-display text-2xl font-semibold text-primary">{v}</p><p className="mt-1 text-sm text-muted-foreground">{l}</p></Panel>
        ))}
      </div>

      <div id="algorithms" className="scroll-mt-20" />
      <SectionTitle n="01">Algorithms</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        {ALGOS.map(({ to, icon: Icon, cat, title, desc, tags }) => (
          <Link key={to} to={to} className="panel group p-5 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-violet">{cat}</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">{tags.map((t) => <span key={t} className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">{t}</span>)}</div>
            <p className="mt-4 inline-flex items-center gap-1 text-sm text-primary">Open Lab <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></p>
          </Link>
        ))}
      </div>

      <SectionTitle n="02">Algorithm comparison</SectionTitle>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{["Algorithm", "Type", "Main purpose", "Complexity", "Speed"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>{COMPARE.map((r) => <tr key={r[0]} className="border-b border-border last:border-0">{r.map((c, i) => <td key={i} className={`px-4 py-3 ${i === 0 ? "font-medium" : "text-muted-foreground"}`}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>

      <div id="architecture" className="scroll-mt-20" />
      <SectionTitle n="03">System architecture</SectionTitle>
      <Panel>
        <Flow steps={["Image upload", "Browser canvas", "CV engine", "Algorithm", "Annotated result + metrics"]} />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            [Upload, "Input layer", "Drag-and-drop with type & size validation. Images never leave your device."],
            [Cpu, "Processing layer", "OpenCV.js (WebAssembly) for Haar cascades; TensorFlow.js models for face analysis & embeddings; pure JS NCC for template matching."],
            [ImageIcon, "Output layer", "Annotated images, bounding boxes, scores, timing and downloadable results."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Upload;
            return <div key={t as string}><I className="h-5 w-5 text-primary" /><p className="mt-2 font-medium">{t as string}</p><p className="mt-1 text-sm text-muted-foreground">{d as string}</p></div>;
          })}
        </div>
      </Panel>
    </div>
  );
}
