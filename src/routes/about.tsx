import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/lab/ui";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About VISIONLAB — IVA Assignment" },
    { name: "description", content: "About the VISIONLAB Image & Video Analytics assignment and its technology." },
    { property: "og:title", content: "About VISIONLAB — IVA Assignment" },
    { property: "og:description", content: "Project goals, technology stack and how each demo runs." },
  ] }),
  component: () => (
    <div>
      <PageHeader eyebrow="About" title="About VISIONLAB" desc="An academic Image & Video Analytics assignment by a 3rd-year B.Tech AI & Data Science student, demonstrating four computer-vision techniques with genuinely working demos." />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel><p className="font-medium">Technology</p><p className="mt-2 text-sm text-muted-foreground">React + Tailwind CSS frontend. OpenCV.js (WebAssembly) runs the Viola-Jones Haar cascade; TensorFlow.js models (face-api) provide facial analysis and 128-D embeddings; template matching is a from-scratch JS implementation of OpenCV's normalized formulas.</p></Panel>
        <Panel><p className="font-medium">Privacy</p><p className="mt-2 text-sm text-muted-foreground">All processing happens in your browser. Uploaded images are never sent to a server.</p></Panel>
      </div>
    </div>
  ),
});
