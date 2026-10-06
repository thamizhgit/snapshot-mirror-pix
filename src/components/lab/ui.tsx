import { useRef, useState, type ReactNode } from "react";
import { Upload, X, AlertTriangle, Loader2, Download, ChevronDown } from "lucide-react";
import { validateFile } from "@/lib/cv/image";

export function PageHeader({ eyebrow, title, desc, children }: { eyebrow: string; title: string; desc: string; children?: ReactNode }) {
  return (
    <header className="fade-up mb-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">{desc}</p>
      {children}
    </header>
  );
}

export function SectionTitle({ n, children }: { n?: string; children: ReactNode }) {
  return (
    <h2 className="mb-4 mt-12 flex items-baseline gap-3 text-xl font-semibold">
      {n && <span className="font-mono text-xs text-primary">{n}</span>}
      {children}
    </h2>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`panel p-5 ${className}`}>{children}</div>;
}

export function Steps({ items }: { items: { t: string; d: string }[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s, i) => (
        <li key={s.t} className="panel p-4">
          <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
          <p className="mt-1 font-medium">{s.t}</p>
          <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

export function Flow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs">{s}</span>
          {i < steps.length - 1 && <span className="text-primary">→</span>}
        </div>
      ))}
    </div>
  );
}

export function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel><p className="mb-2 text-sm font-medium text-success">Advantages</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">{pros.map((p) => <li key={p}>+ {p}</li>)}</ul></Panel>
      <Panel><p className="mb-2 text-sm font-medium text-destructive">Limitations</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">{cons.map((p) => <li key={p}>− {p}</li>)}</ul></Panel>
    </div>
  );
}

export function Viva({ qa }: { qa: { q: string; a: string }[] }) {
  return (
    <div className="space-y-2">
      {qa.map(({ q, a }) => (
        <details key={q} className="panel group p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
            {q}<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm text-muted-foreground">{a}</p>
        </details>
      ))}
    </div>
  );
}

export function Formula({ children }: { children: ReactNode }) {
  return <pre className="overflow-x-auto rounded-md border border-border bg-surface p-4 font-mono text-sm text-primary">{children}</pre>;
}

export function DropZone({ label, value, onChange }: { label: string; value: string | null; onChange: (url: string | null, name?: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const handle = (f?: File) => {
    if (!f) return;
    const e = validateFile(f);
    setErr(e);
    if (e) return;
    onChange(URL.createObjectURL(f), f.name);
  };
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
          <img src={value} alt={label} className="mx-auto max-h-56 object-contain" />
          <button aria-label="Remove image" onClick={() => onChange(null)} className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 hover:bg-background">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors ${drag ? "border-primary bg-primary/5" : "border-input hover:border-primary/60"}`}
        >
          <Upload className="h-6 w-6 text-primary" />
          <span className="text-sm">Drag & drop or <span className="text-primary">browse</span></span>
          <span className="text-xs text-muted-foreground">JPG, PNG, WEBP, BMP · max 8 MB</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </div>
  );
}

export function RunButton({ onClick, loading, disabled, children, loadingText }: { onClick: () => void; loading: boolean; disabled?: boolean; children: ReactNode; loadingText: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? loadingText : children}
    </button>
  );
}

export function ErrorBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{msg}
    </div>
  );
}

export function EmptyResult({ text }: { text: string }) {
  return <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

export function Metric({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-lg ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

export function ResultImage({ src, name }: { src: string; name: string }) {
  return (
    <div className="space-y-2">
      <img src={src} alt="Processed result" className="w-full rounded-lg border border-border object-contain" />
      <a href={src} download={name} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
        <Download className="h-3.5 w-3.5" />Download result
      </a>
    </div>
  );
}

export function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-20 capitalize text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="w-14 text-right font-mono text-xs">{(value * 100).toFixed(1)}%</span>
    </div>
  );
}
